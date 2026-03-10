import { api, useMocks } from './client';
import { MOCK_DEPARTMENTS_FULL } from '../mocks/admin';

export async function getDepartments() {
  if (useMocks()) {
    return MOCK_DEPARTMENTS_FULL;
  }

  return api.get('/departments');
}

export async function createDepartment(data) {
  if (useMocks()) {
    return { id: `d${Date.now()}`, ...data };
  }

  return api.post('/departments', data);
}

export async function updateDepartment(id, data) {
  if (useMocks()) {
    return { id, ...data };
  }

  return api.put(`/departments/${id}`, data);
}

export async function deleteDepartment(id) {
  if (useMocks()) {
    return { success: true };
  }

  return api.delete(`/departments/${id}`);
}
