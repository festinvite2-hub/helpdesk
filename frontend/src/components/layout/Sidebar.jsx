import { ROLE_LABELS, roleLinks, useAuth } from '../../context/AuthContext'
import Brand from './Brand'
import Navigation from './Navigation'
import RolePicker from './RolePicker'

export default function Sidebar() {
  const { role, setRole, isMockMode, user } = useAuth()
  const links = roleLinks[role] || roleLinks.user

  return (
    <aside className="hidden h-screen w-64 sticky top-0 border-r border-slate-200 bg-white p-5 md:flex md:flex-col">
      <Brand />
      <div className="mt-4">
        {isMockMode ? (
          <RolePicker role={role} onRoleChange={setRole} />
        ) : user ? (
          <div className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <p className="font-medium text-slate-900">{user.full_name}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
            <p className="text-xs font-semibold text-slate-600">{ROLE_LABELS[user.role]}</p>
          </div>
        ) : null}
      </div>

      <div className="my-3 border-t border-slate-200" />

      <Navigation links={links} />

      <div className="mt-auto pt-4 text-xs text-slate-400">v2.1</div>
    </aside>
  )
}
