import { useId } from 'react'

/**
 * Elvish-style decorative border using Tengwar-inspired SVG paths.
 * These aren't actual Tengwar — just decorative curves that evoke the aesthetic.
 */
export function ElvishBorder() {
  const uid = useId().replace(/:/g, '')
  const gradId = `elvish-${uid}`

  return (
    <>
      <div className="elvish-border elvish-border--top">
        <svg viewBox="0 0 1200 40" preserveAspectRatio="none" className="elvish-border__svg">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="20%" stopColor="var(--color-gold-dim)" />
              <stop offset="50%" stopColor="var(--color-gold)" />
              <stop offset="80%" stopColor="var(--color-gold-dim)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          {/* Main line */}
          <path
            d="M0,20 Q100,5 200,20 T400,20 T600,20 T800,20 T1000,20 T1200,20"
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="0.5"
            opacity="0.6"
          />
          {/* Decorative flourishes */}
          <path
            d="M200,20 Q220,8 240,20 Q260,32 280,20"
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="0.8"
            opacity="0.4"
          />
          <path
            d="M500,20 Q530,6 560,20 Q590,34 620,20"
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="0.8"
            opacity="0.4"
          />
          <path
            d="M850,20 Q880,6 910,20 Q940,34 970,20"
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="0.8"
            opacity="0.4"
          />
          {/* Center ornament */}
          <circle cx="600" cy="20" r="3" fill="var(--color-gold)" opacity="0.5" />
          <circle cx="600" cy="20" r="6" fill="none" stroke="var(--color-gold)" strokeWidth="0.5" opacity="0.3" />
          {/* Elvish-inspired script marks */}
          {[150, 300, 450, 750, 900, 1050].map((x, i) => (
            <g key={i} opacity={0.25}>
              <line x1={x} y1={14} x2={x} y2={26} stroke="var(--color-gold)" strokeWidth="0.5" />
              <circle cx={x} cy={i % 2 === 0 ? 12 : 28} r="1.5" fill="none" stroke="var(--color-gold)" strokeWidth="0.5" />
            </g>
          ))}
        </svg>
      </div>

      <div className="elvish-border elvish-border--bottom">
        <svg viewBox="0 0 1200 40" preserveAspectRatio="none" className="elvish-border__svg">
          <path
            d="M0,20 Q100,35 200,20 T400,20 T600,20 T800,20 T1000,20 T1200,20"
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="0.5"
            opacity="0.6"
          />
          <circle cx="600" cy="20" r="3" fill="var(--color-gold)" opacity="0.5" />
          <circle cx="600" cy="20" r="6" fill="none" stroke="var(--color-gold)" strokeWidth="0.5" opacity="0.3" />
        </svg>
      </div>
    </>
  )
}
