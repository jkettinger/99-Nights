import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { TransitionOverlay, usePageTransition } from '../components/PageTransition'
import { useRegionAudio } from '../hooks/useAudio'
import './Tavern.css'

/* ===== Data ===== */

interface Beer {
  name: string
  style: string
  description: string
  icon: string
}

const BEERS: Beer[] = [
  { name: 'Dragon\'s Breath IPA', style: 'West Coast IPA', description: 'Aggressively hopped with Citra and Mosaic. Pine resin and grapefruit on the nose, finishes with a slow burn that earns its name.', icon: '\uD83D\uDC32' },
  { name: 'Monk\'s Midnight', style: 'Belgian Dubbel', description: 'Dark fruit and caramel with a whisper of clove. Brewed with patience and contemplation, as all great things should be.', icon: '\uD83C\uDF19' },
  { name: 'Harvest Gold', style: 'Hazy Pale Ale', description: 'Juicy, crushable, dangerously sessionable. Oats and wheat give it body while Galaxy hops bring tropical sunshine.', icon: '\u2600\uFE0F' },
  { name: 'Stormcloud Stout', style: 'Imperial Stout', description: 'Roasted barley, dark chocolate, and espresso. Thick enough to stand a spoon in. Best enjoyed by firelight.', icon: '\u26C8\uFE0F' },
  { name: 'The Wanderer', style: 'Saison', description: 'Peppery and dry with wild yeast character. A farmhouse ale that tastes like adventure — unpredictable and alive.', icon: '\uD83E\uDDED' },
  { name: 'Elderflower Mead', style: 'Traditional Mead', description: 'Wildflower honey fermented with foraged elderflower. Sweet but not cloying, ancient but approachable.', icon: '\uD83C\uDF3C' },
]

interface MenuItem {
  name: string
  price: string
}

const MENU: Record<string, MenuItem[]> = {
  'On Draught': [
    { name: 'Dragon\'s Breath IPA', price: '6 silver' },
    { name: 'Harvest Gold Pale', price: '5 silver' },
    { name: 'Stormcloud Stout', price: '7 silver' },
    { name: 'The Wanderer Saison', price: '6 silver' },
  ],
  'From the Cellar': [
    { name: 'Monk\'s Midnight Dubbel', price: '8 silver' },
    { name: 'Elderflower Mead', price: '10 silver' },
    { name: 'Barrel-Aged Barleywine', price: '12 silver' },
  ],
  'From the Kitchen': [
    { name: 'Roasted Boar Shank', price: '15 silver' },
    { name: 'Bread & Aged Cheese Board', price: '8 silver' },
    { name: 'Hearth-Baked Meat Pie', price: '10 silver' },
  ],
}

/* ===== Component ===== */

export default function Tavern() {
  useRegionAudio('tavern')
  const navigate = useNavigate()
  const { transitionConfig, triggerTransition, clearTransition } = usePageTransition()
  const [expandedBeer, setExpandedBeer] = useState<number | null>(null)

  const handleBack = useCallback(() => {
    triggerTransition('map', () => navigate('/'))
  }, [triggerTransition, navigate])

  return (
    <div className="tavern">
      <div className="tavern__bg" />

      {/* Fireplace */}
      <div className="tavern__fireplace">
        <div className="fireplace__hearth">
          <div className="fireplace__glow" />
          <div className="fire-particle fire-particle--1" />
          <div className="fire-particle fire-particle--2" />
          <div className="fire-particle fire-particle--3" />
          <div className="fire-particle fire-particle--4" />
          <div className="fire-particle fire-particle--5" />
        </div>
      </div>
      <div className="tavern__firelight" />

      {/* Candles */}
      <Candle style={{ top: '15%', left: '12%' }} delay={0} />
      <Candle style={{ top: '25%', right: '10%' }} delay={0.3} />
      <Candle style={{ top: '55%', left: '8%' }} delay={0.6} />
      <Candle style={{ top: '40%', right: '15%' }} delay={0.9} />

      {/* Content */}
      <div className="tavern__content">
        {/* Header */}
        <motion.div
          className="tavern__header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1>The Tavern</h1>
          <p>Pull up a chair. The fire's warm and the ale is cold.</p>
        </motion.div>

        {/* Chalkboard Menu */}
        <motion.div
          className="chalkboard"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="chalkboard__title">Tonight's Offerings</div>
          <hr className="chalkboard__divider" />
          {Object.entries(MENU).map(([section, items]) => (
            <div key={section} className="chalkboard__section">
              <div className="chalkboard__section-title">{section}</div>
              {items.map((item) => (
                <div key={item.name} className="chalkboard__item">
                  <span className="chalkboard__item-name">{item.name}</span>
                  <span className="chalkboard__item-dots" />
                  <span className="chalkboard__item-price">{item.price}</span>
                </div>
              ))}
            </div>
          ))}
        </motion.div>

        {/* Beer Cards */}
        <motion.div
          className="mugs"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <h4 className="mugs__title">Tap the Mugs</h4>
          <div className="mugs__grid">
            {BEERS.map((beer, i) => (
              <motion.div
                key={i}
                className="mug-card"
                onClick={() => setExpandedBeer(expandedBeer === i ? null : i)}
                role="button"
                tabIndex={0}
                aria-label={`${beer.name} - ${beer.style}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setExpandedBeer(expandedBeer === i ? null : i)
                  }
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="mug-card__icon">{beer.icon}</span>
                <div className="mug-card__name">{beer.name}</div>
                <div className="mug-card__style">{beer.style}</div>
                <AnimatePresence>
                  {expandedBeer === i && (
                    <motion.p
                      className="mug-card__desc"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {beer.description}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Back button */}
      <button className="tavern__back" onClick={handleBack}>
        Return to Map
      </button>

      {/* Vignette */}
      <div className="tavern__vignette" />

      {/* Transition */}
      <TransitionOverlay config={transitionConfig} onComplete={clearTransition} />
    </div>
  )
}

/* ===== Sub-components ===== */

function Candle({ style, delay }: { style: React.CSSProperties; delay: number }) {
  return (
    <motion.div
      className="candle"
      style={style}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: delay + 0.5, duration: 0.5 }}
    >
      <div className="candle__flame" style={{ animationDelay: `${delay}s` }} />
      <div className="candle__body" />
    </motion.div>
  )
}
