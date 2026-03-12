import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, ChevronDown, Info, Loader2 } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { createTicket } from '../api/tickets'
import { getDepartments } from '../api/departments'
import { CATEGORY_OPTIONS, PRIORITY_OPTIONS } from '../config/constants'
import { useAuth } from '../context/AuthContext'

export default function TicketNew() {
  const { role } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = location.state || {}
  const descriptionRef = useRef(null)
  const [formData, setFormData] = useState({
    title: prefill.prefillTitle || '',
    description: prefill.prefillDescription || '',
    category: 'auto',
    priority: 'medium',
    department: '',
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [departments, setDepartments] = useState([])
  const [departmentsLoading, setDepartmentsLoading] = useState(false)
  const [departmentsError, setDepartmentsError] = useState('')


  useEffect(() => {
    if (role !== 'admin') return

    async function loadDepartments() {
      setDepartmentsLoading(true)
      setDepartmentsError('')

      try {
        const result = await getDepartments()
        setDepartments(Array.isArray(result) ? result : [])
      } catch {
        setDepartmentsError('Nu s-au putut încărca departamentele')
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
  }

  const validate = () => {
    const nextErrors = {}

    if (!formData.title.trim()) {
      nextErrors.title = 'Titlul este obligatoriu.'
    }

    if (!formData.description.trim()) {
      nextErrors.description = 'Descrierea este obligatorie.'
    }

    if (role === 'admin' && !formData.department) {
      nextErrors.department = 'Alege un departament.'
    }

    return nextErrors
  }

  const handleSubmit = async () => {
    const nextErrors = validate()

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSubmitting(true)
    setSuccessMessage('')
    setErrors((current) => ({ ...current, submit: '' }))

    try {
      const result = await createTicket({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        department_id: formData.department || null,
        user_id: null,
      })

      if (result.success) {
        setSuccessMessage(`Tichetul ${result.ticket?.ticket_number || ''} a fost creat cu succes.`)
        setTimeout(() => {
          navigate('/dashboard')
        }, 1200)
      } else {
        setErrors({ submit: result.error || 'Eroare la crearea tichetului.' })
      }
    } catch (err) {
      setErrors({ submit: err.message || 'Nu s-a putut contacta serverul.' })
    }

    setIsSubmitting(false)
  }

  const isSubmitDisabled = !formData.title.trim() || !formData.description.trim() || isSubmitting
    || (role === 'admin' && departmentsLoading)

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

      <form className="space-y-4 pb-28" onSubmit={(event) => event.preventDefault()} noValidate>
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

        <div className={role === 'admin' ? 'space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0' : ''}>
          <div>
            <label htmlFor="category" className="mb-1 block text-sm font-medium text-slate-700">
              Categorie
            </label>
            <div className="relative">
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full min-h-[48px] appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
            {role !== 'admin' && (
              <p className="mt-1 text-xs text-slate-400">
                Opțional — lasă pe Autodetectare și AI-ul va alege categoria potrivită.
              </p>
            )}
          </div>

          {role === 'admin' && (
            <div>
              <label htmlFor="department" className="mb-1 block text-sm font-medium text-slate-700">
                Departament destinație
              </label>
              <div className="relative">
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={`w-full min-h-[48px] appearance-none rounded-xl border bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.department ? 'border-red-400 focus:ring-red-500' : 'border-slate-300'
                  }`}
                  aria-invalid={Boolean(errors.department)}
                  aria-describedby={errors.department ? 'department-error' : undefined}
                >
                  <option value="" disabled>
                    — Alege departamentul —
                  </option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
              {departmentsLoading && <p className="mt-1 text-sm text-slate-500">Așteaptă... se încarcă departamentele</p>}
              {departmentsError && <p className="mt-1 text-sm text-red-600">Nu s-au putut încărca departamentele</p>}
              {!departmentsLoading && !departmentsError && departments.length === 0 && (
                <p className="mt-1 text-sm text-slate-500">Nu există departamente</p>
              )}
              {errors.department && (
                <p id="department-error" className="mt-1 text-sm text-red-600">
                  {errors.department}
                </p>
              )}
            </div>
          )}
        </div>

        {role !== 'admin' && (
          <div
            className={`flex gap-2 rounded-xl border p-3 ${
              formData.category === 'auto'
                ? 'border-blue-100 bg-blue-50'
                : 'border-green-100 bg-green-50'
            }`}
          >
            {formData.category === 'auto' ? (
              <Info size={16} className="mt-0.5 flex-shrink-0 text-blue-500" />
            ) : (
              <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-green-500" />
            )}
            <p
              className={`text-xs ${
                formData.category === 'auto' ? 'text-blue-700' : 'text-green-700'
              }`}
            >
              {formData.category === 'auto'
                ? 'Categoria și departamentul vor fi determinate automat pe baza descrierii tale.'
                : 'Tichetul va fi direcționat pe baza categoriei alese.'}
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
        </div>

        {successMessage && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center text-green-700">
            <div className="flex items-center justify-center gap-2 text-sm font-medium">
              <CheckCircle2 size={18} />
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {errors.submit && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errors.submit}
          </p>
        )}

        <div className="fixed bottom-20 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent px-4 pb-2 pt-4 md:static md:bg-none md:px-0 md:pb-0 md:pt-2">
          <button
            type="button"
            onClick={handleSubmit}
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
