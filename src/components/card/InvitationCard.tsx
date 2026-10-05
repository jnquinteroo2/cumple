import { useCallback, useRef, type PointerEvent, type ReactNode } from "react"
import { m, useMotionValue, useSpring, useTransform, type Variants } from "motion/react"
import { CalendarBlank, Clock, MapPin, NavigationArrow, WhatsappLogo } from "@phosphor-icons/react"

import { AuroraText } from "@/components/ui/aurora-text"
import { CoolMode, type CoolParticleOptions } from "@/components/ui/cool-mode"
import { MagicCard } from "@/components/ui/magic-card"
import { NumberTicker } from "@/components/ui/number-ticker"
import { ShineBorder } from "@/components/ui/shine-border"
import { SparklesText } from "@/components/ui/sparkles-text"
import { TextAnimate } from "@/components/ui/text-animate"
import { Countdown } from "@/components/card/Countdown"
import { EVENT } from "@/config/event"
import type { CardParams } from "@/hooks/useCardParams"
import { formatEventDate, googleMapsUrl, wazeUrl, whatsappRsvpUrl } from "@/lib/event-links"
import { CONTENT_FADE_SECONDS, CROSSFADE, DURATION, EASE_OUT, SPRING, STAGGER } from "@/lib/motion"
import { PALETTE } from "@/lib/phase"

const MAX_TILT_DEGREES = 7
const CARD_RADIUS = 28
const CONTENT_OUT = { duration: CONTENT_FADE_SECONDS, ease: EASE_OUT }
const COOL_MODE_OPTIONS: CoolParticleOptions = { particle: ["🎉", "🎂", "🥳", "🎈"], size: 26 }
const SPARKLE_COLORS = { first: PALETTE.coral, second: "#1FA89B" }
const AURORA_COLORS = ["#D2432F", "#E0533F", "#137E75", "#B8452F"]

type InvitationCardProps = {
  params: CardParams
  revealed: boolean
  reducedMotion: boolean
  morphFromLetter: boolean
  onSettled: () => void
  onReplay: (origin: { x: number; y: number }) => void
  onClose: () => void
}

function useCascade(reducedMotion: boolean) {
  const container: Variants = {
    hidden: { transition: { staggerChildren: 0 } },
    show: { transition: { staggerChildren: reducedMotion ? 0.06 : STAGGER.cascade } },
  }
  const item: Variants = reducedMotion
    ? { hidden: { opacity: 0, transition: CONTENT_OUT }, show: { opacity: 1, transition: { duration: DURATION.reveal, ease: EASE_OUT } } }
    : {
        hidden: { opacity: 0, transform: "translateY(14px)", transition: CONTENT_OUT },
        show: { opacity: 1, transform: "translateY(0px)", transition: { duration: DURATION.reveal, ease: EASE_OUT } },
      }
  return { container, item }
}

function TiltSurface({ children, enabled }: { children: ReactNode; enabled: boolean }) {
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const springX = useSpring(pointerX, SPRING.tilt)
  const springY = useSpring(pointerY, SPRING.tilt)
  const rotateX = useTransform(springY, (value) => value * -MAX_TILT_DEGREES)
  const rotateY = useTransform(springX, (value) => value * MAX_TILT_DEGREES)

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!enabled || event.pointerType !== "mouse") return
      const rect = event.currentTarget.getBoundingClientRect()
      pointerX.set(((event.clientX - rect.left) / rect.width) * 2 - 1)
      pointerY.set(((event.clientY - rect.top) / rect.height) * 2 - 1)
    },
    [enabled, pointerX, pointerY],
  )

  const handlePointerLeave = useCallback(() => {
    pointerX.set(0)
    pointerY.set(0)
  }, [pointerX, pointerY])

  return (
    <div className="w-full [perspective:1400px]" onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave}>
      <m.div className={enabled ? "will-change-transform" : undefined} style={enabled ? { rotateX, rotateY } : undefined}>{children}</m.div>
    </div>
  )
}

function DetailRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-coral/15 text-coral-deep" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{label}</dt>
        <dd className="text-lg leading-snug font-medium text-ink-text">{children}</dd>
      </div>
    </div>
  )
}

function EventDetails() {
  const { day, time } = formatEventDate(EVENT)
  return (
    <dl className="grid gap-4 rounded-3xl border border-hairline bg-paper-deep/50 p-5 sm:grid-cols-2 sm:p-6">
      <DetailRow icon={<CalendarBlank size={20} weight="bold" />} label="Fecha">
        {day}
      </DetailRow>
      <DetailRow icon={<Clock size={20} weight="bold" />} label="Hora">
        {time}
      </DetailRow>
      <div className="sm:col-span-2">
        <DetailRow icon={<MapPin size={20} weight="bold" />} label="Lugar">
          <span className="block">{EVENT.location.name}</span>
          <span className="block text-base font-normal text-ink-muted">{EVENT.location.address}</span>
        </DetailRow>
      </div>
    </dl>
  )
}

const LINK_PILL =
  "press hover-lift inline-flex h-12 items-center justify-center gap-2 rounded-full px-4 text-[15px] font-semibold whitespace-nowrap sm:px-5 sm:text-base [&>svg]:shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-deep"

function DirectionsLinks() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <a href={googleMapsUrl(EVENT.location)} target="_blank" rel="noopener noreferrer" className={`${LINK_PILL} border border-ink-text/20 text-ink-text`}>
        <MapPin size={20} weight="bold" aria-hidden="true" />
        Google Maps
      </a>
      <a href={wazeUrl(EVENT.location)} target="_blank" rel="noopener noreferrer" className={`${LINK_PILL} border border-ink-text/20 text-ink-text`}>
        <NavigationArrow size={20} weight="bold" aria-hidden="true" />
        Waze
      </a>
    </div>
  )
}

