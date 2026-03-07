import { useState, useRef, useCallback, useEffect, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { TransitionOverlay, usePageTransition } from '../components/PageTransition'
import { useRegionAudio } from '../hooks/useAudio'
import { StainedGlass } from './citadel/StainedGlass'
import { BlueprintTable } from './citadel/BlueprintTable'
import { SkillPillars } from './citadel/SkillPillars'
import './citadel/Citadel.css'

type Tab = 'hall' | 'blueprints' | 'skills'

export default function Citadel() {
  useRegionAudio('citadel')
  const navigate = useNavigate()
  const { transitionConfig, triggerTransition, clearTransition } = usePageTransition()
  const uid = useId().replace(/:/g, '')
  const [activeTab, setActiveTab] = useState<Tab>('hall')
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
    <div
      className="citadel"
      ref={containerRef}
      style={{
        '--mouse-x': `${mousePos.x}%`,
        '--mouse-y': `${mousePos.y}%`,
      } as React.CSSProperties}
    >
      {/* Vaulted ceiling */}
      <div className="citadel__ceiling">
        <svg viewBox="0 0 1200 300" preserveAspectRatio="xMidYMid slice" className="citadel__ceiling-svg">
          <defs>
            <linearGradient id={`stoneGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2a2520" />
              <stop offset="100%" stopColor="#1a1510" />
            </linearGradient>
            <linearGradient id={`archGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#352d22" />
              <stop offset="100%" stopColor="#1a1510" />
            </linearGradient>
          </defs>
          {/* Gothic arches */}
          {[0, 200, 400, 600, 800, 1000].map((x, i) => (
            <g key={i}>
              <path
                d={`M${x},300 L${x},100 Q${x + 100},0 ${x + 200},100 L${x + 200},300`}
                fill="none"
                stroke="#352d22"
                strokeWidth="3"
                opacity="0.6"
              />
              {/* Keystone */}
              <polygon
                points={`${x + 95},30 ${x + 100},15 ${x + 105},30`}
                fill="#352d22"
                opacity="0.4"
              />
              {/* Ribs */}
              <path
                d={`M${x + 100},15 Q${x + 50},80 ${x},300`}
                fill="none"
                stroke="#2a2520"
                strokeWidth="1.5"
                opacity="0.3"
              />
              <path
                d={`M${x + 100},15 Q${x + 150},80 ${x + 200},300`}
                fill="none"
                stroke="#2a2520"
                strokeWidth="1.5"
                opacity="0.3"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Stained glass windows */}
      <StainedGlass mouseX={mousePos.x} mouseY={mousePos.y} />

      {/* Stone wall texture overlay */}
      <div className="citadel__stone-wall" />

      {/* Flying buttress shadows */}
      <div className="citadel__buttresses">
        {[15, 85].map((x, i) => (
          <div
            key={i}
            className="citadel__buttress"
            style={{ left: `${x}%` }}
          />
        ))}
      </div>

      {/* Ambient dust particles */}
      <div className="citadel__dust">
        {Array.from({ length: 20 }, (_, i) => (
          <span
            key={i}
            className="citadel__dust-mote"
            style={{
              left: `${10 + Math.random() * 80}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${8 + Math.random() * 6}s`,
              '--start-y': `${20 + Math.random() * 60}%`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Torches */}
      <div className="citadel__torches">
        {[8, 92].map((x, i) => (
          <div key={i} className="citadel__torch" style={{ left: `${x}%` }}>
            <div className="citadel__torch-bracket" />
            <div className="citadel__flame">
              <div className="citadel__flame-core" />
            </div>
            <div className="citadel__torch-glow" />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="citadel__content">
        <nav className="citadel__nav">
          <button className="citadel__back-btn" onClick={handleBack}>
            <span>&larr;</span>
            <span>Return to Map</span>
          </button>

          <div className="citadel__tabs">
            {([
              { id: 'hall', label: 'Grand Hall', icon: '⛫' },
              { id: 'blueprints', label: 'Blueprints', icon: '📐' },
              { id: 'skills', label: 'Skill Pillars', icon: '⚒' },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                className={`citadel__tab ${activeTab === tab.id ? 'citadel__tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="citadel__tab-icon">{tab.icon}</span>
                <span className="citadel__tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <AnimatePresence mode="wait">
          {activeTab === 'hall' && (
            <motion.div
              key="hall"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="citadel__panel"
            >
              <div className="citadel__hall">
                <h1 className="citadel__title">The Citadel</h1>
                <p className="citadel__subtitle text-accent">Where stone meets silicon</p>

                <div className="citadel__lore">
                  <p>
                    Within these ancient walls, the disciplines of architecture converge — the
                    physical and the digital, the structural and the ephemeral. Stone archways
                    give way to holographic blueprints, and the glow of circuit-etched stained
                    glass illuminates work that bridges centuries of craft.
                  </p>
                  <p>
                    Hospital architecture demands precision, empathy, and vision. Every corridor
                    planned, every room designed to serve both function and the human spirit.
                    The same principles that built cathedrals now shape healing spaces.
                  </p>
                </div>

                {/* Circuit pattern divider */}
                <div className="citadel__circuit-divider">
                  <svg viewBox="0 0 400 20" className="citadel__circuit-svg">
                    <line x1="0" y1="10" x2="120" y2="10" stroke="var(--color-gold-dim)" strokeWidth="0.5" opacity="0.4" />
                    <circle cx="120" cy="10" r="2" fill="none" stroke="var(--color-gold)" strokeWidth="0.5" opacity="0.5" />
                    <line x1="124" y1="10" x2="160" y2="10" stroke="var(--color-gold-dim)" strokeWidth="0.5" opacity="0.4" />
                    <line x1="160" y1="10" x2="170" y2="3" stroke="var(--color-gold-dim)" strokeWidth="0.5" opacity="0.4" />
                    <line x1="170" y1="3" x2="230" y2="3" stroke="var(--color-gold-dim)" strokeWidth="0.5" opacity="0.4" />
                    <line x1="230" y1="3" x2="240" y2="10" stroke="var(--color-gold-dim)" strokeWidth="0.5" opacity="0.4" />
                    <line x1="240" y1="10" x2="276" y2="10" stroke="var(--color-gold-dim)" strokeWidth="0.5" opacity="0.4" />
                    <circle cx="280" cy="10" r="2" fill="none" stroke="var(--color-gold)" strokeWidth="0.5" opacity="0.5" />
                    <line x1="284" y1="10" x2="400" y2="10" stroke="var(--color-gold-dim)" strokeWidth="0.5" opacity="0.4" />
                    {/* Nodes */}
                    <circle cx="200" cy="3" r="3" fill="var(--color-gold)" opacity="0.3">
                      <animate attributeName="opacity" values="0.2;0.5;0.2" dur="3s" repeatCount="indefinite" />
                    </circle>
                  </svg>
                </div>

                {/* Tech stack badges */}
                <div className="citadel__tech-grid">
                  {[
                    { name: 'React', category: 'Frontend' },
                    { name: 'TypeScript', category: 'Language' },
                    { name: 'Node.js', category: 'Backend' },
                    { name: 'AWS', category: 'Cloud' },
                    { name: 'PostgreSQL', category: 'Database' },
                    { name: 'Docker', category: 'DevOps' },
                    { name: 'Revit', category: 'Architecture' },
                    { name: 'AutoCAD', category: 'Architecture' },
                    { name: 'BIM', category: 'Architecture' },
                  ].map((tech, i) => (
                    <motion.div
                      key={tech.name}
                      className="citadel__tech-badge"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1, duration: 0.3 }}
                    >
                      <span className="citadel__tech-name">{tech.name}</span>
                      <span className="citadel__tech-category">{tech.category}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'blueprints' && (
            <motion.div
              key="blueprints"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="citadel__panel citadel__panel--wide"
            >
              <BlueprintTable />
            </motion.div>
          )}

          {activeTab === 'skills' && (
            <motion.div
              key="skills"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="citadel__panel citadel__panel--wide"
            >
              <SkillPillars />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floor */}
      <div className="citadel__floor" />

      {/* Vignette */}
      <div className="citadel__vignette" />

      {/* Transition overlay */}
      <TransitionOverlay config={transitionConfig} onComplete={clearTransition} />
    </div>
  )
}
