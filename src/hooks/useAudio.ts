import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { audioManager } from '../audio/AudioManager'

/**
 * React hook for interacting with the audio system.
 * Subscribes to audio manager state changes and re-renders on updates.
 */
export function useAudio() {
  const subscribe = useCallback(
    (onStoreChange: () => void) => audioManager.subscribe(onStoreChange),
    []
  )

  // Snapshot functions — useSyncExternalStore needs stable references
  const getMuted = useCallback(() => audioManager.isMuted(), [])
  const getVolume = useCallback(() => audioManager.getMasterVolume(), [])
  const getInitialized = useCallback(() => audioManager.isInitialized(), [])
  const getRegion = useCallback(() => audioManager.getCurrentRegion(), [])

  const muted = useSyncExternalStore(subscribe, getMuted)
  const volume = useSyncExternalStore(subscribe, getVolume)
  const initialized = useSyncExternalStore(subscribe, getInitialized)
  const currentRegion = useSyncExternalStore(subscribe, getRegion)

  const init = useCallback(() => audioManager.init(), [])
  const toggleMute = useCallback(() => audioManager.toggleMute(), [])
  const setVolume = useCallback((v: number) => audioManager.setMasterVolume(v), [])
  const transitionToRegion = useCallback((id: string) => audioManager.transitionToRegion(id), [])
  const playIntroSwell = useCallback(() => audioManager.playIntroSwell(), [])

  return {
    muted,
    volume,
    initialized,
    currentRegion,
    init,
    toggleMute,
    setVolume,
    transitionToRegion,
    playIntroSwell,
  }
}

/**
 * Hook that automatically transitions audio when the region changes.
 * Call this in region components with their region ID.
 */
export function useRegionAudio(regionId: string) {
  const { transitionToRegion, initialized } = useAudio()

  useEffect(() => {
    if (initialized) {
      transitionToRegion(regionId)
    }
  }, [regionId, initialized, transitionToRegion])
}
