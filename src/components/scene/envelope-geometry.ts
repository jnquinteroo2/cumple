import { Shape, Vector2 } from "three"

export type Point = readonly [number, number]

export function roundedTriangle(baseStart: Point, baseEnd: Point, apex: Point, radius: number) {
  const tip = new Vector2(...apex)
  const toStart = new Vector2(...baseStart).sub(tip).normalize().multiplyScalar(radius).add(tip)
  const toEnd = new Vector2(...baseEnd).sub(tip).normalize().multiplyScalar(radius).add(tip)
  const shape = new Shape()
  shape.moveTo(...baseStart)
  shape.lineTo(...baseEnd)
  shape.lineTo(toEnd.x, toEnd.y)
  shape.quadraticCurveTo(tip.x, tip.y, toStart.x, toStart.y)
  shape.closePath()
  return shape
}

export function waxBlobShape(radius: number, lobes: number) {
  const shape = new Shape()
  const steps = 72
  for (let index = 0; index <= steps; index += 1) {
    const angle = (index / steps) * Math.PI * 2
    const wobble = 1 + Math.sin(angle * lobes) * 0.045 + Math.sin(angle * (lobes + 3) + 1.3) * 0.03
    const x = Math.cos(angle) * radius * wobble
    const y = Math.sin(angle) * radius * wobble
    if (index === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  return shape
}

export function circleShape(radius: number) {
  const shape = new Shape()
  shape.absarc(0, 0, radius, 0, Math.PI * 2, false)
  return shape
}

export function starShape(outerRadius: number, innerRadius: number, points: number) {
  const shape = new Shape()
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius
    const angle = (index / (points * 2)) * Math.PI * 2 + Math.PI / 2
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    if (index === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  return shape
}
