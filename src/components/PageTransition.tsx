import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './PageTransition.css'

/* ===== Transition Types ===== */

export type TransitionType = 'portal' | 'parchment' | 'fog' | 'fade'

export interface TransitionConfig {
  type: TransitionType
  regionName?: string
  regionSubtitle?: string
  duration?: number
}

/* ===== Default configs per region ===== */

export const REGION_TRANSITIONS: Record<string, TransitionConfig> = {
  citadel: { type: 'portal', regionName: 'The Citadel', regionSubtitle: 'Work & Architecture' },
  'great-hall': { type: 'parchment', regionName: 'The Great Hall', regionSubtitle: 'Family' },
  arena: { type: 'portal', regionName: 'The Arena', regionSubtitle: 'Sports' },
  library: { type: 'parchment', regionName: 'The Ancient Library', regionSubtitle: 'Literature & Writing' },
  tavern: { type: 'fog', regionName: 'The Tavern', regionSubtitle: 'Craft Beer' },
  shore: { type: 'fog', regionName: 'The Shore', regionSubtitle: 'Beach' },
  wilds: { type: 'portal', regionName: 'The Elder Wilds', regionSubtitle: 'Fantasy' },
  map: { type: 'fade', regionName: 'The Overworld' },
}

/* ===== Page Transition Wrapper ===== */

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4, delay: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
}

interface PageTransitionProps {
  children: React.ReactNode
  transitionKey: string
}

export function PageTransition({ children, transitionKey }: PageTransitionProps) {
  return (
    <motion.div
      key={transitionKey}
      className="page-transition"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="page-transition__content">
        {children}
      </div>
    </motion.div>
  )
}

/* ===== Transition Overlay ===== */
/* This is the dramatic overlay that plays during navigation */

interface TransitionOverlayProps {
  config: TransitionConfig | null
  onComplete?: () => void
}

export function TransitionOverlay({ config, onComplete }: TransitionOverlayProps) {
  const [phase, setPhase] = useState<'idle' | 'enter' | 'hold' | 'exit'>('idle')
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    // Clear all pending timers on config change or unmount
    const clearTimers = () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }

    if (!config) {
      setPhase('idle')
      return clearTimers
    }

    clearTimers()
    const dur = config.duration ?? 1200
    setPhase('enter')

    const t1 = setTimeout(() => {
      setPhase('hold')
      const t2 = setTimeout(() => {
        setPhase('exit')
        const t3 = setTimeout(() => {
          setPhase('idle')
          onComplete?.()
        }, dur * 0.4)
        timersRef.current.push(t3)
      }, dur * 0.3)
      timersRef.current.push(t2)
    }, dur * 0.5)
    timersRef.current.push(t1)

    return clearTimers
  }, [config, onComplete])

  if (phase === 'idle' || !config) return null

  return (
    <>
      {config.type === 'portal' && <PortalVortex phase={phase} />}
      {config.type === 'parchment' && <ParchmentWipe phase={phase} regionName={config.regionName} />}
      {config.type === 'fog' && <FogEnvelop phase={phase} />}
      {config.type === 'fade' && <FadeTransition phase={phase} />}
      <Particles phase={phase} type={config.type} />
      {(phase === 'enter' || phase === 'hold') && <LightFlash phase={phase} />}
      <AnimatePresence>
        {(phase === 'hold') && config.regionName && (
          <RegionNameDisplay name={config.regionName} subtitle={config.regionSubtitle} />
        )}
      </AnimatePresence>
    </>
  )
}

/* ===== Portal Vortex ===== */

function PortalVortex({ phase }: { phase: string }) {
  const isVisible = phase === 'enter' || phase === 'hold'

  return (
    <motion.div
      className="portal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="portal-vortex"
        initial={{ scale: 0, rotate: 0, opacity: 0 }}
        animate={{
          scale: isVisible ? 1 : 0,
          rotate: isVisible ? 720 : 0,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{
          scale: { duration: 0.8, ease: [0.65, 0, 0.35, 1] },
          rotate: { duration: 1.5, ease: 'linear' },
          opacity: { duration: 0.3 },
        }}
      >
        <div className="portal-vortex__inner" />
      </motion.div>
    </motion.div>
  )
}

/* ===== Parchment Wipe ===== */

function ParchmentWipe({ phase, regionName }: { phase: string; regionName?: string }) {
  const isEntering = phase === 'enter' || phase === 'hold'

  return (
    <div className="parchment-wipe">
      <motion.div
        className="parchment-wipe__sheet"
        initial={{ x: '-110%' }}
        animate={{ x: isEntering ? '0%' : '110%' }}
        transition={{
          duration: 0.7,
          ease: [0.45, 0, 0.55, 1],
        }}
      >
        {regionName && (
          <motion.span
            className="parchment-wipe__text"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'hold' ? 1 : 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {regionName}
          </motion.span>
        )}
      </motion.div>
    </div>
  )
}

/* ===== Fog Envelop ===== */

function FogEnvelop({ phase }: { phase: string }) {
  const isVisible = phase === 'enter' || phase === 'hold'

  const clouds = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: `${(i % 4) * 30 - 10}%`,
      y: `${Math.floor(i / 4) * 40 - 10}%`,
      w: 200 + (i % 3) * 100,
      h: 150 + (i % 2) * 80,
      delay: i * 0.06,
    })),
  [])

  return (
    <div className="fog-transition">
      <motion.div
        className="fog-layer"
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 0.8 }}
      >
        {clouds.map((cloud) => (
          <motion.div
            key={cloud.id}
            className="fog-layer__cloud"
            style={{
              left: cloud.x,
              top: cloud.y,
              width: cloud.w,
              height: cloud.h,
            }}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{
              scale: isVisible ? 1.5 : 0.3,
              opacity: isVisible ? 1 : 0,
            }}
            transition={{
              duration: 0.9,
              delay: cloud.delay,
              ease: 'easeOut',
            }}
          />
        ))}
      </motion.div>
    </div>
  )
}

