import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TransitionOverlay, usePageTransition } from './PageTransition'
import { useRegionAudio } from '../hooks/useAudio'
import './OverworldMap.css'

interface Region {
  id: string
  name: string
  subtitle: string
  icon: string
  x: number
  y: number
  route: string
  bannerDir: 'left' | 'right'
}

const REGIONS: Region[] = [
  { id: 'citadel', name: 'The Citadel', subtitle: 'Work & Architecture', icon: '\u2656', x: 48, y: 24, route: '/citadel', bannerDir: 'right' },
  { id: 'library', name: 'Ancient Library', subtitle: 'Literature & Writing', icon: '\uD83D\uDCD6', x: 18, y: 33, route: '/library', bannerDir: 'right' },
  { id: 'great-hall', name: 'The Great Hall', subtitle: 'Family', icon: '\u2302', x: 48, y: 46, route: '/great-hall', bannerDir: 'right' },
  { id: 'tavern', name: 'The Tavern', subtitle: 'Craft Beer', icon: '\uD83C\uDF7A', x: 68, y: 50, route: '/tavern', bannerDir: 'left' },
  { id: 'shore', name: 'The Shore', subtitle: 'Beach', icon: '\uD83C\uDF0A', x: 15, y: 62, route: '/shore', bannerDir: 'right' },
  { id: 'arena', name: 'The Arena', subtitle: 'Sports', icon: '\u2694', x: 83, y: 70, route: '/arena', bannerDir: 'left' },
  { id: 'wilds', name: 'Elder Wilds', subtitle: 'Fantasy', icon: '\u2726', x: 85, y: 30, route: '/wilds', bannerDir: 'left' },
]

const CAMP = { x: 48, y: 74 }

/* ===== Path Network for Avatar Travel ===== */

const PATH_EDGES = [
  { a: 'camp', b: 'great-hall', d: 'M48,74 Q48,60 48,46' },
  { a: 'camp', b: 'shore', d: 'M48,74 Q30,70 15,62' },
  { a: 'camp', b: 'arena', d: 'M48,74 Q65,74 83,70' },
  { a: 'great-hall', b: 'citadel', d: 'M48,46 Q48,35 48,24' },
  { a: 'great-hall', b: 'library', d: 'M48,46 Q33,40 18,33' },
  { a: 'great-hall', b: 'tavern', d: 'M48,46 Q58,47 68,50' },
  { a: 'tavern', b: 'arena', d: 'M68,50 Q76,58 83,70' },
  { a: 'tavern', b: 'wilds', d: 'M68,50 Q78,40 85,30' },
  { a: 'library', b: 'citadel', d: 'M18,33 Q33,26 48,24' },
  { a: 'shore', b: 'library', d: 'M15,62 Q14,48 18,33' },
]

function reverseQuadPath(d: string): string {
  const nums = d.match(/[\d.]+/g)
  if (!nums || nums.length !== 6) return d
  const [x1, y1, cx, cy, x2, y2] = nums
  return `M${x2},${y2} Q${cx},${cy} ${x1},${y1}`
}

function getEdgePath(from: string, to: string): string | null {
  const edge = PATH_EDGES.find(e =>
    (e.a === from && e.b === to) || (e.a === to && e.b === from)
  )
  if (!edge) return null
  return edge.a === from ? edge.d : reverseQuadPath(edge.d)
}

function findRoute(from: string, to: string): string[] | null {
  const queue: string[][] = [[from]]
  const visited = new Set([from])
  while (queue.length > 0) {
    const path = queue.shift()!
    const current = path[path.length - 1]
    if (current === to) return path
    for (const edge of PATH_EDGES) {
      const neighbor = edge.a === current ? edge.b : edge.b === current ? edge.a : null
      if (neighbor && !visited.has(neighbor)) {
        visited.add(neighbor)
        queue.push([...path, neighbor])
      }
    }
  }
  return null
}

function buildTravelPath(route: string[]): string {
  let result = ''
  for (let i = 0; i < route.length - 1; i++) {
    const seg = getEdgePath(route[i], route[i + 1])
    if (!seg) break
    result += i === 0 ? seg : (' ' + seg.replace(/^M[\d.,\s]+/, ''))
  }
  return result
}

