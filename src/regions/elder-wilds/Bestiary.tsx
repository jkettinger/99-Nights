import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface BestiaryEntry {
  id: string
  name: string
  classification: string
  threat: 'Harmless' | 'Minor' | 'Moderate' | 'Dangerous' | 'Legendary'
  habitat: string
  description: string
  stats: {
    power: number
    cunning: number
    resilience: number
    chaos: number
  }
  weakness: string
  lore: string
}

const BESTIARY: BestiaryEntry[] = [
  {
    id: 'hydra',
    name: 'The Five-Headed Hydra',
    classification: 'Familius Adorabilis',
    threat: 'Legendary',
    habitat: 'The Great Hall',
    description: 'A magnificent creature with five distinct heads, each with its own personality, demands, and bedtime negotiation strategy.',
    stats: { power: 95, cunning: 88, resilience: 70, chaos: 100 },
    weakness: 'Ice cream, screen time, "five more minutes"',
    lore: 'Ancient texts warn: "Cut off one demand, two more shall take its place." No adventurer has ever successfully gotten all five heads to sleep at the same time.',
  },
  {
    id: 'code-wyrm',
    name: 'The Code Wyrm',
    classification: 'Bugus Infinitus',
    threat: 'Dangerous',
    habitat: 'The Citadel',
    description: 'A serpentine creature that lurks in the depths of legacy codebases, feeding on poorly documented functions and untested edge cases.',
    stats: { power: 60, cunning: 95, resilience: 85, chaos: 75 },
    weakness: 'console.log, debugger statements, rubber ducks',
    lore: 'The Wyrm is most active on Friday afternoons, just before deployment. It particularly enjoys corrupting code that "worked on my machine."',
  },
  {
    id: 'meeting-wraith',
    name: 'The Meeting Wraith',
    classification: 'Calendarus Consumicus',
    threat: 'Dangerous',
    habitat: 'The Citadel',
    description: 'An ethereal being that devours productive hours. Manifests as a recurring calendar event that "could have been an email."',
    stats: { power: 40, cunning: 70, resilience: 99, chaos: 60 },
    weakness: '"I have a hard stop," declining optional meetings, async communication',
    lore: 'The Wraith multiplies when left unchecked. One meeting begets a follow-up, which begets a sync, which begets a retrospective about having too many meetings.',
  },
  {
    id: 'hop-golem',
    name: 'The Hop Golem',
    classification: 'Lupulus Maximus',
    threat: 'Minor',
    habitat: 'The Tavern',
    description: 'A shambling construct made entirely of spent grain and hop cones. Smells incredible. Very sticky.',
    stats: { power: 50, cunning: 30, resilience: 80, chaos: 45 },
    weakness: 'High temperatures (mash-out), impatient brewers, fruit beers',
    lore: 'The Golem is born during brew day, rising from the mash tun when no one is watching. It seeks only to achieve perfect attenuation.',
  },
  {
    id: 'plot-phoenix',
    name: 'The Plot Phoenix',
    classification: 'Narrativus Rebornus',
    threat: 'Moderate',
    habitat: 'The Ancient Library',
    description: 'A radiant creature that rises from the ashes of abandoned manuscripts. Each death brings a better draft.',
    stats: { power: 70, cunning: 85, resilience: 95, chaos: 55 },
    weakness: 'Writer\'s block, "I\'ll finish it tomorrow," Netflix',
    lore: 'The Phoenix has died and been reborn 47 times. Each incarnation is slightly better than the last. The current draft might actually be the one.',
  },
  {
    id: 'sand-leviathan',
    name: 'The Sand Leviathan',
    classification: 'Beachius Colossus',
    threat: 'Harmless',
    habitat: 'The Shore',
    description: 'A massive but gentle creature that dwells beneath the sand. It surfaces only to bask in the sun and occasionally steal your towel.',
    stats: { power: 85, cunning: 20, resilience: 90, chaos: 30 },
    weakness: 'Sunscreen, beach umbrellas, the drive home',
    lore: 'Despite its fearsome size, the Leviathan is at peace. It has achieved what many adventurers seek: the ability to do absolutely nothing and enjoy it.',
  },
  {
    id: 'ref-banshee',
    name: 'The Referee Banshee',
    classification: 'Whistlus Terribilis',
    threat: 'Moderate',
    habitat: 'The Arena',
    description: 'A shrieking spirit that appears during crucial moments in sporting events to make controversial calls.',
    stats: { power: 30, cunning: 50, resilience: 60, chaos: 90 },
    weakness: 'Video replay, calm rational discussion (extremely rare)',
    lore: 'No one has ever agreed with the Banshee\'s calls. It feeds on the collective rage of disappointed fans. Some say it was once a fan itself.',
  },
  {
    id: 'ancient-ent',
    name: 'The Elder Ent',
    classification: 'Arboris Eternalis',
    threat: 'Harmless',
    habitat: 'The Elder Wilds',
    description: 'An ancient tree creature that has stood in these wilds since before the realm was mapped. It speaks in rustling leaves and creaking branches.',
    stats: { power: 75, cunning: 90, resilience: 100, chaos: 10 },
    weakness: 'Impatience (it speaks very... very... slowly)',
    lore: 'The Ent remembers when this was all fields. It has opinions about modern web frameworks but takes approximately six months to share each one.',
  },
]

