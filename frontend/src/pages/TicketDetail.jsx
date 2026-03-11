import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronDown, SendHorizontal } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ChatBubble from '../components/tickets/ChatBubble'
import useMediaQuery from '../hooks/useMediaQuery'
import { useAuth } from '../context/AuthContext'
import { MOCK_MESSAGES, MOCK_STATUS_HISTORY, MOCK_TICKET_DETAIL } from '../mocks/ticketDetail'

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

export default function TicketDetail() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [messages, setMessages] = useState(MOCK_MESSAGES)

  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  const ticket = MOCK_TICKET_DETAIL
  const status = statusMap[ticket.status] ?? statusMap.open
  const priority = priorityMap[ticket.priority] ?? priorityMap.medium
  const canManage = role === 'dept_manager' || role === 'admin'

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [messages]
  )

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

  const handleSend = () => {
    if (!replyText.trim()) return

    const newMsg = {
      id: `m${Date.now()}`,
      sender_type: role === 'admin' ? 'admin' : role === 'dept_manager' ? 'dept_manager' : 'user',
      sender_name: role === 'admin' ? 'Administrator' : role === 'dept_manager' ? 'Andrei Tecuci' : 'Maria Popescu',
      content: replyText.trim(),
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, newMsg])
    setReplyText('')
  }

  const detailsVisible = isDesktop || detailsOpen

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
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="min-h-11 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-700 active:bg-slate-200"
                    onClick={() => window.alert('Mock: schimbare status în curând')}
                  >
                    Schimbă status
                  </button>
                  {role === 'admin' ? (
                    <button
                      className="min-h-11 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-700 active:bg-slate-200"
                      onClick={() => window.alert('Mock: redirecționare departament în curând')}
                    >
                      Redirijează
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {!isDesktop ? null : (
            <div className="pb-8">
              <StatusHistory
                items={MOCK_STATUS_HISTORY}
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
                items={MOCK_STATUS_HISTORY}
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
                disabled={!replyText.trim()}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-all active:scale-95 active:bg-blue-700 disabled:bg-slate-300"
              >
                <SendHorizontal size={18} />
              </button>
            </div>
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
          {items.map((entry, index) => {
            const status = statusMap[entry.status] ?? statusMap.open
            return (
              <div key={`${entry.created_at}-${entry.status}`} className="flex gap-3 text-xs">
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
          })}
        </div>
      </div>
    </div>
  )
}
