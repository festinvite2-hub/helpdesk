import { ROLE_LABELS, useAuth } from '../../context/AuthContext'

export default function RoleBadge({ role }) {
  const { user, isMockMode } = useAuth()

  if (!isMockMode && user) {
    return <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{user.full_name}</span>
  }

  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
      {role === 'user' ? 'Autentificat ca utilizator' : `Autentificat ca ${ROLE_LABELS[role].toLowerCase()}`}
    </span>
  )
}
