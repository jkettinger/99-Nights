import { useState, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Blueprint {
  id: string
  name: string
  type: string
  description: string
  features: string[]
}

const BLUEPRINTS: Blueprint[] = [
  {
    id: 'hospital-wing',
    name: 'Patient Care Wing',
    type: 'Healthcare',
    description: 'A modern patient care wing designed around healing-centered principles. Natural light floods each room, with views to healing gardens. Wayfinding is intuitive, reducing stress for patients and visitors alike.',
    features: ['Patient-centered room design', 'Healing garden integration', 'Intuitive wayfinding', 'Natural light optimization', 'Infection control corridors'],
  },
  {
    id: 'emergency',
    name: 'Emergency Department',
    type: 'Healthcare',
    description: 'High-volume emergency department with optimized patient flow. Designed to handle surge capacity while maintaining care quality. Separate trauma and ambulatory paths prevent bottlenecks.',
    features: ['Surge capacity planning', 'Trauma bay access', 'Ambulatory care zone', 'Rapid triage flow', 'Decontamination suite'],
  },
  {
    id: 'surgical',
    name: 'Surgical Suite',
    type: 'Healthcare',
    description: 'State-of-the-art surgical suite with integrated technology infrastructure. Modular OR design allows adaptation to different procedure types. Clean-to-dirty workflow is maintained throughout.',
    features: ['Modular OR design', 'Hybrid OR capability', 'Sterile processing link', 'HVAC pressure cascading', 'Equipment boom integration'],
  },
  {
    id: 'digital-infra',
    name: 'Digital Infrastructure',
    type: 'Technology',
    description: 'The invisible backbone — server rooms, network closets, cable pathways, and wireless coverage maps. Every building is only as good as its digital nervous system.',
    features: ['Structured cabling design', 'Server room cooling', 'Redundant power paths', 'Wireless heat mapping', 'IoT sensor integration'],
  },
]

export function BlueprintTable() {
  const uid = useId().replace(/:/g, '')
  const [activeBlueprint, setActiveBlueprint] = useState<Blueprint>(BLUEPRINTS[0])
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null)

  return (
    <div className="blueprints">
      <h2 className="blueprints__title">The Drafting Table</h2>
      <p className="blueprints__subtitle text-accent">Architectural works in progress</p>

      <div className="blueprints__selector">
        {BLUEPRINTS.map((bp) => (
          <button
            key={bp.id}
            className={`blueprints__tab ${activeBlueprint.id === bp.id ? 'blueprints__tab--active' : ''}`}
            onClick={() => setActiveBlueprint(bp)}
          >
            <span className="blueprints__tab-type">{bp.type}</span>
            <span className="blueprints__tab-name">{bp.name}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeBlueprint.id}
          className="blueprints__canvas"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Blueprint drawing area */}
          <div className="blueprints__drawing">
            <svg viewBox="0 0 600 400" className="blueprints__svg">
              {/* Grid */}
              <defs>
                <pattern id={`bpGrid-${uid}`} width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(126, 184, 218, 0.08)" strokeWidth="0.5" />
                </pattern>
                <pattern id={`bpGridSm-${uid}`} width="6" height="6" patternUnits="userSpaceOnUse">
                  <path d="M 6 0 L 0 0 0 6" fill="none" stroke="rgba(126, 184, 218, 0.03)" strokeWidth="0.3" />
                </pattern>
                <marker id={`arrowhead-${uid}`} markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                  <path d="M0,0 L6,2 L0,4" fill="rgba(126, 184, 218, 0.4)" />
                </marker>
              </defs>
              <rect width="600" height="400" fill={`url(#bpGridSm-${uid})`} />
              <rect width="600" height="400" fill={`url(#bpGrid-${uid})`} />

              {/* Dynamic floor plan based on active blueprint */}
              <g className="blueprints__plan" stroke="rgba(126, 184, 218, 0.5)" strokeWidth="1" fill="none">
                {activeBlueprint.id === 'hospital-wing' && (
                  <>
                    {/* Corridor */}
                    <rect x="100" y="160" width="400" height="80" strokeWidth="1.5" />
                    {/* Rooms */}
                    {[0, 1, 2, 3, 4].map((i) => (
                      <g key={i}>
                        <rect x={120 + i * 75} y="80" width="60" height="75" />
                        <rect x={120 + i * 75} y="245" width="60" height="75" />
                        {/* Door */}
                        <line x1={140 + i * 75} y1="155" x2={160 + i * 75} y2="155" stroke="rgba(126, 184, 218, 0.3)" strokeDasharray="3 2" />
                        <line x1={140 + i * 75} y1="245" x2={160 + i * 75} y2="245" stroke="rgba(126, 184, 218, 0.3)" strokeDasharray="3 2" />
                      </g>
                    ))}
                    {/* Garden */}
                    <circle cx="540" cy="200" r="30" strokeDasharray="4 3" opacity="0.3" />
                    <text x="540" y="204" fill="rgba(126, 184, 218, 0.3)" fontSize="8" textAnchor="middle">Garden</text>
                  </>
                )}
                {activeBlueprint.id === 'emergency' && (
                  <>
                    {/* Main area */}
                    <rect x="80" y="100" width="250" height="200" strokeWidth="1.5" />
                    {/* Triage */}
                    <rect x="350" y="100" width="100" height="100" />
                    <text x="400" y="155" fill="rgba(126, 184, 218, 0.3)" fontSize="8" textAnchor="middle">Triage</text>
                    {/* Trauma bays */}
                    {[0, 1, 2].map((i) => (
                      <rect key={i} x={100 + i * 70} y="120" width="55" height="55" opacity="0.6" />
                    ))}
                    {/* Ambulatory */}
                    <rect x="350" y="220" width="180" height="80" />
                    <text x="440" y="264" fill="rgba(126, 184, 218, 0.3)" fontSize="8" textAnchor="middle">Ambulatory</text>
                    {/* Decon */}
                    <rect x="80" y="320" width="80" height="50" strokeDasharray="4 3" />
                    <text x="120" y="349" fill="rgba(218, 126, 126, 0.3)" fontSize="7" textAnchor="middle">Decon</text>
                    {/* Arrows for flow */}
                    <path d="M530,160 L540,160 L540,100 L450,100" stroke="rgba(126, 184, 218, 0.2)" strokeWidth="0.8" markerEnd={`url(#arrowhead-${uid})`} />
                  </>
                )}
                {activeBlueprint.id === 'surgical' && (
                  <>
                    {/* OR rooms */}
                    {[0, 1, 2].map((i) => (
                      <g key={i}>
                        <rect x={100 + i * 150} y="80" width="120" height="120" strokeWidth="1.5" />
                        <text x={160 + i * 150} y="145" fill="rgba(126, 184, 218, 0.3)" fontSize="9" textAnchor="middle">OR {i + 1}</text>
                        {/* Equipment booms */}
                        <circle cx={160 + i * 150} cy="120" r="8" strokeDasharray="2 2" opacity="0.4" />
                      </g>
                    ))}
                    {/* Sterile corridor */}
                    <rect x="80" y="220" width="440" height="50" opacity="0.6" />
                    <text x="300" y="249" fill="rgba(160, 212, 196, 0.3)" fontSize="8" textAnchor="middle">Sterile Corridor</text>
                    {/* Processing */}
                    <rect x="200" y="290" width="200" height="70" />
                    <text x="300" y="329" fill="rgba(126, 184, 218, 0.3)" fontSize="8" textAnchor="middle">Sterile Processing</text>
                  </>
                )}
                {activeBlueprint.id === 'digital-infra' && (
                  <>
                    {/* Server room */}
                    <rect x="200" y="100" width="200" height="120" strokeWidth="1.5" />
                    <text x="300" y="165" fill="rgba(126, 184, 218, 0.3)" fontSize="9" textAnchor="middle">Server Room</text>
                    {/* Rack rows */}
                    {[0, 1, 2].map((i) => (
                      <rect key={i} x={220 + i * 60} y="115" width="40" height="90" opacity="0.3" fill="rgba(126, 184, 218, 0.05)" />
                    ))}
                    {/* Cable paths */}
                    <path d="M300,220 L300,260 L150,260 L150,320" strokeDasharray="4 3" opacity="0.4" />
                    <path d="M300,220 L300,260 L450,260 L450,320" strokeDasharray="4 3" opacity="0.4" />
                    {/* Network closets */}
                    <rect x="120" y="320" width="60" height="40" />
                    <text x="150" y="344" fill="rgba(126, 184, 218, 0.3)" fontSize="6" textAnchor="middle">IDF-A</text>
                    <rect x="420" y="320" width="60" height="40" />
                    <text x="450" y="344" fill="rgba(126, 184, 218, 0.3)" fontSize="6" textAnchor="middle">IDF-B</text>
                    {/* Wireless coverage */}
                    <circle cx="300" cy="300" r="80" strokeDasharray="6 4" opacity="0.15" />
                    <circle cx="300" cy="300" r="40" strokeDasharray="4 3" opacity="0.1" />
                  </>
                )}
              </g>

              {/* Dimension lines */}
              <g stroke="rgba(201, 168, 76, 0.2)" strokeWidth="0.5" fontSize="7" fill="rgba(201, 168, 76, 0.3)">
                <line x1="80" y1="380" x2="520" y2="380" />
                <line x1="80" y1="375" x2="80" y2="385" />
                <line x1="520" y1="375" x2="520" y2="385" />
                <text x="300" y="395" textAnchor="middle">120&apos;-0&quot;</text>
              </g>

              {/* Scale indicator */}
              <g fill="rgba(126, 184, 218, 0.3)" fontSize="7">
                <text x="30" y="385">Scale: 1/16&quot; = 1&apos;-0&quot;</text>
              </g>
            </svg>

            {/* Scanning line animation */}
            <div className="blueprints__scan-line" />
          </div>

          {/* Info panel */}
          <div className="blueprints__info">
            <h3>{activeBlueprint.name}</h3>
            <span className="blueprints__type-badge">{activeBlueprint.type}</span>
            <p>{activeBlueprint.description}</p>

            <h4>Key Features</h4>
            <ul className="blueprints__features">
              {activeBlueprint.features.map((feature) => (
                <li
                  key={feature}
                  className={`blueprints__feature ${hoveredFeature === feature ? 'blueprints__feature--active' : ''}`}
                  onMouseEnter={() => setHoveredFeature(feature)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <span className="blueprints__feature-dot" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
