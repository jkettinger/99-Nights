import { useState, useEffect, useRef, useCallback } from 'react'
import type { Point } from '../data/roadPaths'

interface Destination {
  id: number
  name: string
  slug: string
  map_x: number
  map_y: number
}

interface Props {
  destinations: Destination[]
  authHeaders: () => Record<string, string>
  onMessage: (text: string, type: 'success' | 'error') => void
}

interface RouteData {
  slug: string
  label: string
  color: string
  points: Point[]
  dirty: boolean
}

const START_SLUG = '__start_to_town__'

const ROUTE_COLORS: Record<string, string> = {
  [START_SLUG]: '#4a9eff',
  'the-keep': '#ff4a4a',
  'the-arena': '#ff9f1a',
  'work': '#4aff7f',
  'the-library': '#c74aff',
  'the-tavern': '#ffeb3b',
}

function colorForSlug(slug: string, index: number): string {
  if (ROUTE_COLORS[slug]) return ROUTE_COLORS[slug]
  const hues = [200, 30, 120, 280, 60, 340, 160, 90]
  return `hsl(${hues[index % hues.length]}, 70%, 60%)`
}

export default function AdminWaypointEditor({ destinations, authHeaders, onMessage }: Props) {
  const [routes, setRoutes] = useState<RouteData[]>([])
  const [selectedSlug, setSelectedSlug] = useState(START_SLUG)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Build route list from destinations + start-to-town
  const buildRoutes = useCallback((waypoints: Record<string, number[][]>) => {
    const result: RouteData[] = [
      {
        slug: START_SLUG,
        label: 'Start \u2192 Town',
        color: ROUTE_COLORS[START_SLUG] || '#4a9eff',
        points: (waypoints[START_SLUG] || []).map(p => [p[0], p[1]] as Point),
        dirty: false,
      },
    ]
    destinations.forEach((dest, i) => {
      result.push({
        slug: dest.slug,
        label: dest.name,
        color: colorForSlug(dest.slug, i + 1),
        points: (waypoints[dest.slug] || []).map(p => [p[0], p[1]] as Point),
        dirty: false,
      })
    })
    return result
  }, [destinations])

  // Fetch all waypoints
  useEffect(() => {
    setLoading(true)
    fetch('/api/road-waypoints')
      .then(res => res.ok ? res.json() : {})
      .then(data => {
        setRoutes(buildRoutes(data))
        setLoading(false)
      })
      .catch(() => {
        setRoutes(buildRoutes({}))
        setLoading(false)
      })
  }, [buildRoutes])

  const selected = routes.find(r => r.slug === selectedSlug)

  function getMapPercent(e: React.PointerEvent | PointerEvent): Point {
    const el = overlayRef.current!
    const rect = el.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
    return [Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y))]
  }

  function updatePoint(slug: string, idx: number, pt: Point) {
    setRoutes(prev =>
      prev.map(r =>
        r.slug === slug
          ? { ...r, points: r.points.map((p, i) => i === idx ? pt : p), dirty: true }
          : r
      )
    )
  }

  function addPoint(e: React.MouseEvent) {
    e.preventDefault()
    const pt = getMapPercent(e as unknown as React.PointerEvent)
    setRoutes(prev =>
      prev.map(r =>
        r.slug === selectedSlug
          ? { ...r, points: [...r.points, pt], dirty: true }
          : r
      )
    )
  }

  function removePoint(idx: number) {
    setRoutes(prev =>
      prev.map(r =>
        r.slug === selectedSlug
          ? { ...r, points: r.points.filter((_, i) => i !== idx), dirty: true }
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
    updatePoint(selectedSlug, dragIdx, pt)
  }

  function handlePointerUp() {
    setDragIdx(null)
  }

  async function handleSave() {
    if (!selected || !selected.dirty) return
    setSaving(true)
    try {
      const res = await fetch(`/api/road-waypoints/${selected.slug}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ waypoints: selected.points }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        onMessage(data?.error || 'Failed to save waypoints', 'error')
        return
      }
      setRoutes(prev =>
        prev.map(r => r.slug === selectedSlug ? { ...r, dirty: false } : r)
      )
      onMessage(`Waypoints saved for ${selected.label}`, 'success')
    } catch {
      onMessage('Unable to connect to server', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveAll() {
    const dirtyRoutes = routes.filter(r => r.dirty)
    if (dirtyRoutes.length === 0) return
    setSaving(true)
    let failed = 0
    for (const route of dirtyRoutes) {
      try {
        const res = await fetch(`/api/road-waypoints/${route.slug}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ waypoints: route.points }),
        })
        if (res.ok) {
          setRoutes(prev =>
            prev.map(r => r.slug === route.slug ? { ...r, dirty: false } : r)
          )
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }
    setSaving(false)
    if (failed > 0) {
      onMessage(`Saved ${dirtyRoutes.length - failed}/${dirtyRoutes.length} routes (${failed} failed)`, 'error')
    } else {
      onMessage(`All ${dirtyRoutes.length} routes saved`, 'success')
    }
  }

  const dirtyCount = routes.filter(r => r.dirty).length

  if (loading) {
    return (
      <section className="admin-section">
        <h2>Road Waypoints</h2>
        <p className="admin-empty">Loading waypoints...</p>
      </section>
    )
  }

  return (
    <section className="admin-section admin-section--wide">
      <h2>Road Waypoints</h2>

      <div className="wp-editor">
        {/* Route selector panel */}
        <div className="wp-sidebar">
          <div className="wp-sidebar__routes">
            {routes.map(route => (
              <button
                key={route.slug}
                type="button"
                className={`wp-route-btn${route.slug === selectedSlug ? ' wp-route-btn--active' : ''}${route.dirty ? ' wp-route-btn--dirty' : ''}`}
                style={{ '--route-color': route.color } as React.CSSProperties}
                onClick={() => setSelectedSlug(route.slug)}
              >
                <span className="wp-route-btn__name">{route.label}</span>
                <span className="wp-route-btn__count">{route.points.length} pts</span>
              </button>
            ))}
          </div>

          <div className="wp-sidebar__actions">
            <button
              type="button"
              className="admin-form__actions-btn wp-save-btn"
              disabled={!selected?.dirty || saving}
              onClick={handleSave}
            >
              {saving ? 'Saving...' : `Save ${selected?.label || ''}`}
            </button>
            {dirtyCount > 1 && (
              <button
                type="button"
                className="admin-btn--secondary wp-save-all-btn"
                disabled={saving}
                onClick={handleSaveAll}
              >
                Save All ({dirtyCount})
              </button>
            )}
          </div>

          <div className="wp-sidebar__help">
            <strong>Controls:</strong>
            <br />Drag dots to reposition
            <br />Right-click map to add point
            <br />Double-click dot to remove
          </div>
        </div>

        {/* Map canvas */}
        <div className="wp-canvas">
          <div
            ref={overlayRef}
            className="wp-map-wrap"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onContextMenu={addPoint}
          >
            <img src="/images/map.jpg" alt="Map" className="wp-map-img" draggable={false} />
            <div className="wp-map-dim" />

            {/* Dimmed routes for context */}
            {routes.map(route =>
              route.slug !== selectedSlug && route.points.length > 1 && (
                <svg key={`line-${route.slug}`} className="wp-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke={route.color}
                    strokeWidth="0.25"
                    strokeOpacity="0.3"
                    points={route.points.map(p => `${p[0]},${p[1]}`).join(' ')}
                  />
                </svg>
              )
            )}

            {/* Dimmed dots for non-selected routes */}
            {routes.map(route =>
              route.slug !== selectedSlug &&
              route.points.map((pt, i) => (
                <div
                  key={`${route.slug}-${i}`}
                  className="wp-dot wp-dot--dim"
                  style={{ left: `${pt[0]}%`, top: `${pt[1]}%`, '--dot-color': route.color } as React.CSSProperties}
                />
              ))
            )}

            {/* Selected route — connecting lines */}
            {selected && selected.points.length > 1 && (
              <svg className="wp-lines wp-lines--active" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke={selected.color}
                  strokeWidth="0.35"
                  strokeOpacity="0.7"
                  points={selected.points.map(p => `${p[0]},${p[1]}`).join(' ')}
                />
              </svg>
            )}

            {/* Selected route — draggable dots */}
            {selected && selected.points.map((pt, i) => (
              <div
                key={`sel-${i}`}
                className={`wp-dot wp-dot--editable${dragIdx === i ? ' wp-dot--dragging' : ''}`}
                style={{ left: `${pt[0]}%`, top: `${pt[1]}%`, '--dot-color': selected.color } as React.CSSProperties}
                onPointerDown={e => handlePointerDown(i, e)}
                onDoubleClick={() => removePoint(i)}
              >
                <span className="wp-dot__label">
                  {i} ({pt[0]},{pt[1]})
                </span>
              </div>
            ))}

            {/* Town hub marker — always visible */}
            <div
              className="wp-marker wp-marker--town"
              style={{ left: '61%', top: '67%' }}
            >
              <span className="wp-marker__label">TOWN</span>
            </div>

            {/* Destination markers for reference */}
            {destinations.map(dest => (
              <div
                key={`marker-${dest.id}`}
                className="wp-marker"
                style={{ left: `${dest.map_x}%`, top: `${dest.map_y}%` }}
              >
                <span className="wp-marker__label">{dest.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
