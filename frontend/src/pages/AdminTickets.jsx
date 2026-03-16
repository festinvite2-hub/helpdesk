import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAllTickets, rerouteTicket, updateTicketStatus } from '../api/tickets'
import AdminTicketTable from '../components/admin/AdminTicketTable'
import TicketCard from '../components/tickets/TicketCard'
import LoadingSkeleton from '../components/common/LoadingSkeleton'
import { useAuth } from '../context/AuthContext'
import { getDepartments } from '../api/departments'

const ALL_OPTION_VALUE = 'toate'

function normalizeString(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

export default function AdminTickets() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [statusError, setStatusError] = useState(null)
  const [statusSuccess, setStatusSuccess] = useState('')
  const [updatingTicketIds, setUpdatingTicketIds] = useState({})
  const [departments, setDepartments] = useState([])
  const [rerouteByTicket, setRerouteByTicket] = useState({})
  const [rerouteLoadingByTicket, setRerouteLoadingByTicket] = useState({})

  const statusFilter = searchParams.get('status') || ALL_OPTION_VALUE
  const departmentFilter = searchParams.get('departament') || ALL_OPTION_VALUE
  const priorityFilter = searchParams.get('prioritate') || ALL_OPTION_VALUE
  const searchFilter = searchParams.get('q') || ''

  const currentUserId = user?.id ?? user?.user_id ?? user?.userId

  const updateFilterParam = (key, value) => {
    const nextParams = new URLSearchParams(searchParams)

    if (!value || value === ALL_OPTION_VALUE) {
      nextParams.delete(key)
    } else {
      nextParams.set(key, value)
    }

    setSearchParams(nextParams, { replace: true })
  }

  const loadTickets = useCallback(async () => {
    setLoadError(null)

    try {
      const ticketsResult = await getAllTickets(currentUserId || user)
      const allTickets = Array.isArray(ticketsResult)
        ? ticketsResult
        : Array.isArray(ticketsResult?.tickets)
          ? ticketsResult.tickets
          : Array.isArray(ticketsResult?.data?.tickets)
            ? ticketsResult.data.tickets
            : []

      setTickets(allTickets)

      const departmentsResult = await getDepartments()
      setDepartments(Array.isArray(departmentsResult) ? departmentsResult : [])
    } catch (error) {
      setLoadError(error?.message || 'Nu s-au putut încărca ticketele administratorului.')
    } finally {
      setLoading(false)
    }
  }, [currentUserId, user])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  const handleStatusChange = async (ticketId, nextStatus) => {
    setStatusError(null)
    setStatusSuccess('')
    setUpdatingTicketIds((current) => ({ ...current, [ticketId]: true }))

    try {
      await updateTicketStatus({
        ticketId,
        newStatus: nextStatus,
        userId: currentUserId,
      })
      await loadTickets()
      setStatusSuccess('Statusul tichetului a fost actualizat.')
    } catch {
      setStatusError('Nu am putut actualiza statusul ticketului.')
    } finally {
      setUpdatingTicketIds((current) => ({ ...current, [ticketId]: false }))
    }
  }


  const handleRerouteFieldChange = (ticketId, field, value) => {
    setRerouteByTicket((current) => ({
      ...current,
      [ticketId]: {
        ...(current[ticketId] || {}),
        [field]: value,
      },
    }))
  }

  const handleRerouteTicket = async (ticket) => {
    const draft = rerouteByTicket[ticket.id] || {}

    if (!draft.departmentId) {
      setStatusError('Selectează departamentul către care vrei să redirecționezi tichetul.')
      return
    }

    setStatusError(null)
    setStatusSuccess('')
    setRerouteLoadingByTicket((current) => ({ ...current, [ticket.id]: true }))

    try {
      await rerouteTicket({
        ticketId: ticket.id,
        newDepartmentId: draft.departmentId,
        reason: draft.reason || '',
        userId: currentUserId,
      })

      await loadTickets()
      setRerouteByTicket((current) => ({
        ...current,
        [ticket.id]: { departmentId: '', reason: '' },
      }))
      setStatusError('')
      setStatusSuccess('Tichetul a fost redirecționat cu succes.')
    } catch (error) {
      setStatusError(error?.message || 'Nu am putut redirecționa tichetul.')
    } finally {
      setRerouteLoadingByTicket((current) => ({ ...current, [ticket.id]: false }))
    }
  }

  const statusOptions = useMemo(() => {
    const values = Array.from(new Set(tickets.map((ticket) => normalizeString(ticket.status)).filter(Boolean)))
    return values.sort((a, b) => a.localeCompare(b, 'ro'))
  }, [tickets])

  const departmentOptions = useMemo(() => {
    const values = Array.from(new Set(tickets.map((ticket) => normalizeString(ticket.department)).filter(Boolean)))
    return values.sort((a, b) => a.localeCompare(b, 'ro'))
  }, [tickets])

  const priorityOptions = useMemo(() => {
    const values = Array.from(new Set(tickets.map((ticket) => normalizeString(ticket.priority)).filter(Boolean)))
    return values.sort((a, b) => a.localeCompare(b, 'ro'))
  }, [tickets])

  const filteredTickets = useMemo(() => {
    const normalizedQuery = normalizeString(searchFilter)

    return tickets
      .filter((ticket) => {
        if (statusFilter !== ALL_OPTION_VALUE && normalizeString(ticket.status) !== normalizeString(statusFilter)) return false
        if (departmentFilter !== ALL_OPTION_VALUE && normalizeString(ticket.department) !== normalizeString(departmentFilter)) return false
        if (priorityFilter !== ALL_OPTION_VALUE && normalizeString(ticket.priority) !== normalizeString(priorityFilter)) return false

        if (!normalizedQuery) return true

        const searchableTitle = normalizeString(ticket.title)
        const searchableTicketNumber = normalizeString(ticket.ticket_number)

        return searchableTitle.includes(normalizedQuery) || searchableTicketNumber.includes(normalizedQuery)
      })
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
  }, [tickets, statusFilter, departmentFilter, priorityFilter, searchFilter])

  if (loading) return <LoadingSkeleton />
  if (loadError) return <p className="text-red-600">{loadError}</p>

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-slate-900">Toate ticketele</h1>
        <p className="mt-1 text-sm text-slate-500">Vizualizează și gestionează toate ticketele din platformă.</p>
        {statusError && <p className="mt-2 text-sm text-red-600">{statusError}</p>}
        {statusSuccess && <p className="mt-2 text-sm text-emerald-700">{statusSuccess}</p>}
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Căutare
            <input
              value={searchFilter}
              onChange={(event) => updateFilterParam('q', event.target.value)}
              type="search"
              placeholder="Titlu sau număr tichet"
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-700 placeholder:text-slate-400"
            />
          </label>

          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Status
            <select
              value={statusFilter}
              onChange={(event) => updateFilterParam('status', event.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
            >
              <option value={ALL_OPTION_VALUE}>Toate statusurile</option>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Departament
            <select
              value={departmentFilter}
              onChange={(event) => updateFilterParam('departament', event.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
            >
              <option value={ALL_OPTION_VALUE}>Toate departamentele</option>
              {departmentOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Prioritate
            <select
              value={priorityFilter}
              onChange={(event) => updateFilterParam('prioritate', event.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
            >
              <option value={ALL_OPTION_VALUE}>Toate prioritățile</option>
              {priorityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {filteredTickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
          <p className="text-sm font-medium text-slate-700">Nu există tichete pentru filtrele selectate.</p>
          <p className="mt-1 text-sm text-slate-500">Încearcă să modifici filtrele sau căutarea.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500">{filteredTickets.length} tichete afișate.</p>
          <div className="flex flex-col gap-3 md:hidden">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <TicketCard
                  ticket={ticket}
                  showCreatedBy
                  onStatusChange={handleStatusChange}
                  isStatusUpdating={Boolean(updatingTicketIds[ticket.id])}
                  canEditStatus
                />
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <select
                    value={rerouteByTicket[ticket.id]?.departmentId || ''}
                    onChange={(event) => handleRerouteFieldChange(ticket.id, 'departmentId', event.target.value)}
                    className="min-h-10 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-700 sm:col-span-1"
                  >
                    <option value="">Departament nou</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>{department.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={rerouteByTicket[ticket.id]?.reason || ''}
                    onChange={(event) => handleRerouteFieldChange(ticket.id, 'reason', event.target.value)}
                    placeholder="Motiv redirecționare"
                    className="min-h-10 rounded-lg border border-slate-300 px-2 text-sm sm:col-span-2"
                  />
                  <button
                    type="button"
                    onClick={() => handleRerouteTicket(ticket)}
                    disabled={Boolean(rerouteLoadingByTicket[ticket.id])}
                    className="min-h-10 rounded-lg bg-slate-900 px-3 text-sm font-medium text-white disabled:opacity-60 sm:col-span-3"
                  >
                    {rerouteLoadingByTicket[ticket.id] ? 'Se redirecționează...' : 'Redirecționează tichetul'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <AdminTicketTable
            tickets={filteredTickets}
            canEditStatus
            onStatusChange={handleStatusChange}
            updatingTicketIds={updatingTicketIds}
            showAction
            dateColumnLabel="Creat / actualizat"
            showCreatedUpdated
            departments={departments}
            onRerouteTicket={handleRerouteTicket}
            rerouteByTicket={rerouteByTicket}
            onRerouteFieldChange={handleRerouteFieldChange}
            rerouteLoadingByTicket={rerouteLoadingByTicket}
          />
        </>
      )}
    </section>
  )
}
