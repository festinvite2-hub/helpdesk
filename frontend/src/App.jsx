import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import { AuthProvider, RoleGuard } from './context/AuthContext'
import AdminDashboard from './pages/AdminDashboard'
import AdminDepartments from './pages/AdminDepartments'
import AdminKnowledgeBase from './pages/AdminKnowledgeBase'
import AdminRoutingRules from './pages/AdminRoutingRules'
import AdminUsers from './pages/AdminUsers'
import AiAssistant from './pages/AiAssistant'
import DeptDashboard from './pages/DeptDashboard'
import Login from './pages/Login'
import TicketDetail from './pages/TicketDetail'
import TicketNew from './pages/TicketNew'
import UserDashboard from './pages/UserDashboard'

function RoutesConfig() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
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
