import { forwardRef, useEffect, useState } from "react"
import { CanvasTexture, SRGBColorSpace, type Mesh } from "three"

import { ENVELOPE, PALETTE } from "@/lib/phase"

const TEXTURE_WIDTH = 1024
const TEXTURE_HEIGHT = Math.round((TEXTURE_WIDTH * ENVELOPE.letterHeight) / ENVELOPE.letterWidth)
const DISPLAY_FONT = '"Bricolage Grotesque", system-ui, sans-serif'

function fitFontSize(context: CanvasRenderingContext2D, text: string, maxWidth: number, startSize: number) {
  let size = startSize
  context.font = `800 ${size}px ${DISPLAY_FONT}`
  while (context.measureText(text).width > maxWidth && size > 28) {
    size -= 4
    context.font = `800 ${size}px ${DISPLAY_FONT}`
  }
  return size
}

function paintLetter(canvas: HTMLCanvasElement, name: string) {
  const context = canvas.getContext("2d")
  if (!context) return
  context.fillStyle = PALETTE.paper
  context.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT)

  context.strokeStyle = PALETTE.coral
  context.lineWidth = 6
  context.setLineDash([22, 14])
  context.strokeRect(36, 36, TEXTURE_WIDTH - 72, TEXTURE_HEIGHT - 72)
  context.setLineDash([])

  context.textAlign = "center"
  context.textBaseline = "middle"
  context.fillStyle = PALETTE.coralDeep
  context.font = `600 46px ${DISPLAY_FONT}`
  context.fillText(name ? "Invitación para" : "Estás", TEXTURE_WIDTH / 2, TEXTURE_HEIGHT * 0.36)

  context.fillStyle = PALETTE.ink
  const headline = name || "invitad@"
  fitFontSize(context, headline, TEXTURE_WIDTH * 0.78, 128)
  context.fillText(headline, TEXTURE_WIDTH / 2, TEXTURE_HEIGHT * 0.56)

  context.font = `400 64px ${DISPLAY_FONT}`
  context.fillText("🎉", TEXTURE_WIDTH / 2, TEXTURE_HEIGHT * 0.78)
}

type LetterProps = { name: string }

export const Letter = forwardRef<Mesh, LetterProps>(({ name }, ref) => {
  const [{ canvas, texture }] = useState(() => {
    const letterCanvas = document.createElement("canvas")
    letterCanvas.width = TEXTURE_WIDTH
    letterCanvas.height = TEXTURE_HEIGHT
    const letterTexture = new CanvasTexture(letterCanvas)
    letterTexture.colorSpace = SRGBColorSpace
    letterTexture.anisotropy = 4
    return { canvas: letterCanvas, texture: letterTexture }
  })

  useEffect(() => {
    let active = true
    const repaint = () => {
      if (!active) return
      paintLetter(canvas, name)
      Object.assign(texture, { needsUpdate: true })
    }
    repaint()
    void document.fonts.load(`800 128px ${DISPLAY_FONT}`).then(repaint, () => undefined)
    return () => {
      active = false
    }
  }, [canvas, name, texture])

  useEffect(() => () => texture.dispose(), [texture])

  return (
    <mesh ref={ref} castShadow>
      <planeGeometry args={[ENVELOPE.letterWidth, ENVELOPE.letterHeight]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
})

Letter.displayName = "Letter"