const THREAT_COLORS: Record<string, string> = {
  Harmless: '#7edab8',
  Minor: '#7eb8da',
  Moderate: '#e8c170',
  Dangerous: '#da7e7e',
  Legendary: '#c4a0d4',
}

export function Bestiary() {
  const [selectedEntry, setSelectedEntry] = useState<BestiaryEntry | null>(null)

  return (
    <div className="bestiary">
      <h2 className="bestiary__title">Bestiary of the Realm</h2>
      <p className="bestiary__subtitle text-accent">
        A comprehensive guide to the creatures that inhabit these lands
      </p>

      <div className="bestiary__layout">
        {/* Entry list */}
        <div className="bestiary__list">
          {BESTIARY.map((entry) => (
            <button
              key={entry.id}
              className={`bestiary__item ${selectedEntry?.id === entry.id ? 'bestiary__item--active' : ''}`}
              onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
            >
              <span
                className="bestiary__threat-dot"
                style={{ background: THREAT_COLORS[entry.threat] }}
              />
              <div className="bestiary__item-info">
                <span className="bestiary__item-name">{entry.name}</span>
                <span className="bestiary__item-class">{entry.classification}</span>
              </div>
              <span className="bestiary__item-threat" style={{ color: THREAT_COLORS[entry.threat] }}>
                {entry.threat}
              </span>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          {selectedEntry && (
            <motion.div
              key={selectedEntry.id}
              className="bestiary__detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bestiary__header">
                <h3>{selectedEntry.name}</h3>
                <span className="bestiary__classification">{selectedEntry.classification}</span>
                <div className="bestiary__meta">
                  <span style={{ color: THREAT_COLORS[selectedEntry.threat] }}>
                    Threat: {selectedEntry.threat}
                  </span>
                  <span>Habitat: {selectedEntry.habitat}</span>
                </div>
              </div>

              <p className="bestiary__description">{selectedEntry.description}</p>

              {/* Stats */}
              <div className="bestiary__stats">
                {Object.entries(selectedEntry.stats).map(([stat, value]) => (
                  <div key={stat} className="bestiary__stat">
                    <span className="bestiary__stat-label">{stat}</span>
                    <div className="bestiary__stat-bar">
                      <motion.div
                        className="bestiary__stat-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                      />
                    </div>
                    <span className="bestiary__stat-value">{value}</span>
                  </div>
                ))}
              </div>

              <div className="bestiary__weakness">
                <strong>Weakness:</strong> {selectedEntry.weakness}
              </div>

              <div className="bestiary__lore">
                <em>{selectedEntry.lore}</em>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