function RsvpActions({ guest }: { guest: string }) {
  return (
    <div className="flex flex-col gap-3">
      <a
        href={whatsappRsvpUrl(EVENT, guest, "yes")}
        target="_blank"
        rel="noopener noreferrer"
        className={`${LINK_PILL} h-14 bg-ink text-lg text-paper`}
      >
        <WhatsappLogo size={24} weight="fill" className="text-teal" aria-hidden="true" />
        Confirmar asistencia
      </a>
      <a
        href={whatsappRsvpUrl(EVENT, guest, "no")}
        target="_blank"
        rel="noopener noreferrer"
        className="press self-center rounded-full px-4 py-2 text-sm font-medium text-ink-muted underline decoration-ink-muted/40 underline-offset-4"
      >
        No puedo ir
      </a>
    </div>
  )
}

function CardActions({ onReplay, onClose, reducedMotion }: Pick<InvitationCardProps, "onReplay" | "onClose" | "reducedMotion">) {
  const replayRef = useRef<HTMLButtonElement>(null)

  const handleReplay = () => {
    const rect = replayRef.current?.getBoundingClientRect()
    onReplay(
      rect
        ? { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight }
        : { x: 0.5, y: 0.7 },
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 border-t border-hairline pt-5">
      <CoolMode options={COOL_MODE_OPTIONS} disabled={reducedMotion}>
        <button
          ref={replayRef}
          type="button"
          onClick={handleReplay}
          className="press inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-ink-text"
        >
          Más confeti <span aria-hidden="true">🎉</span>
        </button>
      </CoolMode>
      <button type="button" onClick={onClose} className="press inline-flex h-11 items-center rounded-full px-4 text-sm font-medium text-ink-muted">
        Volver a cerrar
      </button>
    </div>
  )
}

export function InvitationCard({ params, revealed, reducedMotion, morphFromLetter, onSettled, onReplay, onClose }: InvitationCardProps) {
  const { container, item } = useCascade(reducedMotion)

  return (
    <div className="safe-x relative z-20 mx-auto flex min-h-[100dvh] w-full max-w-[620px] items-center py-20">
      <TiltSurface enabled={!reducedMotion && revealed}>
        <m.article
          layoutId={morphFromLetter ? "letter" : undefined}
          aria-labelledby="invitation-title"
          className="relative w-full text-ink-text will-change-transform shadow-[0_40px_80px_-30px_rgba(198,63,44,0.55),0_12px_32px_-12px_rgba(21,16,15,0.6)]"
          style={{ borderRadius: CARD_RADIUS, backgroundColor: PALETTE.paper }}
          initial={morphFromLetter ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={morphFromLetter ? undefined : { opacity: 0, transition: CROSSFADE }}
          transition={morphFromLetter ? { layout: SPRING.handoff } : CROSSFADE}
          onLayoutAnimationComplete={onSettled}
          onAnimationComplete={morphFromLetter ? undefined : onSettled}
        >
          <MagicCard className="rounded-[28px]">
            <ShineBorder borderWidth={2} duration={12} shineColor={[PALETTE.coral, PALETTE.butter, PALETTE.teal]} />
            <m.div
              className="flex flex-col gap-6 px-6 pt-8 pb-6 sm:px-10 sm:pt-11 sm:pb-8"
              variants={container}
              initial="hidden"
              animate={revealed ? "show" : "hidden"}
            >
              <m.div variants={item} className="flex flex-col gap-2">
                {params.guest && <p className="text-lg font-medium text-ink-muted">Hola, {params.guest} 👋</p>}
                <h1 id="invitation-title" className="font-display text-[2.6rem] leading-[1.02] font-extrabold tracking-tight sm:text-6xl">
                  <AuroraText colors={AURORA_COLORS}>¡Estás invitad@!</AuroraText>
                </h1>
              </m.div>

              <m.div variants={item} className="-mt-2 flex flex-wrap items-baseline gap-x-3 sm:pl-10">
                <span className="text-xl text-ink-muted">al cumpleaños de</span>
                <SparklesText
                  colors={SPARKLE_COLORS}
                  paused={reducedMotion || !revealed}
                  className="font-display text-4xl leading-[1.1] font-bold tracking-tight text-ink-text sm:text-5xl"
                >
                  {params.host}
                </SparklesText>
              </m.div>

              {EVENT.age !== null && (
                <m.p variants={item} className="flex items-baseline gap-2 text-lg text-ink-muted">
                  Cumple
                  <NumberTicker value={EVENT.age} delay={0.3} className="font-display text-5xl leading-none font-extrabold text-coral-deep" />
                  años
                </m.p>
              )}

              <TextAnimate
                className="max-w-[46ch] text-lg leading-relaxed text-ink-muted"
                active={revealed}
                delay={reducedMotion ? 0.2 : 0.45}
                stagger={STAGGER.word}
                reducedMotion={reducedMotion}
              >
                {EVENT.message}
              </TextAnimate>

              <m.div variants={item}>
                <EventDetails />
              </m.div>

              <m.div variants={item} className="flex flex-col gap-2">
                <p className="text-sm font-semibold tracking-wide text-ink-muted uppercase">Faltan</p>
                <Countdown startsAt={EVENT.startsAt} endsAt={EVENT.endsAt} reducedMotion={reducedMotion} />
              </m.div>

              <m.div variants={item}>
                <DirectionsLinks />
              </m.div>

              <m.div variants={item}>
                <RsvpActions guest={params.guest} />
              </m.div>

              <m.div variants={item}>
                <CardActions onReplay={onReplay} onClose={onClose} reducedMotion={reducedMotion} />
              </m.div>
            </m.div>
          </MagicCard>
        </m.article>
      </TiltSurface>
    </div>
  )
}
