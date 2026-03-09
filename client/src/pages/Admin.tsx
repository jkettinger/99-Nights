import { useState, useEffect, FormEvent } from 'react'
import IconPicker from '../components/IconPicker'
import { ICON_MAP } from '../components/iconMap'
import AdminNav from '../components/AdminNav'
import './pages.css'

interface Destination {
  id: number
  name: string
  slug: string
  description: string | null
  map_x: number
  map_y: number
  icon: string | null
  audio: string | null
  created_at: string
  updated_at: string
}

type DestinationForm = {
  name: string
  slug: string
  description: string
  map_x: string
  map_y: string
  icon: string
  audio: string
}

const emptyForm: DestinationForm = {
  name: '',
  slug: '',
  description: '',
  map_x: '',
  map_y: '',
  icon: '',
  audio: '',
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export default function Admin() {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [form, setForm] = useState<DestinationForm>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const clearMessage = () => setMessage(null)

  async function fetchDestinations() {
    try {
      const res = await fetch('/api/destinations')
      if (!res.ok) throw new Error('Failed to load destinations')
      const data = await res.json()
      setDestinations(data)
    } catch {
      setMessage({ text: 'Failed to load destinations', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDestinations()
  }, [])

  function startEdit(dest: Destination) {
    setEditingId(dest.id)
    setForm({
      name: dest.name,
      slug: dest.slug,
      description: dest.description || '',
      map_x: String(dest.map_x),
      map_y: String(dest.map_y),
      icon: dest.icon || '',
      audio: dest.audio || '',
    })
    setConfirmDeleteId(null)
    clearMessage()
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    clearMessage()
    setSubmitting(true)

    const body: Record<string, unknown> = {
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      map_x: parseFloat(form.map_x),
      map_y: parseFloat(form.map_y),
      icon: form.icon || null,
      audio: form.audio || null,
    }

    try {
      const url = editingId ? `/api/destinations/${editingId}` : '/api/destinations'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setMessage({ text: data?.error || `Failed to ${editingId ? 'update' : 'create'} destination`, type: 'error' })
        return
      }

      setMessage({ text: editingId ? 'Destination updated' : 'Destination created', type: 'success' })
      setForm(emptyForm)
      setEditingId(null)
      await fetchDestinations()
    } catch {
      setMessage({ text: 'Unable to connect to server', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    clearMessage()
    try {
      const res = await fetch(`/api/destinations/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setMessage({ text: data?.error || 'Failed to delete destination', type: 'error' })
        return
      }

      setMessage({ text: 'Destination deleted', type: 'success' })
      setConfirmDeleteId(null)
      if (editingId === id) cancelEdit()
      await fetchDestinations()
    } catch {
      setMessage({ text: 'Unable to connect to server', type: 'error' })
    }
  }

  function updateField(field: keyof DestinationForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Realm Administration</h1>
      </header>
      <AdminNav />

      {message && (
        <div className={`admin-message admin-message--${message.type}`} onClick={clearMessage}>
          {message.text}
        </div>
      )}

      <div className="admin-layout">
        <section className="admin-section">
          <h2>{editingId ? 'Edit Destination' : 'New Destination'}</h2>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="admin-form__row">
              <label>
                <span>Name</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="The Citadel"
                  required
                />
              </label>
              <label>
                <span>Slug</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => updateField('slug', e.target.value)}
                  placeholder="the-citadel"
                  required
                />
              </label>
            </div>
            <label>
              <span>Description</span>
              <textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="A towering fortress of ambition..."
                rows={3}
              />
            </label>
            <div className="admin-form__row">
              <label>
                <span>Map X (%)</span>
                <input
                  type="number"
                  value={form.map_x}
                  onChange={(e) => updateField('map_x', e.target.value)}
                  placeholder="50.0"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                />
              </label>
              <label>
                <span>Map Y (%)</span>
                <input
                  type="number"
                  value={form.map_y}
                  onChange={(e) => updateField('map_y', e.target.value)}
                  placeholder="50.0"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                />
              </label>
              <label>
                <span>Icon</span>
                <IconPicker
                  value={form.icon}
                  onChange={(icon) => updateField('icon', icon)}
                />
              </label>
            </div>
            <label>
              <span>Audio URL</span>
              <input
                type="text"
                value={form.audio}
                onChange={(e) => updateField('audio', e.target.value)}
                placeholder="/audio/ember.mp3"
              />
            </label>
            <div className="admin-form__actions">
              <button type="submit" disabled={submitting}>{submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}</button>
              {editingId && (
                <button type="button" className="admin-btn--secondary" onClick={cancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="admin-section">
          <h2>Destinations</h2>
          {loading ? (
            <p className="admin-empty">Loading...</p>
          ) : destinations.length === 0 ? (
            <p className="admin-empty">No destinations yet. Create one above.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Position</th>
                    <th>Icon</th>
                    <th>Audio</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {destinations.map((dest) => (
                    <tr key={dest.id} className={editingId === dest.id ? 'admin-table__row--active' : ''}>
                      <td>{dest.name}</td>
                      <td className="admin-table__slug">{dest.slug}</td>
                      <td className="admin-table__coords">{dest.map_x}, {dest.map_y}</td>
                      <td>
                        {(() => {
                          const entry = dest.icon ? ICON_MAP[dest.icon] : undefined
                          return entry ? <entry.component size={16} /> : '—'
                        })()}
                      </td>
                      <td className="admin-table__audio">{dest.audio || '—'}</td>
                      <td className="admin-table__actions">
                        <button className="admin-btn--edit" onClick={() => startEdit(dest)}>Edit</button>
                        {confirmDeleteId === dest.id ? (
                          <>
                            <button className="admin-btn--danger" onClick={() => handleDelete(dest.id)}>Confirm</button>
                            <button className="admin-btn--secondary" onClick={() => setConfirmDeleteId(null)}>No</button>
                          </>
                        ) : (
                          <button className="admin-btn--danger" onClick={() => setConfirmDeleteId(dest.id)}>Delete</button>
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
