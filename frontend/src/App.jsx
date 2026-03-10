import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoadingSkeleton from './components/common/LoadingSkeleton'
import AppLayout from './components/layout/AppLayout'
import { AuthProvider, RoleGuard } from './context/AuthContext'

const Login = lazy(() => import('./pages/Login'))
const UserDashboard = lazy(() => import('./pages/UserDashboard'))
const TicketNew = lazy(() => import('./pages/TicketNew'))
const TicketDetail = lazy(() => import('./pages/TicketDetail'))
const AiAssistant = lazy(() => import('./pages/AiAssistant'))
const DeptDashboard = lazy(() => import('./pages/DeptDashboard'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminDepartments = lazy(() => import('./pages/AdminDepartments'))
const AdminRoutingRules = lazy(() => import('./pages/AdminRoutingRules'))
const AdminKnowledgeBase = lazy(() => import('./pages/AdminKnowledgeBase'))
const AdminUsers = lazy(() => import('./pages/AdminUsers'))

function RoutesConfig() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <Suspense fallback={<LoadingSkeleton />}>
            <Login />
          </Suspense>
        }
      />
      <Route
        element={
          <RoleGuard>
            <AppLayout />
          </RoleGuard>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/tickets/new" element={<TicketNew />} />
        <Route path="/tickets/:id" element={<TicketDetail />} />
        <Route path="/assistant" element={<AiAssistant />} />
        <Route path="/dept/dashboard" element={<DeptDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/departments" element={<AdminDepartments />} />
        <Route path="/admin/routing-rules" element={<AdminRoutingRules />} />
        <Route path="/admin/kb" element={<AdminKnowledgeBase />} />
        <Route path="/admin/users" element={<AdminUsers />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RoutesConfig />
      </AuthProvider>
    </BrowserRouter>
  )
}
