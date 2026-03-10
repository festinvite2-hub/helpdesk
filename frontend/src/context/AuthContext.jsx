import { createContext, useContext, useMemo, useState } from 'react'
import {
  Home,
  PlusCircle,
  Bot,
  ClipboardList,
  User,
  Shield,
  Building2,
  Users,
  Workflow,
  BookOpen,
  Inbox,
} from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'

export const AuthContext = createContext(null)

export const ROLE_LABELS = {
  user: 'Utilizator',
  responsible: 'Responsabil',
  admin: 'Administrator',
}

export const roleLinks = {
  user: [
    { to: '/dashboard', label: 'Panou principal', icon: Home },
    { to: '/tickets/new', label: 'Creează tichet', icon: PlusCircle },
    { to: '/my-tickets', label: 'Ticketele mele', icon: ClipboardList },
    { to: '/assistant', label: 'Asistent AI', icon: Bot },
    { to: '/profile', label: 'Profil', icon: User },
  ],
  responsible: [
    { to: '/inbox', label: 'Tichete primite', icon: Inbox },
    { to: '/my-tickets', label: 'Ticketele mele', icon: ClipboardList },
    { to: '/profile', label: 'Profil', icon: User },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Panou administrare', icon: Shield },
    { to: '/admin/departments', label: 'Departamente', icon: Building2 },
    { to: '/admin/users', label: 'Utilizatori', icon: Users },
    { to: '/admin/routing-rules', label: 'Reguli de rutare', icon: Workflow },
    { to: '/admin/kb', label: 'Bază de cunoștințe', icon: BookOpen },
    { to: '/tickets/new', label: 'Creează tichet', icon: PlusCircle },
  ],
}

export const routeAccess = {
  '/dashboard': ['user'],
  '/tickets/new': ['user', 'admin'],
  '/tickets/:id': ['user', 'responsible', 'admin'],
  '/my-tickets': ['user', 'responsible'],
  '/assistant': ['user'],
  '/profile': ['user', 'responsible'],
  '/inbox': ['responsible', 'admin'],
  '/admin/dashboard': ['admin'],
  '/admin/departments': ['admin'],
  '/admin/routing-rules': ['admin'],
  '/admin/kb': ['admin'],
  '/admin/users': ['admin'],
}

export function AuthProvider({ children }) {
  const [role, setRole] = useState('user')

  const value = useMemo(
    () => ({
      role,
      setRole,
      isAllowed(path) {
        const key = Object.keys(routeAccess).find((entry) => {
          if (!entry.includes(':')) return entry === path
          const pattern = new RegExp(`^${entry.replace(':id', '[^/]+')}$`)
          return pattern.test(path)
        })

        if (!key) return true
        return routeAccess[key].includes(role)
      },
    }),
    [role],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

export function RoleGuard({ children }) {
  const { role, isAllowed } = useAuth()
  const location = useLocation()

  if (!isAllowed(location.pathname)) {
    const fallback = role === 'admin' ? '/admin/dashboard' : role === 'responsible' ? '/inbox' : '/dashboard'
    return <Navigate to={fallback} replace />
  }

  return children
}
