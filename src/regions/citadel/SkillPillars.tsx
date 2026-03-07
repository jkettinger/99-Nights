import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Pillar {
  id: string
  name: string
  icon: string
  level: number
  maxLevel: number
  description: string
  subskills: { name: string; proficiency: number }[]
}

const PILLARS: Pillar[] = [
  {
    id: 'frontend',
    name: 'Frontend Architecture',
    icon: '🏛',
    level: 9,
    maxLevel: 10,
    description: 'Building user interfaces that are both beautiful and performant. Component architecture, state management, rendering optimization.',
    subskills: [
      { name: 'React / TypeScript', proficiency: 95 },
      { name: 'CSS / Animation', proficiency: 85 },
      { name: 'Performance Optimization', proficiency: 80 },
      { name: 'Accessibility (a11y)', proficiency: 75 },
      { name: 'Testing (Jest/Cypress)', proficiency: 70 },
    ],
  },
  {
    id: 'backend',
    name: 'Backend Engineering',
    icon: '⚙',
    level: 8,
    maxLevel: 10,
    description: 'Server-side logic, API design, data persistence. Making sure the machinery behind the curtain runs smoothly and securely.',
    subskills: [
      { name: 'Node.js / Express', proficiency: 90 },
      { name: 'REST API Design', proficiency: 85 },
      { name: 'SQL / PostgreSQL', proficiency: 80 },
      { name: 'Authentication / Security', proficiency: 85 },
      { name: 'Microservices', proficiency: 65 },
    ],
  },
  {
    id: 'architecture',
    name: 'Hospital Architecture',
    icon: '🏥',
    level: 8,
    maxLevel: 10,
    description: 'Designing healing environments that serve patients, staff, and communities. Where healthcare meets the built environment.',
    subskills: [
      { name: 'Healthcare Planning', proficiency: 90 },
      { name: 'BIM / Revit', proficiency: 85 },
      { name: 'Code Compliance', proficiency: 80 },
      { name: 'Sustainability / LEED', proficiency: 70 },
      { name: 'Project Management', proficiency: 85 },
    ],
  },
  {
    id: 'devops',
    name: 'DevOps & Cloud',
    icon: '☁',
    level: 7,
    maxLevel: 10,
    description: 'Infrastructure as code, CI/CD pipelines, cloud architecture. Making deployment boring — in the best possible way.',
    subskills: [
      { name: 'AWS / Cloud Services', proficiency: 75 },
      { name: 'Docker / Containers', proficiency: 80 },
      { name: 'CI/CD Pipelines', proficiency: 75 },
      { name: 'Linux / Shell', proficiency: 70 },
      { name: 'Monitoring / Logging', proficiency: 65 },
    ],
  },
]

export function SkillPillars() {
  const [selectedPillar, setSelectedPillar] = useState<Pillar | null>(null)

  return (
    <div className="pillars">
      <h2 className="pillars__title">The Skill Pillars</h2>
      <p className="pillars__subtitle text-accent">
        Load-bearing columns of expertise
      </p>

      <div className="pillars__row">
        {PILLARS.map((pillar, i) => (
          <motion.button
            key={pillar.id}
            className={`pillars__column ${selectedPillar?.id === pillar.id ? 'pillars__column--active' : ''}`}
            onClick={() => setSelectedPillar(selectedPillar?.id === pillar.id ? null : pillar)}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15, duration: 0.4 }}
          >
            {/* Pillar visual */}
            <div className="pillars__visual">
              {/* Capital */}
              <div className="pillars__capital" />
              {/* Shaft with level indicator */}
              <div className="pillars__shaft">
                <div
                  className="pillars__level-fill"
                  style={{ height: `${(pillar.level / pillar.maxLevel) * 100}%` }}
                />
                <span className="pillars__level-text">
                  {pillar.level}/{pillar.maxLevel}
                </span>
              </div>
              {/* Base */}
              <div className="pillars__base" />
            </div>

            <span className="pillars__icon">{pillar.icon}</span>
            <span className="pillars__name">{pillar.name}</span>
          </motion.button>
        ))}
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selectedPillar && (
          <motion.div
            key={selectedPillar.id}
            className="pillars__detail"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="pillars__detail-inner">
              <h3>
                <span>{selectedPillar.icon}</span> {selectedPillar.name}
              </h3>
              <p>{selectedPillar.description}</p>

              <div className="pillars__subskills">
                {selectedPillar.subskills.map((skill, i) => (
                  <div key={skill.name} className="pillars__subskill">
                    <span className="pillars__subskill-name">{skill.name}</span>
                    <div className="pillars__subskill-bar">
                      <motion.div
                        className="pillars__subskill-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.proficiency}%` }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                      />
                    </div>
                    <span className="pillars__subskill-pct">{skill.proficiency}%</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
