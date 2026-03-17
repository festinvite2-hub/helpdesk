import { useState } from 'react'
import { Loader2, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { changePassword } from '../api/auth'
import { getHomeRouteByRole, normalizeRole, useAuth } from '../context/AuthContext'

export default function ChangePassword() {
  const navigate = useNavigate()
  const { user, setUser } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError('Toate câmpurile sunt obligatorii.')
      return
    }

    if (newPassword.length < 6) {
      setError('Parola nouă trebuie să aibă minim 6 caractere.')
      return
    }

    if (newPassword !== confirmNewPassword) {
      setError('Confirmarea parolei noi trebuie să coincidă.')
      return
    }

    if (!user?.id) {
      setError('Sesiune invalidă. Te rugăm să te autentifici din nou.')
      return
    }

    setIsLoading(true)

    try {
      await changePassword(user.id, currentPassword, newPassword)
      const updatedUser = { ...user, must_change_password: false }
      setUser(updatedUser)
      setSuccess('Parola a fost schimbată cu succes.')
      navigate(getHomeRouteByRole(normalizeRole(updatedUser.role)), { replace: true })
    } catch (err) {
      setError(err.message || 'Nu am putut schimba parola.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col items-center justify-center p-6">
      <section className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h1 className="text-2xl font-bold text-slate-900">Schimbă parola</h1>
        <p className="mt-2 text-sm text-slate-600">
          Pentru securitatea contului, este necesar să îți schimbi parola la prima autentificare.
        </p>

        <div className="relative mt-6 mb-3">
          <Lock size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="password"
            placeholder="Parola curentă"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="w-full min-h-[48px] px-4 py-3 pl-10 text-base border border-slate-300 rounded-xl"
          />
        </div>

        <div className="relative mb-3">
          <Lock size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="password"
            placeholder="Parola nouă"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="w-full min-h-[48px] px-4 py-3 pl-10 text-base border border-slate-300 rounded-xl"
          />
        </div>

        <div className="relative mb-3">
          <Lock size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="password"
            placeholder="Confirmă parola nouă"
            value={confirmNewPassword}
            onChange={(event) => setConfirmNewPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleSubmit()
              }
            }}
            className="w-full min-h-[48px] px-4 py-3 pl-10 text-base border border-slate-300 rounded-xl"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full min-h-[48px] rounded-xl bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 active:bg-blue-700 active:scale-[0.98] transition-all disabled:bg-blue-300"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Se actualizează...
            </>
          ) : (
            'Actualizează parola'
          )}
        </button>

        {error && (
          <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 mt-3">{error}</p>
        )}

        {success && (
          <p className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 mt-3">{success}</p>
        )}
      </section>
    </main>
  )
}
