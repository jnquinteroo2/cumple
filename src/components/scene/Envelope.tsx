import { useEffect, useMemo, useRef, type MutableRefObject } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { Float } from "@react-three/drei"
import {
  BackSide,
  FrontSide,
  MathUtils,
  Vector3,
  type Camera,
  type Group,
  type Mesh,
  type MeshStandardMaterial,
  type PerspectiveCamera,
} from "three"

import { Letter } from "@/components/scene/Letter"
import { circleShape, roundedTriangle, starShape, waxBlobShape } from "@/components/scene/envelope-geometry"
import { createPaperGrainTexture } from "@/components/scene/envelope-textures"
import type { TiltVector } from "@/hooks/useDeviceTilt"
import { CLOSING_TIMELINE, OPENING_TIMELINE, SCENE_SPRING } from "@/lib/motion"
import { ENVELOPE, PALETTE, type Phase, type ScreenRect } from "@/lib/phase"
import { createSpring, stepSpring, type SpringState } from "@/lib/spring"

const HALF_WIDTH = ENVELOPE.width / 2
const HALF_HEIGHT = ENVELOPE.height / 2
const FRONT_Z = ENVELOPE.depth / 2
const BACK_Z = -ENVELOPE.depth / 2
const SIDE_APEX_Y = -0.08
const BOTTOM_APEX_Y = 0.04
const FLAP_TIP_Y = HALF_HEIGHT - ENVELOPE.flapLength
const TIP_RADIUS = 0.14
const LAYER = 0.004
const EDGE_THICKNESS = 0.014
const LETTER_BASE_Y = -0.12
const LETTER_RISE = 1.7
const SEAL_REST = new Vector3(0, FLAP_TIP_Y + 0.17, FRONT_Z + LAYER * 5)
const HANDOFF_GRACE = 0.9
const FLAP_SHADOW_OPACITY = 0.22
const FOLD_SHADOW_OPACITY = 0.16
const WAX_EXTRUDE = { depth: 0.02, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.03, bevelSegments: 4, curveSegments: 32 }
const WAX_INNER_EXTRUDE = { depth: 0.006, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.014, bevelSegments: 3, curveSegments: 32 }
const WAX_STAR_EXTRUDE = { depth: 0.008, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 }
const PAPER = {
  side: "#F0634D",
  bottom: "#FF7660",
  flapOuter: "#FF846E",
  edge: "#C9493A",
  back: "#B23E31",
  wax: "#D9372A",
  waxDeep: "#A8241B",
  inside: "#FFFFFF",
} as const
const LETTER_SCREEN_HEIGHT = 0.62
const LETTER_SCREEN_WIDTH = 0.82
const POINTER_TILT = { x: 0.22, y: 0.4 }

type SceneSprings = {
  flap: SpringState
  seal: SpringState
  rise: SpringState
  forward: SpringState
  tiltX: SpringState
  tiltY: SpringState
}

type Schedule = { flap: number; seal: number; rise: number; forward: number; finish: number }
const DEFAULT_SCHEDULE: Schedule = { flap: 0, seal: 0, rise: 0, forward: 0, finish: 0 }

type EnvelopeProps = {
  phase: Phase
  name: string
  tiltRef: MutableRefObject<TiltVector | null>
  onHandoff: (rect: ScreenRect) => void
  onClosed: () => void
}

function flapShape() {
  return roundedTriangle([HALF_WIDTH, 0], [-HALF_WIDTH, 0], [0, ENVELOPE.flapLength], TIP_RADIUS)
}

function openingSchedule(springs: SceneSprings): Schedule {
  const rise = springs.flap.value > 0.7 ? 0 : OPENING_TIMELINE.letterRise
  const forward = rise + (springs.rise.value > 0.7 ? 0 : OPENING_TIMELINE.letterForward - OPENING_TIMELINE.letterRise)
  return {
    flap: OPENING_TIMELINE.flap,
    seal: OPENING_TIMELINE.seal,
    rise,
    forward,
    finish: forward + (OPENING_TIMELINE.handoff - OPENING_TIMELINE.letterForward),
  }
}

function closingSchedule(springs: SceneSprings): Schedule {
  const rise = springs.forward.value > 0.05 ? CLOSING_TIMELINE.letterRise : 0
  const flap = rise + (springs.rise.value > 0.05 ? CLOSING_TIMELINE.flap - CLOSING_TIMELINE.letterRise : 0)
  const seal = flap + (CLOSING_TIMELINE.seal - CLOSING_TIMELINE.flap)
  return {
    forward: CLOSING_TIMELINE.letterForward,
    rise,
    flap,
    seal,
    finish: seal + (CLOSING_TIMELINE.done - CLOSING_TIMELINE.seal),
  }
}

