import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAudio } from '../contexts/AudioContext'
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
}

const ATTR_META: { key: keyof Character; label: string; icon: string }[] = [
  { key: 'strength', label: 'STR', icon: '\u2694' },
  { key: 'dexterity', label: 'DEX', icon: '\uD83C\uDFF9' },
  { key: 'intellect', label: 'INT', icon: '\uD83D\uDCD6' },
  { key: 'charisma', label: 'CHA', icon: '\uD83D\uDCAC' },
  { key: 'chaos', label: 'CHS', icon: '\uD83D\uDD25' },
  { key: 'resolve', label: 'RES', icon: '\uD83D\uDEE1' },
]

function calculateLevel(birthday: string | null): string {
  if (!birthday) return 'Classified'
  const birth = new Date(birthday)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return String(age)
}

function Stars({ count }: { count: number }) {
  return (
    <span className="tc-stars">
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} className={n <= count ? 'tc-star--filled' : 'tc-star--empty'}>
          {n <= count ? '\u2605' : '\u2606'}
        </span>
      ))}
    </span>
  )
}

function TradingCard({ character }: { character: Character }) {
  const level = calculateLevel(character.birthday)
  const videoRef = useRef<HTMLVideoElement>(null)
  const cardRef = useRef<HTMLElement>(null)
  const [videoEnded, setVideoEnded] = useState(false)

  useEffect(() => {
    if (!character.video || videoEnded) return
    const el = cardRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && videoRef.current) {
          videoRef.current.play().catch(() => {})
        }
      },
      { threshold: 0.5 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [character.video, videoEnded])

  return (
    <article className="tc-card" ref={cardRef}>
      <div className="tc-card__art">
        {character.video && !videoEnded ? (
          <video
            ref={videoRef}
            src={character.video}
            muted
            playsInline
            className="tc-card__photo"
            onEnded={() => setVideoEnded(true)}
            onError={() => setVideoEnded(true)}
          />
        ) : character.photo ? (
          <img src={character.photo} alt={character.name} className="tc-card__photo" />
        ) : (
          <div className="tc-card__placeholder">{character.name.charAt(0)}</div>
        )}
      </div>

      <div className="tc-card__header">
        <div className="tc-card__identity">
          <h3 className="tc-card__name">{character.name}</h3>
          {character.title && <p className="tc-card__title">{character.title}</p>}
        </div>
        <div className="tc-card__meta">
          <span className="tc-card__level">Lvl {level}</span>
          {character.class && <span className="tc-card__class">{character.class}</span>}
        </div>
      </div>

      <div className="tc-card__attrs">
        {ATTR_META.map(({ key, label, icon }) => (
          <div key={key} className="tc-attr">
            <span className="tc-attr__icon">{icon}</span>
            <span className="tc-attr__label">{label}</span>
            <Stars count={character[key] as number} />
          </div>
        ))}
      </div>

      {(character.unique_trait_name || character.passive_ability_name || character.weakness) && (
        <div className="tc-card__abilities">
          {character.unique_trait_name && (
            <div className="tc-ability">
              <span className="tc-ability__type">Trait</span>
              <span className="tc-ability__name">{character.unique_trait_name}</span>
              {character.unique_trait_desc && <p className="tc-ability__desc">{character.unique_trait_desc}</p>}
            </div>
          )}
          {character.passive_ability_name && (
            <div className="tc-ability">
              <span className="tc-ability__type">Passive</span>
              <span className="tc-ability__name">{character.passive_ability_name}</span>
              {character.passive_ability_desc && <p className="tc-ability__desc">{character.passive_ability_desc}</p>}
            </div>
          )}
          {character.weakness && (
            <div className="tc-ability">
              <span className="tc-ability__type">Weakness</span>
              <span className="tc-ability__name">{character.weakness}</span>
            </div>
          )}
        </div>
      )}

      {character.lore && (
        <div className="tc-card__lore">
          <p>{character.lore}</p>
        </div>
      )}
    </article>
  )
}

export default function TheHearth() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const { setTrack } = useAudio()

  // Fetch destination data to check for audio track
  useEffect(() => {
    fetch('/api/destinations')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : []
        const hearth = list.find((d: { slug: string; audio?: string | null }) => d.slug === 'the-hearth')
        if (hearth?.audio) setTrack(hearth.audio)
      })
      .catch(() => {})
    return () => setTrack(null)
  }, [setTrack])

  useEffect(() => {
    fetch('/api/characters?destination=the-hearth')
      .then(res => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then(data => setCharacters(Array.isArray(data) ? data : []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="page-center"><p>Loading...</p></div>
  }

  return (
    <div className="hearth-page">
      <header className="hearth-header">
        <Link to="/" className="hearth-back">&larr; Return to Map</Link>
        <h1 className="hearth-title">The Hearth</h1>
        <p className="hearth-subtitle">Where the party gathers</p>
      </header>

      {characters.length > 0 && (
        <div className="party-status">
          <span className="party-status__label">Party Status</span>
          <div className="party-status__list">
            {characters.map(c => (
              <span key={c.id} className="party-status__member">
                <span className="party-status__dot" />
                <strong>{c.name}</strong>
                {c.status && <span className="party-status__text">: {c.status}</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="tc-grid">
        {characters.map(c => (
          <TradingCard key={c.id} character={c} />
        ))}
      </div>

      {characters.length === 0 && (
        <p className="hearth-empty">
          {error ? 'Failed to summon the party. Try again later.' : 'No party members have gathered at The Hearth yet...'}
        </p>
      )}
    </div>
  )
}
