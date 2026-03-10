import { Bot } from 'lucide-react'
import CardPage from '../components/common/CardPage'

export default function AdminKnowledgeBase() {
  return (
    <CardPage
      title="Bază de cunoștințe"
      description="Curatoriază articole interne de suport AI și șabloane de răspuns."
      actions={[{ to: '/assistant', label: 'Testează în asistent', icon: Bot }]}
    />
  )
}
