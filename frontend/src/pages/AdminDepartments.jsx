import { Workflow } from 'lucide-react'
import CardPage from '../components/common/CardPage'

export default function AdminDepartments() {
  return (
    <CardPage
      title="Departamente"
      description="Gestionează responsabilitatea departamentelor, cozile și limitele serviciilor."
      actions={[{ to: '/admin/routing-rules', label: 'Reguli de rutare', icon: Workflow }]}
    />
  )
}
