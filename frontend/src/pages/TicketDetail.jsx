import { AlertCircle, ChevronLeft, Clock3, FileText, Info, UserRound } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
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

function getTextValue(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return ''
}

function getPersonLabel(value) {
  if (!value) return ''

  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'object') {
    return getTextValue(value.name, value.full_name, value.email, value.username)
  }

  return ''
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
      department: '',
      departmentColor: '',
      assignedTo: '',
      createdBy: '',
      createdAt: '',
      updatedAt: '',
      category: '',
      routedBy: '',
      summary: '',
    }
  }

  const createdBy = getPersonLabel(rawTicket.created_by)
    || getTextValue(rawTicket.created_by_name, rawTicket.createdByName, rawTicket.created_by_email, rawTicket.createdByEmail)

  const assignedTo = getPersonLabel(rawTicket.assigned_to)
    || getTextValue(rawTicket.assigned_to_name, rawTicket.assignedToName, rawTicket.assigned_to_email, rawTicket.assignedToEmail)

  return {
    id: String(rawTicket.id ?? rawTicket.ticket_id ?? fallbackId ?? ''),
    ticketNumber: getTextValue(rawTicket.ticket_number, rawTicket.ticketNumber) || String(rawTicket.id ?? rawTicket.ticket_id ?? fallbackId ?? ''),
    title: getTextValue(rawTicket.title, rawTicket.subject),
    description: getTextValue(rawTicket.description, rawTicket.details, rawTicket.summary),
    status: getTextValue(rawTicket.status),
    priority: getTextValue(rawTicket.priority),
    department: getTextValue(rawTicket.department, rawTicket.department_name, rawTicket.departmentName),
    departmentColor: getTextValue(rawTicket.department_color, rawTicket.departmentColor),
    assignedTo,
    createdBy,
    createdAt: rawTicket.created_at ?? rawTicket.createdAt ?? '',
    updatedAt: rawTicket.updated_at ?? rawTicket.updatedAt ?? '',
    category: getTextValue(rawTicket.category, rawTicket.topic),
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

export default function TicketDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const { user } = useAuth()

  if (!id) {
    return <InlineErrorState message="Lipsește ID-ul ticketului din adresă." />
  }

  if (!user) {
    return <InlineErrorState message="Nu există un utilizator autentificat. Te rugăm să te reautentifici." />
  }

  const ticket = normalizeTicketDetails(location.state?.ticket, id)
  const hasTicketSnapshot = Boolean(location.state?.ticket && typeof location.state.ticket === 'object')
  const hasDescription = Boolean(ticket.description)
  const hasSummaryData = Boolean(ticket.category || ticket.routedBy || ticket.ticketNumber)
  const title = ticket.title || 'Ticket'
  const titleSubtitle = ticket.title ? null : 'Titlu indisponibil momentan'
  const detailAvailabilityNote = hasTicketSnapshot
    ? 'Pagina afișează datele disponibile din lista de tickete și conversația live a ticketului.'
    : 'Detaliile complete ale ticketului vor fi afișate aici când endpoint-ul de detalii este disponibil.'

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
                    {ticket.department || 'Departament nedisponibil'}
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
                    {ticket.createdBy || 'Nedisponibil'}
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
                <MetadataItem label="Date suplimentare" value={detailAvailabilityNote} muted />
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
                    {ticket.department || 'Departament nedisponibil'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">Detalii cheie</h3>
                <dl className="space-y-4">
                  <MetadataItem label="Status" value={normalizeBadgeLabel(ticket.status, 'Nedisponibil')} muted={!ticket.status} />
                  <MetadataItem label="Prioritate" value={normalizeBadgeLabel(ticket.priority, 'Nedisponibil')} muted={!ticket.priority} />
                  <MetadataItem label="Departament" value={ticket.department || 'Nedisponibil'} muted={!ticket.department} />
                  <MetadataItem label="Asignat către" value={ticket.assignedTo || 'Nedisponibil'} muted={!ticket.assignedTo} />
                  <MetadataItem label="Creat de" value={ticket.createdBy || 'Nedisponibil'} muted={!ticket.createdBy} />
                  <MetadataItem label="Ultima actualizare" value={formatDisplayDate(ticket.updatedAt)} muted={!ticket.updatedAt} />
                </dl>
              </div>
            </div>
          </DetailCard>

          {hasSummaryData ? (
            <DetailCard
              title="Context suplimentar"
              description="Informațiile deja disponibile din listele de ticketing."
            >
              <div className="rounded-2xl border border-slate-200 bg-gray-50 p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-white p-2 text-blue-600 shadow-sm ring-1 ring-slate-200">
                    <Info size={16} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-4">
                    <p className="text-sm font-semibold text-slate-700">Detalii utile pentru contextul curent</p>
                    <div className="space-y-3">
                      <MetadataItem label="Număr ticket" value={ticket.ticketNumber || 'Nedisponibil'} muted={!ticket.ticketNumber} />
                      <MetadataItem label="Categorie" value={ticket.category || 'Nedisponibil'} muted={!ticket.category} />
                      <MetadataItem label="Rutare" value={ticket.routedBy || 'Nedisponibil'} muted={!ticket.routedBy} />
                    </div>
                  </div>
                </div>
              </div>
            </DetailCard>
          ) : null}

          <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-white p-2 text-slate-500 shadow-sm ring-1 ring-slate-200">
                <AlertCircle size={16} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Disponibilitate detalii</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{detailAvailabilityNote}</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Clock3 size={14} />
                  Ticket ID curent: {ticket.id}
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
