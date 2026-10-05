import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react"
import { m } from "motion/react"

import { DURATION, EASE_OUT } from "@/lib/motion"
import { PALETTE } from "@/lib/phase"
import { vibrate } from "@/lib/utils"

type BalloonSpec = {
  id: number
  left: number
  scale: number
  color: string
  riseDuration: number
  riseDelay: number
  swayDuration: number
}

type BalloonsProps = {
  onPop: (origin: { x: number; y: number }, color: string) => void
}

const COLORS = [PALETTE.coral, PALETTE.butter, PALETTE.teal, "#FF9F8C"]
const RESPAWN_MS = 900

let balloonSequence = 0

function createBalloon(index: number, initial: boolean): BalloonSpec {
  balloonSequence += 1
  return {
    id: balloonSequence,
    left: 4 + Math.random() * 88,
    scale: 0.75 + Math.random() * 0.45,
    color: COLORS[index % COLORS.length] ?? PALETTE.coral,
    riseDuration: 9 + Math.random() * 6,
    riseDelay: initial ? index * 0.7 + Math.random() * 0.6 : Math.random() * 1.5,
    swayDuration: 2.2 + Math.random() * 1.4,
  }
}

function getBalloonCount() {
  return window.matchMedia("(min-width: 768px)").matches ? 7 : 4
}

function BalloonShape({ color }: { color: string }) {
  return (
    <svg width="64" height="118" viewBox="0 0 64 118" aria-hidden="true" className="block overflow-visible">
      <path
        d="M32 2C15.4 2 4 15.6 4 32.6 4 52.4 20.4 70.6 30 76h4c9.6-5.4 26-23.6 26-43.4C60 15.6 48.6 2 32 2Z"
        fill={color}
      />
      <path d="M19 14c-6 4-9 11-8.6 18" stroke="#FFF4E6" strokeOpacity="0.55" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M28 76h8l-2 5h-4z" fill={color} />
      <path d="M32 81c-5 8 5 13 0 21s4 10 1 15" stroke="#FFF4E6" strokeOpacity="0.45" strokeWidth="1.4" fill="none" />
    </svg>
  )
}

type BalloonProps = {
  spec: BalloonSpec
  onPopped: (spec: BalloonSpec, origin: { x: number; y: number }) => void
  onFinished: (spec: BalloonSpec) => void
}

function Balloon({ spec, onPopped, onFinished }: BalloonProps) {
  const [popped, setPopped] = useState(false)
  const travel = typeof window === "undefined" ? 1000 : window.innerHeight + 220

  const handlePop = (event: MouseEvent<HTMLButtonElement>) => {
    if (popped) return
    const rect = event.currentTarget.getBoundingClientRect()
    setPopped(true)
    vibrate(12)
    onPopped(spec, {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height * 0.32) / window.innerHeight,
    })
  }

  return (
    <div
      className="balloon-track pointer-events-none absolute top-full"
      style={
        {
          left: `${spec.left}%`,
          "--rise-duration": `${spec.riseDuration}s`,
          "--rise-delay": `${spec.riseDelay}s`,
          "--travel": `-${travel}px`,
        } as CSSProperties
      }
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) onFinished(spec)
      }}
    >
      <div className="balloon-sway" style={{ "--sway-duration": `${spec.swayDuration}s` } as CSSProperties}>
        <m.button
          type="button"
          aria-label="Explotar globo"
          disabled={popped}
          onClick={handlePop}
          className="pointer-events-auto block origin-[50%_35%] cursor-pointer"
          style={{ scale: spec.scale }}
          animate={popped ? { opacity: 0, scale: spec.scale * 1.3 } : { opacity: 1, scale: spec.scale }}
          transition={{ duration: DURATION.balloonPop, ease: EASE_OUT }}
        >
          <BalloonShape color={spec.color} />
        </m.button>
      </div>
    </div>
  )
}

export function Balloons({ onPop }: BalloonsProps) {
  const [balloons, setBalloons] = useState<BalloonSpec[]>(() =>
    Array.from({ length: getBalloonCount() }, (_, index) => createBalloon(index, true)),
  )
  const timersRef = useRef<number[]>([])

  useEffect(
    () => () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer))
    },
    [],
  )

  const replace = useCallback((spec: BalloonSpec, delay: number) => {
    const timer = window.setTimeout(() => {
      setBalloons((current) =>
        current.map((balloon, index) => (balloon.id === spec.id ? createBalloon(index, false) : balloon)),
      )
    }, delay)
    timersRef.current.push(timer)
  }, [])

  const handlePopped = useCallback(
    (spec: BalloonSpec, origin: { x: number; y: number }) => {
      onPop(origin, spec.color)
      replace(spec, RESPAWN_MS)
    },
    [onPop, replace],
  )

  const handleFinished = useCallback((spec: BalloonSpec) => replace(spec, 0), [replace])

  return (
    <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
      {balloons.map((spec) => (
        <Balloon key={spec.id} spec={spec} onPopped={handlePopped} onFinished={handleFinished} />
      ))}
    </div>
  )
}
