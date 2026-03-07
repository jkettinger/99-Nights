import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import './OpeningCinematic.css'

const STORAGE_KEY = 'jiggling-cinematic-seen'

const LINES = [
  { text: 'In an age of code and craft...', delay: 0 },
  { text: 'where pixels hold the weight of worlds...', delay: 2.5 },
  { text: 'one wanderer forged a realm from nothing.', delay: 5 },
  { text: '', isTitle: true, delay: 8 },
  { text: 'Seven lands. Seven stories.', delay: 11 },
  { text: 'Each one a piece of the soul that built them.', delay: 13.5 },
  { text: 'Step through the portal...', delay: 16 },
  { text: 'and discover the world within.', delay: 18 },
]

interface OpeningCinematicProps {
  onComplete: () => void
}

function hasSeenCinematic(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function useOpeningCinematic() {
  const [showCinematic, setShowCinematic] = useState(() => !hasSeenCinematic())

  const completeCinematic = useCallback(() => {
    try { localStorage.setItem(STORAGE_KEY, 'true') } catch { /* noop */ }
    setShowCinematic(false)
  }, [])

  return { showCinematic, completeCinematic }
}

export function OpeningCinematic({ onComplete }: OpeningCinematicProps) {
  const totalDuration = 21

  useEffect(() => {
    const timer = setTimeout(onComplete, totalDuration * 1000)
    return () => clearTimeout(timer)
  }, [onComplete, totalDuration])

  return (
      <motion.div
        className="cinematic"
        exit={{ opacity: 0 }}
        transition={{ duration: 1.5 }}
      >
        <div className="cinematic__text-container">
          {LINES.map((line, i) => (
            <motion.div
              key={i}
              className={`cinematic__line ${line.isTitle ? 'cinematic__line--title' : ''}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: line.delay,
                duration: 1.5,
                ease: 'easeOut',
              }}
            >
              {line.isTitle ? 'Jiggling' : line.text}
            </motion.div>
          ))}
        </div>

        <button className="cinematic__skip" onClick={onComplete}>
          Skip
        </button>
      </motion.div>
  )
}