/* ===== Component ===== */

export default function OverworldMap() {
  useRegionAudio('overworld')
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const { transitionConfig, triggerTransition, clearTransition } = usePageTransition()

  // Avatar travel
  const [travel, setTravel] = useState<{ pathData: string; region: Region } | null>(null)
  const [dustTrail, setDustTrail] = useState<{ x: number; y: number; id: number }[]>([])
  const travelPathRef = useRef<SVGPathElement>(null)
  const avatarRef = useRef<SVGGElement>(null)
  const travelAnimRef = useRef(0)
  const travelTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const avatarClipId = useId()

  const updatePos = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * 100
    const y = ((clientY - rect.top) / rect.height) * 100
    setMousePos({ x, y })
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onMouse = (e: MouseEvent) => updatePos(e.clientX, e.clientY)
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0]
      if (t) updatePos(t.clientX, t.clientY)
    }
    el.addEventListener('mousemove', onMouse)
    el.addEventListener('touchmove', onTouch, { passive: true })
    return () => {
      el.removeEventListener('mousemove', onMouse)
      el.removeEventListener('touchmove', onTouch)
    }
  }, [updatePos])

  const parallaxStyle = (depth: number) => ({
    transform: `translate(${(mousePos.x - 50) * depth * 0.15}px, ${(mousePos.y - 50) * depth * 0.1}px)`,
  })

  // Avatar travel animation
  useEffect(() => {
    if (!travel) return
    const path = travelPathRef.current
    const avatar = avatarRef.current
    if (!path || !avatar) return

    const totalLength = path.getTotalLength()
    const duration = Math.min(1500 + totalLength * 18, 3500)
    let startTime = 0
    let lastDustSample = 0
    let dustCount = 0
    const dustArr: { x: number; y: number; id: number }[] = []

    function step(now: number) {
      if (!startTime) startTime = now
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

      const pt = path!.getPointAtLength(eased * totalLength)
      const bob = Math.sin(elapsed * 0.008) * 0.3
      avatar!.setAttribute('transform', `translate(${pt.x},${pt.y + bob})`)

      if (elapsed - lastDustSample > 100 && t > 0.03 && t < 0.93) {
        lastDustSample = elapsed
        dustArr.push({ x: pt.x, y: pt.y + 1.2, id: dustCount++ })
        if (dustArr.length > 10) dustArr.shift()
        setDustTrail([...dustArr])
      }

      if (t < 1) {
        travelAnimRef.current = requestAnimationFrame(step)
      } else {
        const dest = travel!
        travelTimerRef.current = setTimeout(() => {
          setDustTrail([])
          setTravel(null)
          triggerTransition(dest.region.id, () => navigate(dest.region.route))
        }, 400)
      }
    }

    travelAnimRef.current = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(travelAnimRef.current)
      if (travelTimerRef.current) clearTimeout(travelTimerRef.current)
    }
  }, [travel, triggerTransition, navigate])

  const handleRegionClick = (region: Region) => {
    if (travel) return
    const route = findRoute('camp', region.id)
    if (!route) return
    const pathData = buildTravelPath(route)
    if (!pathData) return
    setTravel({ pathData, region })
  }

  return (
    <div
      className={`overworld${travel ? ' overworld--traveling' : ''}`}
      ref={containerRef}
      style={{
        '--mouse-x': `${mousePos.x}%`,
        '--mouse-y': `${mousePos.y}%`,
      } as React.CSSProperties}
    >
      <div className="overworld__parchment" />

      {/* Ornate frame */}
      <div className="overworld__frame">
        <FrameCorner pos="tl" />
        <FrameCorner pos="tr" />
        <FrameCorner pos="bl" />
        <FrameCorner pos="br" />
      </div>

      {/* Title cartouche */}
      <div className="overworld__title">
        <h1>Jiggling</h1>
        <p>A Wanderer&#39;s Atlas</p>
      </div>

      {/* Back layer — Mountains */}
      <div className="overworld__layer overworld__layer--back" style={parallaxStyle(1)}>
        <svg className="overworld__svg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          <path className="mountain mountain--far" d="M0,300 L60,160 L130,240 L200,100 L280,200 L360,120 L440,260 L520,80 L600,180 L680,110 L760,240 L840,140 L920,220 L1000,90 L1080,170 L1150,120 L1200,250 L1200,800 L0,800 Z" />
          <path className="mountain" d="M0,380 L90,260 L170,340 L250,210 L330,310 L430,180 L510,300 L590,240 L690,160 L770,280 L850,200 L930,310 L1010,230 L1100,320 L1200,260 L1200,800 L0,800 Z" />
          <path fill="rgba(212,196,160,0.08)" d="M200,100 L220,140 L180,140 Z M520,80 L545,125 L495,125 Z M1000,90 L1025,135 L975,135 Z M690,160 L715,200 L665,200 Z" />
        </svg>
      </div>

      {/* Mid layer — Terrain */}
      <div className="overworld__layer overworld__layer--mid" style={parallaxStyle(2)}>
        <svg className="overworld__svg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          {/* Coastline */}
          <path className="terrain-coast" d="M0,300 Q50,340 30,380 Q10,420 40,460 Q70,500 30,540 Q-10,580 20,620 Q50,660 0,700 L0,800 L-50,800 L-50,300 Z" />
          <path className="terrain-coast terrain-coast--shallow" d="M0,300 Q30,330 15,360 Q0,400 20,440 Q45,470 15,510 Q-5,550 10,590 Q30,620 0,660 L0,800 L-20,800 L-20,300 Z" />

          {/* River */}
          <path className="terrain-river" d="M850,80 Q780,160 720,240 Q660,320 580,370 Q480,420 380,440 Q280,460 200,490 Q140,510 80,550" />
          <path className="terrain-river terrain-river--shimmer" d="M850,80 Q780,160 720,240 Q660,320 580,370 Q480,420 380,440 Q280,460 200,490 Q140,510 80,550" />

          {/* Dense forest — Elder Wilds (right) */}
          {generateForest(950, 180, 16)}
          {generateForest(1020, 220, 14)}
          {generateForest(1080, 200, 12)}
          {generateForest(980, 260, 10)}
          {generateForest(1050, 280, 13)}
          {generateForest(1100, 250, 8)}
          {generateForest(920, 240, 11)}

          {/* Forest — Library area (upper left) */}
          {generateForest(180, 230, 10)}
          {generateForest(240, 260, 8)}
          {generateForest(150, 290, 9)}
          {generateForest(280, 240, 7)}

          {/* Scattered forest patches */}
          {generateForest(400, 350, 6)}
          {generateForest(700, 380, 5)}
          {generateForest(500, 310, 7)}
          {generateForest(800, 330, 6)}
          {generateForest(350, 510, 5)}
          {generateForest(600, 490, 4)}
          {generateForest(750, 510, 6)}

          {/* Southern forests */}
          {generateForest(300, 580, 8)}
          {generateForest(650, 570, 7)}
          {generateForest(850, 550, 9)}

          {/* Shore area — water */}
          <ellipse cx="140" cy="520" rx="80" ry="50" fill="rgba(110,212,196,0.06)" />
          <ellipse cx="120" cy="500" rx="50" ry="30" fill="rgba(110,212,196,0.04)" />

          {/* Citadel structure */}
          <g opacity="0.5" transform="translate(556, 165)">
            <rect x="0" y="0" width="35" height="55" fill="#2a2318" />
            <rect x="8" y="-20" width="12" height="20" fill="#2a2318" />
            <polygon points="5,0 17,-25 29,0" fill="#2a2318" />
            <rect x="35" y="10" width="22" height="45" fill="#2a2318" />
            <polygon points="35,10 46,-10 57,10" fill="#2a2318" />
          </g>

          {/* Great Hall structure */}
          <g opacity="0.4" transform="translate(555, 340)">
            <rect x="0" y="0" width="60" height="40" fill="#2a2318" />
            <polygon points="-5,0 30,-30 65,0" fill="#2a2318" />
            <rect x="65" y="10" width="20" height="30" fill="#2a2318" opacity="0.6" />
          </g>

          {/* Arena structure */}
          <g opacity="0.35" transform="translate(965, 535)">
            <ellipse cx="25" cy="20" rx="40" ry="22" fill="none" stroke="#2a2318" strokeWidth="5" />
            <path d="M-15,20 Q-15,0 25,-5 Q65,0 65,20" fill="#2a2318" opacity="0.3" />
          </g>

          {/* Fields — center south */}
          <g opacity="0.06">
            <rect x="420" y="550" width="180" height="90" fill="var(--color-parchment-dark)" rx="4" />
            {[440, 470, 500, 530, 560].map(lx => (
              <line key={lx} x1={lx} y1="550" x2={lx} y2="640" stroke="var(--color-parchment-dark)" strokeWidth="1" />
            ))}
          </g>
        </svg>
      </div>

      {/* Front layer — Roads, Markers, Avatar */}
      <div className="overworld__layer overworld__layer--front" style={parallaxStyle(3)}>
        <svg className="overworld__svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
          {/* Road paths */}
          {PATH_EDGES.map((edge, i) => (
            <path key={i} className="map-path" d={edge.d} />
          ))}

          {/* Region markers with banners */}
          {REGIONS.map((region) => {
            const sx = region.x, sy = region.y
            const dir = region.bannerDir
            return (
              <g
                key={region.id}
                className={`region-marker region-marker--${region.id}`}
                onClick={() => handleRegionClick(region)}
                tabIndex={0}
                role="button"
                aria-label={`Enter ${region.name}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleRegionClick(region)
                  }
                }}
                style={{ transformOrigin: `${sx}px ${sy}px` }}
              >
                {/* Shield shape */}
                <path
                  className="marker__shield"
                  d={`M${sx},${sy - 2} L${sx + 1.8},${sy - 1.2} L${sx + 1.8},${sy + 0.5} Q${sx + 1.8},${sy + 2.2} ${sx},${sy + 2.5} Q${sx - 1.8},${sy + 2.2} ${sx - 1.8},${sy + 0.5} L${sx - 1.8},${sy - 1.2} Z`}
                />

                {/* Shield icon */}
                <text className="marker__icon" x={sx} y={sy + 0.8}>{region.icon}</text>

                {/* Banner ribbon */}
                {dir === 'right' ? (
                  <g className="marker__banner">
                    <rect className="banner__connector" x={sx + 1.8} y={sy - 0.4} width={0.8} height={0.8} />
                    <path
                      className="banner__shape"
                      d={`M${sx + 2.5},${sy - 1.5} L${sx + 20},${sy - 1.5} L${sx + 21.5},${sy} L${sx + 20},${sy + 1.5} L${sx + 2.5},${sy + 1.5} Z`}
                    />
                    <text className="banner__text" x={sx + 11.8} y={sy + 0.5}>{region.name}</text>
                  </g>
                ) : (
                  <g className="marker__banner">
                    <rect className="banner__connector" x={sx - 2.6} y={sy - 0.4} width={0.8} height={0.8} />
                    <path
                      className="banner__shape"
                      d={`M${sx - 2.5},${sy - 1.5} L${sx - 20},${sy - 1.5} L${sx - 21.5},${sy} L${sx - 20},${sy + 1.5} L${sx - 2.5},${sy + 1.5} Z`}
                    />
                    <text className="banner__text" x={sx - 11.8} y={sy + 0.5}>{region.name}</text>
                  </g>
                )}
              </g>
            )
          })}

          {/* Camp marker */}
          <g className="camp-marker">
            <ellipse cx={CAMP.x} cy={CAMP.y + 0.5} rx="2" ry="0.6" fill="rgba(42,35,24,0.3)" />
            <rect x={CAMP.x - 1.2} y={CAMP.y - 0.3} width="2.4" height="0.5" rx="0.2" fill="#3a2a18" opacity="0.4" transform={`rotate(-20 ${CAMP.x} ${CAMP.y})`} />
            <rect x={CAMP.x - 1.2} y={CAMP.y - 0.3} width="2.4" height="0.5" rx="0.2" fill="#3a2a18" opacity="0.4" transform={`rotate(20 ${CAMP.x} ${CAMP.y})`} />
            <ellipse cx={CAMP.x} cy={CAMP.y - 0.8} rx="0.7" ry="1" fill="#d4721a" opacity="0.4">
              <animate attributeName="opacity" values="0.3;0.5;0.3" dur="1.5s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx={CAMP.x} cy={CAMP.y - 1.2} rx="0.4" ry="0.6" fill="#e6c555" opacity="0.3" />
          </g>

          {/* Travel visualization */}
          {travel && (
            <>
              <path ref={travelPathRef} d={travel.pathData} fill="none" stroke="none" />
              {dustTrail.map(dust => (
                <circle key={dust.id} className="travel-dust" cx={dust.x} cy={dust.y} r="0.6" />
              ))}
              {/* Pulsing glow on target destination */}
              <circle
                className="travel-target-glow"
                cx={travel.region.x}
                cy={travel.region.y}
                r={4}
              />
            </>
          )}

          {/* Avatar — at camp when idle, animated when traveling */}
          <g ref={avatarRef} className="travel-avatar" transform={`translate(${CAMP.x},${CAMP.y})`}>
            <defs>
              <clipPath id={avatarClipId}>
                <circle cx="0" cy="-3" r="2.2" />
              </clipPath>
            </defs>
            <ellipse cx="0" cy="0.3" rx="1.8" ry="0.5" fill="rgba(0,0,0,0.12)" />
            <circle cx="0" cy="-3" r="4" className="travel-avatar__glow" />
            <circle cx="0" cy="-3" r="2.5" fill="var(--color-bg-deep)" />
            <image
              href="/images/hero-portrait.jpg"
              x="-2.2" y="-5.2" width="4.4" height="4.4"
              clipPath={`url(#${avatarClipId})`}
              preserveAspectRatio="xMidYMid slice"
            />
            <circle cx="0" cy="-3" r="2.5" fill="none" stroke="var(--color-gold)" strokeWidth="0.3" />
          </g>

          {/* Avatar label when idle */}
          {!travel && (
            <text className="avatar-label" x={CAMP.x} y={CAMP.y - 7} textAnchor="middle">The Wanderer</text>
          )}
        </svg>
      </div>

      {/* Mist */}
      <div className="overworld__mist" />

      {/* Clouds */}
      <div className="overworld__clouds">
        <div className="cloud cloud--1" />
        <div className="cloud cloud--2" />
        <div className="cloud cloud--3" />
        <div className="cloud cloud--4" />
      </div>

      {/* Ambient */}
      <Bird className="bird--1" size={20} />
      <Bird className="bird--2" size={16} />
      <Bird className="bird--3" size={14} />
      <TavernSmoke x={68} y={46} />
      <ShoreWaves x={15} y={66} />
      <CitadelLights x={48} y={22} />

      {/* Fog of war */}
      <div className="overworld__fog" />

      {/* Vignette */}
      <div className="overworld__vignette" />

      {/* Compass */}
      <Compass />

      {/* Transition overlay */}
      <TransitionOverlay config={transitionConfig} onComplete={clearTransition} />
    </div>
  )
}

/* ===== Sub-components ===== */

function generateForest(cx: number, cy: number, count: number) {
  const trees = []
  for (let i = 0; i < count; i++) {
    const offsetX = (Math.sin(i * 2.3 + cx) * 30)
    const offsetY = (Math.cos(i * 1.7 + cy) * 20)
    const height = 15 + Math.sin(i * 3.1) * 8
    const x = cx + offsetX
    const y = cy + offsetY
    trees.push(
      <polygon
        key={`tree-${cx}-${cy}-${i}`}
        className={i % 3 === 0 ? 'forest-tree forest-tree--light' : 'forest-tree'}
        points={`${x},${y - height} ${x - 6},${y} ${x + 6},${y}`}
      />
    )
  }
  return <g key={`forest-${cx}-${cy}`}>{trees}</g>
}

function Bird({ className, size }: { className: string; size: number }) {
  return (
    <svg className={`bird ${className}`} width={size} height={size * 0.5} viewBox="0 0 20 10">
      <path className="bird__wing" d="M0,6 Q5,1 10,5 Q15,1 20,6">
        <animate attributeName="d" dur="0.4s" repeatCount="indefinite"
          values="M0,6 Q5,1 10,5 Q15,1 20,6;M0,6 Q5,9 10,5 Q15,9 20,6;M0,6 Q5,1 10,5 Q15,1 20,6" />
      </path>
    </svg>
  )
}

function TavernSmoke({ x, y }: { x: number; y: number }) {
  return (
    <div style={{ position: 'absolute', left: `${x}%`, top: `${y}%` }}>
      <div className="smoke-particle" />
      <div className="smoke-particle" />
      <div className="smoke-particle" />
    </div>
  )
}

function ShoreWaves({ x, y }: { x: number; y: number }) {
  return (
    <div style={{ position: 'absolute', left: `${x}%`, top: `${y}%` }}>
      {[0, 1, 2].map((i) => (
        <svg key={i} className={`wave wave--${i + 1}`} width="40" height="10" viewBox="0 0 40 10"
          style={{ position: 'absolute', top: `${i * 8}px`, left: `${i * 5}px` }}>
          <path className="wave__line" d="M0,5 Q10,0 20,5 Q30,10 40,5" />
        </svg>
      ))}
    </div>
  )
}

function CitadelLights({ x, y }: { x: number; y: number }) {
  return (
    <div style={{ position: 'absolute', left: `${x}%`, top: `${y}%` }}>
      <div className="flicker-light" style={{ top: '-8px', left: '2px' }} />
      <div className="flicker-light" style={{ top: '-12px', left: '8px' }} />
      <div className="flicker-light" style={{ top: '-5px', left: '-4px' }} />
    </div>
  )
}

function FrameCorner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  return (
    <svg className={`frame-corner frame-corner--${pos}`} width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="16" fill="#1a1408" stroke="rgba(201,168,76,0.35)" strokeWidth="1.5" />
      <circle cx="18" cy="18" r="11" fill="none" stroke="rgba(201,168,76,0.2)" strokeWidth="0.8" />
      <circle cx="18" cy="18" r="5" fill="rgba(201,168,76,0.15)" />
      <circle cx="18" cy="18" r="2" fill="rgba(201,168,76,0.25)" />
    </svg>
  )
}

function Compass() {
  return (
    <svg className="compass" width="60" height="60" viewBox="0 0 60 60" aria-hidden="true">
      <circle cx="30" cy="30" r="28" fill="none" stroke="var(--color-gold-dim)" strokeWidth="1" opacity="0.5" />
      <circle cx="30" cy="30" r="24" fill="none" stroke="var(--color-gold-dim)" strokeWidth="0.5" opacity="0.3" />
      <polygon points="30,6 33,24 27,24" fill="var(--color-gold)" opacity="0.6" />
      <polygon points="30,54 33,36 27,36" fill="var(--color-parchment-dark)" opacity="0.4" />
      <polygon points="54,30 36,33 36,27" fill="var(--color-parchment-dark)" opacity="0.4" />
      <polygon points="6,30 24,33 24,27" fill="var(--color-parchment-dark)" opacity="0.4" />
      <circle cx="30" cy="30" r="2" fill="var(--color-gold)" opacity="0.7" />
      <text x="30" y="4" fill="var(--color-gold)" fontSize="5" fontFamily="var(--font-heading)" textAnchor="middle" opacity="0.6">N</text>
      <text x="30" y="59" fill="var(--color-parchment-dark)" fontSize="5" fontFamily="var(--font-heading)" textAnchor="middle" opacity="0.4">S</text>
      <text x="58" y="32" fill="var(--color-parchment-dark)" fontSize="5" fontFamily="var(--font-heading)" textAnchor="middle" opacity="0.4">E</text>
      <text x="2" y="32" fill="var(--color-parchment-dark)" fontSize="5" fontFamily="var(--font-heading)" textAnchor="middle" opacity="0.4">W</text>
    </svg>
  )
}
