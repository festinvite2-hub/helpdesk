import { Bot, ClipboardList, Home, PlusCircle, User } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function BottomNav() {
  const { role } = useAuth()
  const { pathname } = useLocation()

  const homeRoute =
    role === 'admin'
      ? '/admin/dashboard'
      : role === 'dept_manager'
        ? '/dept/dashboard'
        : '/dashboard'

  const tabs = [
    { label: 'Acasă', icon: Home, to: homeRoute },
    { label: 'Ticketele mele', icon: ClipboardList, to: homeRoute },
    { label: 'Ticket Nou', icon: PlusCircle, to: '/tickets/new', isCenter: true },
    { label: 'Asistent', icon: Bot, to: '/assistant' },
    { label: 'Profil', icon: User, to: homeRoute },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white shadow-[0_-1px_3px_rgba(0,0,0,0.05)] md:hidden pb-[env(safe-area-inset-bottom)]">
      <ul className="grid h-16 grid-cols-5">
        {tabs.map(({ label, icon: Icon, to, isCenter }) => {
          const isActive = pathname === to || (!isCenter && pathname.startsWith(`${to}/`))

          return (
            <li key={`${label}-${to}`}>
              <Link
                to={to}
                className={`flex h-full flex-col items-center justify-center gap-0.5 px-1 ${
                  isCenter
                    ? 'text-blue-600'
                    : isActive
                      ? 'text-blue-600'
                      : 'text-slate-400'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {isCenter ? (
                  <span className="-translate-y-1 rounded-full bg-blue-600 p-2 text-white shadow-md">
                    <Icon size={20} />
                  </span>
                ) : (
                  <Icon size={20} />
                )}
                <span
                  className={`text-[10px] ${
                    isCenter ? 'font-semibold text-blue-600' : 'font-medium'
                  }`}
                >
                  {label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
