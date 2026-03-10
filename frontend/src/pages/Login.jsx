import { Bot, LogIn } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
            <LogIn size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Autentificare Helpdesk</h1>
            <p className="text-sm text-slate-500">Punct de intrare demonstrativ (fără backend)</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
        >
          Continuă către aplicație
        </button>
      </div>
    </main>
  )
}
