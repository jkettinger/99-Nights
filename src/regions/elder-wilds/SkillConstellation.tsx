import { useState, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ConstellationNode {
  id: string
  label: string
  description: string
  x: number
  y: number
  size: number
  unlocked: boolean
}

interface ConstellationGroup {
  id: string
  name: string
  icon: string
  color: string
  nodes: ConstellationNode[]
  connections: [number, number][]
}

const CONSTELLATIONS: ConstellationGroup[] = [
  {
    id: 'architecture',
    name: 'The Architect',
    icon: '⚒',
    color: '#7eb8da',
    nodes: [
      { id: 'arch-1', label: 'Foundation', description: 'Where all great structures begin — HTML, CSS, the bones of the web.', x: 15, y: 20, size: 4, unlocked: true },
      { id: 'arch-2', label: 'Framework', description: 'React, Vue, Angular — the scaffolding of modern applications.', x: 12, y: 32, size: 3, unlocked: true },
      { id: 'arch-3', label: 'Systems', description: 'Backend architecture, APIs, databases — the invisible backbone.', x: 20, y: 28, size: 3.5, unlocked: true },
      { id: 'arch-4', label: 'Cloud', description: 'AWS, Azure, GCP — building castles in the sky.', x: 18, y: 15, size: 3, unlocked: true },
      { id: 'arch-5', label: 'DevOps', description: 'CI/CD pipelines, containers, infrastructure as code.', x: 8, y: 24, size: 2.5, unlocked: true },
    ],
    connections: [[0, 1], [0, 2], [0, 3], [1, 4], [2, 3]],
  },
  {
    id: 'family',
    name: 'The Guardian',
    icon: '⌂',
    color: '#e8c170',
    nodes: [
      { id: 'fam-1', label: 'Heart', description: 'The center of it all — love, patience, endless devotion.', x: 48, y: 15, size: 5, unlocked: true },
      { id: 'fam-2', label: 'Wisdom', description: 'Lessons learned through sleepless nights and tiny victories.', x: 42, y: 22, size: 3, unlocked: true },
      { id: 'fam-3', label: 'Strength', description: 'The quiet strength of showing up, every single day.', x: 54, y: 22, size: 3, unlocked: true },
      { id: 'fam-4', label: 'Joy', description: 'Laughter echoing through the halls. Worth every gray hair.', x: 48, y: 28, size: 3.5, unlocked: true },
      { id: 'fam-5', label: 'Legacy', description: 'What we build that outlasts us — five times over.', x: 45, y: 10, size: 2.5, unlocked: true },
      { id: 'fam-6', label: 'Chaos', description: 'Five kids. Enough said.', x: 51, y: 10, size: 2.5, unlocked: true },
    ],
    connections: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 3], [2, 3]],
  },
  {
    id: 'sports',
    name: 'The Champion',
    icon: '⚔',
    color: '#da7e7e',
    nodes: [
      { id: 'sport-1', label: 'Arena', description: 'The thrill of competition — where legends are forged.', x: 82, y: 18, size: 4, unlocked: true },
      { id: 'sport-2', label: 'Endurance', description: 'Miles run, laps swum, reps completed. The grind never lies.', x: 78, y: 26, size: 3, unlocked: true },
      { id: 'sport-3', label: 'Strategy', description: 'Every game is a chess match. Reading the play before it happens.', x: 86, y: 26, size: 3, unlocked: true },
      { id: 'sport-4', label: 'Team', description: 'No champion stands alone. The bonds forged in battle.', x: 82, y: 32, size: 3, unlocked: true },
    ],
    connections: [[0, 1], [0, 2], [1, 3], [2, 3]],
  },
  {
    id: 'literature',
    name: 'The Scribe',
    icon: '✍',
    color: '#c4a0d4',
    nodes: [
      { id: 'lit-1', label: 'Words', description: 'The raw material — every story starts with a single word.', x: 28, y: 55, size: 4, unlocked: true },
      { id: 'lit-2', label: 'Worlds', description: 'Fantasy realms, sci-fi futures, the places that exist between pages.', x: 22, y: 62, size: 3, unlocked: true },
      { id: 'lit-3', label: 'Voice', description: 'Finding the tone, the rhythm, the cadence that makes prose sing.', x: 34, y: 62, size: 3, unlocked: true },
      { id: 'lit-4', label: 'Craft', description: 'Revision after revision. Murder your darlings. Polish until it gleams.', x: 28, y: 68, size: 3, unlocked: true },
    ],
    connections: [[0, 1], [0, 2], [1, 3], [2, 3]],
  },
  {
    id: 'beer',
    name: 'The Brewmaster',
    icon: '☕',
    color: '#d4a050',
    nodes: [
      { id: 'beer-1', label: 'Grain', description: 'Malt, barley, wheat — the foundation of every great brew.', x: 52, y: 52, size: 3.5, unlocked: true },
      { id: 'beer-2', label: 'Hops', description: 'Bitterness, aroma, flavor — the soul of the beer.', x: 48, y: 60, size: 3, unlocked: true },
      { id: 'beer-3', label: 'Yeast', description: 'The invisible alchemist that turns sugar into magic.', x: 56, y: 60, size: 3, unlocked: true },
      { id: 'beer-4', label: 'Time', description: 'Patience. The best things are worth waiting for.', x: 52, y: 66, size: 3, unlocked: true },
    ],
    connections: [[0, 1], [0, 2], [1, 3], [2, 3]],
  },
  {
    id: 'beach',
    name: 'The Voyager',
    icon: '☀',
    color: '#7edab8',
    nodes: [
      { id: 'beach-1', label: 'Horizon', description: 'Where sky meets sea — the edge of the known world.', x: 78, y: 55, size: 3.5, unlocked: true },
      { id: 'beach-2', label: 'Tides', description: 'The rhythm of the ocean — constant, eternal, grounding.', x: 74, y: 62, size: 3, unlocked: true },
      { id: 'beach-3', label: 'Salt', description: 'Sun-bleached and wind-worn. The best kind of tired.', x: 82, y: 62, size: 3, unlocked: true },
      { id: 'beach-4', label: 'Peace', description: 'Sand between the toes, waves at your feet. Stillness.', x: 78, y: 68, size: 3, unlocked: true },
    ],
    connections: [[0, 1], [0, 2], [1, 3], [2, 3]],
  },
  {
    id: 'fantasy',
    name: 'The Dreamer',
    icon: '✦',
    color: '#a0d4c4',
    nodes: [
      { id: 'fan-1', label: 'Imagination', description: 'The spark that ignites everything. Without this, nothing else exists.', x: 50, y: 80, size: 5, unlocked: true },
      { id: 'fan-2', label: 'Lore', description: 'Tolkien, Sanderson, Jordan, Martin — the masters who showed the way.', x: 44, y: 86, size: 3, unlocked: true },
      { id: 'fan-3', label: 'Games', description: 'Skyrim, Witcher, Dark Souls — digital realms explored and conquered.', x: 56, y: 86, size: 3, unlocked: true },
      { id: 'fan-4', label: 'Creation', description: 'Not just consuming worlds, but building them. This site is proof.', x: 50, y: 92, size: 3.5, unlocked: true },
    ],
    connections: [[0, 1], [0, 2], [1, 3], [2, 3]],
  },
]

