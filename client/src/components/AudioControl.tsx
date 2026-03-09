import { useLocation } from 'react-router-dom'
import { useAudio } from '../contexts/AudioContext'

export default function AudioControl() {
  const { muted, volume, audioFailed, toggleMute, handleVolumeChange } = useAudio()
  const location = useLocation()

  if (audioFailed) return null

  // Delay the fade-in only during the first-visit intro on the home page
  const introPlaying = location.pathname === '/' && sessionStorage.getItem('intro-played') !== 'true'

  const onHomePage = location.pathname === '/'

  return (
    <div className={`audio-control${introPlaying ? '' : ' audio-control--immediate'}${onHomePage ? ' audio-control--map' : ''}`}>
      <button
        type="button"
        className="audio-control__btn"
        onClick={toggleMute}
        aria-label={muted ? 'Unmute audio' : 'Mute audio'}
      >
        {muted ? (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M3.63 3.63a.996.996 0 000 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91.8-.33 1.55-.77 2.22-1.31l1.34 1.34a.996.996 0 101.41-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4-.59-.23-1.22.23-1.22.86v.19c0 .38.25.71.61.85C17.18 6.54 19 9.06 19 12zm-8.71-6.29l-.17.17L12 7.76V6.41c0-.89-1.08-1.33-1.71-.7zM16.5 12A4.5 4.5 0 0014 7.97v1.79l2.48 2.48c.01-.08.02-.16.02-.24z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M3 10v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71V6.41c0-.89-1.08-1.34-1.71-.71L7 9H4c-.55 0-1 .45-1 1zm13.5 2A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-3.02zM14 3.23v.19c0 .38.25.71.61.85C17.18 5.54 19 8.06 19 11s-1.82 5.46-4.39 6.73c-.36.14-.61.47-.61.85v.19c0 .63.63 1.09 1.22.86C18.6 18.11 21 14.83 21 11s-2.4-7.11-5.78-8.4c-.59-.23-1.22.23-1.22.86z"/>
          </svg>
        )}
      </button>
      <input
        type="range"
        className="audio-control__volume"
        min="0"
        max="1"
        step="0.05"
        value={volume}
        onChange={handleVolumeChange}
        aria-label="Volume"
      />
    </div>
  )
}
