import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getDepartments } from '../api/departments'
import {
  createRoutingRule,
  deleteRoutingRule,
  getRoutingRules,
  updateRoutingRule,
} from '../api/routingRules'

const PRIORITY_OPTIONS = [
  { value: '', label: 'Fără suprascriere' },
  { value: 'low', label: 'Scăzută' },
  { value: 'medium', label: 'Medie' },
  { value: 'high', label: 'Ridicată' },
  { value: 'critical', label: 'Critică' },
]

const initialForm = {
  name: '',
  keywords: '',
  targetDepartmentId: '',
  priority_override: '',
  sort_order: 0,
  is_active: true,
}

export default function AdminRoutingRules() {
  const { user } = useAuth()
  const [rules, setRules] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [formData, setFormData] = useState(initialForm)

  const userId = user?.id ?? user?.user_id ?? user?.userId

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [rulesResponse, departmentsResponse] = await Promise.all([
        getRoutingRules(userId),
        getDepartments(),
      ])

      setRules(Array.isArray(rulesResponse) ? rulesResponse : [])
      setDepartments(Array.isArray(departmentsResponse) ? departmentsResponse : [])
    } catch (loadError) {
      setError(loadError?.message || 'Nu s-au putut încărca regulile de rutare.')
      setRules([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const sortedRules = useMemo(
    () => [...rules].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [rules],
  )

  const openCreateForm = () => {
    const nextOrder = sortedRules.length ? Math.max(...sortedRules.map((rule) => Number(rule.sort_order || 0))) + 1 : 1

    setEditingRule(null)
    setFormData({ ...initialForm, sort_order: nextOrder })
    setIsFormOpen(true)
    setSuccessMessage('')
  }

  const openEditForm = (rule) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name ?? '',
      keywords: Array.isArray(rule.keywords) ? rule.keywords.join(', ') : '',
      targetDepartmentId: rule.target_department?.id ? String(rule.target_department.id) : '',
      priority_override: rule.priority_override ?? '',
      sort_order: Number(rule.sort_order ?? 0),
      is_active: Boolean(rule.is_active),
    })
    setIsFormOpen(true)
    setSuccessMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.name.trim()) {
      setError('Numele regulii este obligatoriu.')
      return
    }

    const keywords = formData.keywords
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)

    if (!keywords.length) {
      setError('Adaugă cel puțin un cuvânt cheie.')
      return
    }

    if (!formData.targetDepartmentId) {
      setError('Selectează departamentul destinație.')
      return
    }

    if (!userId) {
      setError('Nu am putut identifica utilizatorul curent.')
      return
    }

    const targetDepartment = departments.find((department) => String(department.id) === String(formData.targetDepartmentId))

    if (!targetDepartment) {
      setError('Departamentul selectat nu este valid.')
      return
    }

    setSaving(true)
    setError('')

    const payload = {
      ...(editingRule?.id ? { id: editingRule.id } : {}),
      name: formData.name.trim(),
      rule_type: editingRule?.rule_type || 'keyword',
      keywords,
      target_department: {
        id: targetDepartment.id,
        name: targetDepartment.name,
        color: targetDepartment.color,
      },
      priority_override: formData.priority_override || null,
      sort_order: Number(formData.sort_order || 0),
      is_active: formData.is_active,
    }

    try {
      if (editingRule?.id) {
        await updateRoutingRule(payload, userId)
        setSuccessMessage('Regula de rutare a fost actualizată.')
      } else {
        await createRoutingRule(payload, userId)
        setSuccessMessage('Regula de rutare a fost creată.')
      }

      setIsFormOpen(false)
      setEditingRule(null)
      setFormData(initialForm)
      await loadData()
    } catch (saveError) {
      setError(saveError?.message || 'Nu am putut salva regula.')
    } finally {
      setSaving(false)
    }
  }

  const setRuleStatus = async (rule, isActive) => {
    if (!userId) {
      setError('Nu am putut identifica utilizatorul curent.')
      return
    }

    setError('')
    setSuccessMessage('')

    try {
      if (!isActive) {
        await deleteRoutingRule(rule.id, userId)
        setSuccessMessage(`Regula „${rule.name}” a fost dezactivată.`)
      } else {
        await updateRoutingRule({ ...rule, is_active: true }, userId)
        setSuccessMessage(`Regula „${rule.name}” a fost reactivată.`)
      }

      await loadData()
    } catch (statusError) {
      setError(statusError?.message || 'Nu am putut actualiza regula.')
    }
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Administrare reguli de rutare</h1>
          <p className="text-sm text-slate-500">Gestionare reguli active/inactive pentru distribuirea tichetelor</p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-blue-600 px-4 text-sm font-semibold text-white active:scale-[0.98]"
        >
          <Plus size={16} />
          Regulă nouă
        </button>
      </header>

      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {successMessage && <p className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">{successMessage}</p>}

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">{editingRule ? 'Editează regulă' : 'Adaugă regulă'}</h2>

          <label className="block text-sm font-medium text-slate-700">
            Nume regulă
            <input
              type="text"
              value={formData.name}
              onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
              placeholder="Ex: Probleme rețea"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Cuvinte cheie (separate prin virgulă)
            <input
              type="text"
              value={formData.keywords}
              onChange={(event) => setFormData((current) => ({ ...current, keywords: event.target.value }))}
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
              placeholder="wifi, internet, router"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Departament destinație
              <select
                value={formData.targetDepartmentId}
                onChange={(event) => setFormData((current) => ({ ...current, targetDepartmentId: event.target.value }))}
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3"
              >
                <option value="">Selectează</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Prioritate suprascrisă
              <select
                value={formData.priority_override}
                onChange={(event) => setFormData((current) => ({ ...current, priority_override: event.target.value }))}
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value || 'none'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Ordine
              <input
                type="number"
                min="0"
                step="1"
                value={formData.sort_order}
                onChange={(event) => setFormData((current) => ({ ...current, sort_order: event.target.value }))}
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
              />
            </label>

            <label className="flex items-center gap-2 self-end text-sm text-slate-700">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(event) => setFormData((current) => ({ ...current, is_active: event.target.checked }))}
                className="h-4 w-4"
              />
              Regulă activă
            </label>
          </div>

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
                setEditingRule(null)
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
        <p className="text-sm text-slate-500">Se încarcă regulile de rutare...</p>
      ) : sortedRules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          Nu există reguli de rutare.
        </div>
      ) : (
        <div className="space-y-3">
          {sortedRules.map((rule) => (
            <article key={rule.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">Ordine: #{rule.sort_order}</p>
                  <h3 className="text-base font-semibold text-slate-900">{rule.name}</h3>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    rule.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {rule.is_active ? 'Activă' : 'Inactivă'}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-600">
                <span className="font-medium">Departament:</span> {rule.target_department_name ?? 'Nesetat'}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                <span className="font-medium">Cuvinte cheie:</span> {rule.keywords?.join(', ') || '—'}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openEditForm(rule)}
                  className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-sm text-slate-700"
                >
                  <Pencil size={14} />
                  Editează
                </button>

                {rule.is_active ? (
                  <button
                    type="button"
                    onClick={() => setRuleStatus(rule, false)}
                    className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-red-50 px-3 text-sm text-red-700"
                  >
                    <Trash2 size={14} />
                    Dezactivează
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRuleStatus(rule, true)}
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
