import { Bot } from 'lucide-react'

export default function Brand({ mobile = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
        <Bot size={mobile ? 18 : 20} />
      </div>
      <div>
        <p className="text-sm font-semibold">Helpdesk intern AI</p>
        <p className="text-xs text-slate-500">Interfață de suport</p>
      </div>
    </div>
  )
}
