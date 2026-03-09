import { useState, useEffect, useRef, FormEvent } from 'react'
import AdminNav from '../components/AdminNav'
import './pages.css'

interface Character {
  id: number
  name: string
  title: string | null
  class: string | null
  birthday: string | null
  photo: string | null
  video: string | null
  strength: number
  dexterity: number
  intellect: number
  charisma: number
  chaos: number
  resolve: number
  unique_trait_name: string | null
  unique_trait_desc: string | null
  passive_ability_name: string | null
  passive_ability_desc: string | null
  weakness: string | null
  lore: string | null
  status: string | null
  sort_order: number
  destination_slug: string
}

interface CharForm {
  name: string
  title: string
  class: string
  birthday: string
  photo: string
  video: string
  strength: number
  dexterity: number
  intellect: number
  charisma: number
  chaos: number
  resolve: number
  unique_trait_name: string
  unique_trait_desc: string
  passive_ability_name: string
  passive_ability_desc: string
  weakness: string
  lore: string
  status: string
  sort_order: string
  destination_slug: string
}

const ATTRIBUTES = ['strength', 'dexterity', 'intellect', 'charisma', 'chaos', 'resolve'] as const
const ATTR_LABELS: Record<string, string> = {
  strength: 'STR',
  dexterity: 'DEX',
  intellect: 'INT',
  charisma: 'CHA',
  chaos: 'CHS',
  resolve: 'RES',
}

const emptyForm: CharForm = {
  name: '', title: '', class: '', birthday: '', photo: '', video: '',
  strength: 1, dexterity: 1, intellect: 1, charisma: 1, chaos: 1, resolve: 1,
  unique_trait_name: '', unique_trait_desc: '',
  passive_ability_name: '', passive_ability_desc: '',
  weakness: '', lore: '', status: '',
  sort_order: '0', destination_slug: 'the-hearth',
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function calculateLevel(birthday: string | null): string {
  if (!birthday) return 'Classified'
  const birth = new Date(birthday)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return String(age)
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <span className="star-rating">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={`star-rating__star${n <= value ? ' star-rating__star--filled' : ''}`}
          onClick={() => onChange(n)}
          aria-label={`${n} stars`}
        >
          {n <= value ? '\u2605' : '\u2606'}
        </button>
      ))}
    </span>
  )
}

