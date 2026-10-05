export type Phase = "closed" | "opening" | "handoff" | "open" | "closing-handoff" | "closing"

export type ScreenRect = { left: number; top: number; width: number; height: number }

export const SCENE_VISIBLE_PHASES: ReadonlySet<Phase> = new Set<Phase>(["closed", "opening", "handoff", "closing-handoff", "closing"])

export const CARD_PHASES: ReadonlySet<Phase> = new Set<Phase>(["open"])

export const PROXY_PHASES: ReadonlySet<Phase> = new Set<Phase>(["handoff", "closing-handoff"])

export const ENVELOPE = {
  width: 3,
  height: 2,
  depth: 0.06,
  flapLength: 1.14,
  letterWidth: 2.6,
  letterHeight: 1.7,
} as const

export const PALETTE = {
  ink: "#15100F",
  coral: "#FF6F59",
  coralLight: "#FF8A76",
  coralDeep: "#D94E3D",
  coralShadow: "#A8382C",
  butter: "#FFDF8A",
  butterDeep: "#E8B94F",
  teal: "#3CCFC0",
  paper: "#FFF4E6",
} as const
