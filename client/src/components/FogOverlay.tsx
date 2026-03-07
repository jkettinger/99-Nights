import { useState, useEffect, useCallback } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { ISourceOptions } from '@tsparticles/engine'
import './FogOverlay.css'

const fogConfig: ISourceOptions = {
  fullScreen: false,
  background: { color: 'transparent' },
  particles: {
    number: { value: 80 },
    color: { value: ['#c8ccd4', '#b0b8c4', '#9aa4b0', '#d0d4da'] },
    shape: { type: 'image', options: { image: { src: '/images/smoke.png', width: 256, height: 256 } } },
    opacity: {
      value: { min: 0.15, max: 0.5 },
      animation: { enable: true, speed: 0.3, startValue: 'random', sync: false },
    },
    size: {
      value: { min: 150, max: 400 },
      animation: { enable: true, speed: 5, startValue: 'random', sync: false },
    },
    move: {
      enable: true,
      speed: { min: 0.2, max: 0.8 },
      direction: 'none' as const,
      random: true,
      straight: false,
      outModes: { default: 'out' as const },
      drift: 0,
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
  const [phase, setPhase] = useState<'fog' | 'clearing' | 'done'>('fog')

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => setReady(true))
  }, [])

  useEffect(() => {
    if (!ready) return
    const t1 = setTimeout(() => setPhase('clearing'), 3000)
    const t2 = setTimeout(() => setPhase('done'), 5200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [ready])

  const particlesLoaded = useCallback(async () => {}, [])

  if (phase === 'done' || !ready) {
    if (phase === 'done') return null
    // Show solid bg while engine loads to prevent flash
    return <div className="fog-overlay" />
  }

  const clearing = phase === 'clearing'

  return (
    <div className="fog-overlay">
      <div className={`fog-half fog-left${clearing ? ' fog-clear' : ''}`}>
        <div className="fog-particles-wrap">
          <Particles id="fog-left" options={fogConfig} particlesLoaded={particlesLoaded} className="fog-particles" />
        </div>
      </div>
      <div className={`fog-half fog-right${clearing ? ' fog-clear' : ''}`}>
        <div className="fog-particles-wrap fog-particles-wrap--right">
          <Particles id="fog-right" options={fogConfig} particlesLoaded={particlesLoaded} className="fog-particles" />
        </div>
      </div>
    </div>
  )
}
