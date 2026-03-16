import { apiRequest, useMocks } from './client';
import { MOCK_DEPARTMENTS_FULL } from '../mocks/admin';

function normalizeDepartment(rawDepartment = {}) {
  const id = rawDepartment.id ?? rawDepartment.department_id ?? rawDepartment.uuid;
  const name = rawDepartment.name ?? rawDepartment.department_name ?? '';

  return {
    ...rawDepartment,
    id: id != null ? String(id) : undefined,
    name,
    description: rawDepartment.description ?? rawDepartment.details ?? '',
    color: rawDepartment.color ?? '#3B82F6',
    notification_email: rawDepartment.notification_email ?? rawDepartment.email_notificare ?? rawDepartment.email ?? '',
    is_active: Boolean(rawDepartment.is_active ?? rawDepartment.active ?? true),
  };
}

function extractDepartments(response) {
  if (Array.isArray(response)) return response.map(normalizeDepartment);

  const candidateLists = [
    response?.departments,
    response?.data?.departments,
    response?.items,
    response?.data,
  ];

  const list = candidateLists.find((item) => Array.isArray(item));
  return Array.isArray(list) ? list.map(normalizeDepartment) : [];
}

export async function getDepartments() {
  if (useMocks()) {
    return MOCK_DEPARTMENTS_FULL;
  }

  const response = await apiRequest('/departments');
  return extractDepartments(response).filter((department) => department.is_active);
}

export async function getAllDepartmentsAdmin() {
  if (useMocks()) {
    return MOCK_DEPARTMENTS_FULL;
  }

  const response = await apiRequest('/departments-list');
  return extractDepartments(response);
}

export async function createDepartment(departmentData, userId) {
  if (useMocks()) {
    return {
      success: true,
      department: {
        id: `d${Date.now()}`,
        ...departmentData,
        is_active: true,
      },
    };
  }

  return apiRequest('/departments', {
    method: 'POST',
    body: JSON.stringify({
      action: 'create',
      user_id: userId,
      department_data: departmentData,
    }),
  });
}

export async function updateDepartment(departmentData, userId) {
  if (useMocks()) {
    return {
      success: true,
      department: {
        ...departmentData,
      },
    };
  }

  return apiRequest('/departments', {
    method: 'POST',
    body: JSON.stringify({
      action: 'update',
      user_id: userId,
      department_data: departmentData,
    }),
  });
}

export async function deleteDepartment(departmentId, userId) {
  if (useMocks()) {
    return { success: true };
  }

  return apiRequest('/departments', {
    method: 'POST',
    body: JSON.stringify({
      action: 'delete',
      user_id: userId,
      department_data: { id: departmentId },
    }),
  });
}
