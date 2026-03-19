import { useEffect, useState } from 'react'
import { ChevronLeft, FileText, History, UserRound } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getTicketStatusHistory } from '../api/tickets'
import TicketThread from '../components/tickets/TicketThread'
import { useAuth } from '../context/AuthContext'

const STATUS_STYLES = {
  open: 'bg-blue-50 text-blue-700 ring-blue-200',
  in_progress: 'bg-amber-50 text-amber-700 ring-amber-200',
  waiting: 'bg-orange-50 text-orange-700 ring-orange-200',
  escalated: 'bg-rose-50 text-rose-700 ring-rose-200',
  resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  closed: 'bg-gray-100 text-gray-700 ring-gray-200',
}

const PRIORITY_STYLES = {
  low: 'bg-slate-100 text-slate-700 ring-slate-200',
  medium: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
  high: 'bg-orange-50 text-orange-700 ring-orange-200',
  critical: 'bg-red-50 text-red-700 ring-red-200',
}

function InlineErrorState({ message }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-700 shadow-sm">
      {message}
    </div>
  )
}

function formatDisplayDate(value) {
  if (!value) return 'Nedisponibil'

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return 'Nedisponibil'
  }

  return parsedDate.toLocaleString('ro-RO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(value) {
  if (!value) return 'Dată indisponibilă'

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return 'Dată indisponibilă'
  }

  return parsedDate.toLocaleString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function getTextValue(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }

    if (typeof value === 'number') {
      return String(value)
    }
  }

  return ''
}

function getRawIdentifier(value) {
  if (!value) return ''

  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'number') {
    return String(value)
  }

  if (typeof value === 'object') {
    return getTextValue(value.id, value.uuid, value.user_id, value.department_id, value.category_id)
  }

  return ''
}

function getReadableOrRawValue(readableValues, rawValues, fallback) {
  return getTextValue(...readableValues) || getRawIdentifier(rawValues[0]) || getTextValue(...rawValues.slice(1)) || fallback
}

function normalizeHistoryNote(note) {
  if (typeof note !== 'string') return ''

  const trimmedNote = note.trim()
  if (!trimmedNote || trimmedNote.toLowerCase() === 'null') {
    return ''
  }

  return trimmedNote
}

function normalizeStatusHistoryEntry(entry, index) {
  const normalizedEntry = entry && typeof entry === 'object' ? entry : {}
  const oldStatus = getTextValue(normalizedEntry.old_status, normalizedEntry.oldStatus) || 'Nespecificat'
  const newStatus = getTextValue(normalizedEntry.new_status, normalizedEntry.newStatus) || 'Nespecificat'

  return {
    id: String(normalizedEntry.id ?? normalizedEntry.history_id ?? `${oldStatus}-${newStatus}-${index}`),
    oldStatus,
    newStatus,
    changedByName: getTextValue(
      normalizedEntry.changed_by_name,
      normalizedEntry.changedByName,
      normalizedEntry.user_name,
      normalizedEntry.actor_name
    ) || 'Utilizator necunoscut',
    changedAt: normalizedEntry.changed_at ?? normalizedEntry.changedAt ?? normalizedEntry.created_at ?? normalizedEntry.createdAt ?? '',
    note: normalizeHistoryNote(normalizedEntry.note ?? normalizedEntry.notes),
  }
}

