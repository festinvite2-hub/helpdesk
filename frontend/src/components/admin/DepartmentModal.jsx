import { useEffect, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { COLOR_OPTIONS } from '../../mocks/admin'

const initialForm = {
  name: '',
  description: '',
  color: COLOR_OPTIONS[0],
  managerId: '',
}

export default function DepartmentModal({ isOpen, department, managers, onClose, onSave, onDelete }) {
  const [formData, setFormData] = useState(initialForm)

  useEffect(() => {
    if (!isOpen) return

    if (department) {
      setFormData({
        name: department.name,
        description: department.description,
        color: department.color,
        managerId: department.manager?.id ?? '',
      })
      return
    }

    setFormData(initialForm)
  }, [department, isOpen])

  if (!isOpen) return null

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!formData.name.trim()) return

    onSave({
      name: formData.name.trim(),
      description: formData.description.trim(),
      color: formData.color,
      manager: managers.find((manager) => manager.id === formData.managerId)
        ? { id: formData.managerId, name: managers.find((manager) => manager.id === formData.managerId).full_name }
        : null,
    })
  }

  return (
    <>
      <div className="fixed inset-0 z-40 hidden bg-black/50 md:block" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex flex-col bg-white md:inset-auto md:left-1/2 md:top-1/2 md:max-h-[90vh] md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold">{department ? 'Editează departament' : 'Adaugă departament'}</h2>
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
              <label htmlFor="department-name" className="mb-1 block text-sm font-medium text-slate-700">
                Nume departament
              </label>
              <input
                id="department-name"
                type="text"
                required
                value={formData.name}
                onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-4 py-2.5 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: IT"
              />
            </div>

            <div>
              <label htmlFor="department-description" className="mb-1 block text-sm font-medium text-slate-700">
                Descriere
              </label>
              <textarea
                id="department-description"
                rows={3}
                value={formData.description}
                onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="Descriere scurtă"
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Culoare</p>
              <div className="grid grid-cols-5 gap-3">
                {COLOR_OPTIONS.map((color) => {
                  const selected = formData.color === color

                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData((current) => ({ ...current, color }))}
                      className={`h-10 w-10 rounded-full border-2 transition-all ${
                        selected ? 'scale-110 border-slate-900' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Alege culoarea ${color}`}
                    />
                  )
                })}
              </div>
            </div>

            <div>
              <label htmlFor="department-manager" className="mb-1 block text-sm font-medium text-slate-700">
                Manager
              </label>
              <div className="relative">
                <select
                  id="department-manager"
                  value={formData.managerId}
                  onChange={(event) => setFormData((current) => ({ ...current, managerId: event.target.value }))}
                  className="w-full min-h-[44px] appearance-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Fără manager —</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.full_name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
            </div>
          </div>

          <footer className="border-t border-slate-200 px-4 py-3">
            <button
              type="submit"
              className="min-h-[48px] w-full rounded-xl bg-blue-600 font-semibold text-white transition-all active:scale-[0.98] active:bg-blue-700"
            >
              Salvează
            </button>
            {department && (
              <button
                type="button"
                onClick={() => onDelete(department)}
                className="mt-2 min-h-[44px] w-full rounded-xl bg-red-50 font-medium text-red-600 active:bg-red-100"
              >
                Șterge departamentul
              </button>
            )}
          </footer>
        </form>
      </div>
    </>
  )
}
