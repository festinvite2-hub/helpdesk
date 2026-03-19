import { api, ApiError } from './client'

function normalizeUserId(userOrId) {
  if (typeof userOrId === 'string' || typeof userOrId === 'number') {
    return String(userOrId)
  }

  if (userOrId && typeof userOrId === 'object') {
    const directId = userOrId.id ?? userOrId.user_id ?? userOrId.userId
    if (directId) return String(directId)

    const nestedId = userOrId.user?.id ?? userOrId.user?.user_id ?? userOrId.user?.userId
    if (nestedId) return String(nestedId)
  }

  return null
}

function normalizeSenderType(senderType) {
  if (senderType === 'responsible' || senderType === 'dept_manager') {
    return 'responsabil'
  }

  if (['user', 'admin', 'responsabil', 'ai'].includes(senderType)) {
    return senderType
  }

  return 'user'
}

function normalizeMessage(message) {
  if (!message || typeof message !== 'object') return null

  return {
    id: message.id ?? `${message.ticket_id ?? 'message'}-${message.created_at ?? Date.now()}`,
    ticket_id: message.ticket_id ?? '',
    sender_id: message.sender_id ? String(message.sender_id) : '',
    sender_type: normalizeSenderType(message.sender_type),
    content: typeof message.content === 'string' ? message.content : '',
    is_internal: Boolean(message.is_internal),
    sender_name: message.sender_name ?? 'Necunoscut',
    created_at: message.created_at ?? new Date().toISOString(),
  }
}

export async function getTicketMessages({ ticketId, userId }) {
  const normalizedTicketId = ticketId ? String(ticketId) : ''
  const normalizedUserId = normalizeUserId(userId)

  if (!normalizedTicketId) {
    throw new ApiError('Lipsește identificatorul tichetului.', 400)
  }

  if (!normalizedUserId) {
    throw new ApiError('Nu există un utilizator autentificat pentru încărcarea conversației.', 400)
  }

  const params = new URLSearchParams({
    ticket_id: normalizedTicketId,
    user_id: normalizedUserId,
  })

  const response = await api.get(`/ticket-messages?${params.toString()}`)

  if (response?.success === false) {
    throw new ApiError(response?.message || 'Nu s-a putut încărca conversația.', 400, response)
  }

  return {
    success: true,
    messages: Array.isArray(response?.messages) ? response.messages.map(normalizeMessage).filter(Boolean) : [],
  }
}

export async function sendTicketMessage({ ticketId, userId, content, isInternal = false }) {
  const normalizedTicketId = ticketId ? String(ticketId) : ''
  const normalizedUserId = normalizeUserId(userId)
  const normalizedContent = typeof content === 'string' ? content.trim() : ''

  if (!normalizedTicketId) {
    throw new ApiError('Lipsește identificatorul tichetului.', 400)
  }

  if (!normalizedUserId) {
    throw new ApiError('Nu există un utilizator autentificat pentru trimiterea mesajului.', 400)
  }

  if (!normalizedContent) {
    throw new ApiError('Mesajul nu poate fi gol.', 400)
  }

  const response = await api.post('/ticket-messages', {
    ticket_id: normalizedTicketId,
    user_id: normalizedUserId,
    content: normalizedContent,
    is_internal: Boolean(isInternal),
  })

  if (response?.success === false) {
    throw new ApiError(response?.message || 'Mesajul nu a putut fi trimis.', 400, response)
  }

  return response
}
