import { useState, useEffect, useRef, useCallback } from 'react'
import './FogOverlay.css'

interface Particle {
  x: number
  y: number
  radius: number
  opacity: number
  vx: number
  vy: number
  blur: number
  drift: number // sinusoidal drift amplitude
  driftSpeed: number
  phase: number // offset so particles don't move in sync
}

function createParticles(
  width: number,
  height: number,
  count: number,
): Particle[] {
  const particles: Particle[] = []
  for (let i = 0; i < count; i++) {
    // Depth layer: 0 = far background, 1 = near foreground
    const depth = Math.random()
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 30 + depth * 120 + Math.random() * 60,
      opacity: 0.02 + depth * 0.06 + Math.random() * 0.03,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.15,
      blur: 15 + (1 - depth) * 35,
      drift: 10 + Math.random() * 30,
      driftSpeed: 0.0003 + Math.random() * 0.0008,
      phase: Math.random() * Math.PI * 2,
    })
  }
  return particles
}

function FogCanvas({ side }: { side: 'left' | 'right' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animRef = useRef<number>(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const now = performance.now()

    // Clear with the background color
    ctx.fillStyle = '#1A1E25'
    ctx.fillRect(0, 0, w, h)

    const particles = particlesRef.current

    for (const p of particles) {
      // Organic sinusoidal drift
      const driftX = Math.sin(now * p.driftSpeed + p.phase) * p.drift
      const driftY = Math.cos(now * p.driftSpeed * 0.7 + p.phase + 1.3) * p.drift * 0.5

      // Slow linear movement
      p.x += p.vx
      p.y += p.vy

      // Wrap particles that wander off
      if (p.x < -p.radius * 2) p.x = w + p.radius
      if (p.x > w + p.radius * 2) p.x = -p.radius
      if (p.y < -p.radius * 2) p.y = h + p.radius
      if (p.y > h + p.radius * 2) p.y = -p.radius

      const drawX = p.x + driftX
      const drawY = p.y + driftY

      ctx.save()
      ctx.filter = `blur(${p.blur}px)`
      ctx.globalAlpha = p.opacity

      // Radial gradient for soft smoky edges
      const gradient = ctx.createRadialGradient(
        drawX, drawY, 0,
        drawX, drawY, p.radius,
      )
      gradient.addColorStop(0, 'rgba(190, 195, 205, 1)')
      gradient.addColorStop(0.3, 'rgba(170, 178, 188, 0.6)')
      gradient.addColorStop(0.7, 'rgba(150, 160, 170, 0.2)')
      gradient.addColorStop(1, 'rgba(130, 140, 155, 0)')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(drawX, drawY, p.radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    animRef.current = requestAnimationFrame(draw)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.scale(dpr, dpr)

      // More particles for larger screens, fewer for mobile
      const area = rect.width * rect.height
      const count = Math.floor(area / 6000)
      particlesRef.current = createParticles(rect.width, rect.height, Math.max(30, Math.min(count, 120)))
    }

    resize()
    animRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animRef.current)
    }
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      className="fog-canvas"
      aria-hidden="true"
    />
  )
}

export default function FogOverlay() {
  const [dissipate, setDissipate] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const dissipateTimer = setTimeout(() => setDissipate(true), 3000)
    const hideTimer = setTimeout(() => setHidden(true), 4500)
    return () => {
      clearTimeout(dissipateTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  return (
    <div className={`fog-overlay${hidden ? ' fog-hidden' : ''}`}>
      <div className={`fog-half fog-half--left${dissipate ? ' fog-dissipate' : ''}`}>
        <FogCanvas side="left" />
      </div>
      <div className={`fog-half fog-half--right${dissipate ? ' fog-dissipate' : ''}`}>
        <FogCanvas side="right" />
      </div>
    </div>
  )
}
