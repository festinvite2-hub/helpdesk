import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, MessageSquare, RefreshCw, SendHorizontal } from 'lucide-react'
import { getTicketMessages, sendTicketMessage } from '../../api/ticketMessages'
import { useAuth } from '../../context/AuthContext'

const senderLabels = {
  user: 'Utilizator',
  admin: 'Administrator',
  responsabil: 'Responsabil',
  ai: 'Asistent AI',
}

const senderStyles = {
  self: 'ml-auto rounded-2xl rounded-br-md bg-blue-600 text-white shadow-sm',
  user: 'mr-auto rounded-2xl rounded-bl-md border border-slate-200 bg-white text-slate-900 shadow-sm',
  admin: 'mr-auto rounded-2xl rounded-bl-md border border-amber-200 bg-amber-50 text-slate-900 shadow-sm',
  responsabil: 'mr-auto rounded-2xl rounded-bl-md border border-emerald-200 bg-emerald-50 text-slate-900 shadow-sm',
  ai: 'mr-auto rounded-2xl rounded-bl-md border border-violet-200 bg-violet-50 text-slate-900 shadow-sm',
}

function normalizeCurrentUserId(user) {
  const userId = user?.id ?? user?.user_id ?? user?.userId ?? null
  return userId ? String(userId) : null
}

function formatTimestamp(dateValue) {
  const parsedDate = new Date(dateValue)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Dată indisponibilă'
  }

  return parsedDate.toLocaleString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function compareMessages(left, right) {
  const leftTime = new Date(left.created_at).getTime()
  const rightTime = new Date(right.created_at).getTime()

  if (leftTime !== rightTime) {
    return leftTime - rightTime
  }

  return String(left.id).localeCompare(String(right.id))
}

