import { Bot, Shield, Wrench } from 'lucide-react'

const senderStyles = {
  user: {
    align: 'self-end bg-blue-600 text-white rounded-2xl rounded-br-md',
  },
  ai: {
    align: 'self-start bg-slate-100 text-slate-800 rounded-2xl rounded-bl-md',
    nameClass: 'text-purple-600',
    Icon: Bot,
  },
  responsible: {
    align: 'self-start bg-green-50 text-slate-800 rounded-2xl rounded-bl-md',
    nameClass: 'text-green-700',
    Icon: Wrench,
  },
  admin: {
    align: 'self-start bg-amber-50 text-slate-800 rounded-2xl rounded-bl-md',
    nameClass: 'text-amber-700',
    Icon: Shield,
  },
}

export default function ChatBubble({ message, relativeTime }) {
  const style = senderStyles[message.sender_type] ?? senderStyles.user
  const isUser = message.sender_type === 'user'
  const Icon = style.Icon

  return (
    <article className={`max-w-[85%] px-4 py-3 shadow-sm ${style.align}`}>
      {!isUser ? (
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className={`flex items-center gap-1.5 text-xs font-semibold ${style.nameClass}`}>
            {Icon ? <Icon size={12} /> : null}
            {message.sender_name}
          </span>
          <span className="text-[10px] text-slate-400">{relativeTime}</span>
        </div>
      ) : null}

      <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>

      {isUser ? <div className="mt-1 text-right text-[10px] text-blue-100">{relativeTime}</div> : null}

      {message.sender_type === 'ai' && message.sources?.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-200 pt-2">
          {message.sources.map((source) => (
            <span
              key={source}
              className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-500"
            >
              {source}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  )
}
