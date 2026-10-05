import type { Transition } from "motion/react"

export const EASE_OUT = [0.23, 1, 0.32, 1] as const
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const

export const DURATION = {
  press: 0.16,
  ui: 0.22,
  reveal: 0.5,
  crossfade: 0.4,
  balloonPop: 0.18,
} as const

export const STAGGER = {
  cascade: 0.12,
  word: 0.045,
} as const

export const SPRING = {
  card: { type: "spring", duration: 0.7, bounce: 0.18 },
  handoff: { type: "spring", duration: 0.65, bounce: 0.12 },
  playful: { type: "spring", duration: 0.45, bounce: 0.5 },
  tilt: { stiffness: 150, damping: 18, mass: 0.6 },
} as const satisfies Record<string, Transition | { stiffness: number; damping: number; mass: number }>

export const FADE_OUT: Transition = { duration: DURATION.ui, ease: EASE_OUT }
export const REVEAL: Transition = { duration: DURATION.reveal, ease: EASE_OUT }
export const CROSSFADE: Transition = { duration: DURATION.crossfade, ease: EASE_IN_OUT }

export type SpringConfig = { stiffness: number; damping: number; mass?: number }

export const SCENE_SPRING = {
  flap: { stiffness: 120, damping: 14 },
  seal: { stiffness: 320, damping: 9 },
  letterRise: { stiffness: 70, damping: 16 },
  letterForward: { stiffness: 55, damping: 15 },
  pointerTilt: { stiffness: 40, damping: 11 },
} as const satisfies Record<string, SpringConfig>

export const OPENING_TIMELINE = {
  flap: 0,
  seal: 0,
  letterRise: 0.5,
  letterForward: 1.35,
  handoff: 2.15,
} as const

export const CLOSING_TIMELINE = {
  letterForward: 0,
  letterRise: 0.55,
  flap: 1.15,
  seal: 1.55,
  done: 2.2,
} as const

export const HANDOFF_MS = 280
export const HANDOFF_CONTENT_OUT_MS = 150
export const CARD_CONTENT_OUT_MS = 150
export const CLOSING_MORPH_MS = 640
export const CLOSING_CONTENT_IN_MS = 180
export const CONTENT_FADE_SECONDS = 0.12
export const CELEBRATION_MS = 3000
