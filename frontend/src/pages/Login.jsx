import { useState } from 'react'
import { Bot, Lock, Mail, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { useMocks } from '../api/client'
import { getHomeRouteByRole, normalizeRole, useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { setAuthSession } = useAuth()
  const isMockMode = useMocks()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')

    if (isMockMode) {
      navigate(getHomeRouteByRole('user'))
      return
    }

    if (!email.trim()) {
      setError('Introdu adresa de email.')
      return
    }

    if (!password) {
      setError('Introdu parola.')
      return
    }

    setIsLoading(true)

    try {
      const result = await login(email, password)

      if (result?.token && result?.user) {
        const normalizedRole = normalizeRole(result.user.role)
        const normalizedUser = { ...result.user, role: normalizedRole }
        setAuthSession(result.token, normalizedUser)

        if (normalizedUser.must_change_password) {
          navigate('/change-password', { replace: true })
        } else {
          navigate(getHomeRouteByRole(normalizedRole), { replace: true })
        }
      } else {
        setError(result?.error || 'Email sau parolă incorectă.')
      }
    } catch (err) {
      setError(err.message || 'Nu s-a putut contacta serverul.')
    } finally {
      setIsLoading(false)
    }
  }

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
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full min-h-[48px] px-4 py-3 pl-10 text-base border border-slate-300 rounded-xl"
          />
        </div>

        <div className="relative mb-3">
          <Lock size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="password"
            placeholder="Parolă"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleSubmit()
              }
            }}
            className="w-full min-h-[48px] px-4 py-3 pl-10 text-base border border-slate-300 rounded-xl"
          />
        </div>

        <label className="flex items-center gap-2 mb-4">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600" />
          <span className="text-sm text-slate-600">Ține-mă minte</span>
        </label>

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full min-h-[48px] rounded-xl bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 active:bg-blue-700 active:scale-[0.98] transition-all disabled:bg-blue-300"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Se autentifică...
            </>
          ) : (
            'Autentificare'
          )}
        </button>

        {error && (
          <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 mt-3">{error}</p>
        )}

        {isMockMode && (
          <p className="text-xs text-slate-400 text-center mt-4">Versiune demonstrativă. Apasă Autentificare pentru a continua.</p>
        )}
      </section>
    </main>
  )
}
