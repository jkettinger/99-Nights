import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Champion {
  id: string
  sport: string
  team: string
  era: string
  motto: string
  color: string
  stats: { label: string; value: string }[]
  legend: string
}

const CHAMPIONS: Champion[] = [
  {
    id: 'football',
    sport: 'Football (Soccer)',
    team: 'The Beautiful Game',
    era: 'Eternal',
    motto: 'The ball is round, the game lasts 90 minutes, everything else is just theory.',
    color: '#8a3030',
    stats: [
      { label: 'Passion Level', value: 'Immeasurable' },
      { label: 'Preferred Formation', value: '4-3-3' },
      { label: 'Hot Takes', value: 'Too many' },
      { label: 'Kit Collection', value: 'Embarrassingly large' },
    ],
    legend: 'The world\'s game. Whether it\'s the Premier League on a Saturday morning or a World Cup final at midnight, the beautiful game calls and we answer. Every. Single. Time.',
  },
  {
    id: 'gridiron',
    sport: 'American Football',
    team: 'Sunday Ritual',
    era: 'Fall Sundays',
    motto: 'On any given Sunday...',
    color: '#2a4a8a',
    stats: [
      { label: 'Fantasy Leagues', value: '3 (minimum)' },
      { label: 'Superstitions', value: 'Don\'t ask' },
      { label: 'Snack Preparation', value: 'Professional grade' },
      { label: 'Remote Throws', value: 'Accurate to 10 yards' },
    ],
    legend: 'From September to February, Sundays are sacred. The strategy, the drama, the improbable comebacks — it\'s chess with 300-pound pieces and we love every down of it.',
  },
  {
    id: 'basketball',
    sport: 'Basketball',
    team: 'Court Vision',
    era: 'Year-round',
    motto: 'Ball don\'t lie.',
    color: '#2a6a3a',
    stats: [
      { label: 'Pickup Game Record', value: 'Don\'t keep score (we do)' },
      { label: 'Favorite Play', value: 'No-look pass' },
      { label: 'Trash Talk', value: 'Moderate to severe' },
      { label: 'March Madness Brackets', value: 'All busted by Round 2' },
    ],
    legend: 'The squeak of sneakers on hardwood, the swish of a perfect jumper, the chaos of a buzzer-beater. Basketball is poetry in motion and controlled chaos all at once.',
  },
  {
    id: 'baseball',
    sport: 'Baseball',
    team: 'The Long Season',
    era: 'April - October',
    motto: 'It\'s a marathon, not a sprint. 162 games of it.',
    color: '#6a3a8a',
    stats: [
      { label: 'Games Attended', value: 'Lost count' },
      { label: 'Hot Dog Consumption', value: 'Stadium-tier' },
      { label: 'Sabermetrics Nerdery', value: 'Deep WAR analysis' },
      { label: 'Seventh Inning Stretch', value: 'Never missed' },
    ],
    legend: 'Baseball is the thinking person\'s sport. In a world of instant gratification, there\'s something beautiful about a game that unfolds over 3+ hours with no clock.',
  },
  {
    id: 'hockey',
    sport: 'Hockey',
    team: 'Ice Warriors',
    era: 'Winter Campaigns',
    motto: 'You miss 100% of the shots you don\'t take.',
    color: '#8a6a2a',
    stats: [
      { label: 'Teeth Remaining', value: 'All (spectator privileges)' },
      { label: 'Playoff Beard Status', value: 'Committed' },
      { label: 'Fights Enjoyed', value: 'Guilty pleasure' },
      { label: 'Ice Time Knowledge', value: 'Zamboni appreciation' },
    ],
    legend: 'The fastest game on earth. Hockey combines grace, violence, and teamwork into the most intense spectator experience in sports. Plus, where else do they let you fight?',
  },
]

export function ChampionBoard() {
  const [selectedChampion, setSelectedChampion] = useState<Champion | null>(null)

  return (
    <div className="champions">
      <h2 className="champions__title">The Champion Boards</h2>
      <p className="champions__subtitle text-accent">
        Legends honored in these hallowed halls
      </p>

      <div className="champions__grid">
        {CHAMPIONS.map((champ, i) => (
          <motion.button
            key={champ.id}
            className={`champions__card ${selectedChampion?.id === champ.id ? 'champions__card--active' : ''}`}
            style={{ '--card-color': champ.color } as React.CSSProperties}
            aria-expanded={selectedChampion?.id === champ.id}
            onClick={() => setSelectedChampion(selectedChampion?.id === champ.id ? null : champ)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
          >
            <div className="champions__card-banner" style={{ background: champ.color }} />
            <h3>{champ.sport}</h3>
            <span className="champions__card-team">{champ.team}</span>
            <span className="champions__card-era">{champ.era}</span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selectedChampion && (
          <motion.div
            key={selectedChampion.id}
            className="champions__detail"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="champions__detail-inner">
              <div className="champions__detail-header" style={{ borderLeftColor: selectedChampion.color }}>
                <h3>{selectedChampion.sport}</h3>
                <p className="champions__motto">"{selectedChampion.motto}"</p>
              </div>

              <div className="champions__stats-grid">
                {selectedChampion.stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    className="champions__stat"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <span className="champions__stat-label">{stat.label}</span>
                    <span className="champions__stat-value">{stat.value}</span>
                  </motion.div>
                ))}
              </div>

              <p className="champions__legend">{selectedChampion.legend}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
