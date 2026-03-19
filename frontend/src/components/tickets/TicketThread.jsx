import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, RefreshCw, SendHorizontal } from 'lucide-react'
import { getTicketMessages, sendTicketMessage } from '../../api/ticketMessages'
import { useAuth } from '../../context/AuthContext'

const senderLabels = {
  user: 'Utilizator',
  admin: 'Administrator',
  responsabil: 'Responsabil',
  dept_manager: 'Responsabil',
  ai: 'Asistent AI',
}

const roleBubbleStyles = {
  user: {
    bubble: 'bg-gray-200 text-gray-800',
    meta: 'text-slate-500',
    avatar: 'bg-slate-500 text-white',
  },
  admin: {
    bubble: 'bg-violet-600 text-white',
    meta: 'text-violet-100/90',
    avatar: 'bg-violet-600 text-white',
  },
  responsabil: {
    bubble: 'bg-blue-600 text-white',
    meta: 'text-blue-100/90',
    avatar: 'bg-blue-600 text-white',
  },
  dept_manager: {
    bubble: 'bg-blue-600 text-white',
    meta: 'text-blue-100/90',
    avatar: 'bg-blue-600 text-white',
  },
  ai: {
    bubble: 'bg-slate-800 text-white',
    meta: 'text-slate-300',
    avatar: 'bg-slate-800 text-white',
  },
}

function normalizeCurrentUserId(user) {
  const userId = user?.id ?? user?.user_id ?? user?.userId ?? null
  return userId ? String(userId) : null
}

function normalizeSenderRole(senderType) {
  if (senderType === 'dept_manager') return 'responsabil'
  return senderType ?? 'user'
}

function getRoleLetter(senderType) {
  const normalizedRole = normalizeSenderRole(senderType)

  if (normalizedRole === 'admin') return 'A'
  if (normalizedRole === 'responsabil') return 'R'
  if (normalizedRole === 'ai') return 'AI'
  return 'U'
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

export default function TicketThread({ ticketId, currentUser = null }) {
  const { user: authUser } = useAuth()
  const user = currentUser ?? authUser
  const currentUserId = normalizeCurrentUserId(user)
  const threadViewportRef = useRef(null)
  const messagesEndRef = useRef(null)
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
    messagesEndRef.current?.scrollIntoView({
      behavior,
      block: 'end',
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
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow-sm ring-1 ring-slate-200">
            💬
          </div>
          <p className="mt-4 text-base font-semibold text-slate-800">Nu există mesaje încă</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">Fii primul care răspunde la acest ticket</p>
        </div>
      )
    }

    return (
      <div
        ref={threadViewportRef}
        onScroll={updateStickiness}
        className="flex max-h-[52vh] min-h-[320px] flex-col gap-4 overflow-y-auto rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 via-white to-slate-50 p-5 shadow-sm transition hover:shadow-md sm:p-6"
      >
        {sortedMessages.map((message) => {
          const isOwnMessage = currentUserId != null && String(message.sender_id) === currentUserId
          const normalizedRole = normalizeSenderRole(message.sender_type)
          const styles = roleBubbleStyles[normalizedRole] ?? roleBubbleStyles.user
          const senderLabel = isOwnMessage ? 'Tu' : senderLabels[message.sender_type] ?? senderLabels[normalizedRole] ?? 'Utilizator'
          const senderInitial = isOwnMessage ? getRoleLetter(user?.role ?? message.sender_type) : getRoleLetter(message.sender_type)
          const alignmentClass = isOwnMessage ? 'justify-end' : 'justify-start'
          const bubbleRadiusClass = isOwnMessage ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-bl-md'
          const actualName = message.sender_name?.trim()
          const showName = actualName && actualName !== senderLabel && !isOwnMessage

          return (
            <div key={message.id} className={`flex ${alignmentClass}`}>
              <article
                className={`flex w-full max-w-[88%] items-end gap-2 sm:max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold uppercase shadow-sm sm:h-9 sm:w-9 sm:text-xs ${styles.avatar}`}
                  aria-hidden="true"
                >
                  {senderInitial}
                </div>

                <div className={`flex min-w-0 flex-1 flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`mb-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 px-1 text-[11px] sm:text-xs ${
                      isOwnMessage ? 'justify-end text-slate-500' : 'justify-start text-slate-500'
                    }`}
                  >
                    <span className={`font-semibold ${isOwnMessage ? 'text-slate-700' : 'text-slate-700'}`}>
                      {senderLabel}
                    </span>
                    {showName ? <span className="text-slate-400">• {actualName}</span> : null}
                    <time dateTime={message.created_at}>{formatTimestamp(message.created_at)}</time>
                  </div>

                  <div className={`w-full px-4 py-2 shadow-sm transition duration-200 hover:shadow ${bubbleRadiusClass} ${styles.bubble}`}>
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              </article>
            </div>
          )
        })}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>
    )
  }

  const composerDisabled = !ticketId || !currentUserId

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-white/90 px-6 py-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Conversație</h2>
          <p className="mt-1 text-sm text-slate-500">Mesajele se sincronizează automat la fiecare 5 secunde.</p>
        </div>

        <button
          type="button"
          onClick={() => loadMessages({ silent: false })}
          disabled={loading || isRefreshing}
          className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          Reîmprospătează
        </button>
      </div>

      <div className="space-y-6 px-6 py-6">
        {renderContent()}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
          <label htmlFor="ticket-thread-composer" className="mb-3 block text-sm font-semibold text-slate-700">
            Răspuns nou
          </label>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <textarea
              id="ticket-thread-composer"
              value={composerValue}
              onChange={(event) => setComposerValue(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              rows={4}
              placeholder="Scrie mesajul tău aici..."
              disabled={composerDisabled || sending}
              className="min-h-[120px] w-full resize-y rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={composerDisabled || sending || !composerValue.trim()}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-100 sm:w-auto"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <SendHorizontal size={16} />}
              {sending ? 'Se trimite...' : 'Trimite mesajul'}
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
