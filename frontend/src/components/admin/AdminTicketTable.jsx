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

export default function AdminTicketTable({ tickets }) {
  const navigate = useNavigate()

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
            <th className="px-4 py-3">Actualizat</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => {
            const priority = priorityMap[ticket.priority] ?? priorityMap.low
            const status = statusMap[ticket.status] ?? statusMap.open

            return (
              <tr
                key={ticket.id}
                className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                onClick={() => navigate(`/tickets/${ticket.id}`)}
              >
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{ticket.ticket_number}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{ticket.title}</td>
                <td className="px-4 py-3 text-slate-600">{ticket.created_by ?? 'Utilizator'}</td>
                <td className="px-4 py-3">
                  <span
                    className="rounded-full px-2 py-1 text-xs font-medium text-white"
                    style={{ backgroundColor: ticket.department_color }}
                  >
                    {ticket.department}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${priority.className}`}>
                    {priority.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${status.className}`}>
                    {status.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{timeAgo(ticket.updated_at)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
