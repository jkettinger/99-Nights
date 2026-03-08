import { useState, useRef, useEffect } from 'react'
import { ICON_MAP, CATEGORIES } from './iconMap'

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
}

export default function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const current = value && ICON_MAP[value]
  const CurrentIcon = current ? current.component : null

  const filtered = search.trim()
    ? Object.entries(ICON_MAP).filter(
        ([key, entry]) =>
          key.includes(search.toLowerCase()) ||
          entry.label.toLowerCase().includes(search.toLowerCase()) ||
          entry.category.toLowerCase().includes(search.toLowerCase())
      )
    : null

  return (
    <div
      className="icon-picker"
      ref={ref}
      onKeyDown={(e) => { if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false) } }}
    >
      <button
        type="button"
        className="icon-picker__trigger"
        onClick={() => { setOpen(!open); setSearch('') }}
        aria-label="Choose icon"
      >
        <span className="icon-picker__preview">
          {CurrentIcon ? <CurrentIcon size={18} /> : '✦'}
        </span>
        <span className="icon-picker__name">{current ? current.label : 'Choose icon'}</span>
        <span className="icon-picker__chevron">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="icon-picker__dropdown">
          <input
            type="text"
            className="icon-picker__search"
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />

          <div className="icon-picker__scroll">
            {filtered ? (
              filtered.length === 0 ? (
                <div className="icon-picker__empty">No icons found</div>
              ) : (
                <div className="icon-picker__grid">
                  {filtered.map(([key, entry]) => {
                    const Icon = entry.component
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`icon-picker__option${value === key ? ' icon-picker__option--selected' : ''}`}
                        title={entry.label}
                        onClick={() => { onChange(key); setOpen(false) }}
                      >
                        <Icon size={18} />
                      </button>
                    )
                  })}
                </div>
              )
            ) : (
              CATEGORIES.map((cat) => (
                <div key={cat} className="icon-picker__category">
                  <div className="icon-picker__category-label">{cat}</div>
                  <div className="icon-picker__grid">
                    {Object.entries(ICON_MAP)
                      .filter(([, entry]) => entry.category === cat)
                      .map(([key, entry]) => {
                        const Icon = entry.component
                        return (
                          <button
                            key={key}
                            type="button"
                            className={`icon-picker__option${value === key ? ' icon-picker__option--selected' : ''}`}
                            title={entry.label}
                            onClick={() => { onChange(key); setOpen(false) }}
                          >
                            <Icon size={18} />
                          </button>
                        )
                      })}
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            type="button"
            className="icon-picker__clear"
            onClick={() => { onChange(''); setOpen(false) }}
          >
            Clear icon
          </button>
        </div>
      )}
    </div>
  )
}
