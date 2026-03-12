import { useMemo, useState } from 'react'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ToggleSwitch from '../components/common/ToggleSwitch'
import { ROLE_LABELS, useAuth } from '../context/AuthContext'

const PROFILES = {
  user: { name: 'Maria Popescu', email: 'maria.popescu@scoala.local', role: 'user', department: null },
  dept_manager: {
    name: 'Andrei Tecuci',
    email: 'andrei.tecuci@scoala.local',
    role: 'dept_manager',
    department: { name: 'IT', color: '#3B82F6' },
  },
  admin: { name: 'Administrator Sistem', email: 'admin@helpdesk.local', role: 'admin', department: null },
}

const ROLE_BADGE_CLASSES = {
  user: 'bg-slate-100 text-slate-700',
  dept_manager: 'bg-blue-100 text-blue-700',
  admin: 'bg-purple-100 text-purple-700',
}

const STATS_BY_ROLE = {
  user: [
    { label: 'Tichete create', value: '6' },
    { label: 'Rezolvate', value: '3' },
    { label: 'Timp mediu rezolvare', value: '~8h' },
  ],
  dept_manager: [
    { label: 'Tichete gestionate', value: '8' },
    { label: 'Rezolvate', value: '5' },
    { label: 'Timp mediu rezolvare', value: '~4h' },
    { label: 'Departament', value: 'IT' },
  ],
}

function getInitials(name) {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function Profile() {
  const navigate = useNavigate()
  const { role, user, isMockMode, logout } = useAuth()

  const profile = !isMockMode && user
    ? {
        name: user.full_name,
        email: user.email,
        role: user.role || 'user',
        department: user.department ?? user.main_department ?? null,
      }
    : PROFILES[role] ?? PROFILES.user

  const [notificationsPush, setNotificationsPush] = useState(true)
  const [notificationsEmail, setNotificationsEmail] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  const stats = useMemo(() => STATS_BY_ROLE[profile.role] ?? STATS_BY_ROLE.user, [profile.role])

  const departmentName = useMemo(() => {
    if (!profile.department) return null
    if (typeof profile.department === 'string') return profile.department
    return profile.department.name ?? null
  }, [profile.department])

  return (
    <section className="space-y-4 md:mx-auto md:max-w-lg">
      <header className="space-y-4 pt-1">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Profil</h1>
          <p className="mt-1 text-sm text-slate-500">Gestionează datele contului și preferințele aplicației</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
            {getInitials(profile.name)}
          </div>
          <h2 className="mt-3 text-center text-base font-semibold text-slate-900">{profile.name}</h2>
          <p className="text-center text-sm text-slate-500">{profile.email}</p>
          <div className="mt-2 flex justify-center">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ROLE_BADGE_CLASSES[profile.role]}`}>
              {ROLE_LABELS[profile.role]}
            </span>
          </div>
        </div>
      </header>

      <article className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Informații cont</h2>
        <div className="space-y-3">
          <div className="flex min-h-[44px] items-center justify-between gap-4">
            <span className="text-sm text-slate-500">Nume complet</span>
            <span className="text-sm font-medium text-slate-900">{profile.name}</span>
          </div>
          <div className="flex min-h-[44px] items-center justify-between gap-4">
            <span className="text-sm text-slate-500">Email</span>
            <span className="text-sm font-medium text-slate-900">{profile.email}</span>
          </div>
          <div className="flex min-h-[44px] items-center justify-between gap-4">
            <span className="text-sm text-slate-500">Rol</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_BADGE_CLASSES[profile.role]}`}>
              {ROLE_LABELS[profile.role]}
            </span>
          </div>
          {departmentName && (
            <div className="flex min-h-[44px] items-center justify-between gap-4">
              <span className="text-sm text-slate-500">Departament principal</span>
              {profile.department && typeof profile.department === 'object' && profile.department.color ? (
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: profile.department.color }}
                >
                  {departmentName}
                </span>
              ) : (
                <span className="text-sm font-medium text-slate-900">{departmentName}</span>
              )}
            </div>
          )}
          <div className="flex min-h-[44px] items-center justify-between gap-4">
            <span className="text-sm text-slate-500">Membru din</span>
            <span className="text-sm font-medium text-slate-900">Februarie 2025</span>
          </div>
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Statistici</h2>
        <div className="space-y-3">
          {stats.map((item) => (
            <div key={item.label} className="flex min-h-[44px] items-center justify-between gap-4">
              <span className="text-sm text-slate-500">{item.label}</span>
              <span className="text-sm font-medium text-slate-900">{item.value}</span>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-slate-900">Setări aplicație</h2>
        <div>
          <div className="flex min-h-[44px] items-center justify-between gap-4 border-b border-slate-100 py-3">
            <span className="text-sm text-slate-600">Notificări push</span>
            <ToggleSwitch
              enabled={notificationsPush}
              onChange={setNotificationsPush}
              label="Activează notificările push"
            />
          </div>
          <div className="flex min-h-[44px] items-center justify-between gap-4 border-b border-slate-100 py-3">
            <span className="text-sm text-slate-600">Notificări email</span>
            <ToggleSwitch
              enabled={notificationsEmail}
              onChange={setNotificationsEmail}
              label="Activează notificările prin email"
            />
          </div>
          <div className="flex min-h-[44px] items-center justify-between gap-4 py-3">
            <span className="text-sm text-slate-600">Mod întunecat</span>
            <ToggleSwitch enabled={darkMode} onChange={setDarkMode} label="Activează modul întunecat" />
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400">Setările sunt salvate automat.</p>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Despre aplicație</h2>
        <div className="space-y-3">
          <div className="flex min-h-[44px] items-center justify-between gap-4">
            <span className="text-sm text-slate-500">Versiune</span>
            <span className="text-sm font-medium text-slate-900">v2.1</span>
          </div>
          <div className="flex min-h-[44px] items-center justify-between gap-4">
            <span className="text-sm text-slate-500">Stack</span>
            <span className="text-right text-sm font-medium text-slate-900">React + n8n + PostgreSQL + Ollama</span>
          </div>
          <div className="flex min-h-[44px] items-center justify-between gap-4">
            <span className="text-sm text-slate-500">Build</span>
            <span className="text-sm font-medium text-slate-900">Martie 2026</span>
          </div>
        </div>
      </article>

      <button
        type="button"
        onClick={() => {
          logout()
          navigate('/login')
        }}
        className="mb-8 mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-600 transition-all active:scale-[0.98] active:bg-red-100"
      >
        <LogOut size={18} />
        Deconectare
      </button>
    </section>
  )
}
