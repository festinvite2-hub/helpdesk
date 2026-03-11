import { useEffect, useMemo, useState } from 'react'
import { ArrowUpDown, ClipboardList, PlusCircle, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import TicketCard from '../components/tickets/TicketCard'
import TicketTable from '../components/tickets/TicketTable'
import { useAuth } from '../context/AuthContext'
import { getMyTickets } from '../api/tickets'
import { useMocks } from '../api/client'
import LoadingSkeleton from '../components/common/LoadingSkeleton'
import { MOCK_MY_TICKETS_RESPONSIBLE, MOCK_MY_TICKETS_USER } from '../mocks/tickets'
import { timeAgo } from '../utils/timeAgo'

const STATUS_FILTERS = [
  {
    key: 'all',
    label: 'Toate',
    value: null,
    activeClassName: 'bg-slate-900 text-white',
    inactiveClassName: 'bg-slate-100 text-slate-600',
  },
  {
    key: 'open',
    label: 'Deschise',
    value: 'open',
    activeClassName: 'bg-blue-600 text-white',
    inactiveClassName: 'bg-blue-50 text-blue-700',
  },
  {
    key: 'in_progress',
    label: 'În lucru',
    value: 'in_progress',
    activeClassName: 'bg-yellow-500 text-white',
    inactiveClassName: 'bg-yellow-50 text-yellow-700',
  },
  {
    key: 'waiting',
    label: 'Așteptare',
    value: 'waiting',
    activeClassName: 'bg-orange-500 text-white',
    inactiveClassName: 'bg-orange-50 text-orange-700',
  },
  {
    key: 'resolved',
    label: 'Rezolvate',
    value: 'resolved',
    activeClassName: 'bg-green-600 text-white',
    inactiveClassName: 'bg-green-50 text-green-700',
  },
  {
    key: 'closed',
    label: 'Închise',
    value: 'closed',
    activeClassName: 'bg-slate-700 text-white',
    inactiveClassName: 'bg-slate-100 text-slate-600',
  },
]

export default function MyTickets() {
  const { role } = useAuth()
  const [allTickets, setAllTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(null)
  const [sortDir, setSortDir] = useState('desc')


  useEffect(() => {
    async function loadTickets() {
      try {
        if (useMocks()) {
          setAllTickets(role === 'dept_manager' ? MOCK_MY_TICKETS_RESPONSIBLE : MOCK_MY_TICKETS_USER)
        } else {
          const result = await getMyTickets(role)
          setAllTickets(result?.tickets || [])
        }
      } catch (err) {
        setError(err.message || 'Nu s-au putut încărca tichetele.')
      } finally {
        setLoading(false)
      }
    }

    loadTickets()
  }, [role])

  const counts = useMemo(() => {
    const openCount = allTickets.filter((ticket) => ['open', 'in_progress', 'waiting'].includes(ticket.status)).length

    return {
      total: allTickets.length,
      open: openCount,
      resolved: allTickets.filter((ticket) => ticket.status === 'resolved').length,
      byStatus: {
        open: allTickets.filter((ticket) => ticket.status === 'open').length,
        in_progress: allTickets.filter((ticket) => ticket.status === 'in_progress').length,
        waiting: allTickets.filter((ticket) => ticket.status === 'waiting').length,
        resolved: allTickets.filter((ticket) => ticket.status === 'resolved').length,
        closed: allTickets.filter((ticket) => ticket.status === 'closed').length,
      },
    }
  }, [allTickets])

  const filteredTickets = useMemo(() => {
    return allTickets
      .filter((ticket) => {
        const normalizedSearch = search.trim().toLowerCase()
        const matchesSearch =
          !normalizedSearch ||
          ticket.title.toLowerCase().includes(normalizedSearch) ||
          ticket.ticket_number.toLowerCase().includes(normalizedSearch)
        const matchesStatus = !statusFilter || ticket.status === statusFilter

        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()

        return sortDir === 'desc' ? dateB - dateA : dateA - dateB
      })
  }, [allTickets, search, statusFilter, sortDir])

  const hasTickets = allTickets.length > 0
  const subtitle =
    role === 'dept_manager' ? `${counts.total} tichete gestionate de tine` : `${counts.total} tichete create de tine`

  const newestUpdate = useMemo(() => {
    if (!hasTickets) return null
    const [ticket] = [...allTickets].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    return ticket ? timeAgo(ticket.updated_at) : null
  }, [allTickets, hasTickets])

  if (loading) return <LoadingSkeleton />
  if (error) return <p className="text-red-600">{error}</p>

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-slate-900">Ticketele mele</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        {newestUpdate && <p className="mt-1 text-xs text-slate-400">Ultima actualizare: {newestUpdate}</p>}
      </header>

      <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        <div className="flex-shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600">{counts.total} total</div>
        <div className="flex-shrink-0 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700">
          {counts.open} active
        </div>
        <div className="flex-shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
          {counts.resolved} rezolvate
        </div>
      </div>

      <div className="space-y-3 md:flex md:items-center md:gap-4 md:space-y-0">
        <div className="relative md:flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Caută după titlu sau număr..."
            className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-base"
          />
        </div>

        <button
          type="button"
          onClick={() => setSortDir((current) => (current === 'desc' ? 'asc' : 'desc'))}
          className="flex min-h-[44px] items-center gap-1.5 text-xs text-slate-500"
        >
          <ArrowUpDown size={14} />
          {sortDir === 'desc' ? 'Cele mai noi' : 'Cele mai vechi'}
        </button>
      </div>

      <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        {STATUS_FILTERS.map((filter) => {
          const isActive = filter.value === statusFilter
          const count = filter.value ? counts.byStatus[filter.value] : counts.total

          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => setStatusFilter(isActive ? null : filter.value)}
              className={`flex min-h-[44px] items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium transition-colors ${
                isActive ? filter.activeClassName : filter.inactiveClassName
              }`}
            >
              {filter.label} ({count})
            </button>
          )
        })}
      </div>

      {!hasTickets ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-8 text-center">
          <ClipboardList size={40} className="text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">
            {role === 'dept_manager' ? 'Niciun tichet asignat' : 'Nu ai niciun tichet'}
          </p>
          {role === 'user' && (
            <Link
              to="/tickets/new"
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white active:scale-[0.98] active:bg-blue-700"
            >
              <PlusCircle size={16} />
              Creează tichet
            </Link>
          )}
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-8 text-center">
          <ClipboardList size={40} className="text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">Niciun rezultat pentru «{search.trim()}»</p>
          <p className="mt-1 text-xs text-slate-500">Încearcă alte cuvinte cheie</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 md:hidden">
            {filteredTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} showCreatedBy={role === 'dept_manager'} />
            ))}
          </div>
          <TicketTable tickets={filteredTickets} />
        </>
      )}
    </section>
  )
}
