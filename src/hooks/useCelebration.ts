import { useCallback, useEffect, useRef } from "react"
import confetti, { type Shape } from "canvas-confetti"

import type { ConfettiRef } from "@/components/ui/confetti"

import { CELEBRATION_MS } from "@/lib/motion"
import { onIdle } from "@/lib/utils"

const PALETTE = ["#FF6F59", "#FFDF8A", "#3CCFC0", "#FFF4E6", "#FF9F8C"]
const EMOJIS = ["🎉", "🎂", "🥳", "🎈"]
const CANNON_INTERVAL_MS = 50

type Origin = { x: number; y: number }

export function useCelebration(reducedMotion: boolean) {
  const confettiRef = useRef<ConfettiRef>(null)
  const timersRef = useRef<number[]>([])
  const frameRef = useRef<number | null>(null)
  const emojiShapesRef = useRef<Shape[] | null>(null)

  const stop = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
  }, [])

  const reset = useCallback(() => {
    stop()
    confettiRef.current?.reset()
  }, [stop])

  useEffect(() => () => reset(), [reset])

  useEffect(
    () =>
      onIdle(() => {
        if (!emojiShapesRef.current) emojiShapesRef.current = EMOJIS.map((text) => confetti.shapeFromText({ text, scalar: 2.4 }))
      }),
    [],
  )

  const getEmojiShapes = useCallback(() => {
    if (!emojiShapesRef.current) {
      emojiShapesRef.current = EMOJIS.map((text) => confetti.shapeFromText({ text, scalar: 2.4 }))
    }
    return emojiShapesRef.current
  }, [])

  const fireSideCannons = useCallback(() => {
    const fire = confettiRef.current?.fire
    if (!fire) return
    const endAt = performance.now() + CELEBRATION_MS
    let lastBurst = 0
    const tick = (now: number) => {
      if (now > endAt) {
        frameRef.current = null
        return
      }
      if (now - lastBurst >= CANNON_INTERVAL_MS) {
        lastBurst = now
        const shared = { particleCount: 4, spread: 58, startVelocity: 62, colors: PALETTE, ticks: 200 }
        fire({ ...shared, angle: 60, origin: { x: 0, y: 0.72 } })
        fire({ ...shared, angle: 120, origin: { x: 1, y: 0.72 } })
      }
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
  }, [])

  const fireFireworks = useCallback(() => {
    const fire = confettiRef.current?.fire
    if (!fire) return
    const bursts = 6
    for (let index = 0; index < bursts; index += 1) {
      const timer = window.setTimeout(() => {
        fire({
          particleCount: 36,
          spread: 360,
          startVelocity: 26,
          ticks: 70,
          gravity: 0.7,
          scalar: 0.9,
          colors: PALETTE,
          origin: { x: 0.15 + Math.random() * 0.7, y: 0.12 + Math.random() * 0.3 },
        })
      }, index * (CELEBRATION_MS / bursts))
      timersRef.current.push(timer)
    }
  }, [])

  const celebrate = useCallback(() => {
    stop()
    const fire = confettiRef.current?.fire
    if (!fire) return
    if (reducedMotion) {
      fire({ particleCount: 40, spread: 80, startVelocity: 22, gravity: 0.6, ticks: 120, colors: PALETTE, origin: { x: 0.5, y: 0.4 } })
      return
    }
    fireSideCannons()
    fireFireworks()
  }, [fireFireworks, fireSideCannons, reducedMotion, stop])

  const burstEmojis = useCallback(
    (origin: Origin = { x: 0.5, y: 0.6 }) => {
      const fire = confettiRef.current?.fire
      if (!fire) return
      fire({
        shapes: getEmojiShapes(),
        scalar: 2.4,
        particleCount: reducedMotion ? 14 : 34,
        spread: 75,
        startVelocity: reducedMotion ? 20 : 42,
        gravity: 0.9,
        ticks: 180,
        flat: true,
        origin,
      })
    },
    [getEmojiShapes, reducedMotion],
  )

  const burstSmall = useCallback((origin: Origin, color: string) => {
    const fire = confettiRef.current?.fire
    if (!fire) return
    fire({
      particleCount: 22,
      spread: 360,
      startVelocity: 14,
      gravity: 0.8,
      ticks: 60,
      scalar: 0.7,
      colors: [color, "#FFF4E6"],
      origin,
    })
  }, [])

  return { confettiRef, celebrate, burstEmojis, burstSmall, reset }
}
