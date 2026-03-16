import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  createDepartment,
  deleteDepartment,
  getAllDepartmentsAdmin,
  updateDepartment,
} from '../api/departments'

const initialForm = {
  name: '',
  description: '',
  color: '#3B82F6',
  notification_email: '',
  is_active: true,
}

export default function AdminDepartments() {
  const { user } = useAuth()
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [formData, setFormData] = useState(initialForm)

  const userId = user?.id ?? user?.user_id ?? user?.userId

  const loadDepartments = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await getAllDepartmentsAdmin()
      setDepartments(Array.isArray(response) ? response : [])
    } catch (loadError) {
      setError(loadError?.message || 'Nu s-au putut încărca departamentele.')
      setDepartments([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDepartments()
  }, [loadDepartments])

  const activeCount = useMemo(
    () => departments.filter((department) => department.is_active).length,
    [departments],
  )

  const openCreateForm = () => {
    setEditingDepartment(null)
    setFormData(initialForm)
    setIsFormOpen(true)
    setSuccessMessage('')
  }

  const openEditForm = (department) => {
    setEditingDepartment(department)
    setFormData({
      name: department.name ?? '',
      description: department.description ?? '',
      color: department.color ?? '#3B82F6',
      notification_email: department.notification_email ?? '',
      is_active: Boolean(department.is_active),
    })
    setIsFormOpen(true)
    setSuccessMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!formData.name.trim()) {
      setError('Numele departamentului este obligatoriu.')
      return
    }

    if (!userId) {
      setError('Nu am putut identifica utilizatorul curent.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const payload = {
        ...(editingDepartment?.id ? { id: editingDepartment.id } : {}),
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color,
        notification_email: formData.notification_email.trim(),
        is_active: formData.is_active,
      }

      if (editingDepartment?.id) {
        await updateDepartment(payload, userId)
        setSuccessMessage('Departamentul a fost actualizat cu succes.')
      } else {
        await createDepartment(payload, userId)
        setSuccessMessage('Departamentul a fost creat cu succes.')
      }

      setIsFormOpen(false)
      setEditingDepartment(null)
      setFormData(initialForm)
      await loadDepartments()
    } catch (saveError) {
      setError(saveError?.message || 'A apărut o eroare la salvare.')
    } finally {
      setSaving(false)
    }
  }

  const setDepartmentStatus = async (department, isActive) => {
    if (!userId) {
      setError('Nu am putut identifica utilizatorul curent.')
      return
    }

    setError('')
    setSuccessMessage('')

    try {
      if (!isActive) {
        await deleteDepartment(department.id, userId)
        setSuccessMessage(`Departamentul „${department.name}” a fost dezactivat.`)
      } else {
        await updateDepartment(
          {
            id: department.id,
            name: department.name,
            description: department.description ?? '',
            color: department.color ?? '#3B82F6',
            notification_email: department.notification_email ?? '',
            is_active: true,
          },
          userId,
        )
        setSuccessMessage(`Departamentul „${department.name}” a fost reactivat.`)
      }

      await loadDepartments()
    } catch (statusError) {
      setError(statusError?.message || 'Nu am putut actualiza statusul departamentului.')
    }
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Administrare departamente</h1>
          <p className="text-sm text-slate-500">
            {activeCount} active din {departments.length} totale
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-blue-600 px-4 text-sm font-semibold text-white active:scale-[0.98]"
        >
          <Plus size={16} />
          Departament nou
        </button>
      </header>

      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {successMessage && <p className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">{successMessage}</p>}

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            {editingDepartment ? 'Editează departament' : 'Adaugă departament'}
          </h2>

          <label className="block text-sm font-medium text-slate-700">
            Nume
            <input
              type="text"
              value={formData.name}
              onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
              placeholder="Ex: IT"
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Descriere
            <textarea
              value={formData.description}
              onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              rows={3}
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Culoare
              <input
                type="color"
                value={formData.color}
                onChange={(event) => setFormData((current) => ({ ...current, color: event.target.value }))}
                className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-1"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Email notificare
              <input
                type="email"
                value={formData.notification_email}
                onChange={(event) => setFormData((current) => ({ ...current, notification_email: event.target.value }))}
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
                placeholder="it@exemplu.ro"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(event) => setFormData((current) => ({ ...current, is_active: event.target.checked }))}
              className="h-4 w-4"
            />
            Activ
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="min-h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-70"
            >
              {saving ? 'Se salvează...' : 'Salvează'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false)
                setEditingDepartment(null)
                setFormData(initialForm)
              }}
              className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700"
            >
              Renunță
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Se încarcă departamentele...</p>
      ) : departments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          Nu există departamente.
        </div>
      ) : (
        <div className="space-y-3">
          {departments.map((department) => (
            <article key={department.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: department.color }} />
                    <h3 className="text-base font-semibold text-slate-900">{department.name}</h3>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{department.description || 'Fără descriere'}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    department.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {department.is_active ? 'Activ' : 'Inactiv'}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-600">
                <span className="font-medium">Email notificare:</span>{' '}
                {department.notification_email || 'Nedefinit'}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openEditForm(department)}
                  className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-sm text-slate-700"
                >
                  <Pencil size={14} />
                  Editează
                </button>

                {department.is_active ? (
                  <button
                    type="button"
                    onClick={() => setDepartmentStatus(department, false)}
                    className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-red-50 px-3 text-sm text-red-700"
                  >
                    <Trash2 size={14} />
                    Dezactivează
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDepartmentStatus(department, true)}
                    className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-emerald-50 px-3 text-sm text-emerald-700"
                  >
                    <RefreshCw size={14} />
                    Reactivează
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
