import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import UserModal from '../components/admin/UserModal'
import { useAuth } from '../context/AuthContext'
import { createUser, deleteUser, getUsers, updateUser } from '../api/users'
import { getDepartments } from '../api/departments'

const roleFilters = [
  { value: 'all', label: 'Toți' },
  { value: 'user', label: 'Utilizatori' },
  { value: 'dept_manager', label: 'Responsabili' },
  { value: 'admin', label: 'Administratori' },
]

const roleBadgeClasses = {
  user: 'bg-slate-100 text-slate-600',
  dept_manager: 'bg-blue-100 text-blue-700',
  admin: 'bg-purple-100 text-purple-700',
}

const roleLabels = {
  user: 'Utilizator',
  dept_manager: 'Responsabil',
  admin: 'Administrator',
}

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function AdminUsers() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [editingUser, setEditingUser] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [saving, setSaving] = useState(false)

  const userId = user?.id ?? user?.user_id ?? user?.userId

  const loadUsers = useCallback(async () => {
    if (!userId) {
      setUsers([])
      setLoading(false)
      setError('Nu am putut identifica utilizatorul curent.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const [usersResult, departmentsResult] = await Promise.all([
        getUsers(userId),
        getDepartments(),
      ])
      setUsers(Array.isArray(usersResult) ? usersResult : [])
      setDepartments(Array.isArray(departmentsResult) ? departmentsResult : [])
    } catch (loadError) {
      setError(loadError?.message || 'Nu s-au putut încărca utilizatorii.')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const activeUsers = users.filter((entry) => entry.is_active).length

  const filteredUsers = useMemo(() => {
    return users.filter((entry) => {
      const matchesRole = roleFilter === 'all' || entry.role === roleFilter
      const searchValue = `${entry.full_name} ${entry.email}`.toLowerCase()
      const matchesSearch = searchValue.includes(query.trim().toLowerCase())

      return matchesRole && matchesSearch
    })
  }, [users, roleFilter, query])

  const handleOpenCreate = () => {
    setModalError('')
    setEditingUser(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (entry) => {
    setModalError('')
    setEditingUser(entry)
    setIsModalOpen(true)
  }

  const handleSave = async (payload) => {
    if (!userId) {
      setModalError('Nu am putut identifica utilizatorul curent.')
      return false
    }

    setSaving(true)
    setModalError('')

    const userData = {
      ...(editingUser ? { id: editingUser.id } : {}),
      ...(!editingUser ? { password: payload.password } : {}),
      full_name: payload.full_name,
      email: payload.email,
      role: payload.role,
      primary_department_id: payload.department?.id || null,
      is_active: payload.is_active,
    }

    try {
      if (editingUser) {
        const updatedUser = await updateUser(userData, userId)
        setUsers((current) =>
          current.map((entry) => (entry.id === editingUser.id ? updatedUser : entry)),
        )
      } else {
        const createdUser = await createUser(userData, userId)
        setUsers((current) => [createdUser, ...current])
      }

      setIsModalOpen(false)
      setEditingUser(null)
      return true
    } catch (saveError) {
      setModalError(saveError?.message || 'A apărut o eroare la salvarea utilizatorului.')
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (entry) => {
    if (!window.confirm(`Sigur dorești să dezactivezi utilizatorul „${entry.full_name}”?`)) return

    if (!userId) {
      setModalError('Nu am putut identifica utilizatorul curent.')
      return
    }

    setSaving(true)
    setModalError('')

    try {
      await deleteUser(entry.id, userId)
      setUsers((current) =>
        current.map((item) => (item.id === entry.id ? { ...item, is_active: false } : item)),
      )
      setIsModalOpen(false)
    } catch (deleteError) {
      setModalError(deleteError?.message || 'Nu am putut dezactiva utilizatorul.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="w-full">
      <header className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Utilizatori</h1>
          <p className="mt-1 text-sm text-slate-500">{activeUsers} utilizatori activi</p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex min-h-[40px] items-center gap-1.5 rounded-full bg-blue-600 px-4 text-sm font-medium text-white transition-all active:scale-[0.97] active:bg-blue-700"
        >
          <Plus size={16} />
          Adaugă
        </button>
      </header>

      {error && <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mb-4 md:flex md:items-center md:gap-4">
        <div className="relative md:flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Caută după nume sau email..."
            className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-base"
          />
        </div>

        <div className="mt-2 flex gap-2 md:mt-0">
          {roleFilters.map((filter) => {
            const isActive = roleFilter === filter.value

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setRoleFilter(filter.value)}
                className={`min-h-[44px] rounded-full px-3 text-xs font-medium transition-colors ${
                  isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {filter.label}
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <p className="rounded-xl border border-slate-200 bg-white px-3 py-4 text-sm text-slate-500">Se încarcă utilizatorii...</p>
      ) : (
        <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
          {filteredUsers.map((entry) => (
            <article
              key={entry.id}
              className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${entry.is_active ? '' : 'opacity-50'}`}
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
                    {getInitials(entry.full_name)}
                  </div>
                  <h2 className="ml-3 text-sm font-semibold">{entry.full_name}</h2>
                </div>
              </div>

              <p className="ml-12 mt-0.5 text-xs text-slate-400">{entry.email}</p>

              <div className="ml-12 mt-2 flex flex-wrap gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${roleBadgeClasses[entry.role] || roleBadgeClasses.user}`}>
                  {roleLabels[entry.role] || roleLabels.user}
                </span>
                {entry.department && (
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-medium text-white"
                    style={{ backgroundColor: entry.department.color }}
                  >
                    ● {entry.department.name}
                  </span>
                )}
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${entry.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                  {entry.is_active ? 'Activ' : 'Inactiv'}
                </span>
              </div>

              <div className="mt-3 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(entry)}
                  className="flex min-h-[40px] w-full items-center justify-center rounded-lg bg-slate-100 text-sm font-medium text-slate-700 transition-colors active:bg-slate-200"
                >
                  Editează
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <UserModal
        isOpen={isModalOpen}
        user={editingUser}
        departments={departments}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        error={modalError}
        saving={saving}
      />
    </section>
  )
}
