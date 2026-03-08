import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getPathToDestination } from '../data/roadPaths'
import WaypointEditor from '../components/WaypointEditor'
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

export default function Home() {
  const [visible, setVisible] = useState(false)
  const [shrunk, setShrunk] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(0.75)
  const [audioFailed, setAudioFailed] = useState(false)
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [avatarPos, setAvatarPos] = useState({ x: 52, y: 83 })
  const [traveling, setTraveling] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const warriorRef = useRef<HTMLDivElement>(null)
  const travelTimeout = useRef<number>(undefined)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const debug = searchParams.get('debug') === 'true'

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 5500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => () => { clearTimeout(travelTimeout.current) }, [])

  useEffect(() => {
    fetch('/api/destinations')
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setDestinations(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const el = warriorRef.current
    if (!el) return
    const onEnd = (e: AnimationEvent) => {
      if (e.animationName === 'warrior-shrink') setShrunk(true)
    }
    el.addEventListener('animationend', onEnd)
    return () => el.removeEventListener('animationend', onEnd)
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.play().catch(() => {
      audio.muted = true
      setMuted(true)
    })
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    if (muted) {
      audio.muted = false
      setMuted(false)
      audio.play().catch(() => {
        audio.muted = true
        setMuted(true)
      })
    } else {
      audio.muted = true
      setMuted(true)
    }
  }

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    if (val === 0) {
      setMuted(true)
      if (audioRef.current) audioRef.current.muted = true
    } else if (muted) {
      setMuted(false)
      if (audioRef.current) {
        audioRef.current.muted = false
        audioRef.current.play().catch(() => {
          audioRef.current!.muted = true
          setMuted(true)
        })
      }
    }
  }

  function handleMarkerClick(dest: Destination) {
    if (traveling) return
    setTraveling(true)
    const waypoints = getPathToDestination(dest.slug, dest.map_x, dest.map_y)
    const SPEED = 40 // ms per unit of distance — tune for feel
    let step = 0

    function nextStep() {
      if (step >= waypoints.length) {
        navigate(`/destination/${dest.slug}`)
        return
      }
      const wp = waypoints[step]!
      const prev = step > 0 ? waypoints[step - 1]! : [avatarPos.x, avatarPos.y] as const
      const dx = wp[0] - prev[0]
      const dy = wp[1] - prev[1]
      const dist = Math.sqrt(dx * dx + dy * dy)
      const delay = Math.max(50, Math.round(dist * SPEED))
      if (warriorRef.current) {
        warriorRef.current.style.setProperty('--step-dur', `${delay}ms`)
      }
      setAvatarPos({ x: wp[0], y: wp[1] })
      step++
      travelTimeout.current = window.setTimeout(nextStep, delay)
    }
    nextStep()
  }

  return (
    <div className="home-page">
      <audio ref={audioRef} src="/audio/echos.mp3" loop autoPlay
        onError={() => setAudioFailed(true)} />

      <div className="map-container">
        <img src="/images/map.jpg" alt="Fantasy map" className="map-image" />
        <div className="map-overlay" />

        <div className="name-card">
          <h2>Jim Kettinger</h2>
        </div>

        <div
          ref={warriorRef}
          className={`warrior${visible ? ' warrior--visible' : ''}${shrunk ? ' warrior--shrunk' : ''}`}
          style={shrunk ? { left: `${avatarPos.x}%`, top: `${avatarPos.y}%` } : undefined}
        >
          <img
            src="/images/warrior-flipped.png"
            alt="Warrior avatar"
            className={`warrior-img${shrunk ? ' warrior-img--hidden' : ''}`}
          />
          {shrunk && (
            <img
              src="/images/gamepiece.png"
              alt="Game piece avatar"
              className="warrior-img gamepiece-img"
            />
          )}
        </div>

        {shrunk && destinations.map((dest, i) => (
          <button
            type="button"
            key={dest.id}
            className={`map-marker${traveling ? ' map-marker--traveling' : ''}`}
            style={{
              left: `${dest.map_x}%`,
              top: `${dest.map_y}%`,
              animationDelay: `${i * 0.12}s`,
            }}
            title={dest.name}
            aria-label={`Visit ${dest.name}`}
            onClick={() => handleMarkerClick(dest)}
            disabled={traveling}
          >
            <span className="map-marker__icon">{dest.icon || '\u2726'}</span>
            <span className="map-marker__label">{dest.name}</span>
          </button>
        ))}

        {debug && <WaypointEditor />}
      </div>

      {!audioFailed && <div className="audio-control">
        <button
          type="button"
          className="audio-control__btn"
          onClick={toggleMute}
          aria-label={muted ? 'Unmute audio' : 'Mute audio'}
        >
          {muted ? (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M3.63 3.63a.996.996 0 000 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91.8-.33 1.55-.77 2.22-1.31l1.34 1.34a.996.996 0 101.41-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4-.59-.23-1.22.23-1.22.86v.19c0 .38.25.71.61.85C17.18 6.54 19 9.06 19 12zm-8.71-6.29l-.17.17L12 7.76V6.41c0-.89-1.08-1.33-1.71-.7zM16.5 12A4.5 4.5 0 0014 7.97v1.79l2.48 2.48c.01-.08.02-.16.02-.24z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M3 10v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71V6.41c0-.89-1.08-1.34-1.71-.71L7 9H4c-.55 0-1 .45-1 1zm13.5 2A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-3.02zM14 3.23v.19c0 .38.25.71.61.85C17.18 5.54 19 8.06 19 11s-1.82 5.46-4.39 6.73c-.36.14-.61.47-.61.85v.19c0 .63.63 1.09 1.22.86C18.6 18.11 21 14.83 21 11s-2.4-7.11-5.78-8.4c-.59-.23-1.22.23-1.22.86z"/>
            </svg>
          )}
        </button>
        <input
          type="range"
          className="audio-control__volume"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={handleVolume}
          aria-label="Volume"
        />
      </div>}
    </div>
  )
}
