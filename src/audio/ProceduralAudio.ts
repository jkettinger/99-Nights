// ============================================================
// Procedural Audio Engine
// Generates real-time ambient soundscapes using Web Audio API.
// No external audio files needed.
// ============================================================

export interface ProceduralSound {
  output: GainNode
  stop(): void
}

export interface RegionAudioConfig {
  generate(ctx: AudioContext): ProceduralSound
  crossfadeDuration?: number
}

export const DEFAULT_CROSSFADE_MS = 2000

// ============================================================
// Shared noise buffer — created once, reused everywhere
// ============================================================

let noiseBuffer: AudioBuffer | null = null

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer
  const sr = ctx.sampleRate
  const len = sr * 4
  const buf = ctx.createBuffer(1, len, sr)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) {
    data[i] = Math.random() * 2 - 1
  }
  noiseBuffer = buf
  return buf
}

// ============================================================
// Cleanup tracker — every generator uses one
// ============================================================

class Cleanup {
  private sources: (AudioBufferSourceNode | OscillatorNode)[] = []
  private nodes: AudioNode[] = []
  private timers: ReturnType<typeof setTimeout>[] = []

  track<T extends AudioBufferSourceNode | OscillatorNode>(source: T): T {
    this.sources.push(source)
    return source
  }

  trackNode<T extends AudioNode>(node: T): T {
    this.nodes.push(node)
    return node
  }

  trackTimer(id: ReturnType<typeof setTimeout>) {
    this.timers.push(id)
  }

  dispose() {
    this.timers.forEach(clearTimeout)
    this.sources.forEach((s) => {
      try { s.stop() } catch { /* already stopped */ }
      try { s.disconnect() } catch { /* already disconnected */ }
    })
    this.nodes.forEach((n) => {
      try { n.disconnect() } catch { /* already disconnected */ }
    })
    this.timers = []
    this.sources = []
    this.nodes = []
  }
}

// ============================================================
// Building blocks — ambient layers
// ============================================================

/** Looping white noise source */
function createNoise(ctx: AudioContext, cleanup: Cleanup): AudioBufferSourceNode {
  const src = ctx.createBufferSource()
  src.buffer = getNoiseBuffer(ctx)
  src.loop = true
  src.start()
  return cleanup.track(src)
}

/** Filtered noise — wind, murmur, fire base, room tone */
function filteredNoise(
  ctx: AudioContext,
  cleanup: Cleanup,
  type: BiquadFilterType,
  frequency: number,
  Q: number,
  gain: number,
): GainNode {
  const noise = createNoise(ctx, cleanup)
  const filter = ctx.createBiquadFilter()
  filter.type = type
  filter.frequency.value = frequency
  filter.Q.value = Q
  cleanup.trackNode(filter)

  const vol = ctx.createGain()
  vol.gain.value = gain
  cleanup.trackNode(vol)

  noise.connect(filter).connect(vol)
  return vol
}

/** Simple oscillator drone */
function drone(
  ctx: AudioContext,
  cleanup: Cleanup,
  frequency: number,
  gain: number,
  type: OscillatorType = 'sine',
): GainNode {
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.value = frequency
  osc.start()
  cleanup.track(osc)

  const vol = ctx.createGain()
  vol.gain.value = gain
  cleanup.trackNode(vol)

  osc.connect(vol)
  return vol
}

/** Drone with slow LFO breathing on volume — for swells and evolving pads */
function breathingDrone(
  ctx: AudioContext,
  cleanup: Cleanup,
  frequency: number,
  gain: number,
  lfoRate: number,
  lfoDepth: number,
  type: OscillatorType = 'sine',
): GainNode {
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.value = frequency
  osc.start()
  cleanup.track(osc)

  const vol = ctx.createGain()
  vol.gain.value = gain
  cleanup.trackNode(vol)

  const lfo = ctx.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = lfoRate
  lfo.start()
  cleanup.track(lfo)

  const lfoGainNode = ctx.createGain()
  lfoGainNode.gain.value = lfoDepth
  cleanup.trackNode(lfoGainNode)

  lfo.connect(lfoGainNode).connect(vol.gain)
  osc.connect(vol)
  return vol
}

/** Noise with slow LFO on gain — ocean waves, breathing wind */
function lfoNoise(
  ctx: AudioContext,
  cleanup: Cleanup,
  filterFreq: number,
  lfoRate: number,
  lfoDepth: number,
  baseGain: number,
): GainNode {
  const noise = createNoise(ctx, cleanup)
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = filterFreq
  filter.Q.value = 0.7
  cleanup.trackNode(filter)

  const vol = ctx.createGain()
  vol.gain.value = baseGain
  cleanup.trackNode(vol)

  const lfo = ctx.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = lfoRate
  lfo.start()
  cleanup.track(lfo)

  const lfoGain = ctx.createGain()
  lfoGain.gain.value = lfoDepth
  cleanup.trackNode(lfoGain)

  lfo.connect(lfoGain).connect(vol.gain)
  noise.connect(filter).connect(vol)
  return vol
}

