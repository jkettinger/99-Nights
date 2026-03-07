interface BannersProps {
  mouseX: number
}

interface Banner {
  color: string
  accent: string
  symbol: string
  name: string
  x: number
}

const BANNERS: Banner[] = [
  { color: '#8a3030', accent: '#c9a84c', symbol: '⚽', name: 'Football', x: 18 },
  { color: '#2a4a8a', accent: '#c9a84c', symbol: '🏈', name: 'Gridiron', x: 32 },
  { color: '#2a6a3a', accent: '#e8dcc4', symbol: '🏀', name: 'Basketball', x: 46 },
  { color: '#6a3a8a', accent: '#c9a84c', symbol: '⚾', name: 'Baseball', x: 60 },
  { color: '#8a6a2a', accent: '#e8dcc4', symbol: '🏒', name: 'Hockey', x: 74 },
]

/**
 * Animated banner pennants that sway based on mouse position.
 * Each banner represents a sport.
 */
export function Banners({ mouseX }: BannersProps) {
  const windOffset = (mouseX - 50) * 0.15

  return (
    <div className="banners">
      {BANNERS.map((banner, i) => {
        const sway = windOffset + Math.sin(i * 1.5) * 2
        return (
          <div
            key={banner.name}
            className="banner"
            style={{
              left: `${banner.x}%`,
              transform: `skewX(${sway}deg)`,
            }}
          >
            <div className="banner__pole" />
            <div
              className="banner__cloth"
              style={{ background: banner.color }}
            >
              <div
                className="banner__stripe"
                style={{ background: banner.accent }}
              />
              <span className="banner__symbol">{banner.symbol}</span>
              <span className="banner__name">{banner.name}</span>
              {/* Cloth bottom — pennant shape */}
              <div
                className="banner__tail"
                style={{ borderTopColor: banner.color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
