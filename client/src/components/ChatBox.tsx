import { useState, useRef, useEffect, FormEvent } from 'react'
import { useChat } from '../contexts/ChatContext'

const SPAM_THRESHOLD_MS = 3000
const AUTO_MINIMIZE_DELAY = 2500
const isMobile = () => window.matchMedia('(max-width: 768px)').matches

export default function ChatBox() {
  const { messages, addMessage } = useChat()
  const [minimized, setMinimized] = useState(false)
  const [glowing, setGlowing] = useState(false)
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [errorText, setErrorText] = useState('')
  const honeypotRef = useRef('')
  const mountTimeRef = useRef(Date.now())
  const logRef = useRef<HTMLDivElement>(null)
  const autoMinimizedRef = useRef(false)
  const manualInteractionRef = useRef(false)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  // Mobile: auto-minimize after a brief moment on first load
  useEffect(() => {
    if (!isMobile() || autoMinimizedRef.current || manualInteractionRef.current) return
    const timer = setTimeout(() => {
      if (manualInteractionRef.current) return
      autoMinimizedRef.current = true
      setMinimized(true)
      setGlowing(true)
      setTimeout(() => setGlowing(false), 1200)
    }, AUTO_MINIMIZE_DELAY)
    return () => clearTimeout(timer)
  }, [])

  function handleToggle() {
    manualInteractionRef.current = true
    setMinimized(prev => !prev)
    setGlowing(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (sending || !name.trim() || !text.trim()) return

    const trimmedName = name.trim()
    const trimmedText = text.trim()

    // Show user message in chat immediately
    addMessage('Traveler', trimmedText)
    setText('')
    setErrorText('')

    // Honeypot: silently fake success
    if (honeypotRef.current) {
      addMessage('Jim', 'Your raven has been sent. I\'ll respond soon!')
      return
    }

    // Timestamp anti-spam: too fast = bot
    if (Date.now() - mountTimeRef.current < SPAM_THRESHOLD_MS) {
      addMessage('Jim', 'Your raven has been sent. I\'ll respond soon!')
      return
    }

    setSending(true)

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, message: trimmedText, website: honeypotRef.current }),
      })

      if (res.status === 429) {
        setErrorText('Easy there, adventurer. Try again in a moment.')
        return
      }

      if (!res.ok) {
        setErrorText('The raven failed to deliver. Try again.')
        return
      }

      addMessage('Jim', 'Your raven has been sent. I\'ll respond soon!')
    } catch {
      setErrorText('No connection to the realm. Try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={`chatbox${minimized ? ' chatbox--minimized' : ''}`}>
      <div className="chatbox__header">
        <span className="chatbox__channel">[General]</span>
        <button
          type="button"
          className={`chatbox__minimize${glowing ? ' chatbox__minimize--glow' : ''}`}
          onClick={handleToggle}
          aria-label={minimized ? 'Expand chat' : 'Minimize chat'}
        >
          {minimized ? '+' : '\u2013'}
        </button>
      </div>

      <div className="chatbox__content">
        <div className="chatbox__content-inner">
          <div className="chatbox__log" ref={logRef}>
            {messages.length === 0 && (
              <p className="chatbox__empty">The chat is quiet...</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className="chatbox__msg">
                <span className={`chatbox__sender${msg.sender === 'Jim' || msg.sender === 'Traveler' ? ' chatbox__sender--player' : ''}`}>
                  [{msg.sender}]
                </span>{' '}
                <span className="chatbox__text">{msg.text}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="chatbox__form">
            {/* Honeypot — invisible to humans */}
            <input
              name="website"
              tabIndex={-1}
              autoComplete="off"
              style={{ position: 'absolute', left: '-9999px', height: 0, width: 0, overflow: 'hidden' }}
              onChange={(e) => { honeypotRef.current = e.target.value }}
            />
            <div className="chatbox__form-row">
              <input
                type="text"
                className="chatbox__input chatbox__input--name"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                tabIndex={minimized ? -1 : 0}
              />
              <input
                type="text"
                className="chatbox__input chatbox__input--msg"
                placeholder="Type a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                maxLength={2000}
                tabIndex={minimized ? -1 : 0}
              />
              <button type="submit" className="chatbox__send" disabled={sending} tabIndex={minimized ? -1 : 0}>
                {sending ? '...' : 'Send'}
              </button>
            </div>
            {errorText && <p className="chatbox__error">{errorText}</p>}
          </form>
        </div>
      </div>
    </div>
  )
}
