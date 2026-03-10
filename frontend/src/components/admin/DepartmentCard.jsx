import { Link } from 'react-router-dom'

export default function DepartmentCard({ department }) {
  return (
    <Link
      to="/admin/departments"
      className="min-h-[44px] min-w-[140px] flex-shrink-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-transform active:scale-[0.97]"
    >
      <p className="flex items-center text-sm font-semibold text-slate-900">
        <span
          className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: department.color }}
        />
        {department.name}
      </p>
      <p className="mt-2 text-xs text-slate-500">{department.ticketCount} tichete</p>
      <p className="text-xs" style={{ color: department.openCount > 0 ? department.color : '#94a3b8' }}>
        {department.openCount} deschise
      </p>
      <p className="text-xs text-slate-400">~{department.avgResolveTime} rezolvare</p>
    </Link>
  )
}
