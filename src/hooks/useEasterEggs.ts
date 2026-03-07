import { useEffect, useRef, useCallback, useState } from 'react'

const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a',
]

export function useKonamiCode(onActivate: () => void) {
  const indexRef = useRef(0)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === KONAMI_CODE[indexRef.current]) {
        indexRef.current++
        if (indexRef.current === KONAMI_CODE.length) {
          indexRef.current = 0
          onActivate()
        }
      } else {
        indexRef.current = 0
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onActivate])
}

export function useKonamiEasterEgg() {
  const [active, setActive] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const trigger = useCallback(() => {
    setActive(true)
    document.body.style.transition = 'transform 1s ease'
    document.body.style.transform = 'rotate(180deg)'

    timersRef.current.push(setTimeout(() => {
      document.body.style.transform = 'rotate(360deg)'
      timersRef.current.push(setTimeout(() => {
        document.body.style.transform = ''
        document.body.style.transition = ''
        setActive(false)
      }, 1000))
    }, 2000))
  }, [])

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
      document.body.style.transform = ''
      document.body.style.transition = ''
    }
  }, [])

  useKonamiCode(trigger)

  return active
}

export function useSecretClick(threshold = 3) {
  const countRef = useRef(0)
  const [triggered, setTriggered] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const triggeredTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleClick = useCallback(() => {
    countRef.current += 1
    if (countRef.current >= threshold) {
      countRef.current = 0
      setTriggered(true)
      if (triggeredTimerRef.current) clearTimeout(triggeredTimerRef.current)
      triggeredTimerRef.current = setTimeout(() => setTriggered(false), 5000)
    } else {
      // Reset count after 2 seconds of inactivity
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => { countRef.current = 0 }, 2000)
    }
  }, [threshold])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (triggeredTimerRef.current) clearTimeout(triggeredTimerRef.current)
    }
  }, [])

  return { handleClick, triggered }
}
