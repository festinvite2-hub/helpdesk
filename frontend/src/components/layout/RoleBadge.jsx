export default function RoleBadge({ role }) {
  const roleMessage = {
    user: 'Autentificat ca utilizator',
    responsible: 'Autentificat ca responsabil',
    admin: 'Autentificat ca administrator',
  }

  return <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{roleMessage[role]}</span>
}