export function SkillConstellation() {
  const uid = useId().replace(/:/g, '')
  const clipId = `hero-clip-${uid}`
  const [hoveredNode, setHoveredNode] = useState<ConstellationNode | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

  return (
    <div className="constellation">
      <h2 className="constellation__title">The Star Chart</h2>
      <p className="constellation__subtitle text-accent">
        Each constellation maps a domain of mastery
      </p>

      {/* Legend */}
      <div className="constellation__legend">
        {CONSTELLATIONS.map((group) => (
          <button
            key={group.id}
            className={`constellation__legend-item ${selectedGroup === group.id ? 'constellation__legend-item--active' : ''}`}
            style={{ '--group-color': group.color } as React.CSSProperties}
            onClick={() => setSelectedGroup(selectedGroup === group.id ? null : group.id)}
          >
            <span className="constellation__legend-icon">{group.icon}</span>
            <span>{group.name}</span>
          </button>
        ))}
      </div>

      {/* Sky */}
      <svg className="constellation__sky" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {/* Background stars */}
        {Array.from({ length: 80 }, (_, i) => (
          <circle
            key={`bg-star-${i}`}
            cx={Math.sin(i * 7.3) * 50 + 50}
            cy={Math.cos(i * 11.7) * 50 + 50}
            r={0.15 + Math.sin(i * 3.1) * 0.1}
            fill="white"
            opacity={0.2 + Math.sin(i * 5.7) * 0.15}
          >
            <animate
              attributeName="opacity"
              values={`${0.15 + Math.sin(i) * 0.1};${0.4 + Math.cos(i) * 0.2};${0.15 + Math.sin(i) * 0.1}`}
              dur={`${3 + (i % 4)}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}

        {/* Hero portrait — center of the star chart */}
        <defs>
          <clipPath id={clipId}>
            <circle cx="50" cy="48" r="5" />
          </clipPath>
        </defs>
        {/* Glow ring */}
        <circle cx="50" cy="48" r="7" fill="none" stroke="var(--color-gold)" strokeWidth="0.2" opacity="0.3">
          <animate attributeName="r" values="6.5;7.5;6.5" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.4;0.2" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="48" r="5.5" fill="none" stroke="var(--color-gold)" strokeWidth="0.15" opacity="0.5" />
        <image
          href="/images/hero-portrait.jpg"
          x="45"
          y="43"
          width="10"
          height="10"
          clipPath={`url(#${clipId})`}
          preserveAspectRatio="xMidYMid slice"
        />
        <circle cx="50" cy="48" r="5" fill="none" stroke="var(--color-gold-bright)" strokeWidth="0.3" opacity="0.7" />
        <text x="50" y="55" fill="var(--color-gold)" fontSize="1.5" fontFamily="var(--font-heading)" textAnchor="middle" opacity="0.8">
          Wanderer of the Wilds
        </text>

        {/* Constellation groups */}
        {CONSTELLATIONS.map((group) => {
          const dimmed = selectedGroup !== null && selectedGroup !== group.id
          return (
            <g
              key={group.id}
              opacity={dimmed ? 0.15 : 1}
              style={{ transition: 'opacity 0.5s ease' }}
            >
              {/* Connection lines */}
              {group.connections.map(([a, b], i) => (
                <line
                  key={`conn-${group.id}-${i}`}
                  x1={group.nodes[a].x}
                  y1={group.nodes[a].y}
                  x2={group.nodes[b].x}
                  y2={group.nodes[b].y}
                  stroke={group.color}
                  strokeWidth="0.15"
                  opacity="0.4"
                  strokeDasharray="0.5 0.3"
                >
                  <animate
                    attributeName="opacity"
                    values="0.2;0.5;0.2"
                    dur="4s"
                    repeatCount="indefinite"
                    begin={`${i * 0.5}s`}
                  />
                </line>
              ))}

              {/* Nodes */}
              {group.nodes.map((node) => (
                <g
                  key={node.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`${node.label}: ${node.description}`}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onFocus={() => setHoveredNode(node)}
                  onBlur={() => setHoveredNode(null)}
                  onClick={() => setHoveredNode(hoveredNode?.id === node.id ? null : node)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setHoveredNode(hoveredNode?.id === node.id ? null : node)
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Glow */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.size * 1.5}
                    fill={group.color}
                    opacity={hoveredNode?.id === node.id ? 0.3 : 0.05}
                    style={{ transition: 'opacity 0.3s ease' }}
                  />
                  {/* Star body */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.size * 0.4}
                    fill={group.color}
                    opacity={hoveredNode?.id === node.id ? 1 : 0.7}
                    style={{ transition: 'opacity 0.3s ease' }}
                  >
                    <animate
                      attributeName="r"
                      values={`${node.size * 0.35};${node.size * 0.45};${node.size * 0.35}`}
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  {/* Core */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.size * 0.2}
                    fill="white"
                    opacity={0.8}
                  />
                  {/* Label */}
                  <text
                    x={node.x}
                    y={node.y - node.size * 0.8}
                    fill={group.color}
                    fontSize="1.3"
                    fontFamily="var(--font-heading)"
                    textAnchor="middle"
                    opacity={hoveredNode?.id === node.id ? 1 : 0.6}
                    style={{ transition: 'opacity 0.3s ease' }}
                  >
                    {node.label}
                  </text>
                </g>
              ))}
            </g>
          )
        })}
      </svg>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredNode && (
          <motion.div
            className="constellation__tooltip"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
          >
            <h4>{hoveredNode.label}</h4>
            <p>{hoveredNode.description}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
