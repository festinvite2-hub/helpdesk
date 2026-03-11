import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingSkeleton from '../common/LoadingSkeleton'
import Brand from './Brand'
import RoleBadge from './RoleBadge'
import RolePicker from './RolePicker'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const { role, setRole, isMockMode, user } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <Sidebar />

        <div className="flex-1 flex flex-col min-h-screen">
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-2 pt-[env(safe-area-inset-top)] backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
              <div className="md:hidden">
                <Brand mobile />
              </div>

              <div className="md:hidden">
                {isMockMode ? (
                  <RolePicker role={role} onRoleChange={setRole} compact />
                ) : user ? (
                  <div className="px-3 py-2 text-right text-sm">
                    <p className="font-medium text-slate-900">{user.full_name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                ) : null}
              </div>

              <div className="hidden md:ml-auto md:block">
                <RoleBadge role={role} />
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-5xl flex-1 p-4 pb-24 md:p-8 md:pb-8">
            <Suspense fallback={<LoadingSkeleton />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
