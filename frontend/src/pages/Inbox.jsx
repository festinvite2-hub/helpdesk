import { useCallback, useEffect, useMemo, useState } from 'react'
import { getTicketsByRole, updateTicketStatus } from '../api/tickets'
import { useAuth } from '../context/AuthContext'
import { Inbox as InboxIcon } from 'lucide-react'
import TicketCard from '../components/tickets/TicketCard'
import InboxTable from '../components/tickets/InboxTable'
import LoadingSkeleton from '../components/common/LoadingSkeleton'

const FILTERS = [
  {
    key: 'all',
    label: 'Toate',
    value: null,
    activeClassName: 'bg-slate-900 text-white',
    inactiveClassName: 'bg-slate-100 text-slate-600',
  },
  {
    key: 'open',
    label: 'Noi',
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
]

function mapInboxTicket(rawTicket) {
  if (!rawTicket || typeof rawTicket !== 'object') return null

  const id = rawTicket.id ?? rawTicket.ticket_id
  if (!id) return null

  return {
    ...rawTicket,
    id,
    ticket_number: rawTicket.ticket_number ?? rawTicket.ticketNumber ?? String(id),
    title: rawTicket.title ?? rawTicket.subject ?? `Tichet #${id}`,
    status: rawTicket.status ?? 'open',
    priority: rawTicket.priority ?? 'medium',
    created_at: rawTicket.created_at ?? rawTicket.createdAt ?? new Date().toISOString(),
    created_by:
      rawTicket.created_by ?? rawTicket.created_by_name ?? rawTicket.requester_name ?? 'Necunoscut',
    department: rawTicket.department ?? rawTicket.department_name ?? 'Nespecificat',
    category: rawTicket.category ?? rawTicket.topic ?? 'General',
  }
}

export default function Inbox() {
  const { role, user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [activeFilter, setActiveFilter] = useState(null)
  const [statusError, setStatusError] = useState(null)
  const [updatingTicketIds, setUpdatingTicketIds] = useState({})

  const canEditStatus = role === 'dept_manager' || role === 'admin' || role === 'responsible'

  const openCount = tickets.filter((ticket) => ticket.status === 'open').length
  const inProgressCount = tickets.filter((ticket) => ticket.status === 'in_progress').length
  const urgentCount = tickets.filter(
    (ticket) => ['critical', 'high'].includes(ticket.priority) && ticket.status === 'open'
  ).length

  const today = new Date()
  const resolvedTodayCount = tickets.filter((ticket) => {
    if (!ticket.resolved_at) {
      return false
    }
    const resolvedDate = new Date(ticket.resolved_at)
    return (
      resolvedDate.getDate() === today.getDate() &&
      resolvedDate.getMonth() === today.getMonth() &&
      resolvedDate.getFullYear() === today.getFullYear()
    )
  }).length

  const filteredTickets = activeFilter
    ? tickets.filter((ticket) => ticket.status === activeFilter)
    : tickets

  const sortedTickets = [...filteredTickets].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const filterLabels = useMemo(
    () => ({
      open: 'Noi',
      in_progress: 'În lucru',
      waiting: 'Așteptare',
      resolved: 'Rezolvate',
    }),
    []
  )

  const loadTickets = useCallback(async () => {
    try {
      const currentUserId = user?.id ?? user?.user_id
      const result = await getTicketsByRole(role, currentUserId)
      const nextTickets = Array.isArray(result) ? result : result?.tickets
      const mappedTickets = Array.isArray(nextTickets)
        ? nextTickets.map(mapInboxTicket).filter(Boolean)
        : []
      setTickets(mappedTickets)
      setLoadError(null)
    } catch (error) {
      setLoadError(error.message || 'Nu s-au putut încărca tichetele primite.')
    } finally {
      setLoading(false)
    }
  }, [role, user?.id, user?.user_id])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  const handleStatusChange = async (ticketId, nextStatus) => {
    if (!canEditStatus) return

    setStatusError(null)
    setUpdatingTicketIds((current) => ({ ...current, [ticketId]: true }))

    try {
      await updateTicketStatus({
        ticketId,
        newStatus: nextStatus,
        userId: user?.id ?? user?.user_id,
      })

      await loadTickets()
    } catch {
      setStatusError('Nu am putut actualiza statusul ticketului.')
    } finally {
      setUpdatingTicketIds((current) => ({ ...current, [ticketId]: false }))
    }
  }
  const getFilterCount = (filterValue) => {
    if (!filterValue) {
      return tickets.length
    }
    return tickets.filter((ticket) => ticket.status === filterValue).length
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-500">Se încarcă tichetele primite...</p>
        <LoadingSkeleton />
      </div>
    )
  }
  if (loadError) return <p className="text-red-600">{loadError}</p>

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-slate-900">Tichete primite</h1>
        <p className="mt-1 text-sm text-slate-500">
          {openCount} tichete noi · {inProgressCount} în lucru
        </p>
        {statusError && <p className="mt-2 text-sm text-red-600">{statusError}</p>}
      </header>

      <div className="rounded-lg bg-slate-50 px-3 py-2">
        <div className="flex justify-between gap-2">
          <p className="text-xs text-slate-500">🔴 {urgentCount} urgente</p>
          <p className="text-xs text-slate-500">✅ {resolvedTodayCount} azi</p>
        </div>
      </div>

      <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:overflow-visible md:px-0">
        {FILTERS.map((filter) => {
          const isActive = filter.value === activeFilter
          const count = getFilterCount(filter.value)

          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(isActive ? null : filter.value)}
              className={`flex min-h-[36px] items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive ? filter.activeClassName : filter.inactiveClassName
              }`}
            >
              {filter.label} ({count})
            </button>
          )
        })}
      </div>

      {sortedTickets.length === 0 ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-8 text-center">
          <InboxIcon size={40} className="text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">
            {activeFilter
              ? `Niciun tichet cu statusul «${filterLabels[activeFilter] ?? 'Toate'}»`
              : 'Nu există tichete primite disponibile.'}
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 md:hidden">
            {sortedTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                showCreatedBy
                onStatusChange={handleStatusChange}
                isStatusUpdating={Boolean(updatingTicketIds[ticket.id])}
                canEditStatus={canEditStatus}
              />
            ))}
          </div>
          <InboxTable
            tickets={sortedTickets}
            canEditStatus={canEditStatus}
            onStatusChange={handleStatusChange}
            updatingTicketIds={updatingTicketIds}
          />
        </>
      )}
    </section>
  )
}
