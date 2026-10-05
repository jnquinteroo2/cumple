import { useCallback, useEffect, useRef, useState } from "react"

import { onIdle } from "@/lib/utils"

type ToneModule = typeof import("tone")

type MusicEngine = {
  play: () => void
  fadeTo: (level: number, seconds: number) => void
  stop: () => void
  dispose: () => void
}

const MP3_URL = "/music.mp3"
const VOLUME_LEVEL = 0.32
const FADE_IN_SECONDS = 1.6
const TOGGLE_FADE_SECONDS = 0.4
const BPM = 104
const LOOP_BEATS = 27

const MELODY: ReadonlyArray<readonly [string, number]> = [
  ["G4", 0.75], ["G4", 0.25], ["A4", 1], ["G4", 1], ["C5", 1], ["B4", 2],
  ["G4", 0.75], ["G4", 0.25], ["A4", 1], ["G4", 1], ["D5", 1], ["C5", 2],
  ["G4", 0.75], ["G4", 0.25], ["G5", 1], ["E5", 1], ["C5", 1], ["B4", 1], ["A4", 1],
  ["F5", 0.75], ["F5", 0.25], ["E5", 1], ["C5", 1], ["D5", 1], ["C5", 3],
]

const BASS_LINE: ReadonlyArray<readonly [string, number]> = [
  ["C3", 1], ["G2", 4], ["G2", 7], ["C3", 10], ["C3", 13], ["F2", 16], ["G2", 19], ["C3", 22],
]

function beatsToSeconds(beats: number) {
  return (beats * 60) / BPM
}

function levelToDecibels(level: number) {
  return level <= 0.0001 ? -60 : 20 * Math.log10(level)
}

async function hasCustomTrack() {
  try {
    const response = await fetch(MP3_URL, { method: "HEAD" })
    const contentType = response.headers.get("content-type") ?? ""
    return response.ok && contentType.startsWith("audio")
  } catch {
    return false
  }
}

function createAudioEngine(): MusicEngine {
  const audio = new Audio(MP3_URL)
  audio.loop = true
  audio.volume = 0
  let frame: number | null = null

  const fadeTo = (level: number, seconds: number) => {
    if (frame !== null) cancelAnimationFrame(frame)
    const from = audio.volume
    const startedAt = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / (seconds * 1000), 1)
      audio.volume = from + (level - from) * progress
      frame = progress < 1 ? requestAnimationFrame(tick) : null
    }
    frame = requestAnimationFrame(tick)
  }

  return {
    play: () => void audio.play().catch(() => undefined),
    fadeTo,
    stop: () => {
      fadeTo(0, TOGGLE_FADE_SECONDS)
      window.setTimeout(() => audio.pause(), TOGGLE_FADE_SECONDS * 1000)
    },
    dispose: () => {
      if (frame !== null) cancelAnimationFrame(frame)
      audio.pause()
      audio.src = ""
    },
  }
}

