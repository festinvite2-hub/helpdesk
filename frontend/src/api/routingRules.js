import { api, useMocks } from './client';
import { MOCK_ROUTING_RULES } from '../mocks/admin';

export async function getRoutingRules() {
  if (useMocks()) {
    return MOCK_ROUTING_RULES;
  }

  return api.get('/routing-rules');
}

export async function createRoutingRule(data) {
  if (useMocks()) {
    return { id: `r${Date.now()}`, ...data };
  }

  return api.post('/routing-rules', data);
}

export async function updateRoutingRule(id, data) {
  if (useMocks()) {
    return { id, ...data };
  }

  return api.put(`/routing-rules/${id}`, data);
}

export async function deleteRoutingRule(id) {
  if (useMocks()) {
    return { success: true };
  }

  return api.delete(`/routing-rules/${id}`);
}

export async function testRouting(text) {
  if (useMocks()) {
    return null;
  }

  return api.post('/routing-rules/test', { text });
}
