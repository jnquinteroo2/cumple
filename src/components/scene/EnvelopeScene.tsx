import { useEffect, useState, type MutableRefObject, type ReactNode } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { ContactShadows, Environment, Lightformer, PerformanceMonitor, Preload } from "@react-three/drei"
import { MathUtils, type PerspectiveCamera } from "three"

import { Envelope } from "@/components/scene/Envelope"
import type { TiltVector } from "@/hooks/useDeviceTilt"
import { ENVELOPE, PALETTE, type Phase, type ScreenRect } from "@/lib/phase"

const CAMERA_FOV = 32
const HIGH_DPR = 1.5
const LOW_DPR = 1
const WIDE_ASPECT = 1.15
const NARROW_BASE_FIT = 1.3
const NARROW_BASE_ASPECT = 0.46

type EnvelopeSceneProps = {
  phase: Phase
  name: string
  running: boolean
  tiltRef: MutableRefObject<TiltVector | null>
  onHandoff: (rect: ScreenRect) => void
  onClosed: () => void
}

function ResponsiveStage({ children }: { children: ReactNode }) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera
  const size = useThree((state) => state.size)
  const aspect = size.width / Math.max(size.height, 1)
  const isWide = aspect >= WIDE_ASPECT && size.width >= 768
  const viewFactor = 2 * Math.tan(MathUtils.degToRad(CAMERA_FOV) / 2)
  const distanceForHeight = (ENVELOPE.height * (isWide ? 2.5 : 2.9)) / viewFactor
  const distanceForWidth = (ENVELOPE.width * (isWide ? 2.1 : NARROW_BASE_FIT + Math.max(0, aspect - NARROW_BASE_ASPECT) * 1.2)) / (viewFactor * aspect)
  const distance = Math.max(distanceForHeight, distanceForWidth)
  const visibleHeight = distance * viewFactor
  const visibleWidth = visibleHeight * aspect
  const offsetX = isWide ? visibleWidth * 0.2 : 0
  const offsetY = isWide ? 0.05 : visibleHeight * 0.16

  useEffect(() => {
    camera.position.set(0, 0, distance)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [camera, distance])

  return (
    <group position={[offsetX, offsetY, 0]}>
      {children}
      <ContactShadows
        position={[0, -ENVELOPE.height * 0.95, 0]}
        opacity={0.55}
        scale={7}
        blur={2.6}
        far={3}
        resolution={256}
        frames={1}
        color={PALETTE.ink}
      />
    </group>
  )
}

function StudioLighting() {
  return (
    <>
      <ambientLight intensity={0.55} color={PALETTE.paper} />
      <directionalLight position={[3, 4, 5]} intensity={1.7} color="#FFE9D6" />
      <directionalLight position={[-4, -1, 3]} intensity={0.5} color={PALETTE.teal} />
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={2.2} color={PALETTE.paper} position={[0, 4, 3]} scale={[6, 2, 1]} />
        <Lightformer form="circle" intensity={1.4} color={PALETTE.butter} position={[-4, 1, 2]} scale={2.5} />
        <Lightformer form="circle" intensity={1.1} color={PALETTE.teal} position={[4, -1, 2]} scale={2} />
      </Environment>
    </>
  )
}

function usePageVisible() {
  const [visible, setVisible] = useState(() => document.visibilityState === "visible")
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === "visible")
    document.addEventListener("visibilitychange", update)
    return () => document.removeEventListener("visibilitychange", update)
  }, [])
  return visible
}

export default function EnvelopeScene({ phase, name, running, tiltRef, onHandoff, onClosed }: EnvelopeSceneProps) {
  const pageVisible = usePageVisible()
  const [maxDpr, setMaxDpr] = useState(HIGH_DPR)

  return (
    <Canvas
      dpr={[1, maxDpr]}
      frameloop={running && pageVisible ? "always" : "never"}
      camera={{ fov: CAMERA_FOV, near: 0.1, far: 60, position: [0, 0, 10] }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      aria-hidden="true"
    >
      <PerformanceMonitor onDecline={() => setMaxDpr(LOW_DPR)} onIncline={() => setMaxDpr(HIGH_DPR)} />
      <StudioLighting />
      <ResponsiveStage>
        <Envelope phase={phase} name={name} tiltRef={tiltRef} onHandoff={onHandoff} onClosed={onClosed} />
      </ResponsiveStage>
      <Preload all />
    </Canvas>
  )
}