// ============================================================
// Building blocks — melodic and rhythmic
// ============================================================

/** Schedule a looping melody — plays notes from parallel freq/dur arrays */
function scheduleMelody(
  ctx: AudioContext,
  cleanup: Cleanup,
  destination: AudioNode,
  opts: {
    notes: number[]
    durations: number[]
    gap: number
    gain: number
    type: OscillatorType
    filterFreq?: number
    loopPause?: number
    detune?: number
  },
) {
  let stopped = false
  let noteIndex = 0

  const playNote = () => {
    if (stopped || ctx.state !== 'running') return

    const freq = opts.notes[noteIndex]
    const dur = opts.durations[noteIndex % opts.durations.length]
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    osc.type = opts.type
    osc.frequency.setValueAtTime(freq, now)
    if (opts.detune) osc.detune.value = opts.detune

    const env = ctx.createGain()
    env.gain.setValueAtTime(0, now)
    env.gain.linearRampToValueAtTime(opts.gain, now + Math.min(dur * 0.1, 0.05))
    env.gain.setValueAtTime(opts.gain, now + dur * 0.7)
    env.gain.linearRampToValueAtTime(0, now + dur)

    if (opts.filterFreq) {
      const filt = ctx.createBiquadFilter()
      filt.type = 'lowpass'
      filt.frequency.value = opts.filterFreq
      filt.Q.value = 1
      osc.connect(filt).connect(env).connect(destination)
      osc.onended = () => {
        try { osc.disconnect(); filt.disconnect(); env.disconnect() } catch { /* noop */ }
      }
    } else {
      osc.connect(env).connect(destination)
      osc.onended = () => {
        try { osc.disconnect(); env.disconnect() } catch { /* noop */ }
      }
    }

    osc.start(now)
    osc.stop(now + dur + 0.05)

    noteIndex = (noteIndex + 1) % opts.notes.length
    const isLoopEnd = noteIndex === 0
    const nextDelay = dur + opts.gap + (isLoopEnd ? (opts.loopPause ?? 0) : 0)

    const timer = setTimeout(playNote, nextDelay * 1000)
    cleanup.trackTimer(timer)
  }

  const startTimer = setTimeout(playNote, (0.5 + Math.random()) * 1000)
  cleanup.trackTimer(startTimer)

  const origDispose = cleanup.dispose.bind(cleanup)
  cleanup.dispose = () => { stopped = true; origDispose() }
}

/** Metallic clang — sword hits, anvil strikes */
function scheduleMetalClangs(
  ctx: AudioContext,
  cleanup: Cleanup,
  destination: AudioNode,
  opts: {
    minInterval: number
    maxInterval: number
    gain: number
    highFreq?: number
  },
) {
  let stopped = false

  const next = () => {
    if (stopped) return
    const delay = opts.minInterval + Math.random() * (opts.maxInterval - opts.minInterval)
    const timer = setTimeout(() => {
      if (stopped || ctx.state !== 'running') { next(); return }

      const now = ctx.currentTime
      const dur = 0.15 + Math.random() * 0.1
      const freq = opts.highFreq ?? (3000 + Math.random() * 2000)

      const osc = ctx.createOscillator()
      osc.type = 'square'
      osc.frequency.setValueAtTime(freq, now)
      osc.frequency.exponentialRampToValueAtTime(freq * 0.3, now + dur)

      const osc2 = ctx.createOscillator()
      osc2.type = 'triangle'
      osc2.frequency.setValueAtTime(freq * 1.5, now)
      osc2.frequency.exponentialRampToValueAtTime(freq * 0.5, now + dur)

      const mix = ctx.createGain()
      mix.gain.value = 0.5

      const env = ctx.createGain()
      env.gain.setValueAtTime(opts.gain, now)
      env.gain.exponentialRampToValueAtTime(0.001, now + dur)

      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 1500

      osc.connect(mix)
      osc2.connect(mix)
      mix.connect(hp).connect(env).connect(destination)
      osc.start(now)
      osc2.start(now)
      osc.stop(now + dur + 0.05)
      osc2.stop(now + dur + 0.05)

      osc.onended = () => {
        try { osc.disconnect(); osc2.disconnect(); mix.disconnect(); env.disconnect(); hp.disconnect() } catch { /* noop */ }
      }

      next()
    }, delay * 1000)
    cleanup.trackTimer(timer)
  }

  const firstTimer = setTimeout(next, (1 + Math.random() * 2) * 1000)
  cleanup.trackTimer(firstTimer)

  const origDispose = cleanup.dispose.bind(cleanup)
  cleanup.dispose = () => { stopped = true; origDispose() }
}

