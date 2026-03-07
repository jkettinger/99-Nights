import { useMemo } from 'react'
import { motion } from 'framer-motion'
import './Particles.css'

export type ParticleVariant = 'dust' | 'ember' | 'firefly' | 'snow' | 'spark' | 'ash'

interface ParticleConfig {
  variant: ParticleVariant
  count?: number
  minSize?: number
  maxSize?: number
  speed?: number  // multiplier, 1 = default
  drift?: number  // horizontal drift in px
  direction?: 'up' | 'down'
}

export function Particles({
  variant = 'dust',
  count = 12,
  minSize = 2,
  maxSize = 4,
  speed = 1,
  drift = 20,
  direction = 'up',
}: ParticleConfig) {
  const motes = useMemo(() =>
    Array.from({ length: count }, (_, i) => {
      const size = minSize + Math.random() * (maxSize - minSize)
      const baseDuration = (10 + Math.random() * 15) / speed
      const startX = Math.random() * 100
      const driftX = (Math.random() - 0.5) * drift * 2
      const delay = Math.random() * baseDuration

      return { id: i, size, baseDuration, startX, driftX, delay }
    }),
  [count, minSize, maxSize, speed, drift])

  const isUp = direction === 'up'

  return (
    <div className="particles">
      {motes.map((mote) => (
        <motion.div
          key={mote.id}
          className={`particles__mote particles__mote--${variant}`}
          style={{
            width: mote.size,
            height: mote.size,
            left: `${mote.startX}%`,
          }}
          initial={{
            y: isUp ? '100vh' : '-10vh',
            x: 0,
            opacity: 0,
          }}
          animate={{
            y: isUp ? '-10vh' : '100vh',
            x: [0, mote.driftX, -mote.driftX * 0.5, mote.driftX * 0.3, 0],
            opacity: [0, 0.6, 0.8, 0.5, 0],
          }}
          transition={{
            duration: mote.baseDuration,
            delay: mote.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  )
}
