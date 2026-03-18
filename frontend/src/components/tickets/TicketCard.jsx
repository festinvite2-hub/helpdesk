import { Link } from 'react-router-dom'
import { timeAgo } from '../../utils/timeAgo'

const priorityMap = {
  low: { label: 'scăzută', className: 'bg-slate-100 text-slate-600' },
  medium: { label: 'medie', className: 'bg-blue-100 text-blue-700' },
  high: { label: 'ridicată', className: 'bg-orange-100 text-orange-700' },
  critical: { label: 'critică', className: 'bg-red-100 text-red-700' },
}

const statusMap = {
  open: { label: 'deschis', className: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'în lucru', className: 'bg-yellow-100 text-yellow-700' },
  waiting: { label: 'așteptare', className: 'bg-orange-100 text-orange-700' },
  escalated: { label: 'escaladat', className: 'bg-red-100 text-red-700' },
  resolved: { label: 'rezolvat', className: 'bg-green-100 text-green-700' },
  closed: { label: 'închis', className: 'bg-slate-100 text-slate-600' },
}

function getAssignedLabel(ticket, currentUserId) {
  if (ticket.assigned_to && currentUserId && String(ticket.assigned_to) === String(currentUserId)) {
    return { label: 'Tu', isCurrentUser: true }
  }

  return {
    label: ticket.assigned_to_name ?? ticket.assigned_to_email ?? ticket.assigned_to ?? 'Neasignat',
    isCurrentUser: false,
  }
}

export default function TicketCard({
  ticket,
  showCreatedBy = false,
  currentUserId,
  onStatusChange,
  isStatusUpdating = false,
  canEditStatus = false,
}) {
  const priority = priorityMap[ticket.priority] ?? priorityMap.low
  const status = statusMap[ticket.status] ?? statusMap.open
  const createdByLabel = ticket.created_by_name ?? ticket.created_by_email ?? ticket.created_by
  const assigned = getAssignedLabel(ticket, currentUserId)
  const statusOptions = [
    { value: 'open', label: 'Deschis' },
    { value: 'in_progress', label: 'În lucru' },
    { value: 'waiting', label: 'Așteptare' },
    { value: 'resolved', label: 'Rezolvat' },
    { value: 'closed', label: 'Închis' },
  ]

  const hasDepartmentColor = Boolean(ticket.department_color)

  return (
    <Link
      to={`/tickets/${ticket.id}`}
      className="block min-h-[44px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-transform active:scale-[0.98]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-mono text-slate-400">{ticket.ticket_number}</span>
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${priority.className}`}>
          {priority.label}
        </span>
      </div>

      <p className="mt-1 line-clamp-1 text-sm font-medium text-slate-900">{ticket.title}</p>

      {showCreatedBy && createdByLabel && (
        <p className="mt-0.5 text-xs text-slate-400">de la: {createdByLabel}</p>
      )}

      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400">asignat la:</span>
        <span
          className={assigned.isCurrentUser ? 'rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700' : 'text-slate-600'}
        >
          {assigned.label}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {canEditStatus ? (
          <>
            <select
              value={ticket.status}
              onClick={(event) => event.preventDefault()}
              onChange={(event) => {
                event.preventDefault()
                onStatusChange?.(ticket.id, event.target.value)
              }}
              disabled={!onStatusChange || isStatusUpdating}
              className="min-h-[36px] rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {isStatusUpdating && <span className="text-xs text-slate-500">Se actualizează...</span>}
          </>
        ) : (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
            {status.label}
          </span>
        )}
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${hasDepartmentColor ? 'text-white' : 'bg-slate-100 text-slate-700'}`}
          style={hasDepartmentColor ? { backgroundColor: ticket.department_color } : undefined}
        >
          {ticket.department || 'Nesetat'}
        </span>
        <span className="ml-auto text-xs text-slate-400">{timeAgo(ticket.created_at)}</span>
      </div>
    </Link>
  )
}