/** Bell tone — resonant sine with inharmonic partials and long decay */
function scheduleBells(
  ctx: AudioContext,
  cleanup: Cleanup,
  destination: AudioNode,
  opts: {
    notes: number[]
    minInterval: number
    maxInterval: number
    gain: number
    decay: number
  },
) {
  let stopped = false
  let noteIdx = 0

  const next = () => {
    if (stopped) return
    const delay = opts.minInterval + Math.random() * (opts.maxInterval - opts.minInterval)
    const timer = setTimeout(() => {
      if (stopped || ctx.state !== 'running') { next(); return }

      const now = ctx.currentTime
      const freq = opts.notes[noteIdx]
      noteIdx = (noteIdx + 1) % opts.notes.length

      const harmonics = [1, 2.76, 5.04, 6.67]
      const gains = [opts.gain, opts.gain * 0.4, opts.gain * 0.15, opts.gain * 0.08]
      const decays = [opts.decay, opts.decay * 0.6, opts.decay * 0.3, opts.decay * 0.2]

      harmonics.forEach((ratio, i) => {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = freq * ratio

        const env = ctx.createGain()
        env.gain.setValueAtTime(gains[i], now)
        env.gain.exponentialRampToValueAtTime(0.001, now + decays[i])

        osc.connect(env).connect(destination)
        osc.start(now)
        osc.stop(now + decays[i] + 0.05)
        osc.onended = () => {
          try { osc.disconnect(); env.disconnect() } catch { /* noop */ }
        }
      })

      next()
    }, delay * 1000)
    cleanup.trackTimer(timer)
  }

  const firstTimer = setTimeout(next, (2 + Math.random() * 3) * 1000)
  cleanup.trackTimer(firstTimer)

  const origDispose = cleanup.dispose.bind(cleanup)
  cleanup.dispose = () => { stopped = true; origDispose() }
}

/** Chant-like parallel voices — sustained tones with vowel formant shaping */
function scheduleChant(
  ctx: AudioContext,
  cleanup: Cleanup,
  destination: AudioNode,
  opts: {
    chords: number[][]
    noteDuration: number
    gap: number
    gain: number
  },
) {
  let stopped = false
  let chordIdx = 0

  const playChord = () => {
    if (stopped || ctx.state !== 'running') return

    const chord = opts.chords[chordIdx]
    const now = ctx.currentTime
    const dur = opts.noteDuration

    chord.forEach((freq) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq

      const osc2 = ctx.createOscillator()
      osc2.type = 'triangle'
      osc2.frequency.value = freq
      osc2.detune.value = 3

      const osc2vol = ctx.createGain()
      osc2vol.gain.value = 0.3

      const mix = ctx.createGain()
      mix.gain.value = 1

      const env = ctx.createGain()
      env.gain.setValueAtTime(0, now)
      env.gain.linearRampToValueAtTime(opts.gain, now + dur * 0.2)
      env.gain.setValueAtTime(opts.gain, now + dur * 0.75)
      env.gain.linearRampToValueAtTime(0, now + dur)

      const formant = ctx.createBiquadFilter()
      formant.type = 'bandpass'
      formant.frequency.value = 600
      formant.Q.value = 3

      osc.connect(mix)
      osc2.connect(osc2vol).connect(mix)
      mix.connect(formant).connect(env).connect(destination)

      osc.start(now)
      osc2.start(now)
      osc.stop(now + dur + 0.05)
      osc2.stop(now + dur + 0.05)

      osc.onended = () => {
        try { osc.disconnect(); osc2.disconnect(); osc2vol.disconnect(); mix.disconnect(); formant.disconnect(); env.disconnect() } catch { /* noop */ }
      }
    })

    chordIdx = (chordIdx + 1) % opts.chords.length
    const timer = setTimeout(playChord, (dur + opts.gap) * 1000)
    cleanup.trackTimer(timer)
  }

  const startTimer = setTimeout(playChord, (1 + Math.random() * 2) * 1000)
  cleanup.trackTimer(startTimer)

  const origDispose = cleanup.dispose.bind(cleanup)
  cleanup.dispose = () => { stopped = true; origDispose() }
}

/**
 * Rhythmic drum pattern at fixed BPM — alternates kick (sine w/ pitch drop)
 * and snare (highpass noise burst) on beats.
 */
