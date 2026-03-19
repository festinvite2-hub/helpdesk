import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, ChevronDown, Info, Loader2 } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { createTicket } from '../api/tickets'
import { getDepartments } from '../api/departments'
import { ApiError } from '../api/client'
import { PRIORITY_OPTIONS } from '../config/constants'
import { useAuth } from '../context/AuthContext'

const AUTO_DEPARTMENT_VALUE = 'auto'

function getInitialFormData(prefill, role) {
  return {
    title: prefill.prefillTitle || '',
    description: prefill.prefillDescription || '',
    priority: 'medium',
    department: role === 'admin' ? '' : AUTO_DEPARTMENT_VALUE,
  }
}

export default function TicketNew() {
  const { role, user } = useAuth()
  const location = useLocation()
  const prefill = location.state || {}
  const descriptionRef = useRef(null)
  const [formData, setFormData] = useState(() => getInitialFormData(prefill, role))
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [requiresManualDepartment, setRequiresManualDepartment] = useState(false)
  const [departments, setDepartments] = useState([])
  const [departmentsLoading, setDepartmentsLoading] = useState(false)
  const [departmentsError, setDepartmentsError] = useState('')


  useEffect(() => {
    async function loadDepartments() {
      setDepartmentsLoading(true)
      setDepartmentsError('')

      try {
        const result = await getDepartments()
        setDepartments(Array.isArray(result) ? result : [])
      } catch {
        setDepartmentsError('Lista departamentelor nu a putut fi încărcată. Reîncearcă.')
        setDepartments([])
      } finally {
        setDepartmentsLoading(false)
      }
    }

    loadDepartments()
  }, [role])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setSuccessMessage('')

    if (name === 'department' && value !== AUTO_DEPARTMENT_VALUE) {
      setRequiresManualDepartment(false)
    }
  }

  const validate = () => {
    const nextErrors = {}

    if (!formData.title.trim()) {
      nextErrors.title = 'Titlul este obligatoriu.'
    }

    if (!formData.description.trim()) {
      nextErrors.description = 'Descrierea este obligatorie.'
    }

    if (!formData.priority) {
      nextErrors.priority = 'Prioritatea este obligatorie.'
    }

    if (role === 'admin' && !formData.department) {
      nextErrors.department = 'Alege un departament.'
    }

    if (role !== 'admin' && requiresManualDepartment && formData.department === AUTO_DEPARTMENT_VALUE) {
      nextErrors.department = 'Te rugăm să alegi manual un departament.'
    }

    return nextErrors
  }

  const handleCreateTicketResult = (result) => {
    if (result?.success) {
      setSuccessMessage(result.message || 'Tichetul a fost creat cu succes.')
      setRequiresManualDepartment(false)
      setErrors({})
      setFormData(getInitialFormData({}, role))
      return true
    }

    if (result?.requires_manual_department) {
      setRequiresManualDepartment(true)
      setErrors((current) => ({
        ...current,
        submit: '',
        department: result.message || 'Nu am putut identifica automat departamentul. Te rugăm să alegi manual departamentul.',
      }))
      return false
    }

    setErrors({
      submit: result?.message || result?.error || 'Eroare la crearea tichetului.',
    })
    return false
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    if (import.meta.env.DEV) {
      console.debug('[TicketNew] handleSubmit triggered')
    }

    const nextErrors = validate()

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    if (!user?.id) {
      setErrors((current) => ({ ...current, submit: 'Nu s-a putut identifica utilizatorul autentificat.' }))
      return
    }

    setIsSubmitting(true)
    setErrors((current) => ({ ...current, submit: '' }))
    setSuccessMessage('')

    try {
      if (import.meta.env.DEV) {
        console.debug('[TicketNew] createTicket called')
      }

      const isManualRouting = role === 'admin'
        ? Boolean(formData.department)
        : formData.department !== AUTO_DEPARTMENT_VALUE

      const result = await createTicket(role === 'admin'
        ? {
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            routing_mode: 'manual',
            department_id: formData.department || null,
            user_id: user.id,
          }
        : {
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            routing_mode: isManualRouting ? 'manual' : 'auto',
            department_id: isManualRouting ? formData.department : null,
            user_id: user.id,
          })

      handleCreateTicketResult(result)
    } catch (err) {
      if (err instanceof ApiError && err?.data?.requires_manual_department) {
        handleCreateTicketResult({
          success: false,
          requires_manual_department: true,
          message: err.data.message || err.message,
        })
      } else {
        setErrors({ submit: err.message || 'Nu s-a putut contacta serverul.' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const isSubmitDisabled = !formData.title.trim() || !formData.description.trim() || isSubmitting
    || (role === 'admin' && departmentsLoading)

  const showDepartmentField = role === 'admin' || role === 'user'
  const showDepartmentRetryHint = role === 'user' && requiresManualDepartment
  const departmentErrorMessage = errors.department || ''
  const shouldHighlightDepartment = Boolean(departmentErrorMessage) || showDepartmentRetryHint
  const userNeedsDepartmentsRetry = role === 'user' && requiresManualDepartment && departmentsError
  const userHasOnlyAutoOption = role === 'user' && !departmentsLoading && departments.length === 0

  return (
    <section className="w-full md:mx-auto md:max-w-2xl">
      <header className="mb-4 space-y-1">
        <h1 className="text-xl font-bold">Creează tichet nou</h1>
        <p className="mt-1 text-sm text-slate-500">
          {role === 'admin'
            ? 'Creează un tichet și alege departamentul destinație.'
            : 'Descrie problema ta și o vom direcționa automat.'}
        </p>
      </header>

      <form className="space-y-4 pb-28" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700">
            Titlu
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                descriptionRef.current?.focus()
              }
            }}
            className={`w-full min-h-[48px] rounded-xl border bg-white px-4 py-3 text-base outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
              errors.title ? 'border-red-400 focus:ring-red-500' : 'border-slate-300'
            }`}
            placeholder="Rezumat scurt al problemei"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'title-error' : undefined}
          />
          {errors.title && (
            <p id="title-error" className="mt-1 text-sm text-red-600">
              {errors.title}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">
            Descriere
          </label>
          <textarea
            id="description"
            ref={descriptionRef}
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={`w-full min-h-[140px] resize-none rounded-xl border bg-white px-4 py-3 text-base outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
              errors.description ? 'border-red-400 focus:ring-red-500' : 'border-slate-300'
            }`}
            placeholder="Descrie ce s-a întâmplat, ce ai încercat, și cât de urgent e"
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? 'description-error' : undefined}
          />
          {errors.description && (
            <p id="description-error" className="mt-1 text-sm text-red-600">
              {errors.description}
            </p>
          )}
        </div>

        <div className={role === 'admin' ? 'space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0' : 'space-y-4'}>
          {showDepartmentField && (
            <div>
              <label htmlFor="department" className="mb-1 block text-sm font-medium text-slate-700">
                {role === 'admin' ? 'Departament destinație' : 'Departament'}
              </label>
              <div className="relative">
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={`w-full min-h-[48px] appearance-none rounded-xl border bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-500 ${
                    shouldHighlightDepartment ? 'border-red-400 focus:ring-red-500' : 'border-slate-300'
                  }`}
                  aria-invalid={shouldHighlightDepartment}
                  aria-describedby={shouldHighlightDepartment ? 'department-error' : undefined}
                >
                  {role === 'user' && (
                    <option value={AUTO_DEPARTMENT_VALUE}>
                      Autodetectare
                    </option>
                  )}
                  {role === 'admin' && (
                    <option value="" disabled>
                      — Alege departamentul —
                    </option>
                  )}
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
              {role === 'user' && (
                <p className="mt-1 text-xs text-slate-400">
                  Lasă pe Autodetectare pentru rutare automată sau alege manual dacă știi deja departamentul potrivit.
                </p>
              )}
              {departmentsLoading && <p className="mt-1 text-sm text-slate-500">Așteaptă... se încarcă departamentele</p>}
              {departmentsError && !userNeedsDepartmentsRetry && (
                <p className="mt-1 text-sm text-red-600">{departmentsError}</p>
              )}
              {!departmentsLoading && !departmentsError && role === 'admin' && departments.length === 0 && (
                <p className="mt-1 text-sm text-slate-500">Nu există departamente</p>
              )}
              {userHasOnlyAutoOption && (
                <p className="mt-1 text-sm text-slate-500">Poți trimite tichetul cu Autodetectare chiar dacă lista departamentelor nu este disponibilă.</p>
              )}
              {showDepartmentRetryHint && (
                <p id="department-error" className="mt-1 text-sm text-red-600">
                  {departmentErrorMessage || 'Selectează manual departamentul pentru a continua.'}
                </p>
              )}
              {showDepartmentRetryHint && !departmentErrorMessage && (
                <p className="mt-1 text-sm text-amber-700">
                  Selectează manual departamentul pentru a continua.
                </p>
              )}
              {userNeedsDepartmentsRetry && (
                <p className="mt-1 text-sm text-red-600">
                  Lista departamentelor nu a putut fi încărcată. Reîncearcă.
                </p>
              )}
            </div>
          )}
        </div>

        {role !== 'admin' && !requiresManualDepartment && (
          <div
            className={`flex gap-2 rounded-xl border p-3 ${
              formData.department === AUTO_DEPARTMENT_VALUE
                ? 'border-blue-100 bg-blue-50'
                : 'border-green-100 bg-green-50'
            }`}
          >
            {formData.department === AUTO_DEPARTMENT_VALUE ? (
              <Info size={16} className="mt-0.5 flex-shrink-0 text-blue-500" />
            ) : (
              <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-green-500" />
            )}
            <p
              className={`text-xs ${
                formData.department === AUTO_DEPARTMENT_VALUE ? 'text-blue-700' : 'text-green-700'
              }`}
            >
              {formData.department === AUTO_DEPARTMENT_VALUE
                ? 'Departamentul va fi determinat automat pe baza descrierii tale.'
                : 'Tichetul va fi trimis direct către departamentul selectat.'}
            </p>
          </div>
        )}

        <div>
          <p className="mb-1 text-sm font-medium text-slate-700">Prioritate</p>
          <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1">
            {PRIORITY_OPTIONS.map((priority) => {
              const isActive = formData.priority === priority.value

              return (
                <button
                  key={priority.value}
                  type="button"
                  onClick={() => setFormData((current) => ({ ...current, priority: priority.value }))}
                  className={`flex min-h-[40px] items-center justify-center rounded-lg py-2.5 text-center text-xs font-medium transition-colors ${
                    isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  {priority.label}
                </button>
              )
            })}
          </div>
          {errors.priority && (
            <p className="mt-1 text-sm text-red-600">
              {errors.priority}
            </p>
          )}
        </div>

        {successMessage && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </p>
        )}

        {errors.submit && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errors.submit}
          </p>
        )}

        <div className="fixed bottom-20 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent px-4 pb-2 pt-4 md:static md:bg-none md:px-0 md:pb-0 md:pt-2">
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-xl bg-blue-600 text-base font-semibold text-white shadow-lg transition-all active:scale-[0.98] active:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 md:w-auto md:px-8 md:shadow-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Se trimite...
              </>
            ) : (
              'Trimite tichetul'
            )}
          </button>
        </div>
      </form>
    </section>
  )
}
