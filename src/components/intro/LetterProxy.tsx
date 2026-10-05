import { m } from "motion/react"

import { CONTENT_FADE_SECONDS, DURATION, EASE_OUT, SPRING } from "@/lib/motion"
import { PALETTE, type ScreenRect } from "@/lib/phase"

const NAME_MAX_WIDTH_CQW = 78
const NAME_MAX_SIZE_CQW = 12.5
const AVERAGE_GLYPH_RATIO = 0.6

function nameFontSize(headline: string) {
  const glyphs = Math.max(Array.from(headline).length, 1)
  return `${Math.min(NAME_MAX_SIZE_CQW, NAME_MAX_WIDTH_CQW / (glyphs * AVERAGE_GLYPH_RATIO))}cqw`
}

export function LetterProxy({ rect, name, contentVisible }: { rect: ScreenRect; name: string; contentVisible: boolean }) {
  const headline = name || "invitad@"

  return (
    <m.div
      layoutId="letter"
      aria-hidden="true"
      className="pointer-events-none fixed z-30 overflow-hidden will-change-transform"
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        borderRadius: 6,
        backgroundColor: PALETTE.paper,
        containerType: "inline-size",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: DURATION.ui, ease: EASE_OUT } }}
      transition={{ opacity: { duration: 0.12, ease: EASE_OUT }, layout: SPRING.handoff }}
    >
      <m.div
        className="absolute inset-0"
        initial={false}
        animate={{ opacity: contentVisible ? 1 : 0 }}
        transition={{ duration: CONTENT_FADE_SECONDS, ease: EASE_OUT }}
      >
        <div
          className="absolute font-display"
          style={{
            inset: "3.5cqw",
            border: `0.6cqw dashed ${PALETTE.coral}`,
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center font-display leading-none">
          <span className="absolute font-semibold" style={{ top: "36%", translate: "0 -50%", fontSize: "4.5cqw", color: PALETTE.coralDeep }}>
            {name ? "Invitación para" : "Estás"}
          </span>
          <span
            className="absolute font-extrabold whitespace-nowrap"
            style={{ top: "56%", translate: "0 -50%", fontSize: nameFontSize(headline), color: PALETTE.ink }}
          >
            {headline}
          </span>
          <span className="absolute" style={{ top: "78%", translate: "0 -50%", fontSize: "6.25cqw" }}>
            🎉
          </span>
        </div>
      </m.div>
    </m.div>
  )
}
