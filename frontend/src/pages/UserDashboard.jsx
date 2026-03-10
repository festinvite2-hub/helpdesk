import { Bot, PlusCircle } from 'lucide-react'
import CardPage from '../components/common/CardPage'

export default function UserDashboard() {
  return (
    <CardPage
      title="Panou principal"
      description="Prezentare generală a tichetelor deschise, starea SLA și acțiuni rapide."
      actions={[
        { to: '/tickets/new', label: 'Creează tichet nou', icon: PlusCircle },
        { to: '/assistant', label: 'Deschide asistentul', icon: Bot },
      ]}
    />
  )
}
