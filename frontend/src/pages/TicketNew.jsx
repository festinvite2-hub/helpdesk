import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { createTicketMock } from '../api/tickets'
import { CATEGORY_OPTIONS, PRIORITY_OPTIONS } from '../config/constants'

export default function TicketNew() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: CATEGORY_OPTIONS[0].value,
    priority: PRIORITY_OPTIONS[1].value,
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

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

    return nextErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate()

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSubmitting(true)
    setSuccessMessage('')

    const result = await createTicketMock(formData)

    if (result.success) {
      setSuccessMessage(`Tichetul ${result.ticket_id} a fost creat cu succes. Redirecționare către panoul principal...`)
      setTimeout(() => {
        navigate('/dashboard')
      }, 1200)
    }

    setIsSubmitting(false)
  }

  return (
    <section className="mx-auto w-full max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <header className="mb-6 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Creează tichet nou</h1>
          <p className="text-sm text-slate-600">
            Trimite o solicitare către echipa internă de helpdesk AI.
          </p>
        </header>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
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
              className="min-h-[44px] w-full rounded-xl border border-slate-300 px-3 py-2 text-base outline-none ring-blue-500 focus:ring"
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
              name="description"
              rows={5}
              value={formData.description}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base outline-none ring-blue-500 focus:ring"
              placeholder="Descrie ce s-a întâmplat, comportamentul așteptat și urgența"
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? 'description-error' : undefined}
            />
            {errors.description && (
              <p id="description-error" className="mt-1 text-sm text-red-600">
                {errors.description}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className="mb-1 block text-sm font-medium text-slate-700">
                Categorie
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="min-h-[44px] w-full rounded-xl border border-slate-300 px-3 py-2 text-base outline-none ring-blue-500 focus:ring"
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="mb-1 block text-sm font-medium text-slate-700">
                Prioritate
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="min-h-[44px] w-full rounded-xl border border-slate-300 px-3 py-2 text-base outline-none ring-blue-500 focus:ring"
              >
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {successMessage && (
            <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all active:scale-[0.98] active:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Se trimite...
              </>
            ) : (
              'Trimite tichetul'
            )}
          </button>
        </form>
      </div>
    </section>
  )
}
