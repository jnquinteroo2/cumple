import { useCallback, useEffect, useRef, useState } from "react"

export type TiltVector = { x: number; y: number }

type OrientationPermission = "granted" | "denied" | "default"

type OrientationEventWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<OrientationPermission>
}

const MAX_GAMMA = 30
const MAX_BETA = 25
const RESTING_BETA = 45

function clampUnit(value: number) {
  return Math.max(-1, Math.min(1, value))
}

function getOrientationEvent() {
  if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) return null
  return window.DeviceOrientationEvent as OrientationEventWithPermission
}

export function useDeviceTilt() {
  const tiltRef = useRef<TiltVector | null>(null)
  const orientationEvent = getOrientationEvent()
  const isTouch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches
  const needsPermission = typeof orientationEvent?.requestPermission === "function"
  const available = Boolean(orientationEvent) && isTouch
  const [enabled, setEnabled] = useState(() => available && !needsPermission)

  useEffect(() => {
    if (!enabled) return
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma === null || event.beta === null) return
      tiltRef.current = {
        x: clampUnit(event.gamma / MAX_GAMMA),
        y: clampUnit((event.beta - RESTING_BETA) / MAX_BETA),
      }
    }
    window.addEventListener("deviceorientation", handleOrientation)
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation)
      tiltRef.current = null
    }
  }, [enabled])

  const requestTilt = useCallback(async () => {
    if (!orientationEvent?.requestPermission) {
      setEnabled(true)
      return
    }
    try {
      const permission = await orientationEvent.requestPermission()
      setEnabled(permission === "granted")
    } catch {
      setEnabled(false)
    }
  }, [orientationEvent])

  return { tiltRef, enabled, canRequest: available && needsPermission && !enabled, requestTilt }
}