function scheduleDrumPattern(
  ctx: AudioContext,
  cleanup: Cleanup,
  destination: AudioNode,
  opts: {
    bpm: number
    kickFreq: number
    kickGain: number
    snareGain: number
    swingAmount?: number
  },
) {
  let stopped = false
  const beatDur = 60 / opts.bpm
  let beat = 0

  const playBeat = () => {
    if (stopped) return
    const isKick = beat % 2 === 0
    const swing = opts.swingAmount ?? 0
    const delay = isKick ? beatDur : beatDur * (1 + swing)

    const timer = setTimeout(() => {
      if (stopped || ctx.state !== 'running') { beat++; playBeat(); return }

      const now = ctx.currentTime

      if (isKick) {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(opts.kickFreq * 2, now)
        osc.frequency.exponentialRampToValueAtTime(opts.kickFreq, now + 0.05)

        const env = ctx.createGain()
        env.gain.setValueAtTime(opts.kickGain, now)
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

        osc.connect(env).connect(destination)
        osc.start(now)
        osc.stop(now + 0.35)
        osc.onended = () => {
          try { osc.disconnect(); env.disconnect() } catch { /* noop */ }
        }
      } else {
        const src = ctx.createBufferSource()
        src.buffer = getNoiseBuffer(ctx)
        const offset = Math.random() * 3

        const hp = ctx.createBiquadFilter()
        hp.type = 'highpass'
        hp.frequency.value = 2000

        const env = ctx.createGain()
        env.gain.setValueAtTime(opts.snareGain, now)
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.12)

        src.connect(hp).connect(env).connect(destination)
        src.start(now, offset, 0.15)
        src.onended = () => {
          try { src.disconnect(); hp.disconnect(); env.disconnect() } catch { /* noop */ }
        }
      }

      beat++
      playBeat()
    }, delay * 1000)
    cleanup.trackTimer(timer)
  }

  playBeat()

  const origDispose = cleanup.dispose.bind(cleanup)
  cleanup.dispose = () => { stopped = true; origDispose() }
}

// ============================================================
// Scheduled event patterns (ambient)
// ============================================================

/** Periodic oscillator chirps — birds, seagulls, owls */
function scheduleChirps(
  ctx: AudioContext,
  cleanup: Cleanup,
  destination: AudioNode,
  opts: {
    minFreq: number
    maxFreq: number
    duration: number
    minInterval: number
    maxInterval: number
    gain: number
    sweepUp?: boolean
  },
) {
  let stopped = false

  const next = () => {
    if (stopped) return
    const delay = opts.minInterval + Math.random() * (opts.maxInterval - opts.minInterval)
    const timer = setTimeout(() => {
      if (stopped || ctx.state !== 'running') { next(); return }

      const now = ctx.currentTime
      const freq = opts.minFreq + Math.random() * (opts.maxFreq - opts.minFreq)
      const dur = opts.duration

      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)
      if (opts.sweepUp !== false) {
        osc.frequency.exponentialRampToValueAtTime(freq * 1.3, now + dur * 0.3)
        osc.frequency.exponentialRampToValueAtTime(freq * 0.8, now + dur)
      }

      const env = ctx.createGain()
      env.gain.setValueAtTime(0, now)
      env.gain.linearRampToValueAtTime(opts.gain, now + dur * 0.1)
      env.gain.linearRampToValueAtTime(opts.gain * 0.6, now + dur * 0.5)
      env.gain.linearRampToValueAtTime(0, now + dur)

      osc.connect(env).connect(destination)
      osc.start(now)
      osc.stop(now + dur + 0.05)
      osc.onended = () => {
        try { osc.disconnect() } catch { /* noop */ }
        try { env.disconnect() } catch { /* noop */ }
      }

      next()
    }, delay * 1000)
    cleanup.trackTimer(timer)
  }

  const firstTimer = setTimeout(next, (1 + Math.random() * 2) * 1000)
  cleanup.trackTimer(firstTimer)

  const origDispose = cleanup.dispose.bind(cleanup)
  cleanup.dispose = () => { stopped = true; origDispose() }
}

/** Periodic short noise bursts — fire crackle, wood pops */
function scheduleCracklePops(
  ctx: AudioContext,
  cleanup: Cleanup,
  destination: AudioNode,
  opts: {
    minInterval: number
    maxInterval: number
    gain: number
  },
) {
  let stopped = false

  const next = () => {
    if (stopped) return
    const delay = opts.minInterval + Math.random() * (opts.maxInterval - opts.minInterval)
    const timer = setTimeout(() => {
      if (stopped || ctx.state !== 'running') { next(); return }

      const now = ctx.currentTime
      const dur = 0.02 + Math.random() * 0.04

      const src = ctx.createBufferSource()
      src.buffer = getNoiseBuffer(ctx)
      const offset = Math.random() * (src.buffer!.duration - dur)

      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 2000 + Math.random() * 3000
      bp.Q.value = 2

      const env = ctx.createGain()
      env.gain.setValueAtTime(0, now)
      env.gain.linearRampToValueAtTime(opts.gain, now + 0.002)
      env.gain.linearRampToValueAtTime(0, now + dur)

      src.connect(bp).connect(env).connect(destination)
      src.start(now, offset, dur + 0.01)
      src.onended = () => {
        try { src.disconnect() } catch { /* noop */ }
        try { bp.disconnect() } catch { /* noop */ }
        try { env.disconnect() } catch { /* noop */ }
      }

      next()
    }, delay * 1000)
    cleanup.trackTimer(timer)
  }

  next()

  const origDispose = cleanup.dispose.bind(cleanup)
  cleanup.dispose = () => { stopped = true; origDispose() }
}