function createSynthEngine(Tone: ToneModule): MusicEngine {
  const output = new Tone.Volume(-60).toDestination()
  const echo = new Tone.FeedbackDelay({ delayTime: 0.18, feedback: 0.22, wet: 0.16 }).connect(output)
  const lead = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 0.01, decay: 0.18, sustain: 0.32, release: 0.9 },
    volume: -8,
  }).connect(echo)
  const bass = new Tone.MonoSynth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.02, decay: 0.3, sustain: 0.5, release: 1.2 },
    filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.4, baseFrequency: 180, octaves: 1.5 },
    volume: -12,
  }).connect(echo)

  let cursor = 0
  const melodyEvents = MELODY.map(([note, beats]) => {
    const event = { time: beatsToSeconds(cursor), note, duration: beatsToSeconds(beats) * 0.92 }
    cursor += beats
    return event
  })
  const bassEvents = BASS_LINE.map(([note, beat]) => ({ time: beatsToSeconds(beat), note, duration: beatsToSeconds(2.6) }))

  const melodyPart = new Tone.Part<{ time: number; note: string; duration: number }>((time, event) => {
    lead.triggerAttackRelease(event.note, event.duration, time, 0.7)
  }, melodyEvents)
  const bassPart = new Tone.Part<{ time: number; note: string; duration: number }>((time, event) => {
    bass.triggerAttackRelease(event.note, event.duration, time, 0.6)
  }, bassEvents)

  for (const part of [melodyPart, bassPart]) {
    part.loop = true
    part.loopEnd = beatsToSeconds(LOOP_BEATS)
  }

  const transport = Tone.getTransport()

  return {
    play: () => {
      if (transport.state === "started") return
      melodyPart.start(0)
      bassPart.start(0)
      transport.start("+0.05")
    },
    fadeTo: (level, seconds) => output.volume.rampTo(levelToDecibels(level), seconds),
    stop: () => {
      output.volume.rampTo(-60, TOGGLE_FADE_SECONDS)
      window.setTimeout(() => {
        try {
          melodyPart.stop()
          bassPart.stop()
          transport.stop()
        } catch {
          transport.cancel()
        }
      }, TOGGLE_FADE_SECONDS * 1000)
    },
    dispose: () => {
      transport.stop()
      melodyPart.dispose()
      bassPart.dispose()
      lead.dispose()
      bass.dispose()
      echo.dispose()
      output.dispose()
    },
  }
}

export function useBirthdayMusic() {
  const engineRef = useRef<Promise<MusicEngine> | null>(null)
  const contextRef = useRef<AudioContext | null>(null)
  const customTrackRef = useRef(false)
  const playingRef = useRef(false)
  const [muted, setMuted] = useState(false)
  const mutedRef = useRef(muted)

  const getEngine = useCallback(() => {
    if (engineRef.current) return engineRef.current
    if (customTrackRef.current) {
      engineRef.current = Promise.resolve(createAudioEngine())
      return engineRef.current
    }
    engineRef.current = import("tone").then((Tone) => {
      const context = contextRef.current ?? new AudioContext({ latencyHint: "playback" })
      contextRef.current = context
      Tone.setContext(new Tone.Context(context))
      return createSynthEngine(Tone)
    })
    return engineRef.current
  }, [])

  useEffect(() => {
    let active = true
    let cancelIdle: (() => void) | null = null
    void hasCustomTrack().then((available) => {
      if (!active) return
      customTrackRef.current = available
      cancelIdle = onIdle(() => {
        if (customTrackRef.current) void getEngine()
        else void import("tone")
      })
    })
    return () => {
      active = false
      cancelIdle?.()
    }
  }, [getEngine])

  const unlock = useCallback(() => {
    if (customTrackRef.current) {
      void getEngine().then((engine) => engine.play())
      return
    }
    if (!contextRef.current) contextRef.current = new AudioContext({ latencyHint: "playback" })
    void contextRef.current.resume()
  }, [getEngine])

  const start = useCallback(async () => {
    const engine = await getEngine()
    playingRef.current = true
    engine.play()
    engine.fadeTo(mutedRef.current ? 0 : VOLUME_LEVEL, FADE_IN_SECONDS)
  }, [getEngine])

  const stop = useCallback(async () => {
    if (!engineRef.current || !playingRef.current) return
    playingRef.current = false
    const engine = await engineRef.current
    engine.stop()
  }, [])

  const toggleMuted = useCallback(() => {
    const nextMuted = !mutedRef.current
    mutedRef.current = nextMuted
    setMuted(nextMuted)
    if (!engineRef.current || !playingRef.current) return
    void engineRef.current.then((engine) => engine.fadeTo(nextMuted ? 0 : VOLUME_LEVEL, TOGGLE_FADE_SECONDS))
  }, [])

  useEffect(
    () => () => {
      void engineRef.current?.then((engine) => engine.dispose())
    },
    [],
  )

  return { unlock, start, stop, muted, toggleMuted }
}
