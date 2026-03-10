import { Link } from 'react-router-dom'

export default function TouchableCard({ children, to, onClick, className = '' }) {
  const base = `rounded-xl border border-slate-200 bg-white p-4 shadow-sm
    transition-all active:scale-[0.98] active:shadow-none`

  if (to) {
    return (
      <Link to={to} className={`block ${base} ${className}`}>
        {children}
      </Link>
    )
  }

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`${base} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