export default function AdminCharacters() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [form, setForm] = useState<CharForm>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      const token = localStorage.getItem('token')
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setMessage({ text: data?.error || 'Upload failed', type: 'error' })
        return
      }
      const { url } = await res.json()
      updateField('photo', url)
      setMessage({ text: 'Image uploaded', type: 'success' })
    } catch {
      setMessage({ text: 'Upload failed — unable to connect', type: 'error' })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function fetchCharacters() {
    try {
      const res = await fetch('/api/characters')
      if (!res.ok) throw new Error()
      setCharacters(await res.json())
    } catch {
      setMessage({ text: 'Failed to load characters', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCharacters() }, [])

  function startEdit(c: Character) {
    setEditingId(c.id)
    setForm({
      name: c.name,
      title: c.title || '',
      class: c.class || '',
      birthday: c.birthday ? c.birthday.slice(0, 10) : '',
      photo: c.photo || '',
      video: c.video || '',
      strength: c.strength,
      dexterity: c.dexterity,
      intellect: c.intellect,
      charisma: c.charisma,
      chaos: c.chaos,
      resolve: c.resolve,
      unique_trait_name: c.unique_trait_name || '',
      unique_trait_desc: c.unique_trait_desc || '',
      passive_ability_name: c.passive_ability_name || '',
      passive_ability_desc: c.passive_ability_desc || '',
      weakness: c.weakness || '',
      lore: c.lore || '',
      status: c.status || '',
      sort_order: String(c.sort_order),
      destination_slug: c.destination_slug,
    })
    setConfirmDeleteId(null)
    setMessage(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  function updateField(field: keyof CharForm, value: string | number) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    setSubmitting(true)

    const body: Record<string, unknown> = {
      name: form.name,
      title: form.title || null,
      class: form.class || null,
      birthday: form.birthday || null,
      photo: form.photo || null,
      video: form.video || null,
      strength: form.strength,
      dexterity: form.dexterity,
      intellect: form.intellect,
      charisma: form.charisma,
      chaos: form.chaos,
      resolve: form.resolve,
      unique_trait_name: form.unique_trait_name || null,
      unique_trait_desc: form.unique_trait_desc || null,
      passive_ability_name: form.passive_ability_name || null,
      passive_ability_desc: form.passive_ability_desc || null,
      weakness: form.weakness || null,
      lore: form.lore || null,
      status: form.status || null,
      sort_order: parseInt(form.sort_order, 10) || 0,
      destination_slug: form.destination_slug || 'the-hearth',
    }

    try {
      const url = editingId ? `/api/characters/${editingId}` : '/api/characters'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setMessage({ text: data?.error || `Failed to ${editingId ? 'update' : 'create'} character`, type: 'error' })
        return
      }

      setMessage({ text: editingId ? 'Character updated' : 'Character created', type: 'success' })
      setForm(emptyForm)
      setEditingId(null)
      await fetchCharacters()
    } catch {
      setMessage({ text: 'Unable to connect to server', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    setMessage(null)
    try {
      const res = await fetch(`/api/characters/${id}`, { method: 'DELETE', headers: authHeaders() })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setMessage({ text: data?.error || 'Failed to delete character', type: 'error' })
        return
      }
      setMessage({ text: 'Character deleted', type: 'success' })
      setConfirmDeleteId(null)
      if (editingId === id) cancelEdit()
      await fetchCharacters()
    } catch {
      setMessage({ text: 'Unable to connect to server', type: 'error' })
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Character Management</h1>
      </header>
      <AdminNav />

      {message && (
        <div className={`admin-message admin-message--${message.type}`} onClick={() => setMessage(null)}>
          {message.text}
        </div>
      )}

      <div className="admin-layout">
        <section className="admin-section">
          <h2>{editingId ? 'Edit Character' : 'New Character'}</h2>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="admin-form__row">
              <label>
                <span>Name *</span>
                <input type="text" value={form.name} onChange={e => updateField('name', e.target.value)} required placeholder="Layla" />
              </label>
              <label>
                <span>Title</span>
                <input type="text" value={form.title} onChange={e => updateField('title', e.target.value)} placeholder="Firstborn of the Hearth" />
              </label>
            </div>

            <div className="admin-form__row">
              <label>
                <span>Class</span>
                <input type="text" value={form.class} onChange={e => updateField('class', e.target.value)} placeholder="Shadow Diplomat" />
              </label>
              <label>
                <span>Birthday {form.birthday && <em className="char-level">Level: {calculateLevel(form.birthday)}</em>}</span>
                <input type="date" value={form.birthday} onChange={e => updateField('birthday', e.target.value)} />
              </label>
            </div>

            <div className="photo-field">
              <label className="photo-field__label">
                <span>Photo URL</span>
                <div className="photo-field__row">
                  <input type="text" value={form.photo} onChange={e => updateField('photo', e.target.value)} placeholder="/images/characters/layla.jpg" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="photo-field__file-input"
                    onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0]) }}
                  />
                  <button
                    type="button"
                    className="admin-btn--secondary photo-field__upload-btn"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? 'Uploading\u2026' : 'Choose Image'}
                  </button>
                </div>
              </label>
              {form.photo && (
                <div className="photo-field__preview">
                  <img src={form.photo} alt="Character preview" className="photo-field__thumb" />
                </div>
              )}
            </div>

            <label>
              <span>Video URL</span>
              <input type="text" value={form.video} onChange={e => updateField('video', e.target.value)} placeholder="/videos/characters/layla-intro.mp4" />
            </label>

            <div className="char-attrs">
              <span className="char-attrs__label">Attributes</span>
              <div className="char-attrs__grid">
                {ATTRIBUTES.map(attr => (
                  <div key={attr} className="char-attr">
                    <span className="char-attr__name">{ATTR_LABELS[attr]}</span>
                    <StarRating value={form[attr]} onChange={v => updateField(attr, v)} />
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-form__row">
              <label>
                <span>Unique Trait Name</span>
                <input type="text" value={form.unique_trait_name} onChange={e => updateField('unique_trait_name', e.target.value)} placeholder="Diplomat's Intuition" />
              </label>
              <label>
                <span>Passive Ability Name</span>
                <input type="text" value={form.passive_ability_name} onChange={e => updateField('passive_ability_name', e.target.value)} placeholder="Shadow Network" />
              </label>
            </div>

            <div className="admin-form__row">
              <label>
                <span>Unique Trait Description</span>
                <textarea value={form.unique_trait_desc} onChange={e => updateField('unique_trait_desc', e.target.value)} rows={2} placeholder="Can read a room before entering it..." />
              </label>
              <label>
                <span>Passive Ability Description</span>
                <textarea value={form.passive_ability_desc} onChange={e => updateField('passive_ability_desc', e.target.value)} rows={2} placeholder="Maintains an invisible web of allies..." />
              </label>
            </div>

            <label>
              <span>Weakness</span>
              <input type="text" value={form.weakness} onChange={e => updateField('weakness', e.target.value)} placeholder="Overconfidence" />
            </label>

            <label>
              <span>Lore</span>
              <textarea value={form.lore} onChange={e => updateField('lore', e.target.value)} rows={4} placeholder="Born under a crimson moon..." />
            </label>

            <div className="admin-form__row">
              <label>
                <span>Status</span>
                <input type="text" value={form.status} onChange={e => updateField('status', e.target.value)} placeholder="Plotting world domination" />
              </label>
              <label>
                <span>Sort Order</span>
                <input type="number" value={form.sort_order} onChange={e => updateField('sort_order', e.target.value)} />
              </label>
              <label>
                <span>Destination</span>
                <input type="text" value={form.destination_slug} onChange={e => updateField('destination_slug', e.target.value)} />
              </label>
            </div>

            <div className="admin-form__actions">
              <button type="submit" disabled={submitting}>{submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}</button>
              {editingId && <button type="button" className="admin-btn--secondary" onClick={cancelEdit}>Cancel</button>}
            </div>
          </form>
        </section>

        <section className="admin-section">
          <h2>Characters</h2>
          {loading ? (
            <p className="admin-empty">Loading...</p>
          ) : characters.length === 0 ? (
            <p className="admin-empty">No characters yet. Create one above.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Title</th>
                    <th>Class</th>
                    <th>Level</th>
                    <th>Dest</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {characters.map(c => (
                    <tr key={c.id} className={editingId === c.id ? 'admin-table__row--active' : ''}>
                      <td>{c.name}</td>
                      <td className="admin-table__slug">{c.title || '\u2014'}</td>
                      <td>{c.class || '\u2014'}</td>
                      <td className="admin-table__coords">{calculateLevel(c.birthday)}</td>
                      <td className="admin-table__slug">{c.destination_slug}</td>
                      <td className="admin-table__actions">
                        <button className="admin-btn--edit" onClick={() => startEdit(c)}>Edit</button>
                        {confirmDeleteId === c.id ? (
                          <>
                            <button className="admin-btn--danger" onClick={() => handleDelete(c.id)}>Confirm</button>
                            <button className="admin-btn--secondary" onClick={() => setConfirmDeleteId(null)}>No</button>
                          </>
                        ) : (
                          <button className="admin-btn--danger" onClick={() => setConfirmDeleteId(c.id)}>Delete</button>
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
