import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ'] as const
const RUNE_NAMES = ['Fehu', 'Uruz', 'Thurisaz', 'Ansuz', 'Raido', 'Kenaz', 'Gebo', 'Wunjo']

const SECRET_MESSAGES = [
  'The path is forged by those who walk it.',
  'In code and craft, patience is power.',
  'Five heads are better than one.',
  'The best brew is the one shared with friends.',
  'Every great story begins with a single word.',
  'The sea calls to those who listen.',
]

type GameState = 'idle' | 'showing' | 'input' | 'success' | 'failure'

export function RuneCircle() {
  const [gameState, setGameState] = useState<GameState>('idle')
  const [sequence, setSequence] = useState<number[]>([])
  const [playerInput, setPlayerInput] = useState<number[]>([])
  const [activeRune, setActiveRune] = useState<number | null>(null)
  const [level, setLevel] = useState(1)
  const [message, setMessage] = useState<string | null>(null)
  const [showParticles, setShowParticles] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimeouts = useCallback(() => {
    timeoutRef.current.forEach(clearTimeout)
    timeoutRef.current = []
  }, [])

  useEffect(() => {
    return clearTimeouts
  }, [clearTimeouts])

  const generateSequence = useCallback((length: number) => {
    const seq: number[] = []
    for (let i = 0; i < length; i++) {
      let next: number
      do {
        next = Math.floor(Math.random() * RUNES.length)
      } while (seq.length > 0 && seq[seq.length - 1] === next)
      seq.push(next)
    }
    return seq
  }, [])

  const showSequence = useCallback((seq: number[]) => {
    setGameState('showing')
    setActiveRune(null)

    seq.forEach((runeIdx, i) => {
      const showTimeout = setTimeout(() => {
        setActiveRune(runeIdx)
      }, i * 800 + 400)
      timeoutRef.current.push(showTimeout)

      const hideTimeout = setTimeout(() => {
        setActiveRune(null)
      }, i * 800 + 900)
      timeoutRef.current.push(hideTimeout)
    })

    const doneTimeout = setTimeout(() => {
      setGameState('input')
      setPlayerInput([])
    }, seq.length * 800 + 500)
    timeoutRef.current.push(doneTimeout)
  }, [])

  const startGame = useCallback(() => {
    clearTimeouts()
    const seq = generateSequence(level + 2)
    setSequence(seq)
    setMessage(null)
    setShowParticles(false)
    showSequence(seq)
  }, [level, generateSequence, showSequence, clearTimeouts])

  const handleRuneClick = useCallback((runeIdx: number) => {
    if (gameState !== 'input') return

    // Flash the rune
    setActiveRune(runeIdx)
    const t = setTimeout(() => setActiveRune(null), 200)
    timeoutRef.current.push(t)

    const newInput = [...playerInput, runeIdx]
    setPlayerInput(newInput)

    // Check if the input matches so far
    const currentPos = newInput.length - 1
    if (newInput[currentPos] !== sequence[currentPos]) {
      // Wrong!
      setGameState('failure')
      setMessage('The runes grow dim... Try again.')
      return
    }

    // Completed the sequence?
    if (newInput.length === sequence.length) {
      setGameState('success')
      setShowParticles(true)
      const secretMsg = SECRET_MESSAGES[Math.floor(Math.random() * SECRET_MESSAGES.length)]
      setMessage(secretMsg)

      if (level < 5) {
        const nextTimeout = setTimeout(() => {
          setLevel((l) => l + 1)
          setShowParticles(false)
        }, 3000)
        timeoutRef.current.push(nextTimeout)
      } else {
        const clearParticles = setTimeout(() => {
          setShowParticles(false)
        }, 3000)
        timeoutRef.current.push(clearParticles)
      }
    }
  }, [gameState, playerInput, sequence, level])

  const resetGame = useCallback(() => {
    clearTimeouts()
    setLevel(1)
    setGameState('idle')
    setSequence([])
    setPlayerInput([])
    setActiveRune(null)
    setMessage(null)
    setShowParticles(false)
  }, [clearTimeouts])

  return (
    <div className="rune-circle">
      <h2 className="rune-circle__title">The Rune Circle</h2>
      <p className="rune-circle__subtitle text-accent">
        Repeat the ancient sequence to unlock hidden wisdom
      </p>

      <div className="rune-circle__info">
        <span>Level {level}/5</span>
        <span>Sequence: {level + 2} runes</span>
      </div>

      {/* The stone circle */}
      <div className="rune-circle__stones">
        <div className="rune-circle__inner-ring" />

        {RUNES.map((rune, i) => {
          const angle = (i / RUNES.length) * Math.PI * 2 - Math.PI / 2
          const radius = 38
          const x = 50 + Math.cos(angle) * radius
          const y = 50 + Math.sin(angle) * radius

          const isActive = activeRune === i

          return (
            <button
              key={i}
              className={`rune-stone ${isActive ? 'rune-stone--active' : ''}`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
              }}
              onClick={() => handleRuneClick(i)}
              disabled={gameState !== 'input'}
              aria-label={`Rune ${RUNE_NAMES[i]}`}
              title={RUNE_NAMES[i]}
            >
              <span className="rune-stone__glow" />
              <span className="rune-stone__symbol">{rune}</span>
              <span className="rune-stone__name">{RUNE_NAMES[i]}</span>
            </button>
          )
        })}

        {/* Center stone */}
        <div className="rune-circle__center">
          {gameState === 'idle' && (
            <button className="rune-circle__start" onClick={startGame}>
              Begin
            </button>
          )}
          {gameState === 'showing' && (
            <span className="rune-circle__status">Watch...</span>
          )}
          {gameState === 'input' && (
            <span className="rune-circle__status">
              {playerInput.length}/{sequence.length}
            </span>
          )}
          {gameState === 'success' && level < 5 && (
            <button className="rune-circle__start" onClick={startGame}>
              Next
            </button>
          )}
          {gameState === 'success' && level >= 5 && (
            <span className="rune-circle__status rune-circle__status--victory">
              Master!
            </span>
          )}
          {gameState === 'failure' && (
            <button className="rune-circle__start" onClick={startGame}>
              Retry
            </button>
          )}
        </div>

        {/* Particle explosion on success */}
        <AnimatePresence>
          {showParticles && (
            <>
              {Array.from({ length: 20 }, (_, i) => {
                const angle = (i / 20) * Math.PI * 2
                const distance = 30 + Math.random() * 20
                return (
                  <motion.div
                    key={`particle-${i}`}
                    className="rune-particle"
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{
                      x: Math.cos(angle) * distance + (Math.random() - 0.5) * 20,
                      y: Math.sin(angle) * distance + (Math.random() - 0.5) * 20,
                      opacity: 0,
                      scale: 0,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      width: 4 + Math.random() * 4,
                      height: 4 + Math.random() * 4,
                      borderRadius: '50%',
                      background: `hsl(${40 + Math.random() * 30}, 80%, ${60 + Math.random() * 30}%)`,
                      boxShadow: `0 0 8px hsl(${40 + Math.random() * 30}, 80%, 60%)`,
                      pointerEvents: 'none',
                    }}
                  />
                )
              })}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            className={`rune-circle__message ${gameState === 'success' ? 'rune-circle__message--success' : 'rune-circle__message--failure'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset */}
      {gameState !== 'idle' && (
        <button className="rune-circle__reset" onClick={resetGame}>
          Reset
        </button>
      )}
    </div>
  )
}
