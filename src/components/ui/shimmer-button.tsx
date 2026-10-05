import { forwardRef, type ComponentPropsWithoutRef, type CSSProperties } from "react"

import { cn } from "@/lib/utils"

export type ShimmerButtonProps = ComponentPropsWithoutRef<"button"> & {
  shimmerColor?: string
  shimmerSize?: string
  borderRadius?: string
  shimmerDuration?: string
  background?: string
}

export const ShimmerButton = forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = "#FFF4E6",
      shimmerSize = "0.06em",
      shimmerDuration = "3s",
      borderRadius = "999px",
      background = "#FF6F59",
      className,
      children,
      type = "button",
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      style={
        {
          "--spread": "90deg",
          "--shimmer-color": shimmerColor,
          "--radius": borderRadius,
          "--speed": shimmerDuration,
          "--cut": shimmerSize,
          "--bg": background,
        } as CSSProperties
      }
      className={cn(
        "press group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden [border-radius:var(--radius)] border border-white/15 px-7 py-3.5 whitespace-nowrap [background:var(--bg)]",
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className="@container-[size] absolute inset-0 -z-30 overflow-visible blur-[2px]">
        <span className="animate-shimmer-slide absolute inset-0 aspect-square h-[100cqh] rounded-none [mask:none]">
          <span className="animate-spin-around absolute -inset-full w-auto [translate:0_0] rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))]" />
        </span>
      </span>
      {children}
      <span
        aria-hidden="true"
        className="shimmer-highlight absolute inset-0 size-full [border-radius:var(--radius)] shadow-[inset_0_-8px_10px_#ffffff1f]"
      />
      <span aria-hidden="true" className="absolute inset-(--cut) -z-20 [border-radius:var(--radius)] [background:var(--bg)]" />
    </button>
  ),
)

ShimmerButton.displayName = "ShimmerButton"
