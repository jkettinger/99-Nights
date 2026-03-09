import { useState, useEffect } from 'react'
import AdminWaypointEditor from '../components/AdminWaypointEditor'
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
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export default function AdminWaypoints() {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/destinations')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setDestinations(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="wp-page">
      <header className="wp-page__header">
        <h1>Road Waypoints</h1>
        {message && (
          <div
            className={`admin-message admin-message--${message.type} wp-page__message`}
            onClick={() => setMessage(null)}
          >
            {message.text}
          </div>
        )}
      </header>
      <AdminNav />

      {loading ? (
        <p className="admin-empty" style={{ padding: '2rem' }}>Loading...</p>
      ) : (
        <AdminWaypointEditor
          destinations={destinations}
          authHeaders={authHeaders}
          onMessage={(text, type) => setMessage({ text, type })}
        />
      )}
    </div>
  )
}