// ============================================================
// Region generators
// ============================================================

function generateOverworld(ctx: AudioContext): ProceduralSound {
  const cleanup = new Cleanup()
  const output = ctx.createGain()
  output.gain.value = 1
  cleanup.trackNode(output)

  // Gentle wind
  filteredNoise(ctx, cleanup, 'lowpass', 600, 0.7, 0.5).connect(output)
  // Higher wind shimmer
  filteredNoise(ctx, cleanup, 'bandpass', 1000, 0.5, 0.15).connect(output)

  // Bird chirps — two voices
  scheduleChirps(ctx, cleanup, output, {
    minFreq: 2000, maxFreq: 4000, duration: 0.15,
    minInterval: 3, maxInterval: 8, gain: 0.15,
  })
  scheduleChirps(ctx, cleanup, output, {
    minFreq: 3000, maxFreq: 5000, duration: 0.1,
    minInterval: 5, maxInterval: 12, gain: 0.1,
  })

  // Slow wistful melody — D minor pentatonic, gentle and adventurous
  scheduleMelody(ctx, cleanup, output, {
    notes:     [293.66, 349.23, 440, 392, 349.23, 293.66, 523.25, 440, 392, 349.23],
    durations: [1.8,    1.5,    2.0, 1.5, 1.8,    2.0,    2.2,    1.8, 1.5, 2.0   ],
    gap: 0.3,
    gain: 0.1,
    type: 'triangle',
    filterFreq: 1800,
    loopPause: 4.0,
  })

  // Gentle pedal tone
  drone(ctx, cleanup, 130.81, 0.03, 'sine').connect(output)

  return { output, stop: () => cleanup.dispose() }
}

function generateTavern(ctx: AudioContext): ProceduralSound {
  const cleanup = new Cleanup()
  const output = ctx.createGain()
  output.gain.value = 1
  cleanup.trackNode(output)

  // Fire base — warm filtered noise
  filteredNoise(ctx, cleanup, 'bandpass', 1200, 1, 0.15).connect(output)
  // Frequent crackle pops
  scheduleCracklePops(ctx, cleanup, output, {
    minInterval: 0.1, maxInterval: 0.5, gain: 0.25,
  })
  // Occasional louder pops
  scheduleCracklePops(ctx, cleanup, output, {
    minInterval: 1, maxInterval: 4, gain: 0.4,
  })
  // Low murmur
  filteredNoise(ctx, cleanup, 'lowpass', 200, 0.7, 0.12).connect(output)

  // Procedural fiddle jig plays immediately while MP3 loads
  const jigGain = ctx.createGain()
  jigGain.gain.value = 1
  cleanup.trackNode(jigGain)
  jigGain.connect(output)

  scheduleMelody(ctx, cleanup, jigGain, {
    notes:     [293.66, 369.99, 440, 587.33, 493.88, 440, 392, 369.99, 329.63, 293.66, 329.63, 369.99, 392, 440, 369.99, 293.66],
    durations: [0.2,    0.2,    0.2, 0.3,    0.2,    0.2, 0.2, 0.2,    0.2,    0.3,    0.2,    0.2,    0.2, 0.3, 0.2,    0.4   ],
    gap: 0.05,
    gain: 0.12,
    type: 'sawtooth',
    filterFreq: 2500,
    loopPause: 1.5,
    detune: 5,
  })
  drone(ctx, cleanup, 146.83, 0.06, 'triangle').connect(jigGain)

  // Tavern music — oak-and-ember.mp3 crossfades in when loaded
  fetch('/audio/oak-and-ember.mp3')
    .then(res => res.arrayBuffer())
    .then(buf => ctx.decodeAudioData(buf))
    .then(decoded => {
      const src = ctx.createBufferSource()
      src.buffer = decoded
      src.loop = true
      cleanup.track(src)

      const vol = ctx.createGain()
      vol.gain.value = 0.35
      cleanup.trackNode(vol)

      src.connect(vol).connect(output)
      src.start()

      // Fade out the procedural jig now that the MP3 is playing
      const now = ctx.currentTime
      jigGain.gain.setValueAtTime(1, now)
      jigGain.gain.linearRampToValueAtTime(0, now + 2)
    })
    .catch(() => { /* audio file unavailable — procedural jig keeps playing */ })

  return { output, stop: () => cleanup.dispose() }
}

