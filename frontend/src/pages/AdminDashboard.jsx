import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardList,
  PlusCircle,
  Users,
  Workflow,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAllTickets, updateTicketStatus } from '../api/tickets'
import { getDepartments } from '../api/departments'
import TicketCard from '../components/tickets/TicketCard'
import AdminTicketTable from '../components/admin/AdminTicketTable'
import DepartmentCard from '../components/admin/DepartmentCard'
import QuickActionCard from '../components/admin/QuickActionCard'
import { useAuth } from '../context/AuthContext'
import LoadingSkeleton from '../components/common/LoadingSkeleton'

const STAT_CARD_CONFIG = [
  {
    key: 'total',
    label: 'Total tichete',
    icon: ClipboardList,
    textClass: 'text-slate-900',
    bgClass: 'bg-white',
    borderClass: 'border-l-slate-400',
  },
  {
    key: 'open',
    label: 'Deschise',
    icon: AlertCircle,
    textClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
    borderClass: 'border-l-blue-500',
  },
  {
    key: 'criticalOpen',
    label: 'Critice',
    icon: AlertTriangle,
    textClass: 'text-red-600',
    bgClass: 'bg-red-50',
    borderClass: 'border-l-red-500',
  },
  {
    key: 'resolvedToday',
    label: 'Rezolvate azi',
    icon: CheckCircle2,
    textClass: 'text-green-600',
    bgClass: 'bg-green-50',
    borderClass: 'border-l-green-500',
  },
]

const QUICK_ACTIONS = [
  {
    label: 'Creează tichet',
    icon: PlusCircle,
    to: '/tickets/new',
    className: 'bg-blue-50 text-blue-700',
  },
  {
    label: 'Departamente',
    icon: Building2,
    to: '/admin/departments',
    className: 'bg-amber-50 text-amber-700',
  },
  {
    label: 'Reguli rutare',
    icon: Workflow,
    to: '/admin/routing-rules',
    className: 'bg-purple-50 text-purple-700',
  },
  {
    label: 'Utilizatori',
    icon: Users,
    to: '/admin/users',
    className: 'bg-emerald-50 text-emerald-700',
  },
]