export default function TicketThread({ ticketId }) {
  const { user } = useAuth()
  const currentUserId = normalizeCurrentUserId(user)
  const threadViewportRef = useRef(null)
  const shouldStickToBottomRef = useRef(true)
  const pollingRef = useRef(null)
  const latestRequestRef = useRef(0)
  const initialLoadRef = useRef(true)

  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [composerValue, setComposerValue] = useState('')
  const [sendError, setSendError] = useState('')
  const [sending, setSending] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const sortedMessages = useMemo(
    () => [...messages].sort(compareMessages),
    [messages]
  )

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    const viewport = threadViewportRef.current
    if (!viewport) return

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior,
    })
  }, [])

  const updateStickiness = useCallback(() => {
    const viewport = threadViewportRef.current
    if (!viewport) return

    const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight
    shouldStickToBottomRef.current = distanceFromBottom < 120
  }, [])

  const loadMessages = useCallback(async ({ silent = false } = {}) => {
    if (!ticketId) {
      setMessages([])
      setError('Nu există un tichet selectat pentru conversație.')
      setLoading(false)
      setIsRefreshing(false)
      return
    }

    if (!currentUserId) {
      setMessages([])
      setError('Nu există un utilizator autentificat. Reautentifică-te pentru a vedea conversația.')
      setLoading(false)
      setIsRefreshing(false)
      return
    }

    const requestId = latestRequestRef.current + 1
    latestRequestRef.current = requestId

    if (silent) {
      setIsRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const response = await getTicketMessages({
        ticketId,
        userId: currentUserId,
      })

      if (latestRequestRef.current !== requestId) return

      setMessages(Array.isArray(response?.messages) ? response.messages : [])
      setError('')
    } catch (loadError) {
      if (latestRequestRef.current !== requestId) return
      setError(loadError?.message || 'Nu s-au putut încărca mesajele conversației.')
    } finally {
      if (latestRequestRef.current === requestId) {
        setLoading(false)
        setIsRefreshing(false)
        initialLoadRef.current = false
      }
    }
  }, [currentUserId, ticketId])

  useEffect(() => {
    initialLoadRef.current = true
    shouldStickToBottomRef.current = true
    setComposerValue('')
    setSendError('')
    loadMessages()

    if (pollingRef.current) {
      window.clearInterval(pollingRef.current)
    }

    pollingRef.current = window.setInterval(() => {
      loadMessages({ silent: true })
    }, 5000)

    return () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current)
      }
    }
  }, [loadMessages])

  useEffect(() => {
    if (!sortedMessages.length) return

    if (initialLoadRef.current || shouldStickToBottomRef.current || sending) {
      scrollToBottom(initialLoadRef.current ? 'auto' : 'smooth')
    }
  }, [scrollToBottom, sending, sortedMessages])

  const handleSend = async () => {
    if (!ticketId) {
      setSendError('Nu există un tichet selectat pentru trimiterea mesajului.')
      return
    }

    if (!currentUserId) {
      setSendError('Nu există un utilizator autentificat. Reautentifică-te pentru a trimite mesaje.')
      return
    }

    const nextContent = composerValue.trim()
    if (!nextContent || sending) return

    setSending(true)
    setSendError('')
    shouldStickToBottomRef.current = true

    try {
      await sendTicketMessage({
        ticketId,
        userId: currentUserId,
        content: nextContent,
        isInternal: false,
      })
      setComposerValue('')
      await loadMessages({ silent: true })
    } catch (requestError) {
      setSendError(requestError?.message || 'Mesajul nu a putut fi trimis. Încearcă din nou.')
    } finally {
      setSending(false)
    }
  }

  const handleComposerKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  const renderContent = () => {
    if (!ticketId) {
      return <InlineState tone="error" message="Nu există un tichet selectat pentru conversație." />
    }

    if (!currentUserId) {
      return (
        <InlineState
          tone="error"
          message="Nu există un utilizator autentificat. Te rugăm să te reautentifici pentru a vedea conversația."
        />
      )
    }

    if (loading) {
      return (
        <div className="flex min-h-[240px] items-center justify-center gap-3 text-sm text-slate-500">
          <Loader2 size={18} className="animate-spin" />
          <span>Se încarcă conversația...</span>
        </div>
      )
    }

    if (error) {
      return (
        <InlineState
          tone="error"
          message={error}
          action={
            <button
              type="button"
              onClick={() => loadMessages()}
              className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Reîncearcă
            </button>
          }
        />
      )
    }

    if (!sortedMessages.length) {
      return (
        <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
          <MessageSquare size={34} className="text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">Nu există încă mesaje pentru acest tichet.</p>
          <p className="mt-1 text-sm text-slate-500">Trimite primul răspuns pentru a porni conversația.</p>
        </div>
      )
    }

    return (
      <div
        ref={threadViewportRef}
        onScroll={updateStickiness}
        className="max-h-[52vh] min-h-[320px] space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4"
      >
        {sortedMessages.map((message) => {
          const isOwnMessage = currentUserId != null && String(message.sender_id) === currentUserId
          const bubbleStyle = isOwnMessage ? senderStyles.self : senderStyles[message.sender_type] ?? senderStyles.user
          const senderLabel = isOwnMessage ? 'Tu' : senderLabels[message.sender_type] ?? 'Utilizator'

          return (
            <article
              key={message.id}
              className={`flex max-w-[92%] flex-col gap-2 px-4 py-3 text-sm sm:max-w-[80%] ${bubbleStyle}`}
            >
              <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${isOwnMessage ? 'text-blue-100' : 'text-slate-500'}`}>
                <span className={`font-semibold ${isOwnMessage ? 'text-white' : 'text-slate-900'}`}>
                  {message.sender_name}
                </span>
                <span>•</span>
                <span>{senderLabel}</span>
                <span>•</span>
                <time dateTime={message.created_at}>{formatTimestamp(message.created_at)}</time>
              </div>
              <p className={`whitespace-pre-wrap break-words leading-relaxed ${isOwnMessage ? 'text-white' : 'text-slate-700'}`}>
                {message.content}
              </p>
            </article>
          )
        })}
      </div>
    )
  }

  const composerDisabled = !ticketId || !currentUserId

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Conversație</h2>
          <p className="mt-1 text-sm text-slate-500">Mesajele se sincronizează automat la fiecare 5 secunde.</p>
        </div>

        <button
          type="button"
          onClick={() => loadMessages({ silent: false })}
          disabled={loading || isRefreshing}
          className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          Reîmprospătează
        </button>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5">
        {renderContent()}

        <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
          <label htmlFor="ticket-thread-composer" className="mb-2 block text-sm font-medium text-slate-700">
            Răspuns nou
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <textarea
              id="ticket-thread-composer"
              value={composerValue}
              onChange={(event) => setComposerValue(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              rows={4}
              placeholder="Scrie mesajul tău aici..."
              disabled={composerDisabled || sending}
              className="min-h-[120px] w-full resize-y rounded-xl border border-slate-300 px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={composerDisabled || sending || !composerValue.trim()}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <SendHorizontal size={16} />}
              Trimite mesajul
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Apasă Enter pentru trimitere și Shift + Enter pentru rând nou.</p>
          {sendError ? <p className="mt-3 text-sm text-red-600">{sendError}</p> : null}
        </div>
      </div>
    </section>
  )
}

function InlineState({ tone = 'neutral', message, action = null }) {
  const toneClasses =
    tone === 'error'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-slate-200 bg-slate-50 text-slate-600'

  return (
    <div className={`flex min-h-[180px] flex-col items-center justify-center rounded-2xl border px-6 py-8 text-center ${toneClasses}`}>
      <p className="max-w-xl text-sm leading-relaxed">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
