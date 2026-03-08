import { useState, useEffect } from 'react'
import './pages.css'

export default function Home() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 5500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="page-center home-page">
      <div className="name-card">
        <h2>Jim Kettinger</h2>
      </div>
      <img
        src="/images/warrior.png"
        alt="Warrior avatar"
        className={`warrior${visible ? ' warrior--visible' : ''}`}
      />
    </div>
  )
}
