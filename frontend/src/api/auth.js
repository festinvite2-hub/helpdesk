import { api, useMocks } from './client';

export async function login(email, password) {
  if (useMocks()) {
    return {
      token: 'mock-jwt-token-123',
      user: {
        id: 'u1',
        email: email || 'admin@helpdesk.local',
        full_name: 'Administrator Sistem',
        role: 'admin',
        primary_department_id: null,
        must_change_password: false,
        department: null,
      },
    };
  }

  return api.post('/auth/login', { email, password });
}

export async function getProfile() {
  if (useMocks()) {
    return {
      id: 'u1',
      email: 'admin@helpdesk.local',
      full_name: 'Administrator Sistem',
      role: 'admin',
      primary_department_id: null,
      must_change_password: false,
      department: null,
    };
  }

  return api.get('/auth/profile');
}


export async function changePassword(payload) {
  if (useMocks()) {
    return { success: true }
  }

  return api.post('/change-password', {
    user_id: payload.user_id,
    current_password: payload.current_password,
    new_password: payload.new_password,
  })
}

export function saveToken(token) {
  localStorage.setItem('helpdesk_token', token);
}

export function getToken() {
  return localStorage.getItem('helpdesk_token');
}

export function removeToken() {
  localStorage.removeItem('helpdesk_token');
}

export function isAuthenticated() {
  return !!getToken();
}
