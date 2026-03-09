import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { startToTown as hardcodedStartToTown, spokes as hardcodedSpokes } from '../data/roadPaths'
import type { Point } from '../data/roadPaths'
import { ICON_MAP } from '../components/iconMap'
import { useChat } from '../contexts/ChatContext'
import WaypointEditor from '../components/WaypointEditor'
import ChatBox from '../components/ChatBox'
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

const DESTINATION_MESSAGES: Record<string, string> = {
  'the-hearth': "Ah, I can't wait to see the brood!",
  'the-keep': 'To the Keep! Important business awaits.',
  'the-arena': 'Time to test our mettle in the Arena!',
  'the-library': 'Knowledge awaits in the ancient stacks...',
  'the-tavern': 'Nothing like a cold mead after a long journey.',
  'work': 'Duty calls at the forge.',
}

const AMBIENT_MESSAGES: [string, string][] = [
  ['Guard', 'I used to be an adventurer like you, then I took an arrow to the knee.'],
  ['Merchant', "Fresh sweetrolls! Get 'em while they're warm!"],
  ['Bard', '\u266A Our hero, our hero, claims a warrior\'s heart... \u266A'],
  ['Villager', 'Did you hear? Dragons have been spotted near the mountains.'],
  ['Innkeeper', "Nothing like some fried dragon to lift a wanderer's spirit."],
  ['Scout', "The roads aren't safe these days. Watch yourself, traveler."],
  ['Blacksmith', "Steel's not cheap, but neither is your life."],
  ['Elder', 'The ancient texts speak of one who would come...'],
  ['Child', "Tag! You're it! ...oh wait, you're not playing."],
  ['Fisherman', 'Caught a mudcrab the other day. Nasty creatures.'],
  ['Alchemist', 'I could brew you a potion, but the last one turned a man into a newt.'],
  ['Courier', "I've been looking for you. Got something I'm supposed to deliver."],
  ['Stablehand', 'The horses are restless tonight. Something in the air.'],
  ['Wizard', 'I tried to refactor reality once. Got a stack overflow.'],
  ['Scribe', 'The logs are full of warnings. As usual, no one reads them.'],
  ['Merchant', "Two copper for a health potion? In THIS economy?"],
  ['Guard', 'Nothing to report. Which is exactly what worries me.'],
  ['Bard', "They say the dev who built this realm never sleeps."],
  ['Villager', 'My cousin saw a pixel out of place near the tavern. Terrifying.'],
  ['Innkeeper', 'We serve ale, mead, and cold brew coffee. Adventurers need caffeine.'],
  ['Elder', 'In my day, we deployed on Fridays and lived to tell the tale.'],
  ['Child', 'When I grow up, I want to be a div with position: absolute!'],
  ['Fisherman', "The network's been slow today. Must be the sea serpents."],
  ['Scout', 'I found a hidden path behind the waterfall. It led to a 404.'],
  ['Blacksmith', "I forged this blade from pure TypeScript. It's strictly typed."],
]

