import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { usePageTransition } from './PageTransition'
import './CompassNav.css'

const REGIONS = [
  { id: 'map', name: 'The Map', icon: '\uD83D\uDDFA\uFE0F', route: '/' },
  { id: 'citadel', name: 'The Citadel', icon: '\u2656', route: '/citadel' },
  { id: 'great-hall', name: 'The Great Hall', icon: '\u2302', route: '/great-hall' },
  { id: 'arena', name: 'The Arena', icon: '\u2694', route: '/arena' },
  { id: 'library', name: 'The Library', icon: '\uD83D\uDCD6', route: '/library' },
  { id: 'tavern', name: 'The Tavern', icon: '\uD83C\uDF7A', route: '/tavern' },
  { id: 'shore', name: 'The Shore', icon: '\uD83C\uDF0A', route: '/shore' },
  { id: 'wilds', name: 'Elder Wilds', icon: '\u2726', route: '/wilds' },
]

export function CompassNav() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { triggerTransition } = usePageTransition()
  const isOnMap = location.pathname === '/'
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleOutsideClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isOpen])

  const handleNavigate = useCallback((regionId: string, route: string) => {
    if (location.pathname === route) {
      setIsOpen(false)
      return
    }
    setIsOpen(false)
    triggerTransition(regionId, () => navigate(route))
  }, [location.pathname, triggerTransition, navigate])

  return (
      <div ref={navRef} className={`compass-nav ${isOnMap ? 'compass-nav--on-map' : ''}`}>
        <button
          className="compass-nav__trigger"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Navigate to region"
          aria-expanded={isOpen}
        >
          <svg width="22" height="22" viewBox="0 0 60 60" aria-hidden="true">
            <circle cx="30" cy="30" r="26" fill="none" stroke="var(--color-gold-dim)" strokeWidth="1.5" />
            <polygon points="30,8 33,24 27,24" fill="var(--color-gold)" opacity="0.8" />
            <polygon points="30,52 33,36 27,36" fill="var(--color-parchment-dark)" opacity="0.5" />
            <polygon points="52,30 36,33 36,27" fill="var(--color-parchment-dark)" opacity="0.5" />
            <polygon points="8,30 24,33 24,27" fill="var(--color-parchment-dark)" opacity="0.5" />
            <circle cx="30" cy="30" r="3" fill="var(--color-gold)" opacity="0.6" />
          </svg>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="compass-nav__menu"
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {REGIONS.map((region, i) => (
                <div key={region.id}>
                  {i === 1 && <div className="compass-nav__divider" />}
                  <button
                    className="compass-nav__item"
                    onClick={() => handleNavigate(region.id, region.route)}
                    disabled={location.pathname === region.route}
                    style={location.pathname === region.route ? { opacity: 0.4 } : undefined}
                  >
                    <span className="compass-nav__item-icon">{region.icon}</span>
                    {region.name}
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  )
}
