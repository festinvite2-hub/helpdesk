import { ChevronLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import TicketThread from '../components/tickets/TicketThread'
import { useAuth } from '../context/AuthContext'

function InlineErrorState({ message }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-700 shadow-sm">
      {message}
    </div>
  )
}

export default function TicketDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()

  if (!id) {
    return <InlineErrorState message="Lipsește ID-ul ticketului din adresă." />
  }

  if (!user) {
    return <InlineErrorState message="Nu există un utilizator autentificat. Te rugăm să te reautentifici." />
  }

  return (
    <div className="space-y-6 pb-28 md:pb-6">
      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              aria-label="Înapoi"
            >
              <ChevronLeft size={20} />
            </button>

            <div>
              <p className="text-sm font-medium text-slate-500">Ticket</p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-900">Detalii ticket</h1>
              <p className="mt-2 text-sm text-slate-600">ID ticket: <span className="font-medium text-slate-900">{id}</span></p>
            </div>
          </div>
        </div>
      </section>

      <TicketThread ticketId={id} currentUser={user} />
    </div>
  )
}
