import { AnimatePresence, m } from "motion/react"

import { useCountdown } from "@/hooks/useCountdown"
import { DURATION, EASE_OUT } from "@/lib/motion"

type CountdownProps = {
  startsAt: string
  endsAt: string | null
  reducedMotion: boolean
}

const DIGIT_TRANSITION = { duration: DURATION.ui, ease: EASE_OUT }

function CountdownUnit({ value, label, reducedMotion }: { value: number; label: string; reducedMotion: boolean }) {
  const display = String(value).padStart(2, "0")
  return (
    <div className="flex min-w-0 flex-col items-center gap-1 rounded-2xl bg-ink px-2 py-3 text-paper sm:py-4">
      <span className="relative block h-[1.1em] overflow-hidden font-display text-3xl leading-[1.1] font-extrabold tabular-nums sm:text-4xl">
        <AnimatePresence mode="popLayout" initial={false}>
          <m.span
            key={display}
            className="block"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, transform: "translateY(-60%)" }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, transform: "translateY(0%)" }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, transform: "translateY(60%)" }}
            transition={DIGIT_TRANSITION}
          >
            {display}
          </m.span>
        </AnimatePresence>
      </span>
      <span className="text-xs font-medium tracking-wide text-paper/65 uppercase">{label}</span>
    </div>
  )
}

export function Countdown({ startsAt, endsAt, reducedMotion }: CountdownProps) {
  const state = useCountdown(startsAt, endsAt)

  if (state.status === "live") {
    return <p className="rounded-2xl bg-ink px-5 py-4 font-display text-2xl font-bold text-butter">¡La fiesta es ahora! 🎉</p>
  }

  if (state.status === "past") {
    return <p className="rounded-2xl bg-paper-deep px-5 py-4 text-lg text-ink-muted">Esta fiesta ya pasó. ¡Gracias por celebrar!</p>
  }

  return (
    <div role="timer" aria-label={`Faltan ${state.days} días, ${state.hours} horas y ${state.minutes} minutos`}>
      <div className="grid grid-cols-4 gap-2 sm:gap-3" aria-hidden="true">
        <CountdownUnit value={state.days} label={state.days === 1 ? "día" : "días"} reducedMotion={reducedMotion} />
        <CountdownUnit value={state.hours} label="horas" reducedMotion={reducedMotion} />
        <CountdownUnit value={state.minutes} label="min" reducedMotion={reducedMotion} />
        <CountdownUnit value={state.seconds} label="seg" reducedMotion={reducedMotion} />
      </div>
    </div>
  )
}