function generateLibrary(ctx: AudioContext): ProceduralSound {
  const cleanup = new Cleanup()
  const output = ctx.createGain()
  output.gain.value = 1
  cleanup.trackNode(output)

  // Very quiet room tone
  filteredNoise(ctx, cleanup, 'lowpass', 150, 0.5, 0.04).connect(output)

  // Slowly evolving chord — C major triad with individual LFO breathing
  const chordFreqs = [130.81, 164.81, 196.00] // C3, E3, G3
  chordFreqs.forEach((freq, i) => {
    breathingDrone(ctx, cleanup, freq, 0.04, 0.03 + i * 0.012, 0.025).connect(output)
  })

  // Monastery bells — pentatonic with long decay
  scheduleBells(ctx, cleanup, output, {
    notes: [523.25, 659.25, 783.99, 880.00, 1046.50],
    minInterval: 10,
    maxInterval: 20,
    gain: 0.1,
    decay: 4,
  })

  // Occasional creaks
  scheduleCracklePops(ctx, cleanup, output, {
    minInterval: 8, maxInterval: 20, gain: 0.1,
  })

  return { output, stop: () => cleanup.dispose() }
}

function generateWilds(ctx: AudioContext): ProceduralSound {
  const cleanup = new Cleanup()
  const output = ctx.createGain()
  output.gain.value = 1
  cleanup.trackNode(output)

  // Forest wind
  filteredNoise(ctx, cleanup, 'bandpass', 500, 0.8, 0.2).connect(output)
  // Deeper wind layer
  filteredNoise(ctx, cleanup, 'lowpass', 250, 0.5, 0.12).connect(output)

  // Crickets
  const cricket = ctx.createOscillator()
  cricket.type = 'sine'
  cricket.frequency.value = 4200
  cricket.start()
  cleanup.track(cricket)

  const cricketGain = ctx.createGain()
  cricketGain.gain.value = 0.04
  cleanup.trackNode(cricketGain)

  const cricketLfo = ctx.createOscillator()
  cricketLfo.type = 'square'
  cricketLfo.frequency.value = 8
  cricketLfo.start()
  cleanup.track(cricketLfo)

  const cricketLfoGain = ctx.createGain()
  cricketLfoGain.gain.value = 0.04
  cleanup.trackNode(cricketLfoGain)

  cricketLfo.connect(cricketLfoGain).connect(cricketGain.gain)
  cricket.connect(cricketGain).connect(output)

  // Owl hoots
  scheduleChirps(ctx, cleanup, output, {
    minFreq: 300, maxFreq: 450, duration: 0.5,
    minInterval: 8, maxInterval: 20, gain: 0.18,
    sweepUp: false,
  })

  // Mysterious arpeggios — A minor, Skyrim-esque exploration feel
  const wildsNotes = [220, 261.63, 329.63, 440, 329.63, 261.63, 246.94, 164.81]
  const wildsDurs  = [0.8, 0.8,    0.8,    1.0, 0.8,    0.8,    0.8,    1.2   ]

  // Voice 1 — center
  scheduleMelody(ctx, cleanup, output, {
    notes: wildsNotes,
    durations: wildsDurs,
    gap: 0.15,
    gain: 0.08,
    type: 'sine',
    loopPause: 3,
  })

  // Voice 2 — detuned +8 cents for chorus shimmer
  scheduleMelody(ctx, cleanup, output, {
    notes: wildsNotes,
    durations: wildsDurs,
    gap: 0.15,
    gain: 0.05,
    type: 'sine',
    loopPause: 3,
    detune: 8,
  })

  // Haunting fifth drone
  drone(ctx, cleanup, 110, 0.035, 'sine').connect(output)
  drone(ctx, cleanup, 164.81, 0.02, 'sine').connect(output)

  return { output, stop: () => cleanup.dispose() }
}