function normalizeTicketDetails(rawTicket, fallbackId) {
  if (!rawTicket || typeof rawTicket !== 'object') {
    return {
      id: fallbackId,
      ticketNumber: fallbackId,
      title: '',
      description: '',
      status: '',
      priority: '',
      department: 'Nesetat',
      departmentColor: '',
      assignedTo: 'Neasignat',
      createdBy: 'Nedisponibil',
      createdAt: '',
      updatedAt: '',
      category: 'Nedisponibil',
      routedBy: '',
      summary: '',
    }
  }

  const createdBy = getReadableOrRawValue(
    [rawTicket.created_by_name, rawTicket.createdByName],
    [rawTicket.created_by, rawTicket.created_by_email, rawTicket.createdByEmail],
    'Nedisponibil'
  )

  const assignedTo = getReadableOrRawValue(
    [rawTicket.assigned_to_name, rawTicket.assignedToName],
    [rawTicket.assigned_to, rawTicket.assigned_to_email, rawTicket.assignedToEmail],
    'Neasignat'
  )

  const department = getReadableOrRawValue(
    [rawTicket.department_name, rawTicket.departmentName, rawTicket.department],
    [rawTicket.department_id, rawTicket.departmentId],
    'Nesetat'
  )

  const category = getReadableOrRawValue(
    [rawTicket.category_name, rawTicket.categoryName, rawTicket.category, rawTicket.topic],
    [rawTicket.category_id, rawTicket.categoryId],
    'Nedisponibil'
  )

  return {
    id: String(rawTicket.id ?? rawTicket.ticket_id ?? fallbackId ?? ''),
    ticketNumber: getTextValue(rawTicket.ticket_number, rawTicket.ticketNumber) || String(rawTicket.id ?? rawTicket.ticket_id ?? fallbackId ?? ''),
    title: getTextValue(rawTicket.title, rawTicket.subject),
    description: getTextValue(rawTicket.description, rawTicket.details, rawTicket.summary),
    status: getTextValue(rawTicket.status),
    priority: getTextValue(rawTicket.priority),
    department,
    departmentColor: getTextValue(rawTicket.department_color, rawTicket.departmentColor),
    assignedTo,
    createdBy,
    createdAt: rawTicket.created_at ?? rawTicket.createdAt ?? '',
    updatedAt: rawTicket.updated_at ?? rawTicket.updatedAt ?? '',
    category,
    routedBy: getTextValue(rawTicket.routed_by, rawTicket.routing_mode),
    summary: getTextValue(rawTicket.summary),
  }
}

function normalizeBadgeLabel(value, fallback) {
  if (!value) return fallback

  return value
    .split('_')
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')
}

function getStatusStyles(status) {
  const statusStyles = {
    open: {
      backgroundColor: 'bg-blue-100',
      textColor: 'text-blue-700',
    },
    in_progress: {
      backgroundColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
    },
    waiting: {
      backgroundColor: 'bg-orange-100',
      textColor: 'text-orange-700',
    },
    resolved: {
      backgroundColor: 'bg-green-100',
      textColor: 'text-green-700',
    },
    closed: {
      backgroundColor: 'bg-gray-200',
      textColor: 'text-gray-700',
    },
    rerouted: {
      backgroundColor: 'bg-purple-100',
      textColor: 'text-purple-700',
    },
  }

  return statusStyles[status] ?? {
    backgroundColor: 'bg-slate-100',
    textColor: 'text-slate-700',
  }
}

function DetailCard({ title, description, children, action = null }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="pt-6">{children}</div>
    </section>
  )
}

function MetadataItem({ label, value, muted = false }) {
  return (
    <div className="space-y-1.5 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3.5">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={`text-sm font-medium ${muted ? 'text-slate-500' : 'text-slate-900'}`}>{value}</dd>
    </div>
  )
}

