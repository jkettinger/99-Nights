import { useAudio } from '../hooks/useAudio'
import './AudioControls.css'

/**
 * Floating audio controls — mute toggle + volume slider.
 * Shows an "Enter" button if audio hasn't been initialized yet
 * (browser autoplay policy requires a user gesture).
 */
export function AudioControls() {
  const { muted, volume, initialized, toggleMute, setVolume } = useAudio()

  if (!initialized) {
    return null
  }

  return (
    <div className="audio-controls">
      <button
        className="audio-mute-btn"
        onClick={toggleMute}
        aria-label={muted ? 'Unmute audio' : 'Mute audio'}
        title={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? (
          <span className="audio-icon">&#128263;</span>
        ) : (
          <span className="audio-icon">&#128266;</span>
        )}
      </button>
      <input
        type="range"
        className="audio-volume-slider"
        min="0"
        max="1"
        step="0.05"
        value={volume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
        aria-label="Master volume"
        title={`Volume: ${Math.round(volume * 100)}%`}
      />
    </div>
  )
}
