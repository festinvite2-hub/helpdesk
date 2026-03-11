import { api, useMocks } from './client';
import {
  MOCK_MY_TICKETS_USER,
  MOCK_MY_TICKETS_RESPONSIBLE,
  MOCK_INBOX_TICKETS,
  MOCK_ALL_TICKETS,
} from '../mocks/tickets';
import { MOCK_TICKET_DETAIL, MOCK_MESSAGES } from '../mocks/ticketDetail';

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
    return role === 'dept_manager' || role === 'responsible' ? MOCK_MY_TICKETS_RESPONSIBLE : MOCK_MY_TICKETS_USER;
  }

  return api.get('/my-tickets');
}

export async function getInboxTickets() {
  if (useMocks()) {
    return MOCK_INBOX_TICKETS;
  }

  return api.get('/inbox-tickets');
}

export async function getAllTickets() {
  if (useMocks()) {
    return MOCK_ALL_TICKETS;
  }

  return api.get('/all-tickets');
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

export async function updateTicketStatus(ticketId, newStatus, note) {
  if (useMocks()) {
    return { success: true, status: newStatus };
  }

  return api.put(`/ticket/${ticketId}/status`, { status: newStatus, note });
}

export async function rerouteTicket(ticketId, newDepartmentId, reason) {
  if (useMocks()) {
    return { success: true };
  }

  return api.put(`/ticket/${ticketId}/reroute`, { department_id: newDepartmentId, reason });
}
