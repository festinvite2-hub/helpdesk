import { ROLE_LABELS } from '../../context/AuthContext'

const ROLE_OPTIONS = ['user', 'responsible', 'admin']

export default function RolePicker({ role, onRoleChange, compact = false }) {
  if (compact) {
    return (
      <select
        value={role}
        onChange={(event) => onRoleChange(event.target.value)}
        className="rounded-full border-0 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 outline-none"
      >
        {ROLE_OPTIONS.map((value) => (
          <option key={value} value={value}>
            {ROLE_LABELS[value]}
          </option>
        ))}
      </select>
    )
  }

  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
        Rol demonstrativ
      </span>
      <select
        value={role}
        onChange={(event) => onRoleChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
      >
        {ROLE_OPTIONS.map((value) => (
          <option key={value} value={value}>
            {ROLE_LABELS[value]}
          </option>
        ))}
      </select>
    </label>
  )
}
