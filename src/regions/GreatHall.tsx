import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TransitionOverlay, usePageTransition } from '../components/PageTransition'
import { useRegionAudio } from '../hooks/useAudio'
import './GreatHall.css'

/* ===== Data ===== */

interface Child {
  name: string
  sigil: string
  color: string
  shieldColor: string
}

const CHILDREN: Child[] = [
  { name: 'Layla', sigil: '\u2726', color: '#3a2028', shieldColor: '#3a2028' },
  { name: 'Cecelia', sigil: '\u2736', color: '#1e2a3a', shieldColor: '#1e2a3a' },
  { name: 'James', sigil: '\u2742', color: '#2a3a1e', shieldColor: '#2a3a1e' },
  { name: 'Nora', sigil: '\u2756', color: '#3a2a1e', shieldColor: '#3a2a1e' },
  { name: 'Owen', sigil: '\u2740', color: '#2a1e3a', shieldColor: '#2a1e3a' },
]

const FEAST_ITEMS = [
  { icon: '\uD83C\uDF56', name: 'Roast Meat' },
  { icon: '\uD83C\uDF5E', name: 'Fresh Bread' },
  { icon: '\uD83E\uDDC0', name: 'Aged Cheese' },
  { icon: '\uD83C\uDF47', name: 'Grapes' },
  { icon: '\uD83C\uDF77', name: 'Red Wine' },
  { icon: '\uD83C\uDF6F', name: 'Honey Mead' },
  { icon: '\uD83E\uDD55', name: 'Root Stew' },
  { icon: '\uD83C\uDF70', name: 'Sweet Cake' },
]

/* ===== Component ===== */

export default function GreatHall() {
  useRegionAudio('great-hall')
  const navigate = useNavigate()
  const { transitionConfig, triggerTransition, clearTransition } = usePageTransition()

  const handleBack = useCallback(() => {
    triggerTransition('map', () => navigate('/'))
  }, [triggerTransition, navigate])

  return (
    <div className="great-hall">
      <div className="great-hall__bg" />

      {/* Torches */}
      <Torch style={{ top: '20%', left: '5%' }} delay={0} />
      <Torch style={{ top: '20%', right: '5%' }} delay={0.5} />
      <Torch style={{ top: '50%', left: '5%' }} delay={1} />
      <Torch style={{ top: '50%', right: '5%' }} delay={1.5} />

      {/* Hanging banners */}
      <div className="great-hall__banners">
        {CHILDREN.map((child, i) => (
          <motion.div
            key={i}
            className="banner"
            initial={{ y: -160 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.3 + i * 0.15, duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <div className="banner__rod" />
            <div
              className="banner__fabric"
              style={{ backgroundColor: child.color, '--banner-color': child.color } as React.CSSProperties}
            >
              <span className="banner__sigil">{child.sigil}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <div className="great-hall__content">
        <motion.div
          className="great-hall__header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <h1>The Great Hall</h1>
          <p>Where the family gathers and stories are shared</p>
        </motion.div>

        {/* Shields */}
        <motion.div
          className="shields"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {CHILDREN.map((child, i) => (
            <motion.div
              key={i}
              className="shield"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + i * 0.1, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <svg viewBox="0 0 70 80" width="100%" height="100%">
                <path
                  className="shield__shape"
                  d="M35,5 L60,15 L60,45 Q60,65 35,75 Q10,65 10,45 L10,15 Z"
                  style={{ '--shield-color': child.shieldColor } as React.CSSProperties}
                  fill={child.shieldColor}
                />
                <text className="shield__icon" x="35" y="40" fill="var(--color-parchment)">{child.sigil}</text>
              </svg>
              <span className="shield__name">{child.name}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Feast table */}
        <motion.div
          className="feast-table"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <h4 className="feast-table__title">The Feast</h4>
          <div className="feast-table__items">
            {FEAST_ITEMS.map((item, i) => (
              <motion.div
                key={i}
                className="feast-item"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + i * 0.06, duration: 0.3 }}
              >
                <span className="feast-item__icon">{item.icon}</span>
                <span className="feast-item__name">{item.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Family Tree */}
        <motion.div
          className="family-tree"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
        >
          <h4 className="family-tree__title">The Family Tree</h4>
          <svg className="family-tree__svg" viewBox="0 0 400 280">
            {/* Trunk */}
            <rect className="tree-trunk" x="185" y="140" width="30" height="120" rx="4" />
            {/* Root crown */}
            <ellipse className="tree-leaf-cluster" cx="200" cy="80" rx="90" ry="70" />
            <ellipse className="tree-leaf-cluster" cx="160" cy="90" rx="50" ry="45" opacity="0.4" />
            <ellipse className="tree-leaf-cluster" cx="240" cy="90" rx="50" ry="45" opacity="0.4" />

            {/* Branches to children */}
            {CHILDREN.map((child, i) => {
              const cx = 60 + i * 70
              const cy = 50 + Math.abs(i - 2) * 12
              return (
                <g key={i}>
                  <path
                    className="tree-branch"
                    d={`M200,100 Q${cx + (200 - cx) * 0.3},${80} ${cx},${cy + 15}`}
                  />
                  <circle className="tree-node" cx={cx} cy={cy} r="8" />
                  <text className="tree-label" x={cx} y={cy + 22}>{child.name}</text>
                  <text x={cx} y={cy + 3} textAnchor="middle" fontSize="8" fill="var(--color-parchment)">
                    {child.sigil}
                  </text>
                </g>
              )
            })}

            {/* Parent node */}
            <circle cx="200" cy="120" r="10" fill="var(--color-gold-dim)" stroke="var(--color-gold)" strokeWidth="1.5" />
            <text x="200" y="123" textAnchor="middle" fontSize="8" fill="var(--color-parchment)">{'\u2665'}</text>
          </svg>
        </motion.div>
      </div>

      {/* Back button */}
      <button className="great-hall__back" onClick={handleBack}>
        Return to Map
      </button>

      {/* Vignette */}
      <div className="great-hall__vignette" />

      {/* Transition */}
      <TransitionOverlay config={transitionConfig} onComplete={clearTransition} />
    </div>
  )
}

/* ===== Sub-components ===== */

function Torch({ style, delay }: { style: React.CSSProperties; delay: number }) {
  return (
    <motion.div
      className="torch"
      style={style}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: delay + 0.3, duration: 0.5 }}
    >
      <div className="torch__glow" style={{ animationDelay: `${delay}s` }} />
      <svg width="20" height="50" viewBox="0 0 20 50">
        {/* Bracket */}
        <rect className="torch__bracket" x="7" y="20" width="6" height="30" rx="2" />
        <rect className="torch__bracket" x="4" y="18" width="12" height="4" rx="1" />
        {/* Flame */}
        <g className="torch__flame" style={{ animationDelay: `${delay * 0.3}s` }}>
          <ellipse cx="10" cy="12" rx="5" ry="10" fill="#d4721a" opacity="0.8" />
          <ellipse cx="10" cy="10" rx="3" ry="7" fill="#e6c555" opacity="0.9" />
          <ellipse cx="10" cy="8" rx="2" ry="4" fill="#fff5d0" opacity="0.7" />
        </g>
      </svg>
    </motion.div>
  )
}