function generateCitadel(ctx: AudioContext): ProceduralSound {
  const cleanup = new Cleanup()
  const output = ctx.createGain()
  output.gain.value = 1
  cleanup.trackNode(output)

  // Parallel fifths with slow breathing swells — austere and grand
  // C3, G3, C4, G4 with staggered LFO rates for organic movement
  const chantFreqs = [130.81, 196.00, 261.63, 392.00]
  const chantGains = [0.1, 0.08, 0.06, 0.04]
  const lfoRates   = [0.04, 0.048, 0.035, 0.055]
  chantFreqs.forEach((freq, i) => {
    breathingDrone(ctx, cleanup, freq, chantGains[i], lfoRates[i], chantGains[i] * 0.6).connect(output)
  })

  // Stone echo ambience
  const ambNoise = filteredNoise(ctx, cleanup, 'bandpass', 600, 0.5, 0.06)
  ambNoise.connect(output)

  const delay = ctx.createDelay(1)
  delay.delayTime.value = 0.3
  cleanup.trackNode(delay)

  const feedback = ctx.createGain()
  feedback.gain.value = 0.3
  cleanup.trackNode(feedback)

  const delayFilter = ctx.createBiquadFilter()
  delayFilter.type = 'lowpass'
  delayFilter.frequency.value = 800
  cleanup.trackNode(delayFilter)

  ambNoise.connect(delay)
  delay.connect(delayFilter).connect(feedback).connect(delay)
  delay.connect(output)

  // Gregorian chant — parallel organum in Dorian mode
  scheduleChant(ctx, cleanup, output, {
    chords: [
      [146.83, 220.00],  // D3 + A3
      [174.61, 261.63],  // F3 + C4
      [164.81, 246.94],  // E3 + B3
      [146.83, 220.00],  // D3 + A3
      [130.81, 196.00],  // C3 + G3
      [146.83, 220.00],  // D3 + A3
    ],
    noteDuration: 3,
    gap: 0.5,
    gain: 0.07,
  })

  return { output, stop: () => cleanup.dispose() }
}

function generateGreatHall(ctx: AudioContext): ProceduralSound {
  const cleanup = new Cleanup()
  const output = ctx.createGain()
  output.gain.value = 1
  cleanup.trackNode(output)

  // Warm hearth fire
  filteredNoise(ctx, cleanup, 'bandpass', 800, 0.8, 0.18).connect(output)
  // Fire crackle
  scheduleCracklePops(ctx, cleanup, output, {
    minInterval: 0.2, maxInterval: 0.8, gain: 0.22,
  })
  // Warm room tone
  filteredNoise(ctx, cleanup, 'lowpass', 180, 0.5, 0.1).connect(output)

  // Festive folk melody — G major, warm gentle feast song
  scheduleMelody(ctx, cleanup, output, {
    notes:     [392, 440, 493.88, 587.33, 493.88, 440, 392, 293.66, 392, 493.88, 440, 196],
    durations: [0.35, 0.35, 0.35, 0.5, 0.35, 0.35, 0.5, 0.35, 0.35, 0.35, 0.35, 0.7],
    gap: 0.08,
    gain: 0.09,
    type: 'triangle',
    filterFreq: 2000,
    loopPause: 2.5,
  })

  // Warm bass pedal
  drone(ctx, cleanup, 196, 0.04, 'sine').connect(output)

  // Distant laughter-like chirps
  scheduleChirps(ctx, cleanup, output, {
    minFreq: 800, maxFreq: 1200, duration: 0.08,
    minInterval: 8, maxInterval: 18, gain: 0.05,
  })

  return { output, stop: () => cleanup.dispose() }
}

function generateArena(ctx: AudioContext): ProceduralSound {
  const cleanup = new Cleanup()
  const output = ctx.createGain()
  output.gain.value = 1
  cleanup.trackNode(output)

  // Crowd murmur base
  filteredNoise(ctx, cleanup, 'bandpass', 600, 0.5, 0.2).connect(output)
  // Higher crowd chatter
  filteredNoise(ctx, cleanup, 'bandpass', 1500, 1, 0.08).connect(output)

  // Crowd roar swells — LFO-modulated noise for periodic surges
  const crowdSwell = filteredNoise(ctx, cleanup, 'bandpass', 800, 0.8, 0.12)
  crowdSwell.connect(output)

  const swellLfo = ctx.createOscillator()
  swellLfo.type = 'sine'
  swellLfo.frequency.value = 0.06
  swellLfo.start()
  cleanup.track(swellLfo)

  const swellDepth = ctx.createGain()
  swellDepth.gain.value = 0.1
  cleanup.trackNode(swellDepth)

  swellLfo.connect(swellDepth).connect(crowdSwell.gain)

  // Epic marching war drums — 90bpm, deep kicks + snare offbeats
  scheduleDrumPattern(ctx, cleanup, output, {
    bpm: 90,
    kickFreq: 65,
    kickGain: 0.3,
    snareGain: 0.12,
  })

  // Low brass drone — menacing sawtooth
  drone(ctx, cleanup, 110, 0.05, 'sawtooth').connect(output)

  // Metallic sword clangs
  scheduleMetalClangs(ctx, cleanup, output, {
    minInterval: 4,
    maxInterval: 8,
    gain: 0.12,
  })

  // Gladiator brass melody — D minor, imposing power fifths
  scheduleMelody(ctx, cleanup, output, {
    notes:     [146.83, 146.83, 174.61, 220, 293.66, 220, 174.61, 146.83],
    durations: [0.6,    0.6,    0.8,    0.6, 1.0,    0.6, 0.8,    1.0   ],
    gap: 0.2,
    gain: 0.1,
    type: 'sawtooth',
    filterFreq: 800,
    loopPause: 4,
  })

  return { output, stop: () => cleanup.dispose() }
}

