import { useEffect, useRef, type ReactNode } from "react"

export type CoolParticleOptions = {
  particle?: string | string[]
  size?: number
  particleCount?: number
  speedHorz?: number
  speedUp?: number
}

type CoolParticle = {
  element: HTMLDivElement
  left: number
  top: number
  size: number
  direction: number
  speedHorz: number
  speedUp: number
  spinSpeed: number
  spinVal: number
}

const CONTAINER_ID = "cool-mode-layer"
const SIZES = [15, 20, 25, 35, 45]
const LIMIT = 45
const SPAWN_INTERVAL_MS = 30
const BURST_ON_TAP = 6

let activeInstances = 0

function getContainer() {
  const existing = document.getElementById(CONTAINER_ID)
  if (existing) return existing
  const container = document.createElement("div")
  container.id = CONTAINER_ID
  container.setAttribute("aria-hidden", "true")
  container.style.cssText = "overflow:hidden;position:fixed;inset:0;pointer-events:none;z-index:60"
  document.body.appendChild(container)
  return container
}

function pickParticle(particle: CoolParticleOptions["particle"]) {
  if (Array.isArray(particle)) return particle[Math.floor(Math.random() * particle.length)] ?? "🎉"
  return particle ?? "🎉"
}

function applyParticleEffect(element: HTMLElement, options: CoolParticleOptions = {}) {
  activeInstances += 1
  const container = getContainer()
  let particles: CoolParticle[] = []
  let spawning = false
  let pointerX = 0
  let pointerY = 0
  let lastSpawn = 0
  let frame: number | null = null

  const spawn = () => {
    const size = options.size ?? SIZES[Math.floor(Math.random() * SIZES.length)] ?? 25
    const node = document.createElement("div")
    node.textContent = pickParticle(options.particle)
    node.style.cssText = `position:absolute;left:0;top:0;width:${size}px;height:${size}px;font-size:${size}px;line-height:1;will-change:transform`
    container.appendChild(node)
    particles.push({
      element: node,
      left: pointerX - size / 2,
      top: pointerY - size / 2,
      size,
      direction: Math.random() <= 0.5 ? -1 : 1,
      speedHorz: options.speedHorz ?? Math.random() * 10,
      speedUp: options.speedUp ?? Math.random() * 25,
      spinSpeed: Math.random() * 35 * (Math.random() <= 0.5 ? -1 : 1),
      spinVal: Math.random() * 360,
    })
  }

  const tick = (now: number) => {
    if (spawning && particles.length < LIMIT && now - lastSpawn > SPAWN_INTERVAL_MS) {
      spawn()
      lastSpawn = now
    }
    const floor = window.innerHeight
    particles = particles.filter((particle) => {
      particle.left -= particle.speedHorz * particle.direction
      particle.top -= particle.speedUp
      particle.speedUp = Math.min(particle.size, particle.speedUp - 1)
      particle.spinVal += particle.spinSpeed
      if (particle.top >= floor + particle.size) {
        particle.element.remove()
        return false
      }
      particle.element.style.transform = `translate3d(${particle.left}px, ${particle.top}px, 0) rotate(${particle.spinVal}deg)`
      return true
    })
    frame = particles.length > 0 || spawning ? requestAnimationFrame(tick) : null
  }

  const ensureLoop = () => {
    if (frame === null) frame = requestAnimationFrame(tick)
  }

  const handleDown = (event: PointerEvent) => {
    pointerX = event.clientX
    pointerY = event.clientY
    spawning = true
    const burst = options.particleCount ?? BURST_ON_TAP
    for (let index = 0; index < burst; index += 1) spawn()
    ensureLoop()
  }
  const handleMove = (event: PointerEvent) => {
    pointerX = event.clientX
    pointerY = event.clientY
  }
  const handleUp = () => {
    spawning = false
  }

  element.addEventListener("pointerdown", handleDown, { passive: true })
  element.addEventListener("pointermove", handleMove, { passive: true })
  element.addEventListener("pointerup", handleUp, { passive: true })
  element.addEventListener("pointerleave", handleUp, { passive: true })
  element.addEventListener("pointercancel", handleUp, { passive: true })

  return () => {
    element.removeEventListener("pointerdown", handleDown)
    element.removeEventListener("pointermove", handleMove)
    element.removeEventListener("pointerup", handleUp)
    element.removeEventListener("pointerleave", handleUp)
    element.removeEventListener("pointercancel", handleUp)
    spawning = false
    if (frame !== null) cancelAnimationFrame(frame)
    particles.forEach((particle) => particle.element.remove())
    particles = []
    activeInstances -= 1
    if (activeInstances === 0) container.remove()
  }
}

type CoolModeProps = {
  children: ReactNode
  options?: CoolParticleOptions
  disabled?: boolean
}

export function CoolMode({ children, options, disabled = false }: CoolModeProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element || disabled) return
    return applyParticleEffect(element, options)
  }, [disabled, options])

  return (
    <span ref={ref} className="inline-flex">
      {children}
    </span>
  )
}
