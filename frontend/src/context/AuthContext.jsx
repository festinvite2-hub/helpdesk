import { createContext, useContext, useMemo, useState } from 'react'
import {
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
  Tickets,
} from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'
import { useMocks } from '../api/client'

export const AuthContext = createContext(null)

function normalizeUser(user) {
  if (!user) return null

  const normalizedRole = normalizeRole(user.role)
  const normalizedId = user.id ?? user.user_id ?? null

  return {
    ...user,
    id: normalizedId,
    email: user.email ?? '',
    role: normalizedRole,
    must_change_password: Boolean(user.must_change_password),
  }
}

export function normalizeRole(role) {
  if (role === 'responsible') return 'dept_manager'
  if (role === 'dept_manager' || role === 'admin' || role === 'user') return role
  return 'user'
}

export function getHomeRouteByRole(role) {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'dept_manager') return '/inbox'
  return '/my-tickets'
}

export const ROLE_LABELS = {
  user: 'Utilizator',
  dept_manager: 'Responsabil',
  responsible: 'Responsabil',
  admin: 'Administrator',
}

export const roleLinks = {
  user: [
    { to: '/tickets/new', label: 'Creează tichet', icon: PlusCircle },
    { to: '/my-tickets', label: 'Ticketele mele', icon: ClipboardList },
    { to: '/assistant', label: 'Asistent AI', icon: Bot },
    { to: '/profile', label: 'Profil', icon: User },
  ],
  dept_manager: [
    { to: '/inbox', label: 'Tichete primite', icon: Inbox },
    { to: '/profile', label: 'Profil', icon: User },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Panou administrare', icon: Shield },
    { to: '/admin/tickets', label: 'Toate ticketele', icon: Tickets },
    { to: '/admin/departments', label: 'Departamente', icon: Building2 },
    { to: '/admin/users', label: 'Utilizatori', icon: Users },
    { to: '/admin/routing-rules', label: 'Reguli de rutare', icon: Workflow },
    { to: '/admin/kb', label: 'Bază de cunoștințe', icon: BookOpen },
    { to: '/tickets/new', label: 'Creează tichet', icon: PlusCircle },
    { to: '/profile', label: 'Profil', icon: User },
  ],
}

export const routeAccess = {
  '/dashboard': ['user'],
  '/tickets/new': ['user', 'admin'],
  '/tickets/:id': ['user', 'dept_manager', 'admin'],
  '/my-tickets': ['user'],
  '/assistant': ['user'],
  '/profile': ['user', 'dept_manager', 'admin'],
  '/inbox': ['dept_manager', 'admin'],
  '/admin/dashboard': ['admin'],
  '/admin/tickets': ['admin'],
  '/admin/departments': ['admin'],
  '/admin/routing-rules': ['admin'],
  '/admin/kb': ['admin'],
  '/admin/users': ['admin'],
}

export function AuthProvider({ children }) {
  const isMockMode = useMocks()
  const [mockRole, setMockRole] = useState('user')
  const [token, setToken] = useState(() => localStorage.getItem('helpdesk_token'))
  const [realUser, setRealUser] = useState(() => {
    try {
      const stored = localStorage.getItem('helpdesk_user')
      return stored ? normalizeUser(JSON.parse(stored)) : null
    } catch {
      return null
    }
  })

  const role = isMockMode ? mockRole : normalizeRole(realUser?.role)
  const user = isMockMode
    ? {
        id: 'mock',
        full_name: 'Demo User',
        email: 'demo@test.com',
        role: normalizeRole(mockRole),
        must_change_password: false,
      }
    : realUser

  const value = useMemo(
    () => ({
      role,
      token,
      user,
      isMockMode,
      setRole: isMockMode ? setMockRole : () => {},
      setUser: (nextUser) => {
        const normalizedUser = normalizeUser(nextUser)
        setRealUser(normalizedUser)

        if (normalizedUser) {
          localStorage.setItem('helpdesk_user', JSON.stringify(normalizedUser))
        } else {
          localStorage.removeItem('helpdesk_user')
        }
      },
      setAuthSession: (nextToken, nextUser) => {
        const normalizedUser = normalizeUser(nextUser)
        setToken(nextToken || null)
        setRealUser(normalizedUser)

        if (nextToken) {
          localStorage.setItem('helpdesk_token', nextToken)
        } else {
          localStorage.removeItem('helpdesk_token')
        }

        if (normalizedUser) {
          localStorage.setItem('helpdesk_user', JSON.stringify(normalizedUser))
        } else {
          localStorage.removeItem('helpdesk_user')
        }
      },
      logout: () => {
        localStorage.removeItem('helpdesk_token')
        localStorage.removeItem('helpdesk_user')
        setToken(null)
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
    [isMockMode, role, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

export function RoleGuard({ children }) {
  const { token, isAllowed, isMockMode, user } = useAuth()
  const location = useLocation()
  const mustChangePassword = Boolean(user?.must_change_password)
  const isChangePasswordRoute = location.pathname === '/change-password'

  if (!isMockMode && (!token || !user)) {
    return <Navigate to="/login" replace />
  }

  if (!isMockMode && mustChangePassword && !isChangePasswordRoute) {
    return <Navigate to="/change-password" replace />
  }

  if (!isMockMode && !mustChangePassword && isChangePasswordRoute) {
    return <Navigate to={getHomeRouteByRole(normalizeRole(user?.role))} replace />
  }

  if (!isAllowed(location.pathname)) {
    return <Navigate to={getHomeRouteByRole(normalizeRole(user?.role))} replace />
  }

  return children
}
