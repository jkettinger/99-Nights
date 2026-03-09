import { Link, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/admin', label: 'Destinations' },
  { path: '/admin/characters', label: 'Characters' },
  { path: '/admin/messages', label: 'Messages' },
  { path: '/admin/auto-messages', label: 'Auto Messages' },
  { path: '/admin/waypoints', label: 'Waypoints' },
]

export default function AdminNav() {
  const { pathname } = useLocation()

  return (
    <nav className="admin-nav" aria-label="Admin navigation">
      {NAV_ITEMS.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className={`admin-nav__item${pathname === item.path ? ' admin-nav__item--active' : ''}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
