import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import ToggleSwitch from '../components/common/ToggleSwitch'
import UserModal from '../components/admin/UserModal'
import { MOCK_DEPARTMENTS_FULL, MOCK_USERS } from '../mocks/admin'

const roleFilters = [
  { value: 'all', label: 'Toți' },
  { value: 'user', label: 'Utilizatori' },
  { value: 'responsible', label: 'Responsabili' },
  { value: 'admin', label: 'Administratori' },
]

const roleBadgeClasses = {
  user: 'bg-slate-100 text-slate-600',
  responsible: 'bg-blue-100 text-blue-700',
  admin: 'bg-purple-100 text-purple-700',
}

const roleLabels = {
  user: 'Utilizator',
  responsible: 'Responsabil',
  admin: 'Administrator',
}

function getInitials(name) {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function AdminUsers() {
  const [users, setUsers] = useState(MOCK_USERS)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [editingUser, setEditingUser] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const activeUsers = users.filter((user) => user.is_active).length

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const searchValue = `${user.full_name} ${user.email}`.toLowerCase()
      const matchesSearch = searchValue.includes(query.trim().toLowerCase())

      return matchesRole && matchesSearch
    })
  }, [users, roleFilter, query])

  const handleOpenCreate = () => {
    setEditingUser(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (user) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  const handleSave = (payload) => {
    if (editingUser) {
      setUsers((current) => current.map((user) => (user.id === editingUser.id ? { ...user, ...payload } : user)))
      setIsModalOpen(false)
      return
    }

    setUsers((current) => [
      {
        id: `u${Date.now()}`,
        created_at: new Date().toISOString().slice(0, 10),
        ...payload,
      },
      ...current,
    ])
    setIsModalOpen(false)
  }

  const handleDelete = (user) => {
    if (!window.confirm(`Sigur dorești să ștergi utilizatorul „${user.full_name}”?`)) return

    setUsers((current) => current.filter((item) => item.id !== user.id))
    setIsModalOpen(false)
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

      <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
        {filteredUsers.map((user) => (
          <article
            key={user.id}
            className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${user.is_active ? '' : 'opacity-50'}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
                  {getInitials(user.full_name)}
                </div>
                <h2 className="ml-3 text-sm font-semibold">{user.full_name}</h2>
              </div>
              <ToggleSwitch
                enabled={user.is_active}
                onChange={(nextValue) =>
                  setUsers((current) =>
                    current.map((item) => (item.id === user.id ? { ...item, is_active: nextValue } : item)),
                  )
                }
                label={`Stare utilizator ${user.full_name}`}
              />
            </div>

            <p className="ml-12 mt-0.5 text-xs text-slate-400">{user.email}</p>

            <div className="ml-12 mt-2 flex gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${roleBadgeClasses[user.role]}`}>
                {roleLabels[user.role]}
              </span>
              {user.department && (
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-medium text-white"
                  style={{ backgroundColor: user.department.color }}
                >
                  ● {user.department.name}
                </span>
              )}
            </div>

            <div className="mt-3 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => handleOpenEdit(user)}
                className="flex min-h-[40px] w-full items-center justify-center rounded-lg bg-slate-100 text-sm font-medium text-slate-700 transition-colors active:bg-slate-200"
              >
                Editează
              </button>
            </div>
          </article>
        ))}
      </div>

      <UserModal
        isOpen={isModalOpen}
        user={editingUser}
        departments={MOCK_DEPARTMENTS_FULL}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </section>
  )
}
