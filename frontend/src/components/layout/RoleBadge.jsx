import { ROLE_LABELS, useAuth } from '../../context/AuthContext'

export default function RoleBadge({ role }) {
  const { user, isMockMode } = useAuth()

  if (!isMockMode && user) {
    return (
      <div className="rounded-xl bg-slate-100 px-3 py-2 text-right">
        <p className="text-sm font-medium text-slate-900">{user.full_name}</p>
        <p className="text-xs text-slate-500">{user.email}</p>
        <p className="text-xs font-semibold text-slate-600">{ROLE_LABELS[user.role]}</p>
      </div>
    )
  }

  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
      {role === 'user' ? 'Autentificat ca utilizator' : `Autentificat ca ${ROLE_LABELS[role].toLowerCase()}`}
    </span>
  )
}
