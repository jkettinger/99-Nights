import { useState, useEffect, FormEvent } from 'react'
import AdminNav from '../components/AdminNav'
import './pages.css'

interface AutoMessage {
  id: number
  name: string
  message: string
}

type AutoMsgForm = { name: string; message: string }
const emptyForm: AutoMsgForm = { name: '', message: '' }

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export default function AdminAutoMessages() {
  const [messages, setMessages] = useState<AutoMessage[]>([])
  const [form, setForm] = useState<AutoMsgForm>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [status, setStatus] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  async function fetchMessages() {
    try {
      const res = await fetch('/api/auto-messages')
      if (!res.ok) throw new Error()
      setMessages(await res.json())
    } catch {
      setStatus({ text: 'Failed to load auto messages', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMessages() }, [])

  function startEdit(msg: AutoMessage) {
    setEditingId(msg.id)
    setForm({ name: msg.name, message: msg.message })
    setConfirmDeleteId(null)
    setStatus(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus(null)
    setSubmitting(true)

    const body = { name: form.name, message: form.message }

    try {
      const url = editingId ? `/api/auto-messages/${editingId}` : '/api/auto-messages'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setStatus({ text: data?.error || `Failed to ${editingId ? 'update' : 'create'} auto message`, type: 'error' })
        return
      }

      setStatus({ text: editingId ? 'Auto message updated' : 'Auto message created', type: 'success' })
      setForm(emptyForm)
      setEditingId(null)
      await fetchMessages()
    } catch {
      setStatus({ text: 'Unable to connect to server', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    setStatus(null)
    try {
      const res = await fetch(`/api/auto-messages/${id}`, { method: 'DELETE', headers: authHeaders() })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setStatus({ text: data?.error || 'Failed to delete auto message', type: 'error' })
        return
      }
      setStatus({ text: 'Auto message deleted', type: 'success' })
      setConfirmDeleteId(null)
      if (editingId === id) cancelEdit()
      await fetchMessages()
    } catch {
      setStatus({ text: 'Unable to connect to server', type: 'error' })
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Auto Messages</h1>
      </header>
      <AdminNav />

      {status && (
        <div className={`admin-message admin-message--${status.type}`} onClick={() => setStatus(null)}>
          {status.text}
        </div>
      )}

      <div className="admin-layout">
        <section className="admin-section">
          <h2>{editingId ? 'Edit Auto Message' : 'New Auto Message'}</h2>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="admin-form__row">
              <label>
                <span>NPC Name</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Guard"
                  required
                  maxLength={100}
                />
              </label>
            </div>
            <label>
              <span>Message</span>
              <textarea
                value={form.message}
                onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Nothing to report. Which is exactly what worries me."
                required
                maxLength={500}
                rows={2}
              />
            </label>
            <div className="admin-form__actions">
              <button type="submit" disabled={submitting}>{submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}</button>
              {editingId && <button type="button" className="admin-btn--secondary" onClick={cancelEdit}>Cancel</button>}
            </div>
          </form>
        </section>

        <section className="admin-section">
          <h2>NPC Messages ({messages.length})</h2>
          {loading ? (
            <p className="admin-empty">Loading...</p>
          ) : messages.length === 0 ? (
            <p className="admin-empty">No auto messages yet. The NPCs have nothing to say.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>NPC</th>
                    <th>Message</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map(m => (
                    <tr key={m.id} className={editingId === m.id ? 'admin-table__row--active' : ''}>
                      <td>{m.name}</td>
                      <td className="admin-table__message">{m.message}</td>
                      <td className="admin-table__actions">
                        <button className="admin-btn--edit" onClick={() => startEdit(m)}>Edit</button>
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
