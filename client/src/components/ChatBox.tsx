import { useState, useRef, FormEvent } from 'react'

const SPAM_THRESHOLD_MS = 3000

export default function ChatBox() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorText, setErrorText] = useState('')
  const honeypotRef = useRef('')
  const mountTimeRef = useRef(Date.now())

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (status === 'sending') return

    // Honeypot: bots fill hidden fields — silently fake success
    if (honeypotRef.current) {
      setStatus('sent')
      setName('')
      setMessage('')
      return
    }

    // Timestamp anti-spam: too fast = bot
    if (Date.now() - mountTimeRef.current < SPAM_THRESHOLD_MS) {
      setStatus('sent')
      setName('')
      setMessage('')
      return
    }

    setStatus('sending')
    setErrorText('')

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message, website: honeypotRef.current }),
      })

      if (res.status === 429) {
        setStatus('error')
        setErrorText('Easy there, adventurer. Try again in a moment.')
        return
      }

      if (!res.ok) {
        setStatus('error')
        setErrorText('The raven failed to deliver. Try again.')
        return
      }

      setStatus('sent')
      setName('')
      setMessage('')
    } catch {
      setStatus('error')
      setErrorText('No connection to the realm. Try again.')
    }
  }

  function handleNewMessage() {
    setStatus('idle')
    setErrorText('')
  }

  return (
    <div className={`chatbox${open ? ' chatbox--open' : ''}`}>
      {!open ? (
        <button type="button" className="chatbox__toggle" onClick={() => setOpen(true)}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
          </svg>
          <span>Message Me</span>
        </button>
      ) : (
        <>
          <div className="chatbox__header">
            <span className="chatbox__channel">[General]</span>
            <button type="button" className="chatbox__close" onClick={() => setOpen(false)} aria-label="Close chat">
              &times;
            </button>
          </div>

          <div className="chatbox__body">
            {status === 'sent' ? (
              <div className="chatbox__confirmation">
                <p className="chatbox__sent-msg">Message sent! The raven flies.</p>
                <button type="button" className="chatbox__again" onClick={handleNewMessage}>
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="chatbox__form">
                {/* Honeypot — invisible to humans */}
                <input
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  style={{ position: 'absolute', left: '-9999px', height: 0, width: 0, overflow: 'hidden' }}
                  onChange={(e) => { honeypotRef.current = e.target.value }}
                />
                <input
                  type="text"
                  className="chatbox__input"
                  placeholder="Your name, traveler..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                />
                <textarea
                  className="chatbox__textarea"
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  maxLength={2000}
                  rows={3}
                />
                {status === 'error' && (
                  <p className="chatbox__error">{errorText}</p>
                )}
                <button type="submit" className="chatbox__send" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Sending...' : 'Send Raven'}
                </button>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  )
}
