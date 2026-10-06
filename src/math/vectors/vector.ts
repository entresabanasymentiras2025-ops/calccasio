import { MathError } from '../arithmetic/value'

export type Vector = number[]

function same(a: Vector, b: Vector): void {
  if (a.length !== b.length) throw new MathError('DimensionError', 'Vectors must have the same dimension')
}

export const add = (a: Vector, b: Vector): Vector => (same(a, b), a.map((v, i) => v + b[i]))
export const subtract = (a: Vector, b: Vector): Vector => (same(a, b), a.map((v, i) => v - b[i]))
export const scale = (a: Vector, k: number): Vector => a.map((v) => v * k)
export const dot = (a: Vector, b: Vector): number => (same(a, b), a.reduce((s, v, i) => s + v * b[i], 0))
export const norm = (a: Vector): number => Math.hypot(...a)

export function cross(a: Vector, b: Vector): Vector {
  if (a.length !== 3 || b.length !== 3) throw new MathError('DimensionError', 'Cross product requires 3D vectors')
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

/** Angle between vectors, in radians. */
export function angleBetween(a: Vector, b: Vector): number {
  const d = norm(a) * norm(b)
  if (d === 0) throw new MathError('MathError', 'Angle undefined for a zero vector')
  return Math.acos(Math.max(-1, Math.min(1, dot(a, b) / d)))
}

export function unit(a: Vector): Vector {
  const n = norm(a)
  if (n === 0) throw new MathError('MathError', 'Zero vector has no unit vector')
  return scale(a, 1 / n)
}
