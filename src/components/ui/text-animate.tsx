import { memo } from "react"
import { m, type Variants } from "motion/react"

import { EASE_OUT } from "@/lib/motion"
import { cn } from "@/lib/utils"

type TextAnimateProps = {
  children: string
  className?: string
  segmentClassName?: string
  delay?: number
  duration?: number
  stagger?: number
  reducedMotion?: boolean
  active?: boolean
}

function TextAnimateBase({
  children,
  className,
  segmentClassName,
  delay = 0,
  duration = 0.5,
  stagger = 0.045,
  reducedMotion = false,
  active = true,
}: TextAnimateProps) {
  const words = children.split(/(\s+)/)

  const container: Variants = {
    hidden: { transition: { staggerChildren: 0 } },
    show: { transition: { delayChildren: delay, staggerChildren: reducedMotion ? 0 : stagger } },
  }

  const item: Variants = reducedMotion
    ? { hidden: { opacity: 0, transition: { duration: 0.12, ease: EASE_OUT } }, show: { opacity: 1, transition: { duration, ease: EASE_OUT } } }
    : {
        hidden: { opacity: 0, transform: "translateY(8px)", transition: { duration: 0.12, ease: EASE_OUT } },
        show: {
          opacity: 1,
          transform: "translateY(0px)",
          transition: { duration, ease: EASE_OUT },
        },
      }

  return (
    <m.p className={cn("whitespace-pre-wrap", className)} variants={container} initial="hidden" animate={active ? "show" : "hidden"} aria-label={children}>
      {words.map((segment, index) =>
        /^\s+$/.test(segment) ? (
          segment
        ) : (
          <m.span key={`${segment}-${index}`} variants={item} className={cn("inline-block", segmentClassName)} aria-hidden="true">
            {segment}
          </m.span>
        ),
      )}
    </m.p>
  )
}

export const TextAnimate = memo(TextAnimateBase)
