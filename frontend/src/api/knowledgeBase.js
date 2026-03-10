import { ApiError, api, useMocks } from './client';

import { MOCK_KB_DOCUMENTS } from '../mocks/admin';

export async function getDocuments() {
  if (useMocks()) {
    return MOCK_KB_DOCUMENTS;
  }

  return api.get('/kb/documents');
}

export async function uploadDocument(formData) {
  if (useMocks()) {
    return {
      id: `kb${Date.now()}`,
      status: 'processing',
      chunk_count: 0,
    };
  }

  const token = localStorage.getItem('helpdesk_token');
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5678/webhook';

  try {
    const response = await fetch(`${baseUrl}/kb/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `Eroare ${response.status}`,
        response.status,
        errorData,
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;

    throw new ApiError(
      'Nu s-a putut încărca documentul. Verifică conexiunea.',
      0,
      { originalError: error?.message || 'Eroare necunoscută' },
    );
  }
}

export async function deleteDocument(id) {
  if (useMocks()) {
    return { success: true };
  }

  return api.delete(`/kb/documents/${id}`);
}

export async function reindexDocument(id) {
  if (useMocks()) {
    return { success: true, status: 'processing' };
  }

  return api.post(`/kb/documents/${id}/reindex`);
}