function Badge({ children, className = '', style }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${className}`}
      style={style}
    >
      {children}
    </span>
  )
}

function StatusHistoryCard({ history, loading, error }) {
  const hasItems = history.length > 0

  return (
    <DetailCard
      title="Istoric status"
      description="Ultimele modificări de status în ordinea furnizată de backend."
    >
      <div className="space-y-4">
        {loading ? <p className="text-sm text-slate-500">Se încarcă istoricul...</p> : null}

        {!loading && error ? (
          <p className="rounded-2xl border border-red-100 bg-red-50/60 px-4 py-3 text-sm text-red-700">
            Nu s-a putut încărca istoricul statusului.
          </p>
        ) : null}

        {!loading && !error && !hasItems ? (
          <p className="text-sm text-slate-500">Nu există modificări de status.</p>
        ) : null}

        {!loading && !error && hasItems ? (
          <div className="space-y-2.5">
            {history.map((item) => {
              const oldStatusStyles = getStatusStyles(item.oldStatus)
              const newStatusStyles = getStatusStyles(item.newStatus)

              return (
                <article
                  key={item.id}
                  className="rounded-xl border border-slate-200/70 bg-slate-50/40 p-3"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/90 text-slate-500 ring-1 ring-slate-200/80">
                      <History size={14} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-slate-900">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${oldStatusStyles.backgroundColor} ${oldStatusStyles.textColor}`}
                        >
                          {normalizeBadgeLabel(item.oldStatus, 'Nespecificat')}
                        </span>
                        <span className="text-xs text-slate-400">→</span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${newStatusStyles.backgroundColor} ${newStatusStyles.textColor}`}
                        >
                          {normalizeBadgeLabel(item.newStatus, 'Nespecificat')}
                        </span>
                      </div>
                      <p className="text-xs leading-4 text-slate-500">
                        de {item.changedByName} • {formatDate(item.changedAt)}
                      </p>
                      {item.note ? (
                        <p className="whitespace-pre-wrap text-xs leading-4 text-slate-500/90">{item.note}</p>
                      ) : null}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : null}
      </div>
    </DetailCard>
  )
}

export default function TicketDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const { user } = useAuth()
  const [statusHistory, setStatusHistory] = useState([])
  const [statusHistoryLoading, setStatusHistoryLoading] = useState(false)
  const [statusHistoryError, setStatusHistoryError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadStatusHistory() {
      if (!id) {
        if (isMounted) {
          setStatusHistory([])
          setStatusHistoryLoading(false)
          setStatusHistoryError('')
        }
        return
      }

      if (isMounted) {
        setStatusHistoryLoading(true)
        setStatusHistoryError('')
      }

      try {
        const response = await getTicketStatusHistory(id)
        if (!isMounted) return

        const history = Array.isArray(response?.history) ? response.history : []
        setStatusHistory(history.map(normalizeStatusHistoryEntry))
      } catch (requestError) {
        if (!isMounted) return

        setStatusHistory([])
        setStatusHistoryError(requestError?.message || 'Nu s-a putut încărca istoricul statusului.')
      } finally {
        if (isMounted) {
          setStatusHistoryLoading(false)
        }
      }
    }

    loadStatusHistory()

    return () => {
      isMounted = false
    }
  }, [id])

  if (!id) {
    return <InlineErrorState message="Lipsește ID-ul ticketului din adresă." />
  }

  if (!user) {
    return <InlineErrorState message="Nu există un utilizator autentificat. Te rugăm să te reautentifici." />
  }

  const ticket = normalizeTicketDetails(location.state?.ticket, id)
  const hasDescription = Boolean(ticket.description)
  const title = ticket.title || 'Ticket'
  const titleSubtitle = ticket.title ? null : 'Titlu indisponibil momentan'

  const statusBadgeClass = ticket.status ? STATUS_STYLES[ticket.status] ?? 'bg-slate-100 text-slate-700 ring-slate-200' : 'bg-slate-100 text-slate-500 ring-slate-200'
  const priorityBadgeClass = ticket.priority ? PRIORITY_STYLES[ticket.priority] ?? 'bg-slate-100 text-slate-700 ring-slate-200' : 'bg-slate-100 text-slate-500 ring-slate-200'

  return (
    <div className="space-y-6 pb-28 md:pb-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-6 py-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                aria-label="Înapoi"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Detalii ticket</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
                    <Badge className={statusBadgeClass}>{normalizeBadgeLabel(ticket.status, 'Status nedisponibil')}</Badge>
                    <Badge className={priorityBadgeClass}>{normalizeBadgeLabel(ticket.priority, 'Prioritate nedisponibilă')}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">ID ticket: {ticket.id}</p>
                  {titleSubtitle ? <p className="mt-1 text-sm text-slate-500">{titleSubtitle}</p> : null}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 text-sm text-slate-600">
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-700">Număr: {ticket.ticketNumber || 'Nedisponibil'}</span>
                  <Badge className="bg-blue-100 text-blue-800 ring-blue-200">
                    {ticket.department}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-900 shadow-sm lg:max-w-sm">
              <p className="font-medium">Conversația rămâne activă și funcțională.</p>
              <p className="mt-1.5 text-blue-800/80">Poți urmări mesajele și trimite răspunsuri fără să aștepți un endpoint separat pentru detaliile ticketului.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(280px,0.9fr)]">
        <div className="space-y-6">
          <DetailCard
            title="Informații ticket"
            description="Datele principale ale ticketului și rezumatul disponibil în acest moment."
          >
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-6 shadow-sm transition hover:shadow-md">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <FileText size={16} className="text-slate-400" />
                    Titlu
                  </div>
                  <p className="mt-3 text-base font-semibold text-slate-900">{ticket.title || 'Titlu indisponibil momentan'}</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-6 shadow-sm transition hover:shadow-md">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <UserRound size={16} className="text-slate-400" />
                    Creat de
                  </div>
                  <p className={`mt-3 text-base font-semibold ${ticket.createdBy ? 'text-slate-900' : 'text-slate-500'}`}>
                    {ticket.createdBy}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md">
                <p className="text-sm font-medium text-slate-700">Descriere</p>
                {hasDescription ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{ticket.description}</p>
                ) : (
                  <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-500">
                    Se va încărca când endpoint-ul de detalii este disponibil.
                  </div>
                )}
              </div>

              {ticket.summary ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-6 shadow-sm transition hover:shadow-md">
                  <p className="text-sm font-medium text-slate-700">Rezumat</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{ticket.summary}</p>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <MetadataItem label="Creat la" value={formatDisplayDate(ticket.createdAt)} muted={!ticket.createdAt} />
                <MetadataItem label="Ultima actualizare" value={formatDisplayDate(ticket.updatedAt)} muted={!ticket.updatedAt} />
                <MetadataItem label="Categorie" value={ticket.category} muted={ticket.category === 'Nedisponibil'} />
              </div>
            </div>
          </DetailCard>

          <TicketThread ticketId={id} currentUser={user} />
        </div>

        <aside className="space-y-6">
          <DetailCard
            title="Metadate"
            description="Statusul curent și persoanele implicate în ticket."
          >
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">Etichete</h3>
                <div className="flex flex-wrap gap-2.5">
                  <Badge className={statusBadgeClass}>{normalizeBadgeLabel(ticket.status, 'Status nedisponibil')}</Badge>
                  <Badge className={priorityBadgeClass}>{normalizeBadgeLabel(ticket.priority, 'Prioritate nedisponibilă')}</Badge>
                  <Badge className="bg-blue-100 text-blue-800 ring-blue-200">
                    {ticket.department}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">Detalii cheie</h3>
                <dl className="space-y-4">
                  <MetadataItem label="Status" value={normalizeBadgeLabel(ticket.status, 'Nedisponibil')} muted={!ticket.status} />
                  <MetadataItem label="Prioritate" value={normalizeBadgeLabel(ticket.priority, 'Nedisponibil')} muted={!ticket.priority} />
                  <MetadataItem label="Departament" value={ticket.department} muted={ticket.department === 'Nesetat'} />
                  <MetadataItem label="Asignat către" value={ticket.assignedTo} muted={ticket.assignedTo === 'Neasignat'} />
                  <MetadataItem label="Creat de" value={ticket.createdBy} muted={ticket.createdBy === 'Nedisponibil'} />
                  <MetadataItem label="Ultima actualizare" value={formatDisplayDate(ticket.updatedAt)} muted={!ticket.updatedAt} />
                </dl>
              </div>
            </div>
          </DetailCard>

          <StatusHistoryCard
            history={statusHistory}
            loading={statusHistoryLoading}
            error={statusHistoryError}
          />
        </aside>
      </div>
    </div>
  )
}
