import { api, useMocks } from './client';
import {
  MOCK_MY_TICKETS_USER,
  MOCK_MY_TICKETS_RESPONSIBLE,
  MOCK_ALL_TICKETS,
} from '../mocks/tickets';
import { MOCK_TICKET_DETAIL, MOCK_MESSAGES } from '../mocks/ticketDetail';

function resolveUserId(userOrId) {
  if (typeof userOrId === 'string' || typeof userOrId === 'number') {
    return String(userOrId);
  }

  if (userOrId && typeof userOrId === 'object') {
    const directId = userOrId.id ?? userOrId.user_id ?? userOrId.userId;
    if (directId) return String(directId);

    const nestedId = userOrId.user?.id ?? userOrId.user?.user_id ?? userOrId.user?.userId;
    if (nestedId) return String(nestedId);
  }

  try {
    const storedUser = JSON.parse(localStorage.getItem('helpdesk_user') || 'null');
    const storedUserId = storedUser?.id ?? storedUser?.user_id ?? storedUser?.userId;
    return storedUserId ? String(storedUserId) : null;
  } catch {
    return null;
  }
}

function normalizeRole(role) {
  if (role === 'responsible' || role === 'responsabil') return 'dept_manager';
  if (role === 'dept_manager' || role === 'admin' || role === 'user') return role;
  return 'user';
}

function buildTicketListPayload(userOrId, role = 'user') {
  const userId = resolveUserId(userOrId);

  if (!userId) {
    return null;
  }

  const payload = {
    user_id: userId,
  };

  const backendRole = normalizeRole(role);
  if (backendRole === 'dept_manager') {
    payload.role = backendRole;
  }

  return payload;
}

function pickDepartment(ticket) {
  return typeof ticket?.department === 'string' ? ticket.department : '';
}

function isUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function pickDepartmentId(ticket) {
  const directDepartmentId = ticket?.department_id ?? ticket?.departmentId;
  if (directDepartmentId) return String(directDepartmentId);

  const departmentCandidate = ticket?.department;
  if (isUuid(departmentCandidate)) return String(departmentCandidate);

  return '';
}

function normalizeTicket(ticket) {
  if (!ticket || typeof ticket !== 'object') return ticket;

  const department = pickDepartment(ticket);
  const department_id = pickDepartmentId(ticket);

  const normalizedDepartment = isUuid(department) ? '' : department;

  return {
    ...ticket,
    department: normalizedDepartment,
    department_id,
  };
}

export function enrichTicketsWithDepartments(tickets, departments) {
  const departmentById = new Map(
    (Array.isArray(departments) ? departments : [])
      .filter((department) => department?.id)
      .map((department) => [String(department.id), department.name || ''])
  );

  return (Array.isArray(tickets) ? tickets : []).map((ticket) => {
    const normalizedTicket = normalizeTicket(ticket);
    const departmentName = normalizedTicket.department?.trim();

    if (departmentName) return normalizedTicket;

    const mappedDepartment = departmentById.get(String(normalizedTicket.department_id || ''));
    return {
      ...normalizedTicket,
      department: mappedDepartment || '',
    };
  });
}

function normalizeTicketsResult(result) {
  if (Array.isArray(result)) {
    return { success: true, tickets: result.map(normalizeTicket) };
  }

  return {
    success: result?.success ?? true,
    tickets: Array.isArray(result?.tickets)
      ? result.tickets.map(normalizeTicket)
      : Array.isArray(result?.data?.tickets)
        ? result.data.tickets.map(normalizeTicket)
        : [],
  };
}

export function createTicketMock(payload) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        ticket_id: 'TICK-001',
        payload,
      });
    }, 1000);
  });
}

export async function createTicket(payload) {
  if (useMocks()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          ticket_id: `TK-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          ...payload,
        });
      }, 1000);
    });
  }

  return api.post('/create-ticket', payload);
}

export async function getMyTickets(userOrId, role = 'user') {
  const normalizedRole = normalizeRole(role);

  if (useMocks()) {
    const tickets = normalizedRole === 'dept_manager' ? MOCK_MY_TICKETS_RESPONSIBLE : MOCK_MY_TICKETS_USER;
    return { success: true, tickets };
  }

  const payload = buildTicketListPayload(userOrId, normalizedRole);
  if (!payload) {
    return { success: true, tickets: [] };
  }

  const result = await api.post('/my-tickets', payload, { skipAuth: true });

  return normalizeTicketsResult(result);
}

export async function getAllTickets(userOrId) {
  if (useMocks()) {
    return { success: true, tickets: MOCK_ALL_TICKETS };
  }

  const payload = buildTicketListPayload(userOrId, 'admin');
  if (!payload) {
    return { success: true, tickets: [] };
  }

  const result = await api.post('/all-tickets', payload, { skipAuth: true });

  return normalizeTicketsResult(result);
}

export async function getTicketsByRole(role, userId) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === 'admin') {
    return getAllTickets(userId);
  }

  if (normalizedRole === 'dept_manager') {
    return getMyTickets(userId, normalizedRole);
  }

  return getMyTickets(userId, normalizedRole);
}

export async function getTicketDetail(ticketId) {
  if (useMocks()) {
    return {
      ticket: MOCK_TICKET_DETAIL,
      messages: MOCK_MESSAGES,
    };
  }

  return api.get(`/ticket/${ticketId}`);
}

export async function addMessage(ticketId, content) {
  if (useMocks()) {
    return {
      id: `m${Date.now()}`,
      content,
      created_at: new Date().toISOString(),
    };
  }

  return api.post(`/ticket/${ticketId}/message`, { content });
}

export async function updateTicketStatus({ ticketId, newStatus, userId, note }) {
  if (useMocks()) {
    return {
      success: true,
      updated_ticket: {
        id: ticketId,
        status: newStatus,
        updated_at: new Date().toISOString(),
      },
    };
  }

  return api.post('/update-ticket-status', {
    ticket_id: ticketId,
    new_status: newStatus,
    user_id: userId,
    note,
  });
}

export async function rerouteTicket({ ticketId, newDepartmentId, reason, userId }) {
  if (useMocks()) {
    return { success: true };
  }

  return api.post('/reroute-ticket', {
    ticket_id: ticketId,
    new_department_id: newDepartmentId,
    reason,
    user_id: userId,
  });
}
