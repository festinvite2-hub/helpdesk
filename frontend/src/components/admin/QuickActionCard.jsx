import { Link } from 'react-router-dom'

export default function QuickActionCard({ to, label, icon: Icon, className }) {
  return (
    <Link
      to={to}
      className={`min-h-[80px] rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-transform active:scale-[0.97] ${className}`}
    >
      <Icon size={24} />
      <span className="text-center text-xs font-medium">{label}</span>
    </Link>
  )
}
