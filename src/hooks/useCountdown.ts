import { useEffect, useState } from "react"

export type CountdownState =
  | { status: "upcoming"; days: number; hours: number; minutes: number; seconds: number }
  | { status: "live" }
  | { status: "past" }

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const DEFAULT_PARTY_LENGTH = 6 * HOUR

function computeCountdown(startsAt: number, endsAt: number, now: number): CountdownState {
  if (now >= endsAt) return { status: "past" }
  if (now >= startsAt) return { status: "live" }
  const remaining = startsAt - now
  return {
    status: "upcoming",
    days: Math.floor(remaining / DAY),
    hours: Math.floor((remaining % DAY) / HOUR),
    minutes: Math.floor((remaining % HOUR) / MINUTE),
    seconds: Math.floor((remaining % MINUTE) / SECOND),
  }
}

export function useCountdown(startsAtIso: string, endsAtIso: string | null): CountdownState {
  const startsAt = new Date(startsAtIso).getTime()
  const endsAt = endsAtIso ? new Date(endsAtIso).getTime() : startsAt + DEFAULT_PARTY_LENGTH
  const [state, setState] = useState(() => computeCountdown(startsAt, endsAt, Date.now()))

  useEffect(() => {
    const tick = () => setState(computeCountdown(startsAt, endsAt, Date.now()))
    tick()
    const interval = window.setInterval(tick, SECOND)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") tick()
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [startsAt, endsAt])

  return state
}
