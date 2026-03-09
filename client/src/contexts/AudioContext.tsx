import { createContext, useContext, useState, useEffect, useRef } from 'react'
import type { ReactNode, ChangeEvent } from 'react'
import { useLocation } from 'react-router-dom'

interface AudioContextValue {
  muted: boolean
  volume: number
  audioFailed: boolean
  toggleMute: () => void
  handleVolumeChange: (e: ChangeEvent<HTMLInputElement>) => void
}

const AudioCtx = createContext<AudioContextValue | null>(null)

export function useAudio() {
  const ctx = useContext(AudioCtx)
  if (!ctx) throw new Error('useAudio must be used within AudioProvider')
  return ctx
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [muted, setMuted] = useState(() => sessionStorage.getItem('audio-muted') === 'true')
  const [audioFailed, setAudioFailed] = useState(false)
  const [volume, setVolume] = useState(() => {
    const stored = sessionStorage.getItem('audio-volume')
    if (stored === null) return 0.75
    const val = parseFloat(stored)
    return Number.isFinite(val) && val >= 0 && val <= 1 ? val : 0.75
  })

  // Start playback on mount — audio always plays, volume controls audibility
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = muted
    audio.play().catch(() => {
      audio.muted = true
      setMuted(true)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Route-based audibility: only audible on home page
  const location = useLocation()
  const onMap = location.pathname === '/'

  // Sync volume to element — fade out when leaving the map, restore when returning
  const fadeRef = useRef<number>(undefined)
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    clearInterval(fadeRef.current)
    const target = onMap ? volume : 0
    if (target < audio.volume) {
      // Fade out over ~1.5s
      fadeRef.current = window.setInterval(() => {
        const next = audio.volume - 0.05
        if (next <= target) {
          audio.volume = target
          clearInterval(fadeRef.current)
        } else {
          audio.volume = next
        }
      }, 50)
    } else {
      audio.volume = target
    }
    return () => clearInterval(fadeRef.current)
  }, [volume, onMap])

  function toggleMute() {
    const audio = audioRef.current
    if (!audio) return
    if (muted) {
      audio.muted = false
      setMuted(false)
      sessionStorage.setItem('audio-muted', 'false')
      audio.play().catch(() => {
        audio.muted = true
        setMuted(true)
        sessionStorage.setItem('audio-muted', 'true')
      })
    } else {
      audio.muted = true
      setMuted(true)
      sessionStorage.setItem('audio-muted', 'true')
    }
  }

  function handleVolumeChange(e: ChangeEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value)
    setVolume(val)
    sessionStorage.setItem('audio-volume', String(val))
    if (val === 0) {
      setMuted(true)
      sessionStorage.setItem('audio-muted', 'true')
      if (audioRef.current) audioRef.current.muted = true
    } else if (muted) {
      setMuted(false)
      sessionStorage.setItem('audio-muted', 'false')
      if (audioRef.current) {
        audioRef.current.muted = false
        audioRef.current.play().catch(() => {
          audioRef.current!.muted = true
          setMuted(true)
          sessionStorage.setItem('audio-muted', 'true')
        })
      }
    }
  }

  return (
    <AudioCtx.Provider value={{ muted, volume, audioFailed, toggleMute, handleVolumeChange }}>
      <audio ref={audioRef} src="/audio/echos.mp3" loop onError={() => setAudioFailed(true)} />
      {children}
    </AudioCtx.Provider>
  )
}
