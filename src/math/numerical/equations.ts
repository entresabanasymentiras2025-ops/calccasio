import { MathError } from '../arithmetic/value'
import type { Complex } from '../complex/complex'

/** Solves A·x = b with Gaussian elimination + partial pivoting. */
export function solveLinearSystem(a: number[][], b: number[]): number[] {
  const n = a.length
  if (n === 0 || a.some((r) => r.length !== n) || b.length !== n) {
    throw new MathError('DimensionError', 'Linear system must be square (n equations, n unknowns)')
  }
  const m = a.map((row, i) => [...row, b[i]])
  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let r = col + 1; r < n; r++) if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r
    if (Math.abs(m[pivot][col]) < 1e-12) {
      throw new MathError('MathError', 'No unique solution (infinite solutions or none)')
    }
    ;[m[col], m[pivot]] = [m[pivot], m[col]]
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const factor = m[r][col] / m[col][col]
      for (let c = col; c <= n; c++) m[r][c] -= factor * m[col][c]
    }
  }
  return m.map((row, i) => cleanZero(row[n] / row[i]))
}

function cleanZero(x: number): number {
  return Math.abs(x) < 1e-13 ? 0 : x
}

/**
 * Finds all (complex) roots of a polynomial given coefficients from the
 * highest degree down (e.g. [1, -3, 2] → x² − 3x + 2). Degree 1–2 use
 * closed forms; higher degrees use the Durand–Kerner iteration followed by
 * Newton polishing of real roots.
 */
export function polynomialRoots(coeffs: number[]): Complex[] {
  const c = [...coeffs]
  while (c.length > 1 && c[0] === 0) c.shift()
  const degree = c.length - 1
  if (degree < 1) throw new MathError('MathError', 'Polynomial must have degree ≥ 1')
  if (degree === 1) return [{ re: cleanZero(-c[1] / c[0]), im: 0 }]
  if (degree === 2) {
    const [a, b, cc] = c
    const disc = b * b - 4 * a * cc
    if (disc >= 0) {
      const s = Math.sqrt(disc)
      // Numerically stable form.
      const q = -0.5 * (b + Math.sign(b || 1) * s)
      const r1 = q / a
      const r2 = q !== 0 ? cc / q : -b / (2 * a)
      return [r1, r2].sort((x, y) => y - x).map((re) => ({ re: cleanZero(re), im: 0 }))
    }
    const re = -b / (2 * a)
    const im = Math.sqrt(-disc) / (2 * Math.abs(a))
    return [
      { re: cleanZero(re), im },
      { re: cleanZero(re), im: -im },
    ]
  }
  const monic = c.map((x) => x / c[0])
  let roots: Complex[] = Array.from({ length: degree }, (_, k) => {
    const angle = (2 * Math.PI * k) / degree + 0.4
    return { re: 0.9 * Math.cos(angle), im: 0.9 * Math.sin(angle) }
  })
  const evalP = (z: Complex): Complex => {
    let re = 1
    let im = 0
    for (let i = 1; i < monic.length; i++) {
      const nr = re * z.re - im * z.im + monic[i]
      const ni = re * z.im + im * z.re
      re = nr
      im = ni
    }
    return { re, im }
  }
  for (let iter = 0; iter < 500; iter++) {
    let delta = 0
    roots = roots.map((z, i) => {
      let den: Complex = { re: 1, im: 0 }
      roots.forEach((w, j) => {
        if (i === j) return
        const d = { re: z.re - w.re, im: z.im - w.im }
        den = { re: den.re * d.re - den.im * d.im, im: den.re * d.im + den.im * d.re }
      })
      const p = evalP(z)
      const mag = den.re * den.re + den.im * den.im || 1e-300
      const q = { re: (p.re * den.re + p.im * den.im) / mag, im: (p.im * den.re - p.re * den.im) / mag }
      delta = Math.max(delta, Math.hypot(q.re, q.im))
      return { re: z.re - q.re, im: z.im - q.im }
    })
    if (delta < 1e-15) break
  }
  return roots
    .map((z) => ({ re: cleanZero(Number(z.re.toPrecision(13))), im: Math.abs(z.im) < 1e-9 ? 0 : Number(z.im.toPrecision(13)) }))
    .sort((a, b) => (a.im === 0 && b.im !== 0 ? -1 : b.im === 0 && a.im !== 0 ? 1 : b.re - a.re || b.im - a.im))
}

/** Newton/secant solver for f(x) = 0 near x0 (the SOLVE function). */
export function solveNumeric(f: (x: number) => number, x0: number): number {
  let x = x0
  for (let i = 0; i < 200; i++) {
    const fx = f(x)
    if (!Number.isFinite(fx)) break
    if (Math.abs(fx) < 1e-14) return cleanZero(x)
    const h = Math.max(1e-7, Math.abs(x) * 1e-7)
    const d = (f(x + h) - f(x - h)) / (2 * h)
    if (d === 0 || !Number.isFinite(d)) break
    const next = x - fx / d
    if (Math.abs(next - x) < 1e-13 * Math.max(1, Math.abs(x))) return cleanZero(next)
    x = next
  }
  if (Math.abs(f(x)) < 1e-9) return cleanZero(x)
  throw new MathError('MathError', "Can't solve: no convergence")
}
