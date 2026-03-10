import { Suspense } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { roleLinks, useAuth } from '../../context/AuthContext'
import LoadingSkeleton from '../common/LoadingSkeleton'
import Brand from './Brand'
import Navigation from './Navigation'
import RoleBadge from './RoleBadge'
import RolePicker from './RolePicker'

export default function AppLayout() {
  const { role, setRole } = useAuth()
  const links = roleLinks[role]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-72 border-r border-slate-200 bg-white p-5 md:flex md:flex-col md:gap-5">
          <Brand />
          <RolePicker role={role} onRoleChange={setRole} />
          <Navigation links={links} />
        </aside>

        <div className="flex min-h-screen flex-1 flex-col pb-20 md:pb-0">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-8">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
              <Brand mobile />
              <div className="hidden md:block">
                <RoleBadge role={role} />
              </div>
            </div>
            <div className="mt-3 md:hidden">
              <RolePicker role={role} onRoleChange={setRole} />
            </div>
          </header>

          <main className="mx-auto w-full max-w-5xl flex-1 p-4 md:p-8">
            <Suspense fallback={<LoadingSkeleton />}>
              <Outlet />
            </Suspense>
          </main>

          <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white md:hidden">
            <ul className="grid grid-cols-3">
              {links.slice(0, 3).map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="flex min-h-16 flex-col items-center justify-center gap-1 px-2 text-xs font-medium text-slate-700"
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  )
}
