import { useEffect, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import ToggleSwitch from '../common/ToggleSwitch'

const ROLE_OPTIONS = [
  { value: 'user', label: 'Utilizator' },
  { value: 'dept_manager', label: 'Responsabil' },
  { value: 'admin', label: 'Administrator' },
]

const initialForm = {
  full_name: '',
  email: '',
  role: 'user',
  departmentId: '',
  is_active: true,
}

export default function UserModal({
  isOpen,
  user,
  departments,
  onClose,
  onSave,
  onDelete,
  error,
  saving,
}) {
  const [formData, setFormData] = useState(initialForm)

  useEffect(() => {
    if (!isOpen) return

    if (user) {
      setFormData({
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        departmentId: user.primary_department_id ?? user.department?.id ?? '',
        is_active: user.is_active,
      })
      return
    }

    setFormData(initialForm)
  }, [isOpen, user])

  if (!isOpen) return null

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!formData.full_name.trim() || !formData.email.trim()) return

    const selectedDepartment = departments.find((department) => department.id === formData.departmentId)

    onSave({
      full_name: formData.full_name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      department:
        formData.role === 'dept_manager' && selectedDepartment
          ? {
              id: selectedDepartment.id,
              name: selectedDepartment.name,
              color: selectedDepartment.color,
            }
          : null,
      is_active: formData.is_active,
    })
  }

  return (
    <>
      <div className="fixed inset-0 z-40 hidden bg-black/50 md:block" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex flex-col bg-white md:inset-auto md:left-1/2 md:top-1/2 md:max-h-[90vh] md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold">{user ? 'Editează utilizator' : 'Adaugă utilizator'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-600 active:bg-slate-100"
            aria-label="Închide"
          >
            <X size={20} />
          </button>
        </header>

        <form className="flex flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div>
              <label htmlFor="user-name" className="mb-1 block text-sm font-medium text-slate-700">
                Nume complet
              </label>
              <input
                id="user-name"
                type="text"
                required
                value={formData.full_name}
                onChange={(event) => setFormData((current) => ({ ...current, full_name: event.target.value }))}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-4 py-2.5 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="user-email" className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="user-email"
                type="email"
                required
                value={formData.email}
                onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-4 py-2.5 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <p className="mb-1 text-sm font-medium text-slate-700">Rol</p>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
                {ROLE_OPTIONS.map((role) => {
                  const isActive = formData.role === role.value

                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() =>
                        setFormData((current) => ({
                          ...current,
                          role: role.value,
                          departmentId: role.value === 'dept_manager' ? current.departmentId : '',
                        }))
                      }
                      className={`min-h-[44px] rounded-lg px-2 text-xs font-medium transition-colors ${
                        isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      {role.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {formData.role === 'dept_manager' && (
              <div>
                <label htmlFor="user-department" className="mb-1 block text-sm font-medium text-slate-700">
                  Departament responsabil
                </label>
                <div className="relative">
                  <select
                    id="user-department"
                    value={formData.departmentId}
                    onChange={(event) => setFormData((current) => ({ ...current, departmentId: event.target.value }))}
                    className="w-full min-h-[44px] appearance-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Alege departamentul —</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
              <p className="text-sm font-medium text-slate-700">Activ</p>
              <ToggleSwitch
                enabled={formData.is_active}
                onChange={(nextValue) => setFormData((current) => ({ ...current, is_active: nextValue }))}
                label="Stare utilizator"
              />
            </div>
          </div>

          {error && <p className="mx-4 mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <footer className="border-t border-slate-200 px-4 py-3">
            <button
              type="submit"
              disabled={saving}
              className="min-h-[48px] w-full rounded-xl bg-blue-600 font-semibold text-white transition-all active:scale-[0.98] active:bg-blue-700"
            >
              {saving ? 'Se salvează...' : 'Salvează'}
            </button>
            {user && (
              <button
                type="button"
                onClick={() => onDelete(user)}
                disabled={saving}
                className="mt-2 min-h-[44px] w-full rounded-xl bg-red-50 font-medium text-red-600 active:bg-red-100"
              >
                Șterge utilizatorul
              </button>
            )}
          </footer>
        </form>
      </div>
    </>
  )
}
