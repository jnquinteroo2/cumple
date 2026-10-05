import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three"

function seededRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

function toTexture(canvas: HTMLCanvasElement, repeat: number) {
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(repeat, repeat)
  texture.anisotropy = 4
  return texture
}

export function createPaperGrainTexture() {
  const size = 256
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext("2d")
  if (context) {
    const random = seededRandom(7)
    const image = context.createImageData(size, size)
    for (let index = 0; index < image.data.length; index += 4) {
      const value = 236 + Math.floor(random() * 20)
      image.data[index] = value
      image.data[index + 1] = value
      image.data[index + 2] = value
      image.data[index + 3] = 255
    }
    context.putImageData(image, 0, 0)
  }
  return toTexture(canvas, 0.9)
}
