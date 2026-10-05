import { m } from "motion/react"

import { ShimmerButton } from "@/components/ui/shimmer-button"
import { DURATION, EASE_OUT, STAGGER } from "@/lib/motion"
import { PALETTE } from "@/lib/phase"

type IntroPanelProps = {
  guest: string
  host: string
  reducedMotion: boolean
  canRequestTilt: boolean
  onOpen: () => void
  onRequestTilt: () => void
}

export function IntroPanel({ guest, host, reducedMotion, canRequestTilt, onOpen, onRequestTilt }: IntroPanelProps) {
  const enter = (index: number) => ({
    initial: reducedMotion ? { opacity: 0 } : { opacity: 0, transform: "translateY(16px)" },
    animate: reducedMotion ? { opacity: 1 } : { opacity: 1, transform: "translateY(0px)" },
    transition: { duration: DURATION.reveal, ease: EASE_OUT, delay: 0.15 + index * STAGGER.cascade },
  })

  return (
    <div className="safe-x safe-bottom pointer-events-none relative z-20 mx-auto flex min-h-[100dvh] w-full max-w-[1400px] flex-col justify-end wide:justify-center md:px-12 lg:px-20">
      <div className="pointer-events-auto flex max-w-[42rem] flex-col wide:max-w-[min(42rem,46vw)] gap-6 md:gap-7">
        <m.h1
          {...enter(0)}
          className="font-display text-[2.5rem] leading-[1.04] font-extrabold tracking-tight text-paper sm:text-6xl lg:text-[4.25rem]"
        >
          {guest ? (
            <>
              Estás invitad@,{" "}
              <span className="whitespace-nowrap">
                <span className="text-butter">{guest}</span> <span aria-hidden="true">✉️</span>
              </span>
            </>
          ) : (
            <>
              Tienes una <span className="text-butter">invitación</span> <span aria-hidden="true">✉️</span>
            </>
          )}
        </m.h1>
        <m.p {...enter(1)} className="max-w-[38ch] text-lg leading-relaxed text-paper/75 sm:text-xl">
          {host} cumple años y quiere celebrarlo contigo. Abre el sobre para ver los detalles.
        </m.p>
        <m.div {...enter(2)} className="flex flex-wrap items-center gap-4">
          <ShimmerButton
            onClick={onOpen}
            background={PALETTE.coral}
            shimmerColor={PALETTE.paper}
            className="hover-lift h-14 px-9 text-lg font-semibold text-ink"
          >
            Abrir invitación
          </ShimmerButton>
          {canRequestTilt && (
            <button
              type="button"
              onClick={onRequestTilt}
              className="press inline-flex h-12 items-center rounded-full border border-paper/20 px-5 text-sm font-medium text-paper/85"
            >
              Mover con el teléfono
            </button>
          )}
        </m.div>
      </div>
    </div>
  )
}
