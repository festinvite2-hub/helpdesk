import { createContext, useContext, useMemo, useState } from 'react'
import {
  BrowserRouter,
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import {
  Bot,
  Building2,
  Home,
  Loader2,
  LogIn,
  PlusCircle,
  Shield,
  Users,
  Workflow,
} from 'lucide-react'

const AuthContext = createContext(null)

const ROLE_LABELS = {
  user: 'User',
  dept_manager: 'Department Manager',
  admin: 'Admin',
}

const roleLinks = {
  user: [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/tickets/new', label: 'New Ticket', icon: PlusCircle },
    { to: '/assistant', label: 'Assistant', icon: Bot },
  ],
  dept_manager: [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/dept/dashboard', label: 'Dept', icon: Building2 },
    { to: '/assistant', label: 'Assistant', icon: Bot },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Admin', icon: Shield },
    { to: '/admin/departments', label: 'Departments', icon: Building2 },
    { to: '/admin/users', label: 'Users', icon: Users },
  ],
}

const routeAccess = {
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

const CATEGORY_OPTIONS = ['IT Support', 'Network', 'Software', 'Hardware', 'Administrative']
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical']

function createTicketMock(payload) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        ticket_id: 'TICK-001',
        payload,
      })
    }, 1000)
  })
}

function AuthProvider({ children }) {
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

function useAuth() {
  return useContext(AuthContext)
}

function RoleGuard({ children }) {
  const { role, isAllowed } = useAuth()
  const location = useLocation()

  if (!isAllowed(location.pathname)) {
    const fallback =
      role === 'admin' ? '/admin/dashboard' : role === 'dept_manager' ? '/dept/dashboard' : '/dashboard'
    return <Navigate to={fallback} replace />
  }

  return children
}

function AppLayout() {
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

          <main className="mx-auto w-full max-w-5xl flex-1 p-4 md:p-8">
            <Outlet />
          </main>

          <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white md:hidden">
            <ul className="grid grid-cols-3">
              {links.slice(0, 3).map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="flex min-h-16 flex-col items-center justify-center gap-1 px-2 text-xs font-medium text-slate-700"
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  )
}

function Brand({ mobile = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
        <Bot size={mobile ? 18 : 20} />
      </div>
      <div>
        <p className="text-sm font-semibold">Internal AI Helpdesk</p>
        <p className="text-xs text-slate-500">Support shell</p>
      </div>
    </div>
  )
}

function RolePicker({ role, onRoleChange }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
        Mock Role
      </span>
      <select
        value={role}
        onChange={(event) => onRoleChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
      >
        {Object.entries(ROLE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  )
}

function RoleBadge({ role }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
      Signed in as {ROLE_LABELS[role]}
    </span>
  )
}

function Navigation({ links }) {
  const location = useLocation()

  return (
    <nav>
      <ul className="space-y-1">
        {links.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to
          return (
            <li key={to}>
              <Link
                to={to}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  active ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function CardPage({ title, description, actions = [] }) {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-slate-600">{description}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <article key={item} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-semibold">Card {item}</h2>
            <p className="mt-2 text-sm text-slate-600">
              Mobile-friendly summary information appears here.
            </p>
            <button className="mt-4 min-h-10 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              View details
            </button>
          </article>
        ))}
      </div>

      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {actions.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

function LoginPage() {
  const navigate = useNavigate()

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
            <LogIn size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Helpdesk Login</h1>
            <p className="text-sm text-slate-500">Mock entry point (no backend)</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
        >
          Continue to app shell
        </button>
      </div>
    </main>
  )
}

function NewTicketPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: CATEGORY_OPTIONS[0],
    priority: PRIORITY_OPTIONS[1],
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const validate = () => {
    const nextErrors = {}

    if (!formData.title.trim()) {
      nextErrors.title = 'Title is required.'
    }

    if (!formData.description.trim()) {
      nextErrors.description = 'Description is required.'
    }

    return nextErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate()

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSubmitting(true)
    setSuccessMessage('')

    const result = await createTicketMock(formData)

    if (result.success) {
      setSuccessMessage(`Ticket ${result.ticket_id} created successfully. Redirecting to dashboard...`)
      setTimeout(() => {
        navigate('/dashboard')
      }, 1200)
    }

    setIsSubmitting(false)
  }

  return (
    <section className="mx-auto w-full max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <header className="mb-6 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Create New Ticket</h1>
          <p className="text-sm text-slate-600">
            Submit a request to the internal AI helpdesk team.
          </p>
        </header>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700">
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
              placeholder="Brief summary of your issue"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
            {errors.title && (
              <p id="title-error" className="mt-1 text-sm text-red-600">
                {errors.title}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              value={formData.description}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
              placeholder="Describe what happened, expected behavior, and urgency"
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? 'description-error' : undefined}
            />
            {errors.description && (
              <p id="description-error" className="mt-1 text-sm text-red-600">
                {errors.description}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className="mb-1 block text-sm font-medium text-slate-700">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="mb-1 block text-sm font-medium text-slate-700">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
              >
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority} value={priority} className="capitalize">
                    {priority}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {successMessage && (
            <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Ticket'
            )}
          </button>
        </form>
      </div>
    </section>
  )
}

function TicketDetailPage() {
  const { id } = useParams()

  return (
    <CardPage
      title={`Ticket #${id}`}
      description="Placeholder ticket detail with mobile cards for comments, timeline, and AI suggestions."
      actions={[{ to: '/assistant', label: 'Ask Assistant', icon: Bot }]}
    />
  )
}

function RoutesConfig() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RoleGuard>
            <AppLayout />
          </RoleGuard>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <CardPage
              title="Dashboard"
              description="Overview of your open tickets, SLA status, and quick actions."
              actions={[
                { to: '/tickets/new', label: 'Create Ticket', icon: PlusCircle },
                { to: '/assistant', label: 'Open Assistant', icon: Bot },
              ]}
            />
          }
        />
        <Route path="/tickets/new" element={<NewTicketPage />} />
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
        <Route
          path="/assistant"
          element={
            <CardPage
              title="AI Assistant"
              description="Chat workspace placeholder for internal triage and recommendations."
            />
          }
        />
        <Route
          path="/dept/dashboard"
          element={
            <CardPage
              title="Department Dashboard"
              description="Manager-specific queue overview, team workload, and escalations."
            />
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <CardPage
              title="Admin Dashboard"
              description="System health, automation insights, and governance controls."
            />
          }
        />
        <Route
          path="/admin/departments"
          element={
            <CardPage
              title="Departments"
              description="Manage department ownership, queues, and service boundaries."
              actions={[{ to: '/admin/routing-rules', label: 'Routing Rules', icon: Workflow }]}
            />
          }
        />
        <Route
          path="/admin/routing-rules"
          element={
            <CardPage
              title="Routing Rules"
              description="Configure smart ticket routing and escalation logic."
            />
          }
        />
        <Route
          path="/admin/kb"
          element={
            <CardPage
              title="Knowledge Base"
              description="Curate internal AI help articles and response snippets."
              actions={[{ to: '/assistant', label: 'Test in Assistant', icon: Bot }]}
            />
          }
        />
        <Route
          path="/admin/users"
          element={
            <CardPage
              title="Users & Access"
              description="Manage role assignments and account lifecycle controls."
            />
          }
        />
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
