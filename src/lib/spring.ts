import type { SpringConfig } from "@/lib/motion"

export type SpringState = { value: number; velocity: number }

const MAX_STEP = 1 / 120

export function createSpring(value = 0): SpringState {
  return { value, velocity: 0 }
}

export function stepSpring(state: SpringState, target: number, config: SpringConfig, delta: number) {
  const mass = config.mass ?? 1
  let remaining = Math.min(delta, 0.1)
  while (remaining > 0) {
    const step = Math.min(remaining, MAX_STEP)
    const force = -config.stiffness * (state.value - target) - config.damping * state.velocity
    state.velocity += (force / mass) * step
    state.value += state.velocity * step
    remaining -= step
  }
  return state.value
}

export function isSpringSettled(state: SpringState, target: number, precision = 0.002) {
  return Math.abs(state.value - target) < precision && Math.abs(state.velocity) < precision
}
