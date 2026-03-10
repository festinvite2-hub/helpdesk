import { createContext, useContext, useMemo, useState } from 'react'
import { Bot, Building2, Home, PlusCircle, Shield, Users } from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'

export const AuthContext = createContext(null)

export const ROLE_LABELS = {
  user: 'Utilizator',
  dept_manager: 'Manager de departament',
  admin: 'Admin',
}

export const roleLinks = {
  user: [
    { to: '/dashboard', label: 'Panou principal', icon: Home },
    { to: '/tickets/new', label: 'Creează tichet nou', icon: PlusCircle },
    { to: '/assistant', label: 'Asistent', icon: Bot },
  ],
  dept_manager: [
    { to: '/dashboard', label: 'Panou principal', icon: Home },
    { to: '/dept/dashboard', label: 'Departament', icon: Building2 },
    { to: '/assistant', label: 'Asistent', icon: Bot },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Admin', icon: Shield },
    { to: '/admin/departments', label: 'Departamente', icon: Building2 },
    { to: '/admin/users', label: 'Utilizatori', icon: Users },
  ],
}

export const routeAccess = {
  '/dashboard': ['user', 'dept_manager', 'admin'],
  '/tickets/new': ['user', 'dept_manager', 'admin'],
  '/tickets/:id': ['user', 'dept_manager', 'admin'],
  '/assistant': ['user', 'dept_manager', 'admin'],
  '/dept/dashboard': ['dept_manager', 'admin'],
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
    const fallback =
      role === 'admin' ? '/admin/dashboard' : role === 'dept_manager' ? '/dept/dashboard' : '/dashboard'
    return <Navigate to={fallback} replace />
  }

  return children
}
