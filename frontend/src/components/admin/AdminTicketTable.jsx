import { useNavigate } from 'react-router-dom'
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

export default function AdminTicketTable({
  tickets,
  canEditStatus = false,
  onStatusChange,
  updatingTicketIds = {},
  showAction = false,
  dateColumnLabel = 'Actualizat',
  showCreatedUpdated = false,
  departments = [],
  rerouteByTicket = {},
  rerouteLoadingByTicket = {},
  onRerouteFieldChange,
  onRerouteTicket,
}) {
  const navigate = useNavigate()

  const statusOptions = [
    { value: 'open', label: 'Deschis' },
    { value: 'in_progress', label: 'În lucru' },
    { value: 'waiting', label: 'Așteptare' },
    { value: 'resolved', label: 'Rezolvat' },
    { value: 'closed', label: 'Închis' },
  ]

  return (
    <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Titlu</th>
            <th className="px-4 py-3">De la</th>
            <th className="px-4 py-3">Departament</th>
            <th className="px-4 py-3">Prioritate</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">{dateColumnLabel}</th>
            {showAction && <th className="px-4 py-3 text-right">Acțiune</th>}
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => {
            const priority = priorityMap[ticket.priority] ?? priorityMap.low
            const status = statusMap[ticket.status] ?? statusMap.open
            const hasDepartmentColor = Boolean(ticket.department_color)

            return (
              <tr
                key={ticket.id}
                className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                onClick={() => navigate(`/tickets/${ticket.id}`)}
              >
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{ticket.ticket_number}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{ticket.title}</td>
                <td className="px-4 py-3 text-slate-600">{ticket.created_by_name ?? ticket.created_by_email ?? ticket.created_by ?? 'Utilizator'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${hasDepartmentColor ? 'text-white' : 'bg-slate-100 text-slate-700'}`}
                    style={hasDepartmentColor ? { backgroundColor: ticket.department_color } : undefined}
                  >
                    {ticket.department || 'Nesetat'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${priority.className}`}>
                    {priority.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {canEditStatus ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={ticket.status}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => {
                          event.stopPropagation()
                          onStatusChange?.(ticket.id, event.target.value)
                        }}
                        disabled={!onStatusChange || Boolean(updatingTicketIds?.[ticket.id])}
                        className="min-h-[36px] rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {Boolean(updatingTicketIds?.[ticket.id]) && <span className="text-xs text-slate-500">Se actualizează...</span>}
                    </div>
                  ) : (
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${status.className}`}>
                      {status.label}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {showCreatedUpdated ? (
                    <div className="space-y-0.5">
                      <p>Creat: {timeAgo(ticket.created_at)}</p>
                      <p>Actualizat: {timeAgo(ticket.updated_at || ticket.created_at)}</p>
                    </div>
                  ) : (
                    timeAgo(ticket.updated_at)
                  )}
                </td>
                {showAction && (
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          navigate(`/tickets/${ticket.id}`)
                        }}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
                      >
                        Vezi
                      </button>

                      <select
                        value={rerouteByTicket[ticket.id]?.departmentId || ''}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => {
                          event.stopPropagation()
                          onRerouteFieldChange?.(ticket.id, 'departmentId', event.target.value)
                        }}
                        className="min-h-[34px] rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
                      >
                        <option value="">Dep. nou</option>
                        {departments.map((department) => (
                          <option key={department.id} value={department.id}>{department.name}</option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          onRerouteTicket?.(ticket)
                        }}
                        disabled={Boolean(rerouteLoadingByTicket[ticket.id])}
                        className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                      >
                        {rerouteLoadingByTicket[ticket.id] ? 'Se redirecționează...' : 'Redirecționează'}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
