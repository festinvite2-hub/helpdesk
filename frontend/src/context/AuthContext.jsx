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
import { useMocks } from '../api/client'

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
  const isMockMode = useMocks()
  const [mockRole, setMockRole] = useState('user')
  const [realUser, setRealUser] = useState(() => {
    try {
      const stored = localStorage.getItem('helpdesk_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const role = isMockMode ? mockRole : realUser?.role || 'user'
  const user = isMockMode
    ? { id: 'mock', full_name: 'Demo User', email: 'demo@test.com', role: mockRole }
    : realUser

  const value = useMemo(
    () => ({
      role,
      user,
      isMockMode,
      setRole: isMockMode ? setMockRole : () => {},
      setUser: setRealUser,
      logout: () => {
        localStorage.removeItem('helpdesk_token')
        localStorage.removeItem('helpdesk_user')
        setRealUser(null)
      },
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
    [isMockMode, role, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

export function RoleGuard({ children }) {
  const { role, isAllowed, isMockMode, user } = useAuth()
  const location = useLocation()

  if (!isMockMode && !user) {
    return <Navigate to="/login" replace />
  }

  if (!isAllowed(location.pathname)) {
    const fallback = role === 'admin' ? '/admin/dashboard' : role === 'responsible' ? '/inbox' : '/dashboard'
    return <Navigate to={fallback} replace />
  }

  return children
}
