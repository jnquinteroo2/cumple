import { AnimatePresence, m } from "motion/react"
import { SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react"

import { DURATION, EASE_OUT } from "@/lib/motion"

type MuteButtonProps = {
  muted: boolean
  onToggle: () => void
}

const ICON_SWAP = { duration: DURATION.press, ease: EASE_OUT }

export function MuteButton({ muted, onToggle }: MuteButtonProps) {
  return (
    <m.button
      type="button"
      onClick={onToggle}
      aria-pressed={muted}
      aria-label={muted ? "Activar música" : "Silenciar música"}
      className="press hover-lift safe-top safe-right fixed z-50 grid size-12 place-items-center rounded-full border border-paper/15 bg-ink-soft/80 text-paper backdrop-blur-md"
      initial={{ opacity: 0, transform: "scale(0.95)" }}
      animate={{ opacity: 1, transform: "scale(1)" }}
      exit={{ opacity: 0, transform: "scale(0.95)" }}
      transition={{ duration: DURATION.ui, ease: EASE_OUT }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <m.span
          key={muted ? "muted" : "sound"}
          className="grid place-items-center"
          initial={{ opacity: 0, transform: "scale(0.8)", filter: "blur(4px)" }}
          animate={{ opacity: 1, transform: "scale(1)", filter: "blur(0px)" }}
          exit={{ opacity: 0, transform: "scale(0.8)", filter: "blur(4px)" }}
          transition={ICON_SWAP}
        >
          {muted ? <SpeakerSlash size={22} weight="bold" aria-hidden="true" /> : <SpeakerHigh size={22} weight="bold" aria-hidden="true" />}
        </m.span>
      </AnimatePresence>
    </m.button>
  )
}
