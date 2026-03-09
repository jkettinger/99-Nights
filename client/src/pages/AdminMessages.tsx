import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './pages.css'

interface Message {
  id: number
  name: string
  message: string
  created_at: string
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export default function AdminMessages() {
  const [messages, setMessages] = useState<Message[]>([])
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [status, setStatus] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchMessages() {
    try {
      const res = await fetch('/api/messages', { headers: authHeaders() })
      if (!res.ok) throw new Error()
      setMessages(await res.json())
    } catch {
      setStatus({ text: 'Failed to load messages', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMessages() }, [])

  async function handleDelete(id: number) {
    setStatus(null)
    try {
      const res = await fetch(`/api/messages/${id}`, { method: 'DELETE', headers: authHeaders() })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setStatus({ text: data?.error || 'Failed to delete message', type: 'error' })
        return
      }
      setStatus({ text: 'Message deleted', type: 'success' })
      setConfirmDeleteId(null)
      await fetchMessages()
    } catch {
      setStatus({ text: 'Unable to connect to server', type: 'error' })
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <Link to="/admin" className="wp-page__back">&larr; Back to Admin</Link>
        <h1>Messages</h1>
      </header>

      {status && (
        <div className={`admin-message admin-message--${status.type}`} onClick={() => setStatus(null)}>
          {status.text}
        </div>
      )}

      <div className="admin-layout">
        <section className="admin-section">
          {loading ? (
            <p className="admin-empty">Loading...</p>
          ) : messages.length === 0 ? (
            <p className="admin-empty">No messages yet. The ravens are quiet.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Message</th>
                    <th>Received</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map(m => (
                    <tr key={m.id}>
                      <td>{m.name}</td>
                      <td className="admin-table__message">{m.message}</td>
                      <td className="admin-table__coords">{formatDate(m.created_at)}</td>
                      <td className="admin-table__actions">
                        {confirmDeleteId === m.id ? (
                          <>
                            <button className="admin-btn--danger" onClick={() => handleDelete(m.id)}>Confirm</button>
                            <button className="admin-btn--secondary" onClick={() => setConfirmDeleteId(null)}>No</button>
                          </>
                        ) : (
                          <button className="admin-btn--danger" onClick={() => setConfirmDeleteId(m.id)}>Delete</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
