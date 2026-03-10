import { Bot, Lock, Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col items-center justify-center p-6">
      <section className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
          <Bot size={32} className="text-white" />
        </div>
        <h1 className="text-xl font-bold mt-4">Helpdesk Intern</h1>
        <p className="text-sm text-slate-500">Sistem de ticketing cu AI</p>
      </section>

      <section className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mt-8">
        <div className="relative mb-3">
          <Mail size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="email"
            placeholder="Email"
            className="w-full min-h-[48px] px-4 py-3 pl-10 text-base border border-slate-300 rounded-xl"
          />
        </div>

        <div className="relative mb-3">
          <Lock size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="password"
            placeholder="Parolă"
            className="w-full min-h-[48px] px-4 py-3 pl-10 text-base border border-slate-300 rounded-xl"
          />
        </div>

        <label className="flex items-center gap-2 mb-4">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600" />
          <span className="text-sm text-slate-600">Ține-mă minte</span>
        </label>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full min-h-[48px] rounded-xl bg-blue-600 text-white font-semibold active:bg-blue-700 active:scale-[0.98] transition-all"
        >
          Autentificare
        </button>

        <p className="text-xs text-slate-400 text-center mt-4">
          Aceasta este o versiune demonstrativă. Apasă Autentificare pentru a continua.
        </p>
      </section>
    </main>
  )
}
