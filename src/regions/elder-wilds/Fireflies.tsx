import { useEffect, useRef } from 'react'

interface FirefliesProps {
  count?: number
}

interface Firefly {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  brightness: number
  phase: number
  speed: number
}

export function Fireflies({ count = 30 }: FirefliesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const firefliesRef = useRef<Firefly[]>([])
  const animFrameRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = window.devicePixelRatio
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Rescale firefly positions to new canvas dimensions
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      firefliesRef.current.forEach((f) => {
        if (f.x > w) f.x = Math.random() * w
        if (f.y > h) f.y = Math.random() * h
      })
    }
    resize()
    window.addEventListener('resize', resize)

    // Initialize fireflies
    const w = canvas.offsetWidth
    const h = canvas.offsetHeight
    firefliesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.3,
      size: 1.5 + Math.random() * 2,
      brightness: Math.random(),
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 1.5,
    }))

    let time = 0
    const animate = () => {
      time += 0.016
      const cw = canvas.offsetWidth
      const ch = canvas.offsetHeight
      ctx.clearRect(0, 0, cw, ch)

      firefliesRef.current.forEach((f) => {
        // Gentle wandering motion
        f.x += f.vx + Math.sin(time * f.speed + f.phase) * 0.3
        f.y += f.vy + Math.cos(time * f.speed * 0.7 + f.phase) * 0.2

        // Wrap around edges
        if (f.x < -10) f.x = cw + 10
        if (f.x > cw + 10) f.x = -10
        if (f.y < -10) f.y = ch + 10
        if (f.y > ch + 10) f.y = -10

        // Pulsing glow
        const pulse = (Math.sin(time * f.speed * 2 + f.phase) + 1) * 0.5
        const alpha = 0.2 + pulse * 0.8

        // Outer glow
        const gradient = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size * 6)
        gradient.addColorStop(0, `rgba(180, 220, 80, ${alpha * 0.6})`)
        gradient.addColorStop(0.3, `rgba(140, 200, 60, ${alpha * 0.3})`)
        gradient.addColorStop(1, 'rgba(140, 200, 60, 0)')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(f.x, f.y, f.size * 6, 0, Math.PI * 2)
        ctx.fill()

        // Bright core
        ctx.fillStyle = `rgba(220, 255, 150, ${alpha})`
        ctx.beginPath()
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2)
        ctx.fill()
      })

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [count])

  return (
    <canvas
      ref={canvasRef}
      className="ew__fireflies"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    />
  )
}
