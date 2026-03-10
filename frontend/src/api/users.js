import { api, useMocks } from './client';
import { MOCK_USERS } from '../mocks/admin';

export async function getUsers() {
  if (useMocks()) {
    return MOCK_USERS;
  }

  return api.get('/users');
}

export async function createUser(data) {
  if (useMocks()) {
    return { id: `u${Date.now()}`, ...data };
  }

  return api.post('/users', data);
}

export async function updateUser(id, data) {
  if (useMocks()) {
    return { id, ...data };
  }

  return api.put(`/users/${id}`, data);
}

export async function deleteUser(id) {
  if (useMocks()) {
    return { success: true };
  }

  return api.delete(`/users/${id}`);
}
