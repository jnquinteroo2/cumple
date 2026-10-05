import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, LayoutGroup, LazyMotion, m, useReducedMotion } from "motion/react"

import { Balloons } from "@/components/card/Balloons"
import { InvitationCard } from "@/components/card/InvitationCard"
import { MuteButton } from "@/components/card/MuteButton"
import { IntroPanel } from "@/components/intro/IntroPanel"
import { LetterProxy } from "@/components/intro/LetterProxy"
import { StaticEnvelope } from "@/components/intro/StaticEnvelope"
import { Confetti } from "@/components/ui/confetti"
import { Particles } from "@/components/ui/particles"
import { useBirthdayMusic } from "@/hooks/useBirthdayMusic"
import { useCardParams } from "@/hooks/useCardParams"
import { useCelebration } from "@/hooks/useCelebration"
import { useDeviceTilt } from "@/hooks/useDeviceTilt"
import { CARD_CONTENT_OUT_MS, CLOSING_CONTENT_IN_MS, CLOSING_MORPH_MS, CROSSFADE, FADE_OUT, HANDOFF_CONTENT_OUT_MS, HANDOFF_MS } from "@/lib/motion"
import { PALETTE, PROXY_PHASES, SCENE_VISIBLE_PHASES, type Phase, type ScreenRect } from "@/lib/phase"
import { onIdle, supportsWebGL, vibrate } from "@/lib/utils"

const loadScene = () => import("@/components/scene/EnvelopeScene")
const EnvelopeScene = lazy(loadScene)
const loadMotionFeatures = () => import("@/lib/motion-features").then((module) => module.default)

const PARTICLE_COLORS = [PALETTE.paper, PALETTE.butter, PALETTE.teal]
const MUSIC_DELAY_MS = 450
const BALLOONS_DELAY_MS = 1400
const INTRO_PHASES: ReadonlySet<Phase> = new Set<Phase>(["closed", "closing"])

function useTimers() {
  const timersRef = useRef<number[]>([])
  const clear = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []
  }, [])
  const schedule = useCallback((callback: () => void, delay: number) => {
    timersRef.current.push(window.setTimeout(callback, delay))
  }, [])
  useEffect(() => clear, [clear])
  return { schedule, clear }
}