/* ===== Fade Transition ===== */

function FadeTransition({ phase }: { phase: string }) {
  const isVisible = phase === 'enter' || phase === 'hold'

  return (
    <motion.div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1010,
        background: 'var(--color-bg-deep)',
        pointerEvents: 'none',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.5 }}
    />
  )
}

/* ===== Particles ===== */

function Particles({ phase, type }: { phase: string; type: TransitionType }) {
  const isVisible = phase === 'enter' || phase === 'hold'

  const particles = useMemo(() => {
    const count = type === 'portal' ? 20 : 12
    const variant = type === 'portal' ? 'spark' : type === 'fog' ? 'dust' : 'ember'
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      variant,
      size: 2 + Math.random() * 4,
      startX: 50 + (Math.random() - 0.5) * 20,
      startY: 50 + (Math.random() - 0.5) * 20,
      endX: Math.random() * 100,
      endY: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 0.6 + Math.random() * 0.8,
    }))
  }, [type])

  return (
    <div className="transition-particles">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className={`particle particle--${p.variant}`}
          style={{ width: p.size, height: p.size }}
          initial={{
            left: `${p.startX}%`,
            top: `${p.startY}%`,
            opacity: 0,
            scale: 0,
          }}
          animate={{
            left: isVisible ? `${p.endX}%` : `${p.startX}%`,
            top: isVisible ? `${p.endY}%` : `${p.startY}%`,
            opacity: isVisible ? [0, 1, 0.8, 0] : 0,
            scale: isVisible ? [0, 1.5, 1, 0] : 0,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}

/* ===== Light Flash ===== */

function LightFlash({ phase }: { phase: string }) {
  return (
    <motion.div
      className="light-flash"
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === 'enter' ? [0, 0.8, 0] : 0 }}
      transition={{ duration: 0.4, times: [0, 0.3, 1] }}
    />
  )
}

/* ===== Region Name Display ===== */

function RegionNameDisplay({ name, subtitle }: { name: string; subtitle?: string }) {
  return (
    <motion.div
      className="transition-region-name"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="transition-region-name__title"
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {name}
      </motion.div>
      {subtitle && (
        <motion.div
          className="transition-region-name__subtitle"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.7, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {subtitle}
        </motion.div>
      )}
    </motion.div>
  )
}

/* ===== Rune Spinner (Loading State) ===== */

export function RuneSpinner({ text = 'Entering realm...' }: { text?: string }) {
  const runes = ['\u16A0', '\u16A2', '\u16B1', '\u16B9', '\u16C1', '\u16C7', '\u16D2', '\u16DA']

  return (
    <motion.div
      className="rune-spinner"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="rune-spinner__circle">
        <div className="rune-spinner__glow" />
        <div className="rune-spinner__ring rune-spinner__ring--outer" />
        <div className="rune-spinner__ring rune-spinner__ring--inner" />
        <div className="rune-spinner__ring rune-spinner__ring--core" />
        <div className="rune-spinner__runes">
          {runes.slice(0, 4).map((rune, i) => (
            <span key={i} className="rune-spinner__rune">
              {rune}
            </span>
          ))}
        </div>
      </div>
      <span className="rune-spinner__text">{text}</span>
    </motion.div>
  )
}

/* ===== Screen Shake Hook ===== */

export function useScreenShake() {
  const ref = useRef<HTMLDivElement>(null)

  const shake = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.classList.remove('screen-shake')
    // Trigger reflow
    void el.offsetWidth
    el.classList.add('screen-shake')
    const handler = () => el.classList.remove('screen-shake')
    el.addEventListener('animationend', handler, { once: true })
  }, [])

  return { shakeRef: ref, shake }
}

/* ===== Navigation Transition Hook ===== */

export function usePageTransition() {
  const [transitionConfig, setTransitionConfig] = useState<TransitionConfig | null>(null)
  const transitioningRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const triggerTransition = useCallback((regionId: string, onMidpoint?: () => void) => {
    if (transitioningRef.current) return
    transitioningRef.current = true

    const config = REGION_TRANSITIONS[regionId] ?? { type: 'fade' as const }
    setTransitionConfig(config)

    const dur = config.duration ?? 1200
    timerRef.current = setTimeout(() => {
      onMidpoint?.()
    }, dur * 0.5)
  }, [])

  const clearTransition = useCallback(() => {
    setTransitionConfig(null)
    transitioningRef.current = false
  }, [])

  return { transitionConfig, triggerTransition, clearTransition }
}
