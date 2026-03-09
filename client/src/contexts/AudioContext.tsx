import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import type { ReactNode, ChangeEvent } from 'react'
import { useLocation } from 'react-router-dom'

const MAP_TRACK = '/audio/echos.mp3'
const FADE_STEP = 0.05
const FADE_INTERVAL = 50

interface AudioContextValue {
  muted: boolean
  volume: number
  audioFailed: boolean
  toggleMute: () => void
  handleVolumeChange: (e: ChangeEvent<HTMLInputElement>) => void
  setTrack: (url: string | null) => void
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

  // Track position memory — remembers where each track was playing
  const positionsRef = useRef<Map<string, number>>(new Map())
  const currentTrackRef = useRef<string>(MAP_TRACK)
  const fadeRef = useRef<number>(undefined)

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

  // Route-based audibility: only audible on home page or destination pages with a track
  const location = useLocation()
  const onMap = location.pathname === '/'

  // Determine if audio should be audible based on route and current track
  const shouldPlay = onMap || currentTrackRef.current !== MAP_TRACK

  // Fade helper — fades the audio element volume toward a target
  const fadeTo = useCallback((target: number, onDone?: () => void) => {
    const audio = audioRef.current
    if (!audio) return
    clearInterval(fadeRef.current)
    if (Math.abs(audio.volume - target) < FADE_STEP) {
      audio.volume = target
      onDone?.()
      return
    }
    const direction = target > audio.volume ? 1 : -1
    fadeRef.current = window.setInterval(() => {
      const next = audio.volume + direction * FADE_STEP
      if ((direction > 0 && next >= target) || (direction < 0 && next <= target)) {
        audio.volume = target
        clearInterval(fadeRef.current)
        onDone?.()
      } else {
        audio.volume = next
      }
    }, FADE_INTERVAL)
  }, [])

  // Switch tracks with crossfade: fade out → swap src + restore position → fade in
  const setTrack = useCallback((url: string | null) => {
    const audio = audioRef.current
    if (!audio) return
    const newTrack = url || MAP_TRACK
    if (newTrack === currentTrackRef.current) return

    // Save current position
    positionsRef.current.set(currentTrackRef.current, audio.currentTime)

    // Fade out, then swap
    fadeTo(0, () => {
      currentTrackRef.current = newTrack
      audio.src = newTrack
      audio.currentTime = positionsRef.current.get(newTrack) || 0
      audio.play().catch(() => {})
      // Fade in to user's volume (respect mute state)
      if (!audio.muted) {
        fadeTo(volume)
      }
    })
  }, [fadeTo, volume])

  // Sync volume to element — fade out when leaving the map (and no destination track), restore when returning
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const target = shouldPlay ? volume : 0
    fadeTo(target)
    return () => clearInterval(fadeRef.current)
  }, [volume, shouldPlay, fadeTo])

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
    <AudioCtx.Provider value={{ muted, volume, audioFailed, toggleMute, handleVolumeChange, setTrack }}>
      <audio ref={audioRef} src={MAP_TRACK} loop onError={() => setAudioFailed(true)} />
      {children}
    </AudioCtx.Provider>
  )
}
