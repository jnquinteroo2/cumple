import { useEffect, useRef, type ComponentPropsWithoutRef } from "react"
import { useInView, useMotionValue, useSpring } from "motion/react"

import { cn } from "@/lib/utils"

type NumberTickerProps = ComponentPropsWithoutRef<"span"> & {
  value: number
  startValue?: number
  delay?: number
}

const formatter = new Intl.NumberFormat("es", { maximumFractionDigits: 0 })

export function NumberTicker({ value, startValue = 0, delay = 0, className, ...props }: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(startValue)
  const springValue = useSpring(motionValue, { damping: 40, stiffness: 90 })
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    const timer = window.setTimeout(() => motionValue.set(value), delay * 1000)
    return () => window.clearTimeout(timer)
  }, [delay, isInView, motionValue, value])

  useEffect(
    () =>
      springValue.on("change", (latest) => {
        if (ref.current) ref.current.textContent = formatter.format(Math.round(latest))
      }),
    [springValue],
  )

  return (
    <span ref={ref} className={cn("inline-block tabular-nums", className)} {...props}>
      {formatter.format(startValue)}
    </span>
  )
}
