import { useState, useEffect, useRef, useCallback, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useRegionAudio } from '../hooks/useAudio'
import { Fireflies } from './elder-wilds/Fireflies'
import { SkillConstellation } from './elder-wilds/SkillConstellation'
import { Bestiary } from './elder-wilds/Bestiary'
import { RuneCircle } from './elder-wilds/RuneCircle'
import { ElvishBorder } from './elder-wilds/ElvishBorder'
import './elder-wilds/ElderWilds.css'

type Tab = 'explore' | 'constellation' | 'bestiary' | 'runes'

export default function ElderWilds() {
  useRegionAudio('wilds')
  const navigate = useNavigate()
  const uid = useId().replace(/:/g, '')
  const [activeTab, setActiveTab] = useState<Tab>('explore')
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const containerRef = useRef<HTMLDivElement>(null)

  const gradFar = `treeFar-${uid}`
  const gradMid = `treeMid-${uid}`
  const gradNear = `treeNear-${uid}`

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMousePos({ x, y })
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('mousemove', handleMouseMove)
    return () => el.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])

  const parallaxStyle = (depth: number) => ({
    transform: `translate(${(mousePos.x - 50) * depth * 0.1}px, ${(mousePos.y - 50) * depth * 0.05}px)`,
  })

  return (
    <div className="elder-wilds cursor-sword" ref={containerRef}>
      {/* Sky layer */}
      <div className="ew__sky" style={parallaxStyle(0.5)}>
        <div className="ew__stars" />
        <div className="ew__aurora" />
      </div>

      {/* Moon */}
      <div className="ew__moon" style={parallaxStyle(1)}>
        <div className="ew__moon-glow" />
        <div className="ew__moon-body" />
      </div>

      {/* Far trees silhouette */}
      <div className="ew__trees-far" style={parallaxStyle(1.5)}>
        <svg viewBox="0 0 1600 400" preserveAspectRatio="xMidYMid slice" className="ew__tree-svg">
          <defs>
            <linearGradient id={gradFar} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a2a1a" />
              <stop offset="100%" stopColor="#0d1a0d" />
            </linearGradient>
          </defs>
          {generateTreeLine(0, 1600, 40, gradFar, 0.6)}
        </svg>
      </div>

      {/* Mid trees */}
      <div className="ew__trees-mid" style={parallaxStyle(2.5)}>
        <svg viewBox="0 0 1600 500" preserveAspectRatio="xMidYMid slice" className="ew__tree-svg">
          <defs>
            <linearGradient id={gradMid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#142214" />
              <stop offset="100%" stopColor="#0a140a" />
            </linearGradient>
          </defs>
          {generateTreeLine(0, 1600, 30, gradMid, 0.8)}
        </svg>
      </div>

      {/* Fog layer */}
      <div className="ew__fog" />
      <div className="ew__fog ew__fog--2" />

      {/* Near trees */}
      <div className="ew__trees-near" style={parallaxStyle(3.5)}>
        <svg viewBox="0 0 1600 600" preserveAspectRatio="xMidYMid slice" className="ew__tree-svg">
          <defs>
            <linearGradient id={gradNear} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d1a0d" />
              <stop offset="100%" stopColor="#060d06" />
            </linearGradient>
          </defs>
          {generateTreeLine(0, 1600, 20, gradNear, 1)}
        </svg>
      </div>

      {/* Fireflies */}
      <Fireflies count={40} />

      {/* Floating runes in the environment */}
      <div className="ew__floating-runes">
        {['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ'].map((rune, i) => (
          <span
            key={i}
            className="ew__floating-rune"
            style={{
              left: `${10 + (i * 11)}%`,
              animationDelay: `${i * 1.3}s`,
              animationDuration: `${8 + (i % 3) * 2}s`,
            }}
          >
            {rune}
          </span>
        ))}
      </div>

      {/* Ground fog */}
      <div className="ew__ground-fog" />

      {/* Elvish border decorations */}
      <ElvishBorder />

      {/* Main content area */}
      <div className="ew__content">
        {/* Navigation */}
        <nav className="ew__nav">
          <button className="ew__back-btn" onClick={() => navigate('/')}>
            <span className="ew__back-arrow">&larr;</span>
            <span>Return to Map</span>
          </button>

          <div className="ew__tabs">
            {([
              { id: 'explore', label: 'The Wilds', icon: 'ᛟ' },
              { id: 'constellation', label: 'Star Chart', icon: '✦' },
              { id: 'bestiary', label: 'Bestiary', icon: 'ᛒ' },
              { id: 'runes', label: 'Rune Circle', icon: 'ᚠ' },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                className={`ew__tab ${activeTab === tab.id ? 'ew__tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="ew__tab-icon">{tab.icon}</span>
                <span className="ew__tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === 'explore' && (
            <motion.div
              key="explore"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="ew__panel"
            >
              <div className="ew__explore">
                <h1 className="ew__title">The Elder Wilds</h1>
                <p className="ew__subtitle text-accent">Where ancient magic stirs beneath every root and stone</p>
                <div className="ew__lore">
                  <p>
                    Deep in the heart of the realm lies the Elder Wilds — a place where the boundary
                    between the mundane and the magical grows thin. Ancient trees whisper forgotten
                    secrets, glowing runes pulse with untold power, and the constellations above
                    chart the course of a life lived with intention.
                  </p>
                  <p>
                    Explore the star chart to discover the constellation of skills and passions.
                    Consult the bestiary to learn of the creatures that dwell within these woods.
                    Or dare the rune circle, where ancient sequences unlock hidden truths.
                  </p>
                </div>

                {/* One Ring inscription */}
                <div className="ew__ring-inscription">
                  <div className="ew__ring-text">
                    One site to rule them all, one site to find them,
                    one site to bring them all, and in the darkness bind them.
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'constellation' && (
            <motion.div
              key="constellation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="ew__panel ew__panel--full"
            >
              <SkillConstellation />
            </motion.div>
          )}

          {activeTab === 'bestiary' && (
            <motion.div
              key="bestiary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="ew__panel"
            >
              <Bestiary />
            </motion.div>
          )}

          {activeTab === 'runes' && (
            <motion.div
              key="runes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="ew__panel"
            >
              <RuneCircle />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Vignette */}
      <div className="ew__vignette" />
    </div>
  )
}

/* Generate a line of tree silhouettes */
function generateTreeLine(startX: number, endX: number, count: number, fillId: string, scale: number) {
  const trees = []
  const spacing = (endX - startX) / count
  for (let i = 0; i < count; i++) {
    const x = startX + i * spacing + (Math.sin(i * 7.3) * spacing * 0.3)
    const h = (60 + Math.sin(i * 3.7) * 40 + Math.cos(i * 5.1) * 20) * scale
    const w = 12 + Math.sin(i * 2.1) * 6
    const baseY = 400 * scale
    trees.push(
      <polygon
        key={`tree-${fillId}-${i}`}
        points={`${x},${baseY - h} ${x - w},${baseY} ${x + w},${baseY}`}
        fill={`url(#${fillId})`}
        opacity={0.7 + Math.sin(i * 1.3) * 0.3}
      />
    )
    // Some trees get a second smaller triangle on top
    if (i % 3 === 0) {
      trees.push(
        <polygon
          key={`tree-top-${fillId}-${i}`}
          points={`${x},${baseY - h - 15 * scale} ${x - w * 0.6},${baseY - h + 10 * scale} ${x + w * 0.6},${baseY - h + 10 * scale}`}
          fill={`url(#${fillId})`}
          opacity={0.5 + Math.sin(i * 2.7) * 0.3}
        />
      )
    }
  }
  return <>{trees}</>
}
