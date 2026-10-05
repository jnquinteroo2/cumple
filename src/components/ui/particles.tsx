import { useEffect, useRef, type ComponentPropsWithoutRef } from "react"

import { cn } from "@/lib/utils"

type ParticlesProps = ComponentPropsWithoutRef<"div"> & {
  quantity?: number
  staticity?: number
  ease?: number
  size?: number
  colors?: string[]
  vx?: number
  vy?: number
}

type Circle = {
  x: number
  y: number
  translateX: number
  translateY: number
  size: number
  alpha: number
  targetAlpha: number
  dx: number
  dy: number
  magnetism: number
  rgb: string
}

const EDGE_FADE = 20

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "")
  const full = normalized.length === 3 ? normalized.split("").map((char) => char + char).join("") : normalized
  const value = Number.parseInt(full, 16)
  return `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`
}

function remap(value: number, start1: number, end1: number, start2: number, end2: number) {
  const mapped = ((value - start1) * (end2 - start2)) / (end1 - start1) + start2
  return mapped > 0 ? mapped : 0
}

export function Particles({
  className,
  quantity = 70,
  staticity = 50,
  ease = 50,
  size = 0.5,
  colors = ["#FFF4E6"],
  vx = 0,
  vy = 0,
  ...props
}: ParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const settingsRef = useRef({ quantity, staticity, ease, size, colors, vx, vy })

  useEffect(() => {
    settingsRef.current = { quantity, staticity, ease, size, colors, vx, vy }
  }, [quantity, staticity, ease, size, colors, vx, vy])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (!container || !canvas || !context) return

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const canvasSize = { w: 0, h: 0 }
    const mouse = { x: 0, y: 0 }
    let circles: Circle[] = []
    let frame: number | null = null

    const createCircle = (): Circle => {
      const settings = settingsRef.current
      const palette = settings.colors.length > 0 ? settings.colors : ["#FFFFFF"]
      return {
        x: Math.random() * canvasSize.w,
        y: Math.random() * canvasSize.h,
        translateX: 0,
        translateY: 0,
        size: Math.floor(Math.random() * 2) + settings.size,
        alpha: 0,
        targetAlpha: Number((Math.random() * 0.6 + 0.1).toFixed(1)),
        dx: (Math.random() - 0.5) * 0.1,
        dy: (Math.random() - 0.5) * 0.1,
        magnetism: 0.1 + Math.random() * 4,
        rgb: hexToRgb(palette[Math.floor(Math.random() * palette.length)] ?? "#FFFFFF"),
      }
    }

    const resize = () => {
      canvasSize.w = container.offsetWidth
      canvasSize.h = container.offsetHeight
      canvas.width = canvasSize.w * dpr
      canvas.height = canvasSize.h * dpr
      canvas.style.width = `${canvasSize.w}px`
      canvas.style.height = `${canvasSize.h}px`
      circles = Array.from({ length: settingsRef.current.quantity }, createCircle)
    }

    const drawCircle = (circle: Circle) => {
      context.setTransform(dpr, 0, 0, dpr, circle.translateX * dpr, circle.translateY * dpr)
      context.beginPath()
      context.arc(circle.x, circle.y, circle.size, 0, 2 * Math.PI)
      context.fillStyle = `rgba(${circle.rgb}, ${circle.alpha})`
      context.fill()
    }

    const animate = () => {
      const settings = settingsRef.current
      context.setTransform(1, 0, 0, 1, 0, 0)
      context.clearRect(0, 0, canvas.width, canvas.height)
      circles = circles.map((circle) => {
        const edge = Math.min(
          circle.x + circle.translateX - circle.size,
          canvasSize.w - circle.x - circle.translateX - circle.size,
          circle.y + circle.translateY - circle.size,
          canvasSize.h - circle.y - circle.translateY - circle.size,
        )
        const edgeAlpha = Number(remap(edge, 0, EDGE_FADE, 0, 1).toFixed(2))
        if (edgeAlpha > 1) {
          circle.alpha = Math.min(circle.alpha + 0.02, circle.targetAlpha)
        } else {
          circle.alpha = circle.targetAlpha * edgeAlpha
        }
        circle.x += circle.dx + settings.vx
        circle.y += circle.dy + settings.vy
        circle.translateX += (mouse.x / (settings.staticity / circle.magnetism) - circle.translateX) / settings.ease
        circle.translateY += (mouse.y / (settings.staticity / circle.magnetism) - circle.translateY) / settings.ease
        drawCircle(circle)
        const outside =
          circle.x < -circle.size ||
          circle.x > canvasSize.w + circle.size ||
          circle.y < -circle.size ||
          circle.y > canvasSize.h + circle.size
        return outside ? createCircle() : circle
      })
      frame = requestAnimationFrame(animate)
    }

    const start = () => {
      if (frame === null && document.visibilityState === "visible") frame = requestAnimationFrame(animate)
    }
    const stop = () => {
      if (frame !== null) cancelAnimationFrame(frame)
      frame = null
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left - canvasSize.w / 2
      const y = event.clientY - rect.top - canvasSize.h / 2
      if (Math.abs(x) < canvasSize.w / 2 && Math.abs(y) < canvasSize.h / 2) {
        mouse.x = x
        mouse.y = y
      }
    }
    const handleVisibility = () => (document.visibilityState === "visible" ? start() : stop())
    const resizeObserver = new ResizeObserver(resize)

    resize()
    start()
    resizeObserver.observe(container)
    window.addEventListener("pointermove", handlePointerMove, { passive: true })
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      stop()
      resizeObserver.disconnect()
      window.removeEventListener("pointermove", handlePointerMove)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [])

  return (
    <div ref={containerRef} className={cn("pointer-events-none", className)} aria-hidden="true" {...props}>
      <canvas ref={canvasRef} className="size-full" />
    </div>
  )
}
