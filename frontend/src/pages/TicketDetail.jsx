import { Bot } from 'lucide-react'
import { useParams } from 'react-router-dom'
import CardPage from '../components/common/CardPage'

export default function TicketDetail() {
  const { id } = useParams()

  return (
    <CardPage
      title={`Tichet #${id}`}
      description="Detalii demonstrative tichet, cu carduri mobile pentru comentarii, cronologie și sugestii AI."
      actions={[{ to: '/assistant', label: 'Întreabă asistentul', icon: Bot }]}
    />
  )
}
