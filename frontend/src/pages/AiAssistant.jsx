import { useEffect, useRef, useState } from 'react'
import { Bot, SendHorizontal } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ChatBubble from '../components/tickets/ChatBubble'
import { getAiResponse } from '../mocks/aiResponses'
import { timeAgo } from '../utils/timeAgo'

const INITIAL_MESSAGES = [
  {
    id: 'welcome',
    sender_type: 'ai',
    sender_name: 'Asistent AI',
    content:
      'Bună! 👋 Sunt asistentul AI al helpdesk-ului.\n\nPot să te ajut cu probleme legate de:\n• WiFi și rețea\n• Imprimante și scanere\n• Conturi și parole\n• Proiectoare și echipamente\n\nDescrie problema ta și voi încerca să te ajut. Dacă nu reușesc, poți crea un tichet cu un singur tap.',
    created_at: new Date().toISOString(),
  },
]

export default function AiAssistant() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [helpfulMap, setHelpfulMap] = useState({})

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  useEffect(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
  }, [inputText])

  const getLastUserMessage = () => {
    const lastUserMessage = [...messages].reverse().find((message) => message.sender_type === 'user')
    return lastUserMessage?.content || ''
  }

  const handleEscalate = () => {
    const lastUserMessage = getLastUserMessage()
    navigate('/tickets/new', {
      state: {
        prefillTitle: lastUserMessage,
        prefillDescription: `Problema descrisă în chat AI:\n\n${lastUserMessage}\n\nRăspunsul AI nu a fost suficient.`,
      },
    })
  }

  const handleSend = () => {
    if (!inputText.trim() || isTyping) return

    const question = inputText.trim()
    const userMessage = {
      id: `u${Date.now()}`,
      sender_type: 'user',
      sender_name: 'Tu',
      content: question,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)

    const delay = 1500 + Math.random() * 1500
    window.setTimeout(() => {
      const { response, sources } = getAiResponse(question)
      const aiMessage = {
        id: `ai${Date.now()}`,
        sender_type: 'ai',
        sender_name: 'Asistent AI',
        content: response,
        sources: sources.length > 0 ? sources : undefined,
        created_at: new Date().toISOString(),
        showActions: true,
      }

      setMessages((prev) => [...prev, aiMessage])
      setIsTyping(false)
    }, delay)
  }

  const hideActionsForMessage = (messageId) => {
    setHelpfulMap((prev) => ({ ...prev, [messageId]: true }))
  }

  return (
    <section className="flex h-[calc(100vh-64px)] flex-col md:mx-auto md:max-w-2xl md:px-8">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-600">
          <Bot size={18} />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-slate-900">Asistent AI</h1>
          <p className="text-xs text-green-500">Online · Răspunde instant</p>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-200px)] flex-1 flex-col justify-end overflow-y-auto px-4 py-4 pb-36">
        <div className="flex flex-col gap-3">
          {messages.map((message) => (
            <div key={message.id} className={`flex flex-col ${message.sender_type === 'user' ? 'items-end' : 'items-start'}`}>
              <ChatBubble message={message} relativeTime={timeAgo(message.created_at)} />

              {message.sender_type === 'ai' && message.showActions && !helpfulMap[message.id] ? (
                <div className="ml-2 mt-1 flex items-center gap-3 self-start">
                  <button
                    type="button"
                    onClick={() => hideActionsForMessage(message.id)}
                    className="min-h-[32px] rounded-full bg-green-50 px-3 py-1.5 text-xs text-green-600 transition-colors active:bg-green-100"
                  >
                    M-a ajutat ✓
                  </button>
                  <button
                    type="button"
                    onClick={handleEscalate}
                    className="min-h-[32px] rounded-full bg-blue-50 px-3 py-1.5 text-xs text-blue-600 transition-colors active:bg-blue-100"
                  >
                    Creează tichet →
                  </button>
                </div>
              ) : null}
            </div>
          ))}

          {isTyping ? (
            <div className="self-start rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 max-w-[85%]">
              <div className="flex items-center gap-2">
                <Bot size={14} className="text-purple-500" />
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          ) : null}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="fixed bottom-20 left-0 right-0 z-20 border-t border-slate-200 bg-white px-4 py-2 md:static md:mt-2">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                handleSend()
              }
            }}
            placeholder="Descrie problema ta..."
            className="max-h-[120px] min-h-[44px] flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!inputText.trim() || isTyping}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-all active:scale-95 active:bg-blue-700 disabled:bg-slate-300"
          >
            <SendHorizontal size={18} />
          </button>
        </div>
      </div>
    </section>
  )
}
