const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5678/webhook';
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export function useMocks() {
  return USE_MOCKS;
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const token = localStorage.getItem('helpdesk_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `Eroare ${response.status}`,
        response.status,
        errorData,
      );
    }

    if (response.status === 204) return null;

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;

    throw new ApiError(
      'Nu s-a putut contacta serverul. Verifică conexiunea.',
      0,
      { originalError: error?.message || 'Eroare necunoscută' },
    );
  }
}

export const api = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),

  post: (endpoint, body) => apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  }),

  put: (endpoint, body) => apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  }),

  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
};
