import {
  regionGenerators,
  DEFAULT_CROSSFADE_MS,
  createIntroSwell,
  type ProceduralSound,
} from './ProceduralAudio'

const STORAGE_KEY_VOLUME = 'jiggling-audio-volume'
const STORAGE_KEY_MUTED = 'jiggling-audio-muted'

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw !== null ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

/**
 * Manages procedural ambient audio with crossfading between regions.
 * Uses Web Audio API — no external audio files needed.
 * Singleton — there should only ever be one of these running.
 */
class AudioManager {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private activeSound: ProceduralSound | null = null
  private fadingOut: { sound: ProceduralSound; timer: ReturnType<typeof setTimeout> }[] = []
  private currentRegionId: string | null = null
  private masterVolume = loadFromStorage(STORAGE_KEY_VOLUME, 1)
  private muted = loadFromStorage(STORAGE_KEY_MUTED, false)
  private initialized = false
  private introPlayed = false

  private listeners: Set<() => void> = new Set()

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify() {
    this.listeners.forEach((fn) => fn())
  }

  /**
   * Initialize the audio system. Must be called from a user gesture
   * context to satisfy browser autoplay policies.
   */
  init() {
    if (this.initialized) return

    try {
      this.ctx = new AudioContext()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = this.muted ? 0 : this.masterVolume
      this.masterGain.connect(this.ctx.destination)

      if (this.ctx.state === 'suspended') {
        this.ctx.resume()
      }

      this.initialized = true
    } catch {
      this.ctx = null
      this.masterGain = null
      return
    }

    this.notify()
  }

  /**
   * Play the dramatic intro swell. Only plays once per session.
   */
  playIntroSwell(): Promise<void> {
    if (this.introPlayed || !this.initialized || !this.ctx || !this.masterGain) {
      return Promise.resolve()
    }
    this.introPlayed = true

    const swell = createIntroSwell(this.ctx)
    swell.output.connect(this.masterGain)

    return new Promise((resolve) => {
      setTimeout(() => {
        swell.stop()
        resolve()
      }, swell.duration * 1000 + 100)
    })
  }

  /**
   * Crossfade to a new region's soundscape. If the region has no
   * configured soundscape, fades out current audio.
   */
  transitionToRegion(regionId: string) {
    if (!this.initialized || !this.ctx || !this.masterGain) return
    if (regionId === this.currentRegionId) return

    // Resume context if it got suspended (e.g. tab backgrounded)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }

    const config = regionGenerators[regionId]
    const fadeDuration = (config?.crossfadeDuration ?? DEFAULT_CROSSFADE_MS) / 1000

    // Kill any sounds still fading out from previous transitions
    this.fadingOut.forEach((f) => {
      clearTimeout(f.timer)
      f.sound.stop()
    })
    this.fadingOut = []

    // Fade out current sound
    if (this.activeSound) {
      const dying = this.activeSound
      this.activeSound = null

      const now = this.ctx.currentTime
      // Cancel any in-progress automation before setting fade-out ramp
      dying.output.gain.cancelScheduledValues(0)
      dying.output.gain.setValueAtTime(dying.output.gain.value, now)
      dying.output.gain.linearRampToValueAtTime(0, now + fadeDuration)

      const timer = setTimeout(() => {
        dying.stop()
        this.fadingOut = this.fadingOut.filter((f) => f.sound !== dying)
      }, fadeDuration * 1000 + 100)

      this.fadingOut.push({ sound: dying, timer })
    }

    this.currentRegionId = regionId

    if (!config) {
      this.notify()
      return
    }

    // Create and fade in new sound
    const sound = config.generate(this.ctx)
    const now = this.ctx.currentTime
    sound.output.gain.setValueAtTime(0, now)
    sound.output.gain.linearRampToValueAtTime(1, now + fadeDuration)
    sound.output.connect(this.masterGain)

    this.activeSound = sound
    this.notify()
  }

  /**
   * Set master volume (0-1). Applies immediately.
   */
  setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume))
    saveToStorage(STORAGE_KEY_VOLUME, this.masterVolume)

    if (this.masterGain && this.ctx && !this.muted) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime)
    }

    this.notify()
  }

  getMasterVolume(): number {
    return this.masterVolume
  }

  /**
   * Toggle mute on/off. Preserves volume settings so unmute
   * restores previous levels.
   */
  toggleMute(): boolean {
    this.muted = !this.muted
    saveToStorage(STORAGE_KEY_MUTED, this.muted)

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(
        this.muted ? 0 : this.masterVolume,
        this.ctx.currentTime,
      )
    }

    this.notify()
    return this.muted
  }

  isMuted(): boolean {
    return this.muted
  }

  isInitialized(): boolean {
    return this.initialized
  }

  getCurrentRegion(): string | null {
    return this.currentRegionId
  }

  /**
   * Stop everything and clean up. Call this on app unmount.
   */
  destroy() {
    this.fadingOut.forEach((f) => {
      clearTimeout(f.timer)
      f.sound.stop()
    })
    this.fadingOut = []

    if (this.activeSound) {
      this.activeSound.stop()
      this.activeSound = null
    }

    if (this.ctx) {
      this.ctx.close()
      this.ctx = null
    }

    this.masterGain = null
    this.currentRegionId = null
    this.initialized = false
    this.introPlayed = false
    this.listeners.clear()
  }
}

// Singleton instance
export const audioManager = new AudioManager()
