import { Link, useLocation } from 'react-router-dom'

export default function Navigation({ links }) {
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
