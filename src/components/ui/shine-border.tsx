import type { CSSProperties, HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

type ShineBorderProps = HTMLAttributes<HTMLDivElement> & {
  borderWidth?: number
  duration?: number
  shineColor?: string | string[]
}

const RING_MASK = "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)"

function ringStyle(borderWidth: number, backgroundImage: string): CSSProperties {
  return {
    padding: borderWidth,
    backgroundImage,
    mask: RING_MASK,
    WebkitMask: RING_MASK,
    WebkitMaskComposite: "xor",
    maskComposite: "exclude",
  }
}

export function ShineBorder({ borderWidth = 1, duration = 6, shineColor = "#FFDF8A", className, style, ...props }: ShineBorderProps) {
  const colors = Array.isArray(shineColor) ? shineColor : [shineColor]
  const forward = `linear-gradient(135deg, ${colors.join(", ")})`
  const backward = `linear-gradient(315deg, ${colors.join(", ")})`
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 rounded-[inherit]", className)} style={style} {...props}>
      <div className="absolute inset-0 rounded-[inherit]" style={ringStyle(borderWidth, forward)} />
      <div
        className="motion-safe:animate-shine-fade absolute inset-0 rounded-[inherit] opacity-0 will-change-[opacity]"
        style={{ ...ringStyle(borderWidth, backward), animationDuration: `${duration}s` }}
      />
    </div>
  )
}
