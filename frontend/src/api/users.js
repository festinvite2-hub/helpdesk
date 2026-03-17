import { apiRequest, useMocks } from './client';
import { MOCK_USERS } from '../mocks/admin';

function normalizeRole(role) {
  if (role === 'responsible') return 'dept_manager';
  if (role === 'dept_manager' || role === 'admin' || role === 'user') return role;
  return 'user';
}

function normalizeUser(rawUser = {}) {
  const primaryDepartmentId = rawUser.primary_department_id ?? rawUser.department_id ?? rawUser.department?.id;
  const departmentName = rawUser.department_name ?? rawUser.department?.name ?? '';
  const departmentColor = rawUser.department_color ?? rawUser.department?.color ?? '#3B82F6';

  return {
    id: rawUser.id != null ? String(rawUser.id) : '',
    full_name: rawUser.full_name ?? '',
    email: rawUser.email ?? '',
    role: normalizeRole(rawUser.role),
    primary_department_id: primaryDepartmentId != null ? String(primaryDepartmentId) : '',
    department_name: departmentName,
    department_color: departmentColor,
    department:
      departmentName && primaryDepartmentId != null
        ? {
            id: String(primaryDepartmentId),
            name: departmentName,
            color: departmentColor,
          }
        : null,
    is_active: Boolean(rawUser.is_active ?? true),
    created_at: rawUser.created_at ?? '',
  };
}

function extractUsers(response) {
  if (Array.isArray(response)) return response.map(normalizeUser);

  const users = Array.isArray(response?.users)
    ? response.users
    : Array.isArray(response?.data?.users)
      ? response.data.users
      : [];

  return users.map(normalizeUser);
}

export async function getUsers(userId) {
  if (useMocks()) {
    return MOCK_USERS.map(normalizeUser);
  }

  const response = await apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify({
      action: 'list',
      user_id: userId,
    }),
  });

  return extractUsers(response);
}

export async function createUser(data, userId) {
  if (useMocks()) {
    return normalizeUser({ id: `u${Date.now()}`, ...data });
  }

  const response = await apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify({
      action: 'create',
      user_id: userId,
      user_data: data,
    }),
  });

  return normalizeUser(response?.user || {});
}

export async function updateUser(data, userId) {
  if (useMocks()) {
    return normalizeUser(data);
  }

  const response = await apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify({
      action: 'update',
      user_id: userId,
      user_data: data,
    }),
  });

  return normalizeUser(response?.user || {});
}

export async function deleteUser(id, userId) {
  if (useMocks()) {
    return { success: true, user: normalizeUser({ id, is_active: false }) };
  }

  const response = await apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify({
      action: 'delete',
      user_id: userId,
      user_data: { id },
    }),
  });

  return {
    ...response,
    user: normalizeUser(response?.user || { id, is_active: false }),
  };
}
