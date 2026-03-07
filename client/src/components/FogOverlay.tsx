import { useState, useEffect } from 'react'
import './FogOverlay.css'

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
        <div className="fog-layer fog-layer--base" />
        <div className="fog-layer fog-layer--wisp-1" />
        <div className="fog-layer fog-layer--wisp-2" />
        <div className="fog-layer fog-layer--wisp-3" />
        <div className="fog-layer fog-layer--glow" />
      </div>
      <div className={`fog-half fog-half--right${dissipate ? ' fog-dissipate' : ''}`}>
        <div className="fog-layer fog-layer--base" />
        <div className="fog-layer fog-layer--wisp-1" />
        <div className="fog-layer fog-layer--wisp-2" />
        <div className="fog-layer fog-layer--wisp-3" />
        <div className="fog-layer fog-layer--glow" />
      </div>
    </div>
  )
}
