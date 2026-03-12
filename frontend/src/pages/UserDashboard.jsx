import { useEffect, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { Link } from 'react-router-dom'
import LoadingSkeleton from '../components/common/LoadingSkeleton'
import TicketCard from '../components/tickets/TicketCard'
import TicketTable from '../components/tickets/TicketTable'
import { getAllTickets } from '../api/tickets'
import { useAuth } from '../context/AuthContext'

const statCards = [
  {
    key: 'open',
    label: 'Deschise',
    count: (tickets) => tickets.filter((ticket) => ticket.status === 'open').length,
    className: 'border-l-blue-500 bg-blue-50 text-blue-600',
  },
  {
    key: 'in_progress',
    label: 'În lucru',
    count: (tickets) => tickets.filter((ticket) => ticket.status === 'in_progress').length,
    className: 'border-l-yellow-500 bg-yellow-50 text-yellow-600',
  },
  {
    key: 'waiting',
    label: 'Așteptare',
    count: (tickets) => tickets.filter((ticket) => ticket.status === 'waiting').length,
    className: 'border-l-orange-500 bg-orange-50 text-orange-600',
  },
  {
    key: 'done',
    label: 'Rezolvate',
    count: (tickets) => tickets.filter((ticket) => ticket.status === 'resolved' || ticket.status === 'closed').length,
    className: 'border-l-green-500 bg-green-50 text-green-600',
  },
]

export default function UserDashboard() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadTickets() {
      try {
        const currentUserId = user?.id ?? user?.user_id
        const result = await getAllTickets(currentUserId)
        setTickets(result?.tickets || [])
      } catch (err) {
        setError(err.message || 'Nu s-au putut încărca tichetele.')
      } finally {
        setLoading(false)
      }
    }

    loadTickets()
  }, [user?.id, user?.user_id])

  const sortedTickets = [...tickets].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  const activeTicketsCount = tickets.filter(
    (ticket) => ticket.status !== 'resolved' && ticket.status !== 'closed'
  ).length

  if (loading) return <LoadingSkeleton />
  if (error) return <p className="text-red-600">{error}</p>

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-slate-900">Panou principal</h1>
        <p className="mt-1 text-sm text-slate-500">Ai {activeTicketsCount} tichete active</p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {statCards.map((stat) => (
          <article
            key={stat.key}
            className={`rounded-xl border border-l-4 border-slate-200 p-3 shadow-sm ${stat.className}`}
          >
            <p className="text-2xl font-bold">{stat.count(sortedTickets)}</p>
            <p className="mt-0.5 text-xs text-slate-500">{stat.label}</p>
          </article>
        ))}
      </div>

      <section>
        <div className="mb-3 mt-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">Tichete recente</h2>
          <Link
            to="/my-tickets"
            className="inline-flex min-h-[44px] items-center text-sm font-medium text-blue-600"
          >
            Vezi toate →
          </Link>
        </div>

        {sortedTickets.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center">
            <ClipboardList size={48} className="text-slate-300" />
            <p className="mt-4 text-sm font-medium text-slate-700">Nu ai niciun tichet încă</p>
            <Link
              to="/tickets/new"
              className="mt-4 inline-flex min-h-[44px] items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
            >
              Creează primul tichet
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 md:hidden">
              {sortedTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
            <TicketTable tickets={sortedTickets} canEditStatus={false} />
          </>
        )}
      </section>
    </section>
  )
}
