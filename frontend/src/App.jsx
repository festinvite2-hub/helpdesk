import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoadingSkeleton from './components/common/LoadingSkeleton'
import AppLayout from './components/layout/AppLayout'
import { AuthProvider, RoleGuard, useAuth } from './context/AuthContext'

const Login = lazy(() => import('./pages/Login'))
const UserDashboard = lazy(() => import('./pages/UserDashboard'))
const TicketNew = lazy(() => import('./pages/TicketNew'))
const TicketDetail = lazy(() => import('./pages/TicketDetail'))
const AiAssistant = lazy(() => import('./pages/AiAssistant'))
const MyTickets = lazy(() => import('./pages/MyTickets'))
const Inbox = lazy(() => import('./pages/Inbox'))
const Profile = lazy(() => import('./pages/Profile'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminDepartments = lazy(() => import('./pages/AdminDepartments'))
const AdminRoutingRules = lazy(() => import('./pages/AdminRoutingRules'))
const AdminKnowledgeBase = lazy(() => import('./pages/AdminKnowledgeBase'))
const AdminUsers = lazy(() => import('./pages/AdminUsers'))


function RoleRedirect() {
  const { role } = useAuth()
  const fallback = role === 'admin' ? '/admin/dashboard' : role === 'responsible' ? '/inbox' : '/dashboard'

  return <Navigate to={fallback} replace />
}

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
        <Route path="/my-tickets" element={<MyTickets />} />
        <Route path="/assistant" element={<AiAssistant />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/departments" element={<AdminDepartments />} />
        <Route path="/admin/routing-rules" element={<AdminRoutingRules />} />
        <Route path="/admin/kb" element={<AdminKnowledgeBase />} />
        <Route path="/admin/users" element={<AdminUsers />} />
      </Route>
      <Route path="*" element={<RoleRedirect />} />
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
