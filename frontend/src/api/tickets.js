import { api, useMocks } from './client';
import {
  MOCK_MY_TICKETS_USER,
  MOCK_MY_TICKETS_RESPONSIBLE,
  MOCK_ALL_TICKETS,
} from '../mocks/tickets';
import { MOCK_TICKET_DETAIL, MOCK_MESSAGES } from '../mocks/ticketDetail';

function normalizeRole(role) {
  if (role === 'responsible') return 'dept_manager';
  if (role === 'dept_manager' || role === 'admin' || role === 'user') return role;
  return 'user';
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

export async function getMyTickets(role) {
  if (useMocks()) {
    const tickets = role === 'dept_manager' || role === 'responsible' ? MOCK_MY_TICKETS_RESPONSIBLE : MOCK_MY_TICKETS_USER;
    return { success: true, tickets };
  }

  const result = await api.get('/my-tickets', { skipAuth: true });

  if (Array.isArray(result)) {
    return { success: true, tickets: result };
  }

  return {
    success: result?.success ?? true,
    tickets: result?.tickets ?? [],
  };
}

export async function getInboxTickets(userId) {
  if (!userId) {
    return { success: true, tickets: [] };
  }

  const query = new URLSearchParams({ user_id: String(userId) }).toString();
  const result = await api.get(`/inbox-tickets?${query}`);

  if (Array.isArray(result)) {
    return { success: true, tickets: result };
  }

  return {
    success: result?.success ?? true,
    tickets: Array.isArray(result?.tickets) ? result.tickets : [],
  };
}

export async function getAllTickets(userId) {
  if (useMocks()) {
    return MOCK_ALL_TICKETS;
  }

  if (!userId) {
    return { success: true, tickets: [] };
  }

  const query = new URLSearchParams({ user_id: String(userId) }).toString();
  const result = await api.get(`/all-tickets?${query}`);

  if (Array.isArray(result)) {
    return { success: true, tickets: result };
  }

  return {
    success: result?.success ?? true,
    tickets: Array.isArray(result?.tickets) ? result.tickets : [],
  };
}

export async function getTicketsByRole(role, userId) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === 'admin') {
    return getAllTickets(userId);
  }

  if (normalizedRole === 'dept_manager') {
    return getInboxTickets(userId);
  }

  return getMyTickets(normalizedRole);
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

export async function rerouteTicket(ticketId, newDepartmentId, reason) {
  if (useMocks()) {
    return { success: true };
  }

  return api.put(`/ticket/${ticketId}/reroute`, { department_id: newDepartmentId, reason });
}
