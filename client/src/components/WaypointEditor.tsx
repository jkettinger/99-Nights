import { useState, useRef } from 'react'
import { startToTown, spokes, TOWN } from '../data/roadPaths'
import type { Point } from '../data/roadPaths'

interface EditableRoute {
  id: string
  name: string
  color: string
  points: Point[]
}

function buildInitialRoutes(): EditableRoute[] {
  return [
    { id: 'start-to-town', name: 'Start → Town', color: '#4a9eff', points: startToTown.map((p) => [...p] as Point) },
    { id: 'the-keep', name: 'The Keep', color: '#ff4a4a', points: (spokes['the-keep'] || []).map((p) => [...p] as Point) },
    { id: 'the-arena', name: 'The Arena', color: '#ff9f1a', points: (spokes['the-arena'] || []).map((p) => [...p] as Point) },
    { id: 'work', name: 'Work', color: '#4aff7f', points: (spokes['work'] || []).map((p) => [...p] as Point) },
    { id: 'the-library', name: 'The Library', color: '#c74aff', points: (spokes['the-library'] || []).map((p) => [...p] as Point) },
    { id: 'the-tavern', name: 'The Tavern', color: '#ffeb3b', points: (spokes['the-tavern'] || []).map((p) => [...p] as Point) },
  ]
}

export default function WaypointEditor() {
  const [routes, setRoutes] = useState<EditableRoute[]>(buildInitialRoutes)
  const [selectedId, setSelectedId] = useState('start-to-town')
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  const selected = routes.find((r) => r.id === selectedId)!

  function getMapPercent(e: React.PointerEvent | PointerEvent): Point {
    const el = overlayRef.current!
    const rect = el.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
    return [Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y))]
  }

  function updatePoint(routeId: string, idx: number, pt: Point) {
    setRoutes((prev) =>
      prev.map((r) =>
        r.id === routeId
          ? { ...r, points: r.points.map((p, i) => (i === idx ? pt : p)) }
          : r
      )
    )
  }

  function addPoint(e: React.MouseEvent) {
    e.preventDefault()
    const pt = getMapPercent(e as unknown as React.PointerEvent)
    setRoutes((prev) =>
      prev.map((r) =>
        r.id === selectedId ? { ...r, points: [...r.points, pt] } : r
      )
    )
  }

  function removePoint(idx: number) {
    setRoutes((prev) =>
      prev.map((r) =>
        r.id === selectedId
          ? { ...r, points: r.points.filter((_, i) => i !== idx) }
          : r
      )
    )
  }

  function handlePointerDown(idx: number, e: React.PointerEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragIdx(idx)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (dragIdx === null) return
    const pt = getMapPercent(e)
    updatePoint(selectedId, dragIdx, pt)
  }

  function handlePointerUp() {
    setDragIdx(null)
  }

  function copyCoordinates() {
    const lines: string[] = []
    for (const route of routes) {
      lines.push(`// ${route.name}`)
      if (route.id === 'start-to-town') {
        lines.push(`const startToTown: Point[] = [`)
      } else {
        lines.push(`'${route.id}': [`)
      }
      for (const p of route.points) {
        lines.push(`  [${p[0]}, ${p[1]}],`)
      }
      lines.push(route.id === 'start-to-town' ? `]` : `],`)
      lines.push('')
    }
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      ref={overlayRef}
      className="debug-overlay debug-overlay--editor"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onContextMenu={addPoint}
    >
      {/* Controls panel */}
      <div className="debug-panel">
        <div className="debug-panel__title">Waypoint Editor</div>
        <div className="debug-panel__routes">
          {routes.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`debug-route-btn${r.id === selectedId ? ' debug-route-btn--active' : ''}`}
              style={{ '--route-color': r.color } as React.CSSProperties}
              onClick={() => setSelectedId(r.id)}
            >
              {r.name} ({r.points.length})
            </button>
          ))}
        </div>
        <button type="button" className="debug-copy-btn" onClick={copyCoordinates}>
          {copied ? 'Copied!' : 'Copy All Coordinates'}
        </button>
        <div className="debug-panel__help">
          Drag dots to move | Right-click map to add | Double-click dot to remove
        </div>
      </div>

      {/* All routes (dimmed) */}
      {routes.map((route) =>
        route.id !== selectedId &&
        route.points.map((pt, i) => (
          <div
            key={`${route.id}-${i}`}
            className="debug-dot debug-dot--dim"
            style={{ left: `${pt[0]}%`, top: `${pt[1]}%`, '--dot-color': route.color } as React.CSSProperties}
          />
        ))
      )}

      {/* Selected route — lines connecting dots */}
      {selected.points.length > 1 && (
        <svg className="debug-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke={selected.color}
            strokeWidth="0.3"
            strokeOpacity="0.6"
            points={selected.points.map((p) => `${p[0]},${p[1]}`).join(' ')}
          />
        </svg>
      )}

      {/* Selected route — draggable dots */}
      {selected.points.map((pt, i) => (
        <div
          key={`sel-${i}`}
          className={`debug-dot debug-dot--editable${dragIdx === i ? ' debug-dot--dragging' : ''}`}
          style={{ left: `${pt[0]}%`, top: `${pt[1]}%`, '--dot-color': selected.color } as React.CSSProperties}
          onPointerDown={(e) => handlePointerDown(i, e)}
          onDoubleClick={() => removePoint(i)}
        >
          <span className="debug-dot__label debug-dot__label--visible">
            {i} ({pt[0]},{pt[1]})
          </span>
        </div>
      ))}

      {/* Town hub marker (always visible) */}
      <div
        className="debug-dot"
        style={{ left: `${TOWN[0]}%`, top: `${TOWN[1]}%`, '--dot-color': '#fff' } as React.CSSProperties}
      >
        <span className="debug-dot__label debug-dot__label--visible">
          TOWN ({TOWN[0]},{TOWN[1]})
        </span>
      </div>
    </div>
  )
}
