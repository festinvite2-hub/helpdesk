import { useMemo, useState } from 'react'
import { Plus, Pencil, User, Users } from 'lucide-react'
import DepartmentModal from '../components/admin/DepartmentModal'
import ToggleSwitch from '../components/common/ToggleSwitch'
import { MOCK_DEPARTMENTS_FULL, MOCK_USERS } from '../mocks/admin'

export default function AdminDepartments() {
  const [departments, setDepartments] = useState(MOCK_DEPARTMENTS_FULL)
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const managers = useMemo(() => MOCK_USERS.filter((user) => user.role === 'responsible'), [])
  const activeDepartments = departments.filter((department) => department.is_active).length

  const handleOpenCreate = () => {
    setEditingDepartment(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (department) => {
    setEditingDepartment(department)
    setIsModalOpen(true)
  }

  const handleSave = (payload) => {
    if (editingDepartment) {
      setDepartments((current) =>
        current.map((department) =>
          department.id === editingDepartment.id
            ? {
                ...department,
                ...payload,
              }
            : department,
        ),
      )
      setIsModalOpen(false)
      return
    }

    setDepartments((current) => [
      {
        id: `d${Date.now()}`,
        ...payload,
        memberCount: 0,
        openTickets: 0,
        is_active: true,
      },
      ...current,
    ])
    setIsModalOpen(false)
  }

  const handleDelete = (department) => {
    if (!window.confirm(`Sigur dorești să ștergi departamentul „${department.name}”?`)) return

    setDepartments((current) => current.filter((item) => item.id !== department.id))
    setIsModalOpen(false)
  }

  return (
    <section className="w-full">
      <header className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Departamente</h1>
          <p className="text-sm text-slate-500">{activeDepartments} departamente active</p>
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

      <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
        {departments.map((department) => (
          <article key={department.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center">
                <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: department.color }} />
                <h2 className="ml-2 text-base font-semibold">{department.name}</h2>
              </div>
              <ToggleSwitch
                enabled={department.is_active}
                onChange={(nextValue) =>
                  setDepartments((current) =>
                    current.map((item) => (item.id === department.id ? { ...item, is_active: nextValue } : item)),
                  )
                }
                label={`Stare departament ${department.name}`}
              />
            </div>

            <p className="mt-1 text-xs text-slate-500">{department.description}</p>

            <div className="mt-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-slate-600">
                <User size={14} />
                {department.manager ? (
                  <span>{department.manager.name}</span>
                ) : (
                  <span className="italic text-slate-400">Fără manager</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <Users size={14} />
                <span>{department.memberCount} membri</span>
              </div>
            </div>

            <p className="mt-1 text-xs text-slate-400">{department.openTickets} tichete deschise</p>

            <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => handleOpenEdit(department)}
                className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-100 text-sm font-medium text-slate-700 transition-colors active:bg-slate-200"
              >
                <Pencil size={14} />
                Editează
              </button>
              <button
                type="button"
                className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-100 text-sm font-medium text-slate-700 transition-colors active:bg-slate-200"
              >
                <Users size={14} />
                Membrii
              </button>
            </div>
          </article>
        ))}
      </div>

      <DepartmentModal
        isOpen={isModalOpen}
        department={editingDepartment}
        managers={managers}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </section>
  )
}