function generateShore(ctx: AudioContext): ProceduralSound {
  const cleanup = new Cleanup()
  const output = ctx.createGain()
  output.gain.value = 1
  cleanup.trackNode(output)

  // Prominent ocean waves
  lfoNoise(ctx, cleanup, 500, 0.12, 0.3, 0.4).connect(output)
  // Second wave layer — different cycle
  lfoNoise(ctx, cleanup, 350, 0.08, 0.2, 0.25).connect(output)
  // Foam hiss
  lfoNoise(ctx, cleanup, 2000, 0.15, 0.1, 0.12).connect(output)
  // Deep undertow
  lfoNoise(ctx, cleanup, 120, 0.06, 0.15, 0.15).connect(output)

  // Seagulls
  scheduleChirps(ctx, cleanup, output, {
    minFreq: 2000, maxFreq: 3500, duration: 0.25,
    minInterval: 5, maxInterval: 15, gain: 0.1,
  })

  // Grey Havens melody — ethereal, melancholic E minor
  scheduleMelody(ctx, cleanup, output, {
    notes:     [329.63, 392, 493.88, 440, 392, 369.99, 329.63, 293.66, 329.63],
    durations: [1.0,    0.8, 1.2,    1.0, 0.8, 1.0,    1.2,    0.8,    1.5   ],
    gap: 0.3,
    gain: 0.06,
    type: 'sine',
    loopPause: 5,
  })

  // Harmonic drone
  drone(ctx, cleanup, 164.81, 0.03, 'sine').connect(output)
  drone(ctx, cleanup, 246.94, 0.02, 'sine').connect(output)

  // Distant bell tone — haunting, every 15-25 seconds
  scheduleBells(ctx, cleanup, output, {
    notes: [880, 1047],
    minInterval: 15,
    maxInterval: 25,
    gain: 0.05,
    decay: 3.5,
  })

  return { output, stop: () => cleanup.dispose() }
}

// ============================================================
// Intro swell — dramatic rising chord
// ============================================================

export function createIntroSwell(ctx: AudioContext): ProceduralSound & { duration: number } {
  const cleanup = new Cleanup()
  const output = ctx.createGain()
  output.gain.value = 1
  cleanup.trackNode(output)

  const duration = 3.5
  const now = ctx.currentTime
  const frequencies = [100, 150, 200, 300, 400]

  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    osc.type = i < 3 ? 'sine' : 'triangle'
    osc.frequency.value = freq
    osc.start(now)
    osc.stop(now + duration + 0.5)
    cleanup.track(osc)

    const env = ctx.createGain()
    const peakGain = 0.3 - i * 0.04
    env.gain.setValueAtTime(0, now)
    env.gain.setValueAtTime(0, now + i * 0.15)
    env.gain.linearRampToValueAtTime(peakGain, now + i * 0.15 + duration * 0.6)
    env.gain.linearRampToValueAtTime(0, now + duration)
    cleanup.trackNode(env)

    osc.connect(env).connect(output)
    osc.onended = () => {
      try { osc.disconnect() } catch { /* noop */ }
      try { env.disconnect() } catch { /* noop */ }
    }
  })

  // Noise sweep for drama
  const noise = createNoise(ctx, cleanup)
  const noiseFilt = ctx.createBiquadFilter()
  noiseFilt.type = 'bandpass'
  noiseFilt.frequency.setValueAtTime(200, now)
  noiseFilt.frequency.exponentialRampToValueAtTime(2000, now + duration * 0.8)
  noiseFilt.frequency.exponentialRampToValueAtTime(200, now + duration)
  noiseFilt.Q.value = 2
  cleanup.trackNode(noiseFilt)

  const noiseEnv = ctx.createGain()
  noiseEnv.gain.setValueAtTime(0, now)
  noiseEnv.gain.linearRampToValueAtTime(0.15, now + duration * 0.6)
  noiseEnv.gain.linearRampToValueAtTime(0, now + duration)
  cleanup.trackNode(noiseEnv)

  noise.connect(noiseFilt).connect(noiseEnv).connect(output)

  return { output, duration, stop: () => cleanup.dispose() }
}

// ============================================================
// Registry
// ============================================================

export const regionGenerators: Record<string, RegionAudioConfig> = {
  overworld: { generate: generateOverworld, crossfadeDuration: 2500 },
  tavern: { generate: generateTavern },
  library: { generate: generateLibrary },
  wilds: { generate: generateWilds },
  citadel: { generate: generateCitadel },
  'great-hall': { generate: generateGreatHall },
  arena: { generate: generateArena },
  shore: { generate: generateShore },
}
