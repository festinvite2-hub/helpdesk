import { roleLinks, useAuth } from '../../context/AuthContext'
import Brand from './Brand'
import Navigation from './Navigation'
import RolePicker from './RolePicker'

export default function Sidebar() {
  const { role, setRole } = useAuth()
  const links = roleLinks[role] || roleLinks.user

  return (
    <aside className="hidden h-screen w-64 sticky top-0 border-r border-slate-200 bg-white p-5 md:flex md:flex-col">
      <Brand />
      <div className="mt-4">
        <RolePicker role={role} onRoleChange={setRole} />
      </div>

      <div className="my-3 border-t border-slate-200" />

      <Navigation links={links} />

      <div className="mt-auto pt-4 text-xs text-slate-400">v2.1</div>
    </aside>
  )
}