export default function AdminDashboard() {
  const { user } = useAuth()
  const [allTickets, setAllTickets] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [statusError, setStatusError] = useState(null)
  const [updatingTicketIds, setUpdatingTicketIds] = useState({})

  const loadDashboardData = useCallback(async () => {
    setLoadError(null)

    try {
      const currentUserId = user?.id ?? user?.user_id ?? user?.userId
      const [ticketsResult, departmentsResult] = await Promise.all([getAllTickets(currentUserId || user), getDepartments()])
      setAllTickets(Array.isArray(ticketsResult) ? ticketsResult : ticketsResult?.tickets ?? [])
      setDepartments(Array.isArray(departmentsResult) ? departmentsResult : [])
      setLoadError(null)
    } catch (error) {
      setLoadError(error.message || 'Nu s-au putut încărca datele panoului de administrare.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const totalTickets = allTickets.length
  const openTickets = allTickets.filter((ticket) => ticket.status === 'open').length
  const criticalOpenTickets = allTickets.filter(
    (ticket) => ['critical', 'high'].includes(ticket.priority) && ticket.status === 'open'
  ).length
  const resolvedTodayTickets = allTickets.filter((ticket) => {
    const now = new Date()
    const isResolvedStatus = ['resolved', 'closed'].includes(ticket.status)
    const resolvedAtRaw = ticket.resolved_at || ticket.updated_at

    if (!isResolvedStatus || !resolvedAtRaw) return false

    const resolvedDate = new Date(resolvedAtRaw)

    return (
      resolvedDate.getDate() === now.getDate() &&
      resolvedDate.getMonth() === now.getMonth() &&
      resolvedDate.getFullYear() === now.getFullYear()
    )
  }).length

  const statValues = {
    total: totalTickets,
    open: openTickets,
    criticalOpen: criticalOpenTickets,
    resolvedToday: resolvedTodayTickets,
  }

  const recentTickets = [...allTickets]
    .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    .slice(0, 5)

  const departmentCards = useMemo(() => {
    const ticketGroups = allTickets.reduce((acc, ticket) => {
      const key = ticket.department || 'Necunoscut'
      if (!acc[key]) {
        acc[key] = {
          ticketCount: 0,
          openCount: 0,
          totalResolutionMs: 0,
          resolvedCount: 0,
          color: ticket.department_color || '#94a3b8',
        }
      }

      acc[key].ticketCount += 1
      if (ticket.status === 'open') acc[key].openCount += 1

      if (ticket.resolved_at) {
        const createdAt = new Date(ticket.created_at).getTime()
        const resolvedAt = new Date(ticket.resolved_at).getTime()

        if (!Number.isNaN(createdAt) && !Number.isNaN(resolvedAt) && resolvedAt >= createdAt) {
          acc[key].totalResolutionMs += resolvedAt - createdAt
          acc[key].resolvedCount += 1
        }
      }

      return acc
    }, {})

    return departments.map((department) => {
      const group = ticketGroups[department.name] || {
        ticketCount: 0,
        openCount: 0,
        totalResolutionMs: 0,
        resolvedCount: 0,
        color: department.color || '#94a3b8',
      }
      const avgHours =
        group.resolvedCount > 0
          ? Math.max(1, Math.round(group.totalResolutionMs / group.resolvedCount / (60 * 60 * 1000)))
          : null

      return {
        id: department.id,
        name: department.name,
        color: department.color || group.color,
        ticketCount: group.ticketCount,
        openCount: group.openCount,
        avgResolveTime: avgHours ? `~${avgHours}h` : 'fără date',
      }
    })
  }, [allTickets, departments])

  if (loading) return <LoadingSkeleton />
  if (loadError) return <p className="text-red-600">{loadError}</p>

  const handleStatusChange = async (ticketId, nextStatus) => {
    setStatusError(null)
    setUpdatingTicketIds((current) => ({ ...current, [ticketId]: true }))

    try {
      await updateTicketStatus({
        ticketId,
        newStatus: nextStatus,
        userId: user?.id ?? user?.user_id,
      })

      await loadDashboardData()
    } catch {
      setStatusError('Nu am putut actualiza statusul ticketului.')
    } finally {
      setUpdatingTicketIds((current) => ({ ...current, [ticketId]: false }))
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-slate-900">Panou administrare</h1>
        <p className="mt-1 text-sm text-slate-500">
          {totalTickets} tichete totale · {openTickets} deschise · {criticalOpenTickets} critice
        </p>
        {statusError && <p className="mt-2 text-sm text-red-600">{statusError}</p>}
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {STAT_CARD_CONFIG.map((stat) => {
          const Icon = stat.icon
          return (
            <article
              key={stat.key}
              className={`rounded-xl border border-slate-200 border-l-4 p-3 shadow-sm ${stat.bgClass} ${stat.borderClass}`}
            >
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <Icon size={16} />
                {stat.label}
              </p>
              <p className={`mt-1 text-2xl font-bold ${stat.textClass}`}>{statValues[stat.key]}</p>
            </article>
          )
        })}
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Per departament</h2>
        {departmentCards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-8 text-center">
            <p className="text-sm text-slate-600">Nu există departamente disponibile.</p>
          </div>
        ) : (
          <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0">
            {departmentCards.map((department) => (
              <DepartmentCard key={department.id} department={department} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Activitate recentă</h2>
        {recentTickets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-8 text-center">
            <p className="text-sm text-slate-600">Nu există tichete disponibile.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 md:hidden">
              {recentTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  showCreatedBy
                  onStatusChange={handleStatusChange}
                  isStatusUpdating={Boolean(updatingTicketIds[ticket.id])}
                  canEditStatus
                />
              ))}
            </div>
            <AdminTicketTable
              tickets={recentTickets}
              canEditStatus
              onStatusChange={handleStatusChange}
              updatingTicketIds={updatingTicketIds}
            />
          </>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Acțiuni rapide</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <QuickActionCard
              key={action.label}
              to={action.to}
              label={action.label}
              icon={action.icon}
              className={action.className}
            />
          ))}
        </div>
      </section>
    </section>
  )
}
