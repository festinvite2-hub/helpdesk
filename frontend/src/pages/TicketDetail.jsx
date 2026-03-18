import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronDown, Loader2, SendHorizontal } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import ChatBubble from '../components/tickets/ChatBubble'
import useMediaQuery from '../hooks/useMediaQuery'
import { useAuth } from '../context/AuthContext'
import { addMessage, getTicketDetail } from '../api/tickets'

const statusMap = {
  open: { label: 'Deschis', className: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500' },
  waiting: { label: 'În așteptare', className: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  in_progress: { label: 'În lucru', className: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  resolved: { label: 'Rezolvat', className: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  closed: { label: 'Închis', className: 'bg-slate-200 text-slate-700', dot: 'bg-slate-500' },
}

const priorityMap = {
  low: { label: 'Scăzută', className: 'bg-emerald-50 text-emerald-700' },
  medium: { label: 'Medie', className: 'bg-amber-50 text-amber-700' },
  high: { label: 'Ridicată', className: 'bg-rose-50 text-rose-700' },
  critical: { label: 'Critică', className: 'bg-red-100 text-red-700' },
}

const routedByMap = {
  keyword: 'Cuvinte cheie',
  category: 'Categorie',
  ai: 'Asistent AI',
  manual: 'Manual',
}

function normalizePerson(value, fallbackRole = 'user') {
  if (!value) {
    return { name: 'Necunoscut', role: fallbackRole }
  }

  if (typeof value === 'string') {
    return { name: value, role: fallbackRole }
  }

  return {
    name: value.name ?? value.full_name ?? value.email ?? 'Necunoscut',
    role: value.role ?? fallbackRole,
  }
}

function normalizeMessage(message, role) {
  if (!message || typeof message !== 'object') return null

  return {
    ...message,
    id: message.id ?? `m-${Date.now()}`,
    sender_type: message.sender_type ?? role ?? 'user',
    sender_name: message.sender_name ?? message.sender?.full_name ?? message.sender?.name ?? 'Necunoscut',
    content: message.content ?? '',
    created_at: message.created_at ?? new Date().toISOString(),
  }
}

function normalizeHistoryEntry(entry) {
  if (!entry || typeof entry !== 'object') return null

  return {
    status: entry.new_status ?? entry.status ?? 'open',
    changed_by:
      entry.changed_by_name ??
      entry.changed_by?.full_name ??
      entry.changed_by?.name ??
      entry.changed_by ??
      'Sistem',
    note: entry.note ?? 'Actualizare status.',
    created_at: entry.created_at ?? new Date().toISOString(),
  }
}

function normalizeTicketDetailResponse(response, fallbackId) {
  const ticketSource = response?.ticket ?? response?.data?.ticket ?? response ?? {}
  const messagesSource = response?.messages ?? response?.data?.messages ?? []
  const historySource =
    response?.status_history ??
    response?.history ??
    response?.data?.status_history ??
    response?.data?.history ??
    []

  const createdBy =
    ticketSource.created_by_user ??
    ticketSource.created_by ??
    ticketSource.requester ??
    ticketSource.requester_name
  const assignedTo =
    ticketSource.assigned_user ??
    ticketSource.assigned_to ??
    ticketSource.assigned_to_name

  return {
    ticket: {
      ...ticketSource,
      id: ticketSource.id ?? fallbackId,
      ticket_number: ticketSource.ticket_number ?? ticketSource.ticketNumber ?? String(ticketSource.id ?? fallbackId ?? ''),
      title: ticketSource.title ?? ticketSource.subject ?? 'Tichet fără titlu',
      description: ticketSource.description ?? '',
      status: ticketSource.status ?? 'open',
      priority: ticketSource.priority ?? 'medium',
      category:
        ticketSource.category_name ??
        ticketSource.category?.name ??
        ticketSource.category ??
        'General',
      department:
        ticketSource.department_name ??
        ticketSource.department?.name ??
        ticketSource.department ??
        'Nespecificat',
      department_color: ticketSource.department_color ?? ticketSource.department?.color ?? '#94a3b8',
      created_by: normalizePerson(createdBy, 'user'),
      assigned_to: normalizePerson(assignedTo, 'responsabil'),
      created_at: ticketSource.created_at ?? new Date().toISOString(),
      updated_at: ticketSource.updated_at ?? ticketSource.created_at ?? new Date().toISOString(),
      routed_by: ticketSource.routed_by ?? 'manual',
    },
    messages: Array.isArray(messagesSource)
      ? messagesSource.map((message) => normalizeMessage(message, 'user')).filter(Boolean)
      : [],
    statusHistory: Array.isArray(historySource)
      ? historySource.map(normalizeHistoryEntry).filter(Boolean)
      : [],
  }
}

export default function TicketDetail() {
  const navigate = useNavigate()
  const { id: ticketId } = useParams()
  const { role, user } = useAuth()
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [ticket, setTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [statusHistory, setStatusHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [replyError, setReplyError] = useState('')

  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  const canManage = role === 'dept_manager' || role === 'responsible' || role === 'responsabil' || role === 'admin'

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [messages]
  )

  const status = statusMap[ticket?.status] ?? statusMap.open
  const priority = priorityMap[ticket?.priority] ?? priorityMap.medium

  const formatRelativeTime = (dateValue) => {
    const diffMs = Date.now() - new Date(dateValue).getTime()
    const minutes = Math.max(1, Math.floor(diffMs / 60000))
    if (minutes < 60) return `acum ${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `acum ${hours}h`
    const days = Math.floor(hours / 24)
    return `acum ${days}z`
  }

  const formatFullDate = (dateValue) =>
    new Date(dateValue).toLocaleString('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sortedMessages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [replyText])

  useEffect(() => {
    async function loadTicket() {
      if (!ticketId) {
        setError('Lipsește identificatorul tichetului.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const response = await getTicketDetail(ticketId)
        const normalized = normalizeTicketDetailResponse(response, ticketId)

        setTicket(normalized.ticket)
        setMessages(normalized.messages)
        setStatusHistory(normalized.statusHistory)
      } catch (loadError) {
        setError(loadError?.message || 'Nu s-au putut încărca detaliile tichetului.')
      } finally {
        setLoading(false)
      }
    }

    loadTicket()
  }, [ticketId])

  const handleSend = async () => {
    if (!replyText.trim() || !ticketId || sending) return

    setSending(true)
    setReplyError('')

    try {
      const response = await addMessage(ticketId, replyText.trim())
      const newMessage = normalizeMessage(response, role === 'admin' ? 'admin' : canManage ? 'dept_manager' : 'user')

      setMessages((prev) => [
        ...prev,
        newMessage ?? {
          id: `m${Date.now()}`,
          sender_type: role === 'admin' ? 'admin' : canManage ? 'dept_manager' : 'user',
          sender_name: user?.full_name ?? 'Utilizator',
          content: replyText.trim(),
          created_at: new Date().toISOString(),
        },
      ])
      setReplyText('')
    } catch (sendError) {
      setReplyError(sendError?.message || 'Nu am putut trimite mesajul.')
    } finally {
      setSending(false)
    }
  }

  const detailsVisible = isDesktop || detailsOpen

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center gap-3 text-slate-500">
        <Loader2 size={18} className="animate-spin" />
        <span>Se încarcă tichetul...</span>
      </div>
    )
  }

  if (error || !ticket) {
    return <p className="text-red-600">{error || 'Tichetul nu a fost găsit.'}</p>
  }

  return (
    <div className="pb-28 md:pb-6">
      {!isDesktop ? (
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(-1)}
                className="-ml-1 rounded-lg p-1 transition-colors active:bg-slate-100"
              >
                <ChevronLeft size={24} />
              </button>
              <span className="text-sm font-semibold text-slate-700">{ticket.ticket_number}</span>
            </div>
            <span className={`rounded-full px-2 py-1 text-xs font-medium ${status.className}`}>{status.label}</span>
          </div>
          <p className="line-clamp-1 text-sm font-semibold">{ticket.title}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
            <span
              className="rounded-full px-2 py-0.5 text-white"
              style={{ backgroundColor: ticket.department_color }}
            >
              {ticket.department}
            </span>
            <span className={`rounded-full px-2 py-0.5 ${priority.className}`}>{priority.label}</span>
            <span className="truncate">Asignat: {ticket.assigned_to.name}</span>
          </div>
        </header>
      ) : null}

      <main className="md:grid md:h-[calc(100vh-120px)] md:grid-cols-3 md:gap-6">
        <section className="px-4 pt-3 md:col-span-1 md:overflow-y-auto md:border-r md:border-slate-200 md:pr-6">
          {!isDesktop ? (
            <button
              onClick={() => setDetailsOpen((prev) => !prev)}
              className="mb-2 flex min-h-11 items-center gap-1 text-xs font-medium text-slate-600"
            >
              Detalii tichet {detailsOpen ? '▴' : '▾'}
            </button>
          ) : (
            <div className="mb-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Tichet</p>
              <h1 className="mt-1 text-lg font-semibold text-slate-900">{ticket.title}</h1>
              <p className="text-sm text-slate-500">{ticket.ticket_number}</p>
            </div>
          )}

          <div
            className={`overflow-hidden transition-all duration-200 ${detailsVisible ? 'max-h-[1200px] pb-4' : 'max-h-0'}`}
          >
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Descriere</p>
              <p className="mt-1 text-sm text-slate-700">{ticket.description}</p>
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                <Field label="Categorie" value={ticket.category} />
                <Field label="Prioritate" value={priority.label} />
                <Field label="Departament" value={ticket.department} />
                <Field label="Creat de" value={ticket.created_by.name} />
                <Field label="Asignat către" value={ticket.assigned_to.name} />
                <Field label="Creat la" value={formatFullDate(ticket.created_at)} />
                <Field label="Rutat prin" value={routedByMap[ticket.routed_by] ?? ticket.routed_by} />
                <Field label="Actualizat" value={formatRelativeTime(ticket.updated_at)} />
              </div>

              {canManage ? (
                <p className="mt-4 rounded-lg bg-white px-3 py-2 text-xs text-slate-500">
                  Statusul se poate actualiza din listele de tichete și din inbox.
                </p>
              ) : null}
            </div>
          </div>

          {!isDesktop ? null : (
            <div className="pb-8">
              <StatusHistory
                items={statusHistory}
                statusMap={statusMap}
                formatRelativeTime={formatRelativeTime}
                alwaysOpen
              />
            </div>
          )}
        </section>

        <section className="md:col-span-2 md:flex md:flex-col">
          <div className="flex flex-col gap-3 px-4 py-4 pb-36 md:flex-1 md:overflow-y-auto md:pb-4">
            {sortedMessages.map((message) => (
              <ChatBubble key={message.id} message={message} relativeTime={formatRelativeTime(message.created_at)} />
            ))}

            {!isDesktop ? (
              <StatusHistory
                items={statusHistory}
                statusMap={statusMap}
                formatRelativeTime={formatRelativeTime}
                open={historyOpen}
                onToggle={() => setHistoryOpen((prev) => !prev)}
              />
            ) : null}
            <div ref={bottomRef} />
          </div>

          <div className="fixed bottom-20 left-0 right-0 z-20 border-t border-slate-200 bg-white px-4 py-2 md:static md:mt-2 md:rounded-xl md:border-t md:shadow-sm">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                placeholder="Scrie un răspuns..."
                className="max-h-[120px] min-h-[48px] flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSend}
                disabled={!replyText.trim() || sending}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-all active:scale-95 active:bg-blue-700 disabled:bg-slate-300"
              >
                {sending ? <Loader2 size={18} className="animate-spin" /> : <SendHorizontal size={18} />}
              </button>
            </div>
            {replyError ? <p className="mt-2 text-sm text-red-600">{replyError}</p> : null}
          </div>
        </section>
      </main>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm text-slate-700">{value}</p>
    </div>
  )
}

function StatusHistory({ items, statusMap, formatRelativeTime, open = false, onToggle, alwaysOpen = false }) {
  const visible = alwaysOpen || open

  if (!items.length && !alwaysOpen) {
    return null
  }

  return (
    <div className="mt-3">
      {!alwaysOpen ? (
        <button onClick={onToggle} className="flex min-h-11 items-center gap-1 text-xs font-medium text-slate-600">
          Istoric status {visible ? <ChevronDown size={14} className="rotate-180" /> : <ChevronDown size={14} />}
        </button>
      ) : (
        <p className="mb-2 text-xs font-medium text-slate-600">Istoric status</p>
      )}

      <div className={`overflow-hidden transition-all duration-200 ${visible ? 'max-h-[600px]' : 'max-h-0'}`}>
        <div className="mt-2 space-y-2 rounded-xl border border-slate-100 bg-white p-3">
          {items.length === 0 ? (
            <p className="text-xs text-slate-500">Nu există intrări de istoric disponibile.</p>
          ) : (
            items.map((entry, index) => {
              const status = statusMap[entry.status] ?? statusMap.open
              return (
                <div key={`${entry.created_at}-${entry.status}-${index}`} className="flex gap-3 text-xs">
                  <div className="flex flex-col items-center">
                    <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${status.dot}`} />
                    {index < items.length - 1 ? <span className="ml-0.5 h-full border-l-2 border-slate-200" /> : null}
                  </div>
                  <div className="pb-1">
                    <p className="font-semibold text-slate-700">{status.label}</p>
                    <p className="text-slate-500">{entry.changed_by}</p>
                    <p className="text-slate-600">{entry.note}</p>
                    <p className="text-[10px] text-slate-400">{formatRelativeTime(entry.created_at)}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
