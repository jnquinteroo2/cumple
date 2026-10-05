import { memo, type ReactNode } from "react"

import { cn } from "@/lib/utils"

type AuroraTextProps = {
  children: ReactNode
  className?: string
  colors?: string[]
  speed?: number
}

export const AuroraText = memo(({ children, className, colors = ["#FF6F59", "#FFDF8A", "#3CCFC0"], speed = 1 }: AuroraTextProps) => (
  <span className={cn("relative inline-block", className)}>
    <span className="sr-only">{children}</span>
    <span
      aria-hidden="true"
      className="animate-aurora relative inline-block bg-size-[200%_auto] bg-clip-text text-transparent [transform:translateZ(0)]"
      style={{
        backgroundImage: `linear-gradient(120deg, ${colors.join(", ")}, ${colors[0]})`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        animationDuration: `${10 / speed}s`,
      }}
    >
      {children}
    </span>
  </span>
))

AuroraText.displayName = "AuroraText"
