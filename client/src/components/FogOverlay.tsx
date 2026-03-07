import { useState, useEffect, useCallback } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { ISourceOptions } from '@tsparticles/engine'
import './FogOverlay.css'

const fogConfig: ISourceOptions = {
  fullScreen: false,
  background: { color: 'transparent' },
  particles: {
    number: { value: 90 },
    color: { value: ['#c8ccd4', '#b0b8c4', '#9aa4b0', '#d0d4da'] },
    shape: { type: 'image', options: { image: { src: '/images/smoke.png', width: 256, height: 256 } } },
    opacity: {
      value: { min: 0.15, max: 0.5 },
      animation: { enable: true, speed: 0.3, startValue: 'random', sync: false },
    },
    size: {
      value: { min: 150, max: 450 },
      animation: { enable: true, speed: 5, startValue: 'random', sync: false },
    },
    move: {
      enable: true,
      speed: { min: 0.2, max: 0.8 },
      direction: 'none' as const,
      random: true,
      straight: false,
      outModes: { default: 'out' as const },
    },
    rotate: {
      value: { min: 0, max: 360 },
      animation: { enable: true, speed: 2, sync: false },
    },
    wobble: {
      enable: true,
      distance: 20,
      speed: { min: 2, max: 6 },
    },
  },
  detectRetina: true,
}

export default function FogOverlay() {
  const [ready, setReady] = useState(false)
  const [fading, setFading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => setReady(true))
  }, [])

  useEffect(() => {
    if (!ready) return
    const t1 = setTimeout(() => setFading(true), 3000)
    const t2 = setTimeout(() => setDone(true), 5500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [ready])

  const particlesLoaded = useCallback(async () => {}, [])

  if (done) return null

  return (
    <div className={`fog-overlay${fading ? ' fog-fading' : ''}`}>
      {ready && (
        <Particles
          id="fog"
          options={fogConfig}
          particlesLoaded={particlesLoaded}
          className="fog-particles"
        />
      )}
    </div>
  )
}