export default function App() {
  const params = useCardParams()
  const prefersReducedMotion = useReducedMotion() ?? false
  const [webglAvailable] = useState(supportsWebGL)
  const use3D = webglAvailable && !prefersReducedMotion
  const [phase, setPhase] = useState<Phase>("closed")
  const [proxyRect, setProxyRect] = useState<ScreenRect | null>(null)
  const [proxyContentVisible, setProxyContentVisible] = useState(true)
  const [revealed, setRevealed] = useState(false)
  const [musicStarted, setMusicStarted] = useState(false)
  const [balloonsVisible, setBalloonsVisible] = useState(false)
  const phaseRef = useRef(phase)
  const celebratedRef = useRef(false)
  const timers = useTimers()
  const music = useBirthdayMusic()
  const { confettiRef, celebrate, burstEmojis, burstSmall, reset: resetCelebration } = useCelebration(prefersReducedMotion)
  const tilt = useDeviceTilt()

  const transitionPhase = useCallback((next: Phase) => {
    phaseRef.current = next
    setPhase(next)
  }, [])

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    if (!use3D) return
    return onIdle(() => void loadScene())
  }, [use3D])

  const openCard = useCallback(() => {
    if (!INTRO_PHASES.has(phaseRef.current)) return
    timers.clear()
    vibrate(10)
    music.unlock()
    setMusicStarted(true)
    celebratedRef.current = false
    transitionPhase(use3D ? "opening" : "open")
  }, [music, timers, transitionPhase, use3D])

  const closeCard = useCallback(() => {
    const current = phaseRef.current
    if (current === "closed" || current === "closing") return
    timers.clear()
    setRevealed(false)
    setBalloonsVisible(false)
    resetCelebration()
    void music.stop()
    if (!use3D) {
      transitionPhase("closed")
      return
    }
    if (current === "open" && proxyRect) {
      timers.schedule(() => {
        setProxyContentVisible(false)
        transitionPhase("closing-handoff")
      }, CARD_CONTENT_OUT_MS)
      timers.schedule(() => setProxyContentVisible(true), CARD_CONTENT_OUT_MS + CLOSING_MORPH_MS)
      timers.schedule(() => transitionPhase("closing"), CARD_CONTENT_OUT_MS + CLOSING_MORPH_MS + CLOSING_CONTENT_IN_MS)
      return
    }
    transitionPhase("closing")
  }, [music, proxyRect, resetCelebration, timers, transitionPhase, use3D])

  const handleHandoff = useCallback(
    (rect: ScreenRect) => {
      if (phaseRef.current !== "opening") return
      setProxyRect(rect)
      setProxyContentVisible(true)
      transitionPhase("handoff")
      timers.schedule(() => setProxyContentVisible(false), HANDOFF_CONTENT_OUT_MS)
      timers.schedule(() => transitionPhase("open"), HANDOFF_MS)
    },
    [timers, transitionPhase],
  )

  const handleClosed = useCallback(() => {
    if (phaseRef.current === "closing") transitionPhase("closed")
  }, [transitionPhase])

  const handleCardSettled = useCallback(() => {
    if (phaseRef.current !== "open" || celebratedRef.current) return
    celebratedRef.current = true
    setRevealed(true)
    celebrate()
    timers.schedule(() => void music.start(), MUSIC_DELAY_MS)
    timers.schedule(() => setBalloonsVisible(true), BALLOONS_DELAY_MS)
  }, [celebrate, music, timers])

  const handleReplay = useCallback(
    (origin: { x: number; y: number }) => {
      vibrate([8, 30, 8])
      burstEmojis(origin)
    },
    [burstEmojis],
  )

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCard()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [closeCard])

  const showScene = SCENE_VISIBLE_PHASES.has(phase)
  const showIntro = INTRO_PHASES.has(phase)
  const showCard = phase === "open"

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <main className="relative min-h-[100dvh] overflow-x-clip">
        {!prefersReducedMotion && (
          <Particles className="fixed inset-0 z-0" quantity={70} colors={PARTICLE_COLORS} staticity={40} ease={60} />
        )}

        <m.div
          className="fixed inset-0 z-10"
          initial={false}
          animate={{ opacity: showScene ? 1 : 0 }}
          transition={CROSSFADE}
          aria-hidden="true"
        >
          {use3D ? (
            <Suspense fallback={<StaticEnvelope />}>
              <EnvelopeScene
                phase={phase}
                name={params.guest}
                running={showScene}
                tiltRef={tilt.tiltRef}
                onHandoff={handleHandoff}
                onClosed={handleClosed}
              />
            </Suspense>
          ) : (
            <StaticEnvelope />
          )}
        </m.div>

        <AnimatePresence>
          {showIntro && (
            <m.div key="intro" className="relative z-20" exit={{ opacity: 0, transition: FADE_OUT }}>
              <IntroPanel
                guest={params.guest}
                host={params.host}
                reducedMotion={prefersReducedMotion}
                canRequestTilt={use3D && tilt.canRequest}
                onOpen={openCard}
                onRequestTilt={() => void tilt.requestTilt()}
              />
            </m.div>
          )}
        </AnimatePresence>

        <LayoutGroup>
          <AnimatePresence>{use3D && proxyRect && PROXY_PHASES.has(phase) && <LetterProxy key="proxy" rect={proxyRect} name={params.guest} contentVisible={proxyContentVisible} />}</AnimatePresence>
          <AnimatePresence>
            {showCard && (
              <InvitationCard
                key="card"
                params={params}
                revealed={revealed}
                reducedMotion={prefersReducedMotion}
                morphFromLetter={use3D}
                onSettled={handleCardSettled}
                onReplay={handleReplay}
                onClose={closeCard}
              />
            )}
          </AnimatePresence>
        </LayoutGroup>

        {revealed && balloonsVisible && !prefersReducedMotion && <Balloons onPop={burstSmall} />}

        <Confetti ref={confettiRef} manualstart className="pointer-events-none fixed inset-0 z-40 size-full" />

        <AnimatePresence>{musicStarted && <MuteButton key="mute" muted={music.muted} onToggle={music.toggleMuted} />}</AnimatePresence>
      </main>
    </LazyMotion>
  )
}
