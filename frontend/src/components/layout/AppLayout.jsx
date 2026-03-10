import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { roleLinks, useAuth } from '../../context/AuthContext'
import LoadingSkeleton from '../common/LoadingSkeleton'
import Brand from './Brand'
import Navigation from './Navigation'
import RoleBadge from './RoleBadge'
import RolePicker from './RolePicker'
import BottomNav from './BottomNav'

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

          <main className="mx-auto w-full max-w-5xl flex-1 p-4 pb-20 md:p-8 md:pb-8">
            <Suspense fallback={<LoadingSkeleton />}>
              <Outlet />
            </Suspense>
          </main>

          <BottomNav />
        </div>
      </div>
    </div>
  )
}
