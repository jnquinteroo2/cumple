import { useCallback, type PointerEvent, type ReactNode } from "react"
import { m, useMotionValue, useTransform } from "motion/react"

import { cn } from "@/lib/utils"

type MagicCardProps = {
  children?: ReactNode
  className?: string
  gradientSize?: number
  gradientColor?: string
}

export function MagicCard({ children, className, gradientSize = 260, gradientColor = "rgba(255, 223, 138, 0.16)" }: MagicCardProps) {
  const pointerX = useMotionValue(-gradientSize * 2)
  const pointerY = useMotionValue(-gradientSize * 2)
  const translateX = useTransform(pointerX, (value) => value - gradientSize)
  const translateY = useTransform(pointerY, (value) => value - gradientSize)

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== "mouse") return
      const rect = event.currentTarget.getBoundingClientRect()
      pointerX.set(event.clientX - rect.left)
      pointerY.set(event.clientY - rect.top)
    },
    [pointerX, pointerY],
  )

  return (
    <div
      className={cn("group relative isolate overflow-hidden rounded-[inherit] border border-hairline bg-surface", className)}
      onPointerMove={handlePointerMove}
    >
      <m.div
        aria-hidden="true"
        className="spotlight pointer-events-none absolute top-0 left-0 z-10 rounded-full will-change-transform"
        style={{
          width: gradientSize * 2,
          height: gradientSize * 2,
          x: translateX,
          y: translateY,
          background: `radial-gradient(circle closest-side, ${gradientColor}, transparent)`,
        }}
      />
      <div className="relative z-20">{children}</div>
    </div>
  )
}
