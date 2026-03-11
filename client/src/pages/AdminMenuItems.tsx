import { useState, useEffect, FormEvent } from 'react'
import AdminNav from '../components/AdminNav'
import './pages.css'

interface Buff {
  stat: string
  value: number
}

interface MenuItem {
  id: number
  name: string
  description: string
  category: 'beer' | 'coffee' | 'food' | 'dessert'
  price_gold: number
  buffs: Buff[]
  sort_order: number
}

interface MenuItemForm {
  name: string
  description: string
  category: MenuItem['category']
  price_gold: string
  buffs: Buff[]
  sort_order: string
}

const emptyForm: MenuItemForm = {
  name: '',
  description: '',
  category: 'beer',
  price_gold: '',
  buffs: [],
  sort_order: '0',
}

const CATEGORY_LABELS: Record<MenuItem['category'], string> = {
  beer: 'Ales & Brews',
  coffee: 'Potions of Alertness',
  food: 'Hearty Fare',
  dessert: 'Sweet Enchantments',
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export default function AdminMenuItems() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [form, setForm] = useState<MenuItemForm>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [status, setStatus] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  async function fetchItems() {
    try {
      const res = await fetch('/api/menu-items')
      if (!res.ok) throw new Error()
      setItems(await res.json())
    } catch {
      setStatus({ text: 'Failed to load menu items', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  function startEdit(item: MenuItem) {
    setEditingId(item.id)
    setForm({
      name: item.name,
      description: item.description,
      category: item.category,
      price_gold: String(item.price_gold),
      buffs: (item.buffs || []).length > 0 ? item.buffs : [],
      sort_order: String(item.sort_order),
    })
    setConfirmDeleteId(null)
    setStatus(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  function addBuff() {
    setForm(prev => ({ ...prev, buffs: [...prev.buffs, { stat: '', value: 0 }] }))
  }

  function removeBuff(index: number) {
    setForm(prev => ({ ...prev, buffs: prev.buffs.filter((_, i) => i !== index) }))
  }

  function updateBuff(index: number, field: 'stat' | 'value', val: string) {
    setForm(prev => ({
      ...prev,
      buffs: prev.buffs.map((b, i) =>
        i === index ? { ...b, [field]: field === 'value' ? Number(val) || 0 : val } : b
      ),
    }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus(null)
    setSubmitting(true)

    const body = {
      name: form.name,
      description: form.description,
      category: form.category,
      price_gold: Number(form.price_gold) || 0,
      buffs: form.buffs.filter(b => b.stat.trim()),
      sort_order: Number(form.sort_order) || 0,
    }

    try {
      const url = editingId ? `/api/menu-items/${editingId}` : '/api/menu-items'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setStatus({ text: data?.error || `Failed to ${editingId ? 'update' : 'create'} menu item`, type: 'error' })
        return
      }

      setStatus({ text: editingId ? 'Menu item updated' : 'Menu item created', type: 'success' })
      setForm(emptyForm)
      setEditingId(null)
      await fetchItems()
    } catch {
      setStatus({ text: 'Unable to connect to server', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    setStatus(null)
    try {
      const res = await fetch(`/api/menu-items/${id}`, { method: 'DELETE', headers: authHeaders() })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setStatus({ text: data?.error || 'Failed to delete menu item', type: 'error' })
        return
      }
      setStatus({ text: 'Menu item deleted', type: 'success' })
      setConfirmDeleteId(null)
      if (editingId === id) cancelEdit()
      await fetchItems()
    } catch {
      setStatus({ text: 'Unable to connect to server', type: 'error' })
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Menu Items</h1>
      </header>
      <AdminNav />

      {status && (
        <div className={`admin-message admin-message--${status.type}`} onClick={() => setStatus(null)}>
          {status.text}
        </div>
      )}

      <div className="admin-layout">
        <section className="admin-section">
          <h2>{editingId ? 'Edit Menu Item' : 'New Menu Item'}</h2>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="admin-form__row">
              <label>
                <span>Name</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Dragon's Breath Ale"
                  required
                  maxLength={255}
                />
              </label>
              <label>
                <span>Category</span>
                <select
                  value={form.category}
                  onChange={e => setForm(prev => ({ ...prev, category: e.target.value as MenuItem['category'] }))}
                >
                  {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              <span>Description</span>
              <textarea
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="A fiery brew that warms from the inside out..."
                maxLength={2000}
                rows={2}
              />
            </label>
            <div className="admin-form__row">
              <label>
                <span>Price (gold)</span>
                <input
                  type="number"
                  value={form.price_gold}
                  onChange={e => setForm(prev => ({ ...prev, price_gold: e.target.value }))}
                  placeholder="5"
                  required
                  min={0}
                />
              </label>
              <label>
                <span>Sort Order</span>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={e => setForm(prev => ({ ...prev, sort_order: e.target.value }))}
                  placeholder="0"
                />
              </label>
            </div>

            <div className="admin-buffs">
              <div className="admin-buffs__header">
                <span>Buffs / Nerfs</span>
                <button type="button" className="admin-btn--edit" onClick={addBuff}>+ Add Buff</button>
              </div>
              {form.buffs.map((buff, i) => (
                <div key={i} className="admin-buffs__row">
                  <input
                    type="text"
                    value={buff.stat}
                    onChange={e => updateBuff(i, 'stat', e.target.value)}
                    placeholder="Charisma"
                    className="admin-buffs__stat"
                  />
                  <input
                    type="number"
                    value={buff.value}
                    onChange={e => updateBuff(i, 'value', e.target.value)}
                    placeholder="0"
                    className="admin-buffs__value"
                  />
                  <button type="button" className="admin-btn--danger" onClick={() => removeBuff(i)}>X</button>
                </div>
              ))}
              {form.buffs.length === 0 && (
                <p className="admin-empty" style={{ margin: '0.25rem 0', fontSize: '0.8rem' }}>No buffs yet. Click "+ Add Buff" to add stat modifiers.</p>
              )}
            </div>

            <div className="admin-form__actions">
              <button type="submit" disabled={submitting}>{submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}</button>
              {editingId && <button type="button" className="admin-btn--secondary" onClick={cancelEdit}>Cancel</button>}
            </div>
          </form>
        </section>

        <section className="admin-section">
          <h2>Tavern Menu ({items.length})</h2>
          {loading ? (
            <p className="admin-empty">Loading...</p>
          ) : items.length === 0 ? (
            <p className="admin-empty">No menu items yet. The tavern kitchen is empty.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Buffs</th>
                    <th>Order</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className={editingId === item.id ? 'admin-table__row--active' : ''}>
                      <td>
                        <strong>{item.name}</strong>
                        {item.description && <div className="admin-table__message">{item.description}</div>}
                      </td>
                      <td>{CATEGORY_LABELS[item.category]}</td>
                      <td>{item.price_gold}g</td>
                      <td>
                        {(item.buffs || []).map((b, i) => (
                          <div key={i} style={{ color: b.value >= 0 ? '#4a9' : '#c55', fontSize: '0.8rem' }}>
                            {b.value >= 0 ? '+' : ''}{b.value} {b.stat}
                          </div>
                        ))}
                      </td>
                      <td>{item.sort_order}</td>
                      <td className="admin-table__actions">
                        <button className="admin-btn--edit" onClick={() => startEdit(item)}>Edit</button>
                        {confirmDeleteId === item.id ? (
                          <>
                            <button className="admin-btn--danger" onClick={() => handleDelete(item.id)}>Confirm</button>
                            <button className="admin-btn--secondary" onClick={() => setConfirmDeleteId(null)}>No</button>
                          </>
                        ) : (
                          <button className="admin-btn--danger" onClick={() => setConfirmDeleteId(item.id)}>Delete</button>
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