function projectToScreen(mesh: Mesh, camera: Camera, canvasRect: DOMRect): ScreenRect {
  const halfW = ENVELOPE.letterWidth / 2
  const halfH = ENVELOPE.letterHeight / 2
  const corners = [
    new Vector3(-halfW, -halfH, 0),
    new Vector3(halfW, -halfH, 0),
    new Vector3(halfW, halfH, 0),
    new Vector3(-halfW, halfH, 0),
  ]
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const corner of corners) {
    corner.applyMatrix4(mesh.matrixWorld).project(camera)
    const x = canvasRect.left + ((corner.x + 1) / 2) * canvasRect.width
    const y = canvasRect.top + ((1 - corner.y) / 2) * canvasRect.height
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)
  }
  return { left: minX, top: minY, width: maxX - minX, height: maxY - minY }
}

export function Envelope({ phase, name, tiltRef, onHandoff, onClosed }: EnvelopeProps) {
  const rootRef = useRef<Group>(null)
  const bodyRef = useRef<Group>(null)
  const flapPivotRef = useRef<Group>(null)
  const sealRef = useRef<Group>(null)
  const sealMaterialRefs = useRef<MeshStandardMaterial[]>([])
  const letterRef = useRef<Mesh>(null)
  const springsRef = useRef<SceneSprings>({
    flap: createSpring(),
    seal: createSpring(),
    rise: createSpring(),
    forward: createSpring(),
    tiltX: createSpring(),
    tiltY: createSpring(),
  })
  const phaseClockRef = useRef<{ phase: Phase | null; startedAt: number; schedule: Schedule; reported: boolean }>({
    phase: null,
    startedAt: 0,
    schedule: DEFAULT_SCHEDULE,
    reported: false,
  })
  const scratch = useMemo(() => ({ target: new Vector3(), risen: new Vector3() }), [])
  const { gl } = useThree()

  const flapShadowRef = useRef<MeshStandardMaterial>(null)

  const shapes = useMemo(
    () => ({
      left: roundedTriangle([-HALF_WIDTH, -HALF_HEIGHT], [-HALF_WIDTH, HALF_HEIGHT], [0, SIDE_APEX_Y], TIP_RADIUS),
      right: roundedTriangle([HALF_WIDTH, HALF_HEIGHT], [HALF_WIDTH, -HALF_HEIGHT], [0, SIDE_APEX_Y], TIP_RADIUS),
      bottom: roundedTriangle([HALF_WIDTH, -HALF_HEIGHT], [-HALF_WIDTH, -HALF_HEIGHT], [0, BOTTOM_APEX_Y], TIP_RADIUS),
      bottomShadow: roundedTriangle([HALF_WIDTH, -HALF_HEIGHT], [-HALF_WIDTH, -HALF_HEIGHT], [0, BOTTOM_APEX_Y + 0.05], TIP_RADIUS),
      flap: flapShape(),
      flapShadow: roundedTriangle([HALF_WIDTH, 0], [-HALF_WIDTH, 0], [0, ENVELOPE.flapLength + 0.06], TIP_RADIUS),
      wax: waxBlobShape(0.27, 5),
      waxInner: circleShape(0.17),
      waxStar: starShape(0.1, 0.045, 5),
    }),
    [],
  )

  const geometryArgs = useMemo(
    () => ({
      wax: [shapes.wax, WAX_EXTRUDE] as const,
      waxInner: [shapes.waxInner, WAX_INNER_EXTRUDE] as const,
      waxStar: [shapes.waxStar, WAX_STAR_EXTRUDE] as const,
    }),
    [shapes],
  )

  const textures = useMemo(() => ({ grain: createPaperGrainTexture() }), [])

  useEffect(
    () => () => {
      textures.grain.dispose()
    },
    [textures],
  )

  useFrame((state, delta) => {
    const springs = springsRef.current
    const clock = phaseClockRef.current
    const now = state.clock.elapsedTime

    if (clock.phase !== phase) {
      clock.phase = phase
      clock.startedAt = now
      clock.reported = false
      clock.schedule = phase === "closing" ? closingSchedule(springs) : openingSchedule(springs)
    }

    const elapsed = now - clock.startedAt
    const schedule = clock.schedule
    const isOpening = phase === "opening" || phase === "handoff" || phase === "open" || phase === "closing-handoff"
    const isClosing = phase === "closing"
    const reach = (at: number) => (elapsed >= at ? 1 : 0)

    const targets = isOpening
      ? phase === "opening"
        ? { flap: reach(schedule.flap), seal: reach(schedule.seal), rise: reach(schedule.rise), forward: reach(schedule.forward) }
        : { flap: 1, seal: 1, rise: 1, forward: 1 }
      : isClosing
        ? {
            flap: 1 - reach(schedule.flap),
            seal: 1 - reach(schedule.seal),
            rise: 1 - reach(schedule.rise),
            forward: 1 - reach(schedule.forward),
          }
        : { flap: 0, seal: 0, rise: 0, forward: 0 }

    const flap = stepSpring(springs.flap, targets.flap, SCENE_SPRING.flap, delta)
    const seal = stepSpring(springs.seal, targets.seal, SCENE_SPRING.seal, delta)
    const rise = stepSpring(springs.rise, targets.rise, SCENE_SPRING.letterRise, delta)
    const forward = stepSpring(springs.forward, targets.forward, SCENE_SPRING.letterForward, delta)

    const tiltSource = tiltRef.current ?? { x: state.pointer.x, y: state.pointer.y }
    const tiltInfluence = 1 - MathUtils.clamp(forward, 0, 1)
    const tiltX = stepSpring(springs.tiltX, -tiltSource.y * POINTER_TILT.x * tiltInfluence, SCENE_SPRING.pointerTilt, delta)
    const tiltY = stepSpring(springs.tiltY, tiltSource.x * POINTER_TILT.y * tiltInfluence, SCENE_SPRING.pointerTilt, delta)

    const root = rootRef.current
    const body = bodyRef.current
    const flapPivot = flapPivotRef.current
    const sealGroup = sealRef.current
    const letter = letterRef.current
    if (!root || !body || !flapPivot || !sealGroup || !letter) return

    root.rotation.set(tiltX, tiltY, 0)

    const flapAngle = Math.PI * (1 - flap)
    flapPivot.rotation.x = flapAngle
    flapPivot.position.z = flapAngle > Math.PI / 2 ? FRONT_Z + LAYER * 3 : BACK_Z - LAYER
    if (flapShadowRef.current) flapShadowRef.current.opacity = FLAP_SHADOW_OPACITY * (1 - MathUtils.smoothstep(flap, 0, 0.06))

    sealGroup.position.set(SEAL_REST.x, SEAL_REST.y + seal * 0.85, SEAL_REST.z + seal * 0.7)
    sealGroup.rotation.set(0, seal * 0.6, seal * 1.4)
    const sealScale = 1 - MathUtils.clamp(seal, 0, 1) * 0.35
    sealGroup.scale.setScalar(sealScale)
    const sealOpacity = 1 - MathUtils.smoothstep(seal, 0.45, 0.95)
    sealGroup.visible = sealOpacity > 0.01
    sealMaterialRefs.current.forEach((material) => {
      material.opacity = sealOpacity
    })

    const forwardClamped = MathUtils.clamp(forward, 0, 1.2)
    body.position.set(0, -forwardClamped * 1.3, -forwardClamped * 0.8)

    scratch.risen.set(0, LETTER_BASE_Y + rise * LETTER_RISE, 0)
    const camera = state.camera as PerspectiveCamera
    const fovRadians = MathUtils.degToRad(camera.fov)
    const viewFactor = 2 * Math.tan(fovRadians / 2)
    const distanceForHeight = ENVELOPE.letterHeight / (LETTER_SCREEN_HEIGHT * viewFactor)
    const distanceForWidth = ENVELOPE.letterWidth / (LETTER_SCREEN_WIDTH * viewFactor * camera.aspect)
    const letterDistance = Math.max(distanceForHeight, distanceForWidth)
    scratch.target.set(camera.position.x, camera.position.y, camera.position.z - letterDistance)
    root.worldToLocal(scratch.target)

    const travel = MathUtils.clamp(forward, 0, 1.05)
    const arc = Math.sin(MathUtils.clamp(forward, 0, 1) * Math.PI) * 0.45
    letter.position.set(
      MathUtils.lerp(scratch.risen.x, scratch.target.x, travel),
      MathUtils.lerp(scratch.risen.y, scratch.target.y, travel) + arc,
      MathUtils.lerp(scratch.risen.z, scratch.target.z, travel * travel),
    )
    letter.rotation.set(-tiltX * travel, -tiltY * travel, 0)

    const letterSettled = Math.abs(1 - springs.forward.value) < 0.004 && Math.abs(springs.forward.velocity) < 0.02
    const handoffReady = (elapsed >= schedule.finish && letterSettled) || elapsed >= schedule.finish + HANDOFF_GRACE
    if (phase === "opening" && !clock.reported && handoffReady) {
      clock.reported = true
      root.updateWorldMatrix(true, true)
      onHandoff(projectToScreen(letter, camera, gl.domElement.getBoundingClientRect()))
    }

    if (isClosing && !clock.reported && elapsed >= schedule.finish) {
      clock.reported = true
      onClosed()
    }
  })

  const registerSealMaterial = (material: MeshStandardMaterial | null) => {
    if (material && !sealMaterialRefs.current.includes(material)) sealMaterialRefs.current.push(material)
  }

  return (
    <Float speed={1.6} rotationIntensity={0.25} floatIntensity={0.6} floatingRange={[-0.08, 0.08]}>
      <group ref={rootRef}>
        <group ref={bodyRef}>
          <mesh position={[0, 0, BACK_Z]}>
            <planeGeometry args={[ENVELOPE.width, ENVELOPE.height]} />
            <meshStandardMaterial color={PAPER.inside} emissive={PAPER.inside} emissiveIntensity={0.85} roughness={0.95} side={FrontSide} />
          </mesh>
          <mesh position={[0, 0, BACK_Z - 0.001]}>
            <planeGeometry args={[ENVELOPE.width, ENVELOPE.height]} />
            <meshStandardMaterial color={PAPER.back} map={textures.grain} roughness={0.92} side={BackSide} />
          </mesh>

          <mesh position={[-HALF_WIDTH + EDGE_THICKNESS / 2, 0, 0]}>
            <boxGeometry args={[EDGE_THICKNESS, ENVELOPE.height, ENVELOPE.depth]} />
            <meshStandardMaterial color={PAPER.edge} roughness={0.9} />
          </mesh>
          <mesh position={[HALF_WIDTH - EDGE_THICKNESS / 2, 0, 0]}>
            <boxGeometry args={[EDGE_THICKNESS, ENVELOPE.height, ENVELOPE.depth]} />
            <meshStandardMaterial color={PAPER.edge} roughness={0.9} />
          </mesh>
          <mesh position={[0, -HALF_HEIGHT + EDGE_THICKNESS / 2, 0]}>
            <boxGeometry args={[ENVELOPE.width, EDGE_THICKNESS, ENVELOPE.depth]} />
            <meshStandardMaterial color={PAPER.edge} roughness={0.9} />
          </mesh>

          <mesh position={[0, 0, FRONT_Z]}>
            <shapeGeometry args={[shapes.left]} />
            <meshStandardMaterial color={PAPER.side} map={textures.grain} roughness={0.85} />
          </mesh>
          <mesh position={[0, 0, FRONT_Z]}>
            <shapeGeometry args={[shapes.right]} />
            <meshStandardMaterial color={PAPER.side} map={textures.grain} roughness={0.85} />
          </mesh>
          <mesh position={[0, 0, FRONT_Z + LAYER]}>
            <shapeGeometry args={[shapes.bottomShadow]} />
            <meshStandardMaterial color={PALETTE.ink} transparent opacity={FOLD_SHADOW_OPACITY} depthWrite={false} />
          </mesh>
          <mesh position={[0, 0, FRONT_Z + LAYER * 2]}>
            <shapeGeometry args={[shapes.bottom]} />
            <meshStandardMaterial color={PAPER.bottom} map={textures.grain} roughness={0.82} />
          </mesh>

          <group ref={flapPivotRef} position={[0, HALF_HEIGHT, FRONT_Z + LAYER * 3]} rotation={[Math.PI, 0, 0]}>
            <mesh>
              <shapeGeometry args={[shapes.flap]} />
              <meshStandardMaterial color={PAPER.flapOuter} map={textures.grain} roughness={0.8} side={BackSide} />
            </mesh>
            <mesh>
              <shapeGeometry args={[shapes.flap]} />
              <meshStandardMaterial color={PAPER.inside} emissive={PAPER.inside} emissiveIntensity={0.85} roughness={0.95} side={FrontSide} />
            </mesh>
          </group>
          <group position={[0, HALF_HEIGHT, FRONT_Z + LAYER * 2.5]} rotation={[Math.PI, 0, 0]}>
            <mesh>
              <shapeGeometry args={[shapes.flapShadow]} />
              <meshStandardMaterial
                ref={flapShadowRef}
                color={PALETTE.ink}
                transparent
                opacity={FLAP_SHADOW_OPACITY}
                depthWrite={false}
                side={BackSide}
              />
            </mesh>
          </group>

          <group ref={sealRef} position={SEAL_REST}>
            <mesh>
              <extrudeGeometry args={geometryArgs.wax} />
              <meshStandardMaterial ref={registerSealMaterial} color={PAPER.wax} roughness={0.38} metalness={0.05} transparent />
            </mesh>
            <mesh position={[0, 0, 0.045]}>
              <extrudeGeometry args={geometryArgs.waxInner} />
              <meshStandardMaterial ref={registerSealMaterial} color={PAPER.waxDeep} roughness={0.42} metalness={0.05} transparent />
            </mesh>
            <mesh position={[0, 0, 0.062]}>
              <extrudeGeometry args={geometryArgs.waxStar} />
              <meshStandardMaterial ref={registerSealMaterial} color={PAPER.wax} roughness={0.35} metalness={0.05} transparent />
            </mesh>
          </group>
        </group>

        <Letter ref={letterRef} name={name} />
      </group>
    </Float>
  )
}
