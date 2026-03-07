import { useId } from 'react'

interface StainedGlassProps {
  mouseX: number
  mouseY: number
}

/**
 * Circuit-pattern stained glass windows that glow with light
 * based on mouse position (simulating shifting light).
 */
export function StainedGlass({ mouseX, mouseY }: StainedGlassProps) {
  const uid = useId().replace(/:/g, '')
  const lightAngle = (mouseX - 50) * 0.3
  const lightIntensity = Math.max(0.3, 1 - Math.abs(mouseY - 30) / 60)

  return (
    <div className="stained-glass">
      {/* Left window */}
      <div className="stained-glass__window stained-glass__window--left">
        <svg viewBox="0 0 200 400" className="stained-glass__svg">
          <defs>
            <radialGradient id={`glassGlowL-${uid}`} cx={`${50 + lightAngle}%`} cy="30%" r="60%">
              <stop offset="0%" stopColor={`rgba(126, 184, 218, ${lightIntensity * 0.4})`} />
              <stop offset="50%" stopColor={`rgba(100, 160, 200, ${lightIntensity * 0.15})`} />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <clipPath id={`archClipL-${uid}`}>
              <path d="M20,400 L20,120 Q100,0 180,120 L180,400 Z" />
            </clipPath>
          </defs>

          <g clipPath={`url(#archClipL-${uid})`}>
            {/* Window frame */}
            <rect x="20" y="0" width="160" height="400" fill="rgba(10, 15, 25, 0.8)" />
            <rect x="20" y="0" width="160" height="400" fill={`url(#glassGlowL-${uid})`} />

            {/* Circuit patterns */}
            <g stroke="rgba(126, 184, 218, 0.4)" strokeWidth="1" fill="none">
              {/* Vertical main line */}
              <line x1="100" y1="60" x2="100" y2="380" opacity="0.5" />
              {/* Horizontal branches */}
              <line x1="40" y1="140" x2="160" y2="140" opacity="0.3" />
              <line x1="40" y1="220" x2="160" y2="220" opacity="0.3" />
              <line x1="40" y1="300" x2="160" y2="300" opacity="0.3" />
              {/* Diagonal traces */}
              <path d="M60,140 L40,180 L60,220" opacity="0.25" />
              <path d="M140,140 L160,180 L140,220" opacity="0.25" />
              <path d="M60,220 L40,260 L60,300" opacity="0.25" />
              <path d="M140,220 L160,260 L140,300" opacity="0.25" />
            </g>

            {/* Circuit nodes */}
            <g fill="rgba(126, 184, 218, 0.6)">
              <circle cx="100" cy="100" r="4">
                <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="60" cy="140" r="2.5" />
              <circle cx="140" cy="140" r="2.5" />
              <circle cx="100" cy="180" r="3" />
              <circle cx="60" cy="220" r="2.5" />
              <circle cx="140" cy="220" r="2.5" />
              <circle cx="100" cy="260" r="3" />
              <circle cx="60" cy="300" r="2.5" />
              <circle cx="140" cy="300" r="2.5" />
              <circle cx="100" cy="340" r="4">
                <animate attributeName="opacity" values="0.4;0.8;0.4" dur="4s" repeatCount="indefinite" />
              </circle>
            </g>

            {/* Colored glass panels */}
            <rect x="30" y="145" width="60" height="70" fill="rgba(126, 184, 218, 0.06)" />
            <rect x="110" y="145" width="60" height="70" fill="rgba(160, 212, 196, 0.06)" />
            <rect x="30" y="225" width="60" height="70" fill="rgba(196, 160, 212, 0.06)" />
            <rect x="110" y="225" width="60" height="70" fill="rgba(212, 160, 80, 0.06)" />
          </g>

          {/* Arch frame */}
          <path
            d="M20,400 L20,120 Q100,0 180,120 L180,400"
            fill="none"
            stroke="#352d22"
            strokeWidth="4"
          />
          {/* Mullion */}
          <line x1="100" y1="40" x2="100" y2="400" stroke="#352d22" strokeWidth="2" />
        </svg>

        {/* Light beam */}
        <div
          className="stained-glass__beam"
          style={{
            opacity: lightIntensity * 0.15,
            transform: `skewX(${lightAngle}deg)`,
          }}
        />
      </div>

      {/* Right window */}
      <div className="stained-glass__window stained-glass__window--right">
        <svg viewBox="0 0 200 400" className="stained-glass__svg">
          <defs>
            <radialGradient id={`glassGlowR-${uid}`} cx={`${50 + lightAngle}%`} cy="30%" r="60%">
              <stop offset="0%" stopColor={`rgba(212, 160, 80, ${lightIntensity * 0.4})`} />
              <stop offset="50%" stopColor={`rgba(200, 140, 60, ${lightIntensity * 0.15})`} />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <clipPath id={`archClipR-${uid}`}>
              <path d="M20,400 L20,120 Q100,0 180,120 L180,400 Z" />
            </clipPath>
          </defs>

          <g clipPath={`url(#archClipR-${uid})`}>
            <rect x="20" y="0" width="160" height="400" fill="rgba(15, 10, 5, 0.8)" />
            <rect x="20" y="0" width="160" height="400" fill={`url(#glassGlowR-${uid})`} />

            {/* Architectural/blueprint patterns */}
            <g stroke="rgba(212, 160, 80, 0.3)" strokeWidth="0.5" fill="none">
              {/* Floor plan traces */}
              <rect x="40" y="120" width="50" height="40" />
              <rect x="110" y="120" width="50" height="40" />
              <rect x="55" y="180" width="90" height="60" />
              <line x1="55" y1="210" x2="145" y2="210" />
              <rect x="40" y="260" width="120" height="50" />
              <line x1="100" y1="260" x2="100" y2="310" />
              <rect x="60" y="330" width="80" height="40" />
            </g>

            {/* Nodes */}
            <g fill="rgba(212, 160, 80, 0.5)">
              <circle cx="100" cy="80" r="4">
                <animate attributeName="opacity" values="0.3;0.7;0.3" dur="3.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="65" cy="140" r="2" />
              <circle cx="135" cy="140" r="2" />
              <circle cx="100" cy="210" r="3" />
              <circle cx="100" cy="285" r="3" />
              <circle cx="100" cy="350" r="2" />
            </g>

            {/* Glass panels */}
            <rect x="30" y="125" width="60" height="30" fill="rgba(212, 160, 80, 0.06)" />
            <rect x="110" y="125" width="60" height="30" fill="rgba(232, 193, 112, 0.06)" />
            <rect x="60" y="185" width="80" height="50" fill="rgba(201, 168, 76, 0.05)" />
          </g>

          <path
            d="M20,400 L20,120 Q100,0 180,120 L180,400"
            fill="none"
            stroke="#352d22"
            strokeWidth="4"
          />
          <line x1="100" y1="40" x2="100" y2="400" stroke="#352d22" strokeWidth="2" />
        </svg>

        <div
          className="stained-glass__beam"
          style={{
            opacity: lightIntensity * 0.12,
            transform: `skewX(${lightAngle * 0.8}deg)`,
          }}
        />
      </div>
    </div>
  )
}
