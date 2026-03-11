import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ICON_MAP } from '../components/iconMap'
import { useAudio } from '../contexts/AudioContext'
import TheHearth from './TheHearth'
import TavernMenu from '../components/TavernMenu'
import './pages.css'

interface DestinationData {
  id: number
  name: string
  slug: string
  description: string | null
  icon: string | null
  audio: string | null
}

export default function Destination() {
  const { slug } = useParams()
  const [destination, setDestination] = useState<DestinationData | null>(null)
  const [loading, setLoading] = useState(true)
  const { setTrack } = useAudio()

  const isHearth = slug === 'the-hearth'
  const isTavern = slug === 'the-tavern'

  useEffect(() => {
    if (isHearth) {
      setLoading(false)
      return
    }
    fetch('/api/destinations')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setDestination(list.find((d: DestinationData) => d.slug === slug) || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug, isHearth])

  // Set destination audio track on mount, return to map audio on unmount
  useEffect(() => {
    if (isHearth || !destination?.audio) return
    setTrack(destination.audio)
    return () => setTrack(null)
  }, [destination, isHearth, setTrack])

  if (isHearth) {
    return <TheHearth />
  }

  if (loading) {
    return <div className="page-center"><p>Loading...</p></div>
  }

  return (
    <div className={`page-center destination-page${isTavern ? ' destination-page--tavern' : ''}`}>
      <div className="destination-card">
        <span className="destination-card__icon">
          {(() => {
            const entry = destination?.icon ? ICON_MAP[destination.icon] : undefined
            return entry ? <entry.component size={32} /> : '\u2726'
          })()}
        </span>
        <h1>{destination?.name || slug}</h1>
        {destination?.description && (
          <p className="destination-card__desc">{destination.description}</p>
        )}
        <p className="destination-card__wip">This region is being charted...</p>
        <Link to="/" className="destination-card__back">Return to Map</Link>
      </div>
      {isTavern && <TavernMenu />}
    </div>
  )
}
