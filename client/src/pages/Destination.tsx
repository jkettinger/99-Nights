import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import './pages.css'

interface DestinationData {
  id: number
  name: string
  slug: string
  description: string | null
  icon: string | null
}

export default function Destination() {
  const { slug } = useParams()
  const [destination, setDestination] = useState<DestinationData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/destinations')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setDestination(list.find((d: DestinationData) => d.slug === slug) || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return <div className="page-center"><p>Loading...</p></div>
  }

  return (
    <div className="page-center destination-page">
      <div className="destination-card">
        <span className="destination-card__icon">
          {destination?.icon || '\u2726'}
        </span>
        <h1>{destination?.name || slug}</h1>
        {destination?.description && (
          <p className="destination-card__desc">{destination.description}</p>
        )}
        <p className="destination-card__wip">This region is being charted...</p>
        <Link to="/" className="destination-card__back">Return to Map</Link>
      </div>
    </div>
  )
}
