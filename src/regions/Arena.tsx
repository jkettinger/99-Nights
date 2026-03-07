import { useState, useRef, useCallback, useEffect, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { TransitionOverlay, usePageTransition } from '../components/PageTransition'
import { useRegionAudio } from '../hooks/useAudio'
import { Banners } from './arena/Banners'
import { ChampionBoard } from './arena/ChampionBoard'
import { TournamentBracket } from './arena/TournamentBracket'
import './arena/Arena.css'

type Tab = 'grounds' | 'champions' | 'tournament'

export default function Arena() {
  useRegionAudio('arena')
  const navigate = useNavigate()
  const { transitionConfig, triggerTransition, clearTransition } = usePageTransition()
  const uid = useId().replace(/:/g, '')
  const [activeTab, setActiveTab] = useState<Tab>('grounds')
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)

  const handleBack = useCallback(() => {
    triggerTransition('map', () => navigate('/'))
  }, [triggerTransition, navigate])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      setMousePos({ x, y })
    })
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('mousemove', handleMouseMove)
    return () => {
      el.removeEventListener('mousemove', handleMouseMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [handleMouseMove])

  return (
    <div className="arena cursor-sword" ref={containerRef}>
      {/* Sky */}
      <div className="arena__sky">
        <div className="arena__clouds">
          <div className="arena__cloud arena__cloud--1" />
          <div className="arena__cloud arena__cloud--2" />
          <div className="arena__cloud arena__cloud--3" />
        </div>
      </div>

      {/* Colosseum structure */}
      <div className="arena__colosseum">
        <svg viewBox="0 0 1200 500" preserveAspectRatio="xMidYMid slice" className="arena__structure-svg">
          <defs>
            <linearGradient id={`arenaStone-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3a3228" />
              <stop offset="100%" stopColor="#2a2318" />
            </linearGradient>
          </defs>

          {/* Back wall with arches */}
          <rect x="100" y="80" width="1000" height="350" fill={`url(#arenaStone-${uid})`} opacity="0.4" />

          {/* Upper tier arches */}
          {Array.from({ length: 12 }, (_, i) => {
            const x = 140 + i * 78
            return (
              <g key={`upper-${i}`} opacity="0.5">
                <path
                  d={`M${x},100 L${x},180 Q${x + 39},80 ${x + 78},180 L${x + 78},100`}
                  fill="none"
                  stroke="#4a4035"
                  strokeWidth="2"
                />
                <rect x={x + 10} y={120} width={58} height={60} fill="rgba(0,0,0,0.3)" />
              </g>
            )
          })}

          {/* Lower tier arches */}
          {Array.from({ length: 12 }, (_, i) => {
            const x = 140 + i * 78
            return (
              <g key={`lower-${i}`} opacity="0.6">
                <path
                  d={`M${x},200 L${x},320 Q${x + 39},190 ${x + 78},320 L${x + 78},200`}
                  fill="none"
                  stroke="#4a4035"
                  strokeWidth="2.5"
                />
                <rect x={x + 10} y={230} width={58} height={90} fill="rgba(0,0,0,0.4)" />
              </g>
            )
          })}

          {/* Cornice lines */}
          <line x1="100" y1="80" x2="1100" y2="80" stroke="#4a4035" strokeWidth="3" />
          <line x1="100" y1="195" x2="1100" y2="195" stroke="#4a4035" strokeWidth="2" />
          <line x1="100" y1="340" x2="1100" y2="340" stroke="#4a4035" strokeWidth="2" />

          {/* Arena floor (ellipse) */}
          <ellipse cx="600" cy="430" rx="400" ry="60" fill="rgba(139, 119, 90, 0.15)" stroke="#4a4035" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Banners */}
      <Banners mouseX={mousePos.x} />

      {/* Torches along the walls */}
      <div className="arena__torches">
        {[10, 25, 75, 90].map((x, i) => (
          <div key={i} className="arena__torch" style={{ left: `${x}%` }}>
            <div className="arena__flame-wrap">
              <div className="arena__flame" />
            </div>
            <div className="arena__torch-glow" />
          </div>
        ))}
      </div>

      {/* Crowd noise visualization — subtle dots */}
      <div className="arena__crowd">
        {Array.from({ length: 30 }, (_, i) => (
          <span
            key={i}
            className="arena__crowd-dot"
            style={{
              left: `${15 + Math.random() * 70}%`,
              top: `${15 + Math.random() * 25}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="arena__content">
        <nav className="arena__nav">
          <button className="arena__back-btn" onClick={handleBack}>
            <span>&larr;</span>
            <span>Return to Map</span>
          </button>

          <div className="arena__tabs">
            {([
              { id: 'grounds', label: 'The Grounds', icon: '⚔' },
              { id: 'champions', label: 'Champions', icon: '🏆' },
              { id: 'tournament', label: 'Tournament', icon: '🗡' },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                className={`arena__tab ${activeTab === tab.id ? 'arena__tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="arena__tab-icon">{tab.icon}</span>
                <span className="arena__tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <AnimatePresence mode="wait">
          {activeTab === 'grounds' && (
            <motion.div
              key="grounds"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="arena__panel"
            >
              <div className="arena__grounds">
                <h1 className="arena__title">The Arena</h1>
                <p className="arena__subtitle text-accent">Where champions are forged in fire and sweat</p>

                <div className="arena__lore">
                  <p>
                    The roar of the crowd fills the ancient stone amphitheater as competitors take
                    the field. Here, in the hallowed Arena, sports are not merely games — they are
                    battles of will, strategy, and heart. Every match tells a story.
                  </p>
                  <p>
                    From the gridiron to the pitch, from the court to the diamond, the Arena
                    celebrates the sports that inspire, frustrate, and ultimately unite us.
                    Check the champion boards and tournament brackets to see the legends honored here.
                  </p>
                </div>

                {/* Jousting animation */}
                <div className="arena__jousting">
                  <div className="arena__jouster arena__jouster--left">
                    <svg viewBox="0 0 60 40" className="arena__jouster-svg">
                      <rect x="20" y="18" width="25" height="12" fill="#8a3030" rx="2" />
                      <circle cx="32" cy="14" r="6" fill="#6b6358" />
                      <line x1="45" y1="22" x2="60" y2="18" stroke="#8a8178" strokeWidth="1.5" />
                      <rect x="5" y="28" width="15" height="10" fill="#6b6358" rx="1" />
                      <rect x="30" y="28" width="15" height="10" fill="#6b6358" rx="1" />
                    </svg>
                  </div>
                  <div className="arena__joust-vs">VS</div>
                  <div className="arena__jouster arena__jouster--right">
                    <svg viewBox="0 0 60 40" className="arena__jouster-svg" style={{ transform: 'scaleX(-1)' }}>
                      <rect x="20" y="18" width="25" height="12" fill="#2a4a8a" rx="2" />
                      <circle cx="32" cy="14" r="6" fill="#6b6358" />
                      <line x1="45" y1="22" x2="60" y2="18" stroke="#8a8178" strokeWidth="1.5" />
                      <rect x="5" y="28" width="15" height="10" fill="#6b6358" rx="1" />
                      <rect x="30" y="28" width="15" height="10" fill="#6b6358" rx="1" />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'champions' && (
            <motion.div
              key="champions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="arena__panel arena__panel--wide"
            >
              <ChampionBoard />
            </motion.div>
          )}

          {activeTab === 'tournament' && (
            <motion.div
              key="tournament"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="arena__panel arena__panel--wide"
            >
              <TournamentBracket />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sand/dust at floor */}
      <div className="arena__sand" />

      {/* Vignette */}
      <div className="arena__vignette" />

      {/* Transition overlay */}
      <TransitionOverlay config={transitionConfig} onComplete={clearTransition} />
    </div>
  )
}