export default function Home() {
  const hasPlayed = sessionStorage.getItem('intro-played') === 'true'
  const [visible, setVisible] = useState(hasPlayed)
  const [shrunk, setShrunk] = useState(hasPlayed)
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [dynamicWaypoints, setDynamicWaypoints] = useState<Record<string, Point[]> | null>(null)
  const [avatarPos, setAvatarPos] = useState({ x: 50, y: 84 })
  const [traveling, setTraveling] = useState(false)
  const warriorRef = useRef<HTMLDivElement>(null)
  const travelTimeout = useRef<number>(undefined)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const debug = searchParams.get('debug') === 'true'
  const { messages, addMessage } = useChat()
  const welcomeSentRef = useRef(false)
  const ambientIndexRef = useRef(Math.floor(Math.random() * AMBIENT_MESSAGES.length))

  useEffect(() => {
    if (hasPlayed) return
    const timer = setTimeout(() => setVisible(true), 5500)
    return () => clearTimeout(timer)
  }, [hasPlayed])

  useEffect(() => () => { clearTimeout(travelTimeout.current) }, [])

  useEffect(() => {
    fetch('/api/destinations')
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setDestinations(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/road-waypoints')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && typeof data === 'object') {
          const parsed: Record<string, Point[]> = {}
          for (const [slug, pts] of Object.entries(data)) {
            if (Array.isArray(pts) && pts.length > 0) {
              parsed[slug] = (pts as number[][]).map(p => [p[0], p[1]] as Point)
            }
          }
          if (Object.keys(parsed).length > 0) setDynamicWaypoints(parsed)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (hasPlayed) return
    const el = warriorRef.current
    if (!el) return
    const onEnd = (e: AnimationEvent) => {
      if (e.animationName === 'warrior-shrink') {
        setShrunk(true)
        sessionStorage.setItem('intro-played', 'true')
      }
    }
    el.addEventListener('animationend', onEnd)
    return () => el.removeEventListener('animationend', onEnd)
  }, [hasPlayed])

  // Mobile: center viewport on avatar position immediately on mount
  useEffect(() => {
    if (window.innerWidth > 768) return
    const container = document.querySelector('.home-page') as HTMLElement
    const mapEl = container?.querySelector('.map-container') as HTMLElement
    if (!container || !mapEl) return

    // Wait a frame for layout to settle
    requestAnimationFrame(() => {
      const targetX = mapEl.scrollWidth * 0.5 - window.innerWidth / 2
      const targetY = mapEl.scrollHeight * 0.84 - window.innerHeight / 2
      container.scrollTo(targetX, targetY)
    })
  }, [])

  // Mobile: follow avatar during travel
  useEffect(() => {
    if (window.innerWidth > 768 || !traveling) return
    const container = document.querySelector('.home-page') as HTMLElement
    const mapEl = container?.querySelector('.map-container') as HTMLElement
    if (!container || !mapEl) return

    const targetX = mapEl.scrollWidth * (avatarPos.x / 100) - window.innerWidth / 2
    const targetY = mapEl.scrollHeight * (avatarPos.y / 100) - window.innerHeight / 2
    container.scrollTo({ left: targetX, top: targetY, behavior: 'smooth' })
  }, [avatarPos, traveling])

  // Welcome message when avatar finishes loading — skip if chat already has history
  useEffect(() => {
    if (!shrunk || welcomeSentRef.current || messages.length > 0) return
    welcomeSentRef.current = true
    addMessage('Jim', 'Greetings, adventurer! Welcome to the realm.')
  }, [shrunk, addMessage, messages.length])

  // Ambient NPC messages — random interval, only while on the map
  useEffect(() => {
    if (!shrunk) return
    function scheduleNext() {
      const delay = 15000 + Math.random() * 10000 // 15-25s
      return window.setTimeout(() => {
        const [sender, text] = AMBIENT_MESSAGES[ambientIndexRef.current % AMBIENT_MESSAGES.length]!
        ambientIndexRef.current++
        addMessage(sender, text)
        timerRef = scheduleNext()
      }, delay)
    }
    let timerRef = scheduleNext()
    return () => clearTimeout(timerRef)
  }, [shrunk, addMessage])

  // Destination click chat message
  const addDestinationMessage = useCallback((slug: string) => {
    const msg = DESTINATION_MESSAGES[slug] || 'Onward, to adventure!'
    addMessage('Jim', msg)
  }, [addMessage])

  function handleMarkerClick(dest: Destination) {
    if (traveling) return
    addDestinationMessage(dest.slug)
    setTraveling(true)

    // Per-segment fallback: each piece independently uses API data or hardcoded
    const start: Point[] = dynamicWaypoints?.['__start_to_town__'] ?? hardcodedStartToTown
    const spoke: Point[] | undefined = dynamicWaypoints?.[dest.slug] ?? hardcodedSpokes[dest.slug]
    const waypoints: Point[] = spoke
      ? [...start, ...spoke]
      : [...start, [dest.map_x, dest.map_y]]
    const SPEED = window.innerWidth <= 768 ? 80 : 40 // slower on mobile for the journey
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
      <div className="map-container">
        <img src="/images/map.jpg" alt="Fantasy map" className="map-image" />
        <div className="map-overlay" />

        <div className="char-portrait">
          <h2 className="char-portrait__name">Jim Kettinger</h2>
          <img src="/images/char-pane.png" alt="Character portrait" className="char-portrait__img" />
        </div>

        <div className="name-card">
          <h2>Legend</h2>
          {shrunk && destinations.length > 0 && (
            <nav className="map-legend" aria-label="Destinations">
              {destinations.map((dest, i) => {
                const entry = dest.icon ? ICON_MAP[dest.icon] : undefined
                return (
                  <button
                    key={dest.id}
                    type="button"
                    className={`map-legend__item${traveling ? ' map-legend__item--traveling' : ''}`}
                    style={{ animationDelay: `${i * 0.08}s` }}
                    onClick={() => handleMarkerClick(dest)}
                    disabled={traveling}
                  >
                    <span className="map-legend__icon">
                      {entry ? <entry.component size={12} /> : '\u2726'}
                    </span>
                    <span className="map-legend__name">{dest.name}</span>
                  </button>
                )
              })}
            </nav>
          )}
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
            <span className="map-marker__icon">
              {(() => {
                const entry = dest.icon ? ICON_MAP[dest.icon] : undefined
                return entry ? <entry.component size={16} /> : '\u2726'
              })()}
            </span>
            <span className="map-marker__label">{dest.name}</span>
          </button>
        ))}

        {debug && <WaypointEditor />}
      </div>
      {shrunk && <ChatBox />}
    </div>
  )
}
