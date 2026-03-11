import { useState, useEffect } from 'react'

interface Buff {
  stat: string
  value: number
}

interface MenuItem {
  id: number
  name: string
  description: string | null
  category: 'beer' | 'coffee' | 'food' | 'dessert'
  price_gold: number
  buffs: Buff[]
  sort_order: number
}

const CATEGORIES: { key: MenuItem['category']; emoji: string; label: string }[] = [
  { key: 'beer', emoji: '\uD83C\uDF7A', label: 'Ales & Brews' },
  { key: 'coffee', emoji: '\u2615', label: 'Potions of Alertness' },
  { key: 'food', emoji: '\uD83C\uDF56', label: 'Hearty Fare' },
  { key: 'dessert', emoji: '\uD83C\uDF6B', label: 'Sweet Enchantments' },
]

export default function TavernMenu() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/menu-items')
      .then(res => res.ok ? res.json() : [])
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null

  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    items: items
      .filter(i => i.category === cat.key)
      .sort((a, b) => a.sort_order - b.sort_order),
  })).filter(cat => cat.items.length > 0)

  if (grouped.length === 0) return null

  return (
    <div className="tavern-menu">
      <div className="tavern-menu__inner">
        <h2 className="tavern-menu__title">Menu</h2>
        <div className="tavern-menu__divider" />

        {grouped.map(cat => (
          <div key={cat.key} className="tavern-menu__category">
            <h3 className="tavern-menu__category-header">
              <span className="tavern-menu__category-emoji">{cat.emoji}</span>
              {cat.label}
            </h3>

            {cat.items.map(item => (
              <div key={item.id} className="tavern-menu__item">
                <div className="tavern-menu__item-header">
                  <span className="tavern-menu__item-name">{item.name}</span>
                  <span className="tavern-menu__item-dots" />
                  <span className="tavern-menu__item-price">{item.price_gold}g</span>
                </div>
                {item.description && (
                  <p className="tavern-menu__item-desc">{item.description}</p>
                )}
                {(item.buffs || []).length > 0 && (
                  <div className="tavern-menu__item-buffs">
                    {(item.buffs || []).map((buff, i) => (
                      <span
                        key={i}
                        className={`tavern-menu__buff ${buff.value >= 0 ? 'tavern-menu__buff--positive' : 'tavern-menu__buff--negative'}`}
                      >
                        {buff.value >= 0 ? '+' : ''}{buff.value} {buff.stat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        <div className="tavern-menu__footer">
          <span>~ Prices in gold pieces ~</span>
        </div>
      </div>
    </div>
  )
}
