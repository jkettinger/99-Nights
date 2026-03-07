import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { usePageTransition, TransitionOverlay } from './PageTransition'

export default function ComingSoon() {
  const navigate = useNavigate()
  const { transitionConfig, triggerTransition, clearTransition } = usePageTransition()

  const handleReturn = () => {
    triggerTransition('map', () => {
      navigate('/')
    })
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--color-bg-deep)',
      textAlign: 'center',
      padding: 'var(--space-xl)',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 style={{ marginBottom: 'var(--space-md)', fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
          This Realm Awaits
        </h2>
        <p className="text-accent" style={{
          color: 'var(--color-parchment-dark)',
          fontSize: '1.1rem',
          letterSpacing: '0.1em',
          marginBottom: 'var(--space-2xl)',
        }}>
          The cartographers are still charting these lands...
        </p>
        <button className="coming-soon__btn" onClick={handleReturn}>
          Return to the Map
        </button>
      </motion.div>
      <TransitionOverlay config={transitionConfig} onComplete={clearTransition} />
    </div>
  )
}
