import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import ToggleSwitch from '../common/ToggleSwitch'
import { MOCK_DEPARTMENTS_FULL } from '../../mocks/admin'

const PRIORITY_OPTIONS = [
  { value: '', label: '— Nu suprascrie —' },
  { value: 'low', label: 'Scăzută' },
  { value: 'medium', label: 'Medie' },
  { value: 'high', label: 'Ridicată' },
  { value: 'critical', label: 'Critică' },
]

const initialForm = {
  name: '',
  keywords: [],
  targetDepartmentId: '',
  priorityOverride: '',
  sortOrder: 0,
  is_active: true,
}

export default function RoutingRuleModal({ isOpen, rule, onClose, onSave, onDelete }) {
  const [formData, setFormData] = useState(initialForm)
  const [keywordInput, setKeywordInput] = useState('')
  const [errors, setErrors] = useState({})

  const activeDepartments = useMemo(() => MOCK_DEPARTMENTS_FULL.filter((department) => department.is_active), [])

  useEffect(() => {
    if (!isOpen) return

    if (rule) {
      setFormData({
        name: rule.name,
        keywords: rule.keywords,
        targetDepartmentId: rule.target_department.id,
        priorityOverride: rule.priority_override ?? '',
        sortOrder: rule.sort_order,
        is_active: rule.is_active,
      })
    } else {
      setFormData(initialForm)
    }

    setKeywordInput('')
    setErrors({})
  }, [isOpen, rule])

  if (!isOpen) return null

  const handleKeywordInput = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      const val = keywordInput.trim().replace(',', '')
      if (val && !formData.keywords.includes(val)) {
        setFormData((prev) => ({ ...prev, keywords: [...prev.keywords, val] }))
      }
      setKeywordInput('')
    }
  }

  const removeKeyword = (keyword) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((item) => item !== keyword),
    }))
  }

  const validate = () => {
    const nextErrors = {}

    if (!formData.name.trim()) nextErrors.name = 'Numele regulii este obligatoriu.'
    if (!formData.keywords.length) nextErrors.keywords = 'Adaugă cel puțin un cuvânt cheie.'
    if (!formData.targetDepartmentId) nextErrors.targetDepartment = 'Alege departamentul destinație.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!validate()) return

    const targetDepartment = activeDepartments.find((department) => department.id === formData.targetDepartmentId)
    if (!targetDepartment) return

    onSave({
      name: formData.name.trim(),
      rule_type: 'keyword',
      keywords: formData.keywords,
      target_department: {
        id: targetDepartment.id,
        name: targetDepartment.name,
        color: targetDepartment.color,
      },
      priority_override: formData.priorityOverride || null,
      sort_order: Number.isNaN(Number(formData.sortOrder)) ? 0 : Number(formData.sortOrder),
      is_active: formData.is_active,
    })
  }

  return (
    <>
      <div className="fixed inset-0 z-40 hidden bg-black/50 md:block" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex flex-col bg-white md:inset-auto md:left-1/2 md:top-1/2 md:max-h-[90vh] md:w-full md:max-w-xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold">{rule ? 'Editează regulă de rutare' : 'Adaugă regulă de rutare'}</h2>
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
              <label htmlFor="rule-name" className="mb-1 block text-sm font-medium text-slate-700">
                Nume regulă
              </label>
              <input
                id="rule-name"
                type="text"
                value={formData.name}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Ex: WiFi și rețea"
                className="w-full min-h-[48px] rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="rule-keyword" className="mb-1 block text-sm font-medium text-slate-700">
                Keywords
              </label>
              <input
                id="rule-keyword"
                type="text"
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                onKeyDown={handleKeywordInput}
                placeholder="Scrie un cuvânt cheie și apasă Enter"
                className="w-full min-h-[48px] rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      className="ml-1 text-slate-400 transition-colors hover:text-slate-600"
                      aria-label={`Elimină keyword ${keyword}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              {errors.keywords && <p className="mt-1 text-xs text-red-600">{errors.keywords}</p>}
            </div>

            <div>
              <label htmlFor="rule-department" className="mb-1 block text-sm font-medium text-slate-700">
                Departament destinație
              </label>
              <div className="relative">
                <select
                  id="rule-department"
                  value={formData.targetDepartmentId}
                  onChange={(event) => setFormData((prev) => ({ ...prev, targetDepartmentId: event.target.value }))}
                  className="w-full min-h-[48px] appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Selectează —</option>
                  {activeDepartments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
              {errors.targetDepartment && <p className="mt-1 text-xs text-red-600">{errors.targetDepartment}</p>}
            </div>

            <div>
              <label htmlFor="rule-priority" className="mb-1 block text-sm font-medium text-slate-700">
                Prioritate suprascrisă
              </label>
              <div className="relative">
                <select
                  id="rule-priority"
                  value={formData.priorityOverride}
                  onChange={(event) => setFormData((prev) => ({ ...prev, priorityOverride: event.target.value }))}
                  className="w-full min-h-[48px] appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value || 'none'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
            </div>

            <div>
              <label htmlFor="rule-order" className="mb-1 block text-sm font-medium text-slate-700">
                Ordine de prioritate (mai mic = verificat primul)
              </label>
              <input
                id="rule-order"
                type="number"
                min="0"
                step="1"
                value={formData.sortOrder}
                onChange={(event) => setFormData((prev) => ({ ...prev, sortOrder: event.target.value }))}
                className="w-full min-h-[48px] rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <p className="mb-1 block text-sm font-medium text-slate-700">Activ</p>
              <ToggleSwitch
                enabled={formData.is_active}
                onChange={(nextValue) => setFormData((prev) => ({ ...prev, is_active: nextValue }))}
                label="Stare regulă de rutare"
              />
            </div>
          </div>

          <footer className="border-t border-slate-200 px-4 py-3">
            <button
              type="submit"
              className="min-h-[48px] w-full rounded-xl bg-blue-600 font-semibold text-white transition-all active:scale-[0.98] active:bg-blue-700"
            >
              Salvează
            </button>
            {rule && (
              <button
                type="button"
                onClick={() => onDelete(rule)}
                className="mt-2 min-h-[44px] w-full rounded-xl bg-red-50 font-medium text-red-600 active:bg-red-100"
              >
                Șterge regula
              </button>
            )}
          </footer>
        </form>
      </div>
    </>
  )
}
