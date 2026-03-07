import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TransitionOverlay, usePageTransition } from '../components/PageTransition'
import { useRegionAudio } from '../hooks/useAudio'
import './Shore.css'

export default function Shore() {
  useRegionAudio('shore')
  const navigate = useNavigate()
  const { transitionConfig, triggerTransition, clearTransition } = usePageTransition()

  const handleBack = useCallback(() => {
    triggerTransition('map', () => navigate('/'))
  }, [triggerTransition, navigate])

  return (
    <div className="shore">
      {/* Sky gradient */}
      <div className="shore__sky" />

      {/* Stars */}
      <div className="shore__stars">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="star" />
        ))}
      </div>

      {/* Sun */}
      <div className="shore__sun" />

      {/* Seagulls */}
      <Seagull className="seagull--1" size={18} />
      <Seagull className="seagull--2" size={14} />

      {/* Water */}
      <div className="shore__water">
        <div className="water__surface" />
        <div className="water__reflection" />
        <div className="shore__waves">
          <svg className="wave-svg" viewBox="0 0 1200 30" preserveAspectRatio="none">
            <path className="wave-path wave-path--1" d="M0,15 Q150,5 300,15 Q450,25 600,15 Q750,5 900,15 Q1050,25 1200,15" />
            <path className="wave-path wave-path--2" d="M0,18 Q150,8 300,18 Q450,28 600,18 Q750,8 900,18 Q1050,28 1200,18" />
            <path className="wave-path wave-path--3" d="M0,22 Q150,12 300,22 Q450,30 600,22 Q750,12 900,22 Q1050,30 1200,22" />
          </svg>
        </div>
      </div>

      {/* Elvish Ship */}
      <svg className="shore__ship" width="60" height="40" viewBox="0 0 60 40">
        <path d="M5,30 Q10,35 30,35 Q50,35 55,30 L50,25 Q30,28 10,25 Z" fill="#2a2318" opacity="0.7" />
        <line x1="30" y1="35" x2="30" y2="5" stroke="#3a3020" strokeWidth="1.5" />
        <path d="M30,5 Q45,15 30,30" fill="rgba(212,196,160,0.15)" stroke="rgba(212,196,160,0.2)" strokeWidth="0.5" />
        <path d="M28,8 L28,3 Q30,1 32,3 L32,8" fill="rgba(230,197,85,0.3)" />
      </svg>

      {/* Sand */}
      <div className="shore__sand">
        {Array.from({ length: 15 }, (_, i) => (
          <div
            key={i}
            className="sand-particle"
            style={{
              left: `${5 + i * 6.5}%`,
              top: `${20 + Math.sin(i * 2.3) * 30}%`,
            }}
          />
        ))}
      </div>

      {/* Driftwood & Sea Glass */}
      <svg className="shore__objects" viewBox="0 0 1200 60" preserveAspectRatio="xMidYMid slice">
        <path className="driftwood" d="M200,40 Q210,35 240,38 Q250,42 260,39 Q270,36 280,40 L278,44 Q250,46 220,44 Z" />
        <path className="driftwood" d="M700,35 Q720,30 750,33 L748,38 Q720,40 700,38 Z" />
        <ellipse className="sea-glass" cx="350" cy="42" rx="5" ry="4" fill="rgba(110,212,196,0.5)" />
        <ellipse className="sea-glass" cx="820" cy="38" rx="4" ry="3" fill="rgba(160,200,160,0.4)" style={{ animationDelay: '-2s' }} />
        <ellipse className="sea-glass" cx="500" cy="45" rx="3" ry="3" fill="rgba(200,200,220,0.3)" style={{ animationDelay: '-4s' }} />
      </svg>

      {/* Content */}
      <div className="shore__content">
        <motion.div
          className="shore__header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <h1>The Shore</h1>
          <p>Where the land ends and the dreaming begins</p>
        </motion.div>

        <motion.div
          className="shore__verse"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.8 }}
        >
          To the Sea, to the Sea! The white gulls are crying,<br />
          The wind is blowing, and the white foam is flying.<br />
          West, west away, the round sun is falling.<br />
          Grey ship, grey ship, do you hear them calling?
          <cite>— J.R.R. Tolkien, The Return of the King</cite>
        </motion.div>

        <motion.div
          className="shore__meditation"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2 }}
        >
          <p>
            There is a stillness at the edge of things. The shore is neither land nor sea — it is the space between,
            where the world exhales and invites you to do the same. Here, the only agenda is the tide.
            The only deadline is sunset. And even that returns tomorrow.
          </p>
        </motion.div>
      </div>

      {/* Vignette */}
      <div className="shore__vignette" />

      {/* Back button */}
      <button className="shore__back" onClick={handleBack}>
        Return to Map
      </button>

      {/* Transition */}
      <TransitionOverlay config={transitionConfig} onComplete={clearTransition} />
    </div>
  )
}

function Seagull({ className, size }: { className: string; size: number }) {
  return (
    <svg className={`seagull ${className}`} width={size} height={size * 0.5} viewBox="0 0 20 10">
      <path className="seagull__wing" d="M0,6 Q5,1 10,5 Q15,1 20,6">
        <animate
          attributeName="d"
          dur="0.6s"
          repeatCount="indefinite"
          values="M0,6 Q5,1 10,5 Q15,1 20,6;M0,6 Q5,8 10,5 Q15,8 20,6;M0,6 Q5,1 10,5 Q15,1 20,6"
        />
      </path>
    </svg>
  )
}
