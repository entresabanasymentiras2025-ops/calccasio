import type { GraphCurve, Viewport } from '../core/CalculatorDisplay'
import { MathError } from '../../math/arithmetic/value'

export type RealFn = (x: number) => number

export const STANDARD_VIEWPORT: Viewport = { xmin: -6.3, xmax: 6.3, ymin: -3.1, ymax: 3.1, xscl: 1, yscl: 1 }

export function safe(f: RealFn): RealFn {
  return (x) => {
    try {
      const y = f(x)
      return Number.isFinite(y) ? y : NaN
    } catch {
      return NaN
    }
  }
}

/** Samples f across the viewport at `samples` columns, splitting at gaps and vertical jumps (asymptotes). */
export function sampleCurve(f: RealFn, vp: Viewport, samples: number, label: string, color: string): GraphCurve {
  const g = safe(f)
  const segments: Array<Array<[number, number]>> = []
  let current: Array<[number, number]> = []
  const yRange = vp.ymax - vp.ymin
  let prev: number | null = null
  for (let i = 0; i <= samples; i++) {
    const x = vp.xmin + ((vp.xmax - vp.xmin) * i) / samples
    const y = g(x)
    if (Number.isNaN(y) || (prev !== null && Math.abs(y - prev) > yRange * 2 && Math.sign(y) !== Math.sign(prev))) {
      if (current.length > 1) segments.push(current)
      current = Number.isNaN(y) ? [] : [[x, clampY(y, vp)]]
      prev = Number.isNaN(y) ? null : y
      continue
    }
    current.push([x, clampY(y, vp)])
    prev = y
  }
  if (current.length > 1) segments.push(current)
  return { label, color, segments }
}

function clampY(y: number, vp: Viewport): number {
  const span = vp.ymax - vp.ymin
  return Math.max(vp.ymin - span * 4, Math.min(vp.ymax + span * 4, y))
}

export function zoom(vp: Viewport, factor: number, cx = (vp.xmin + vp.xmax) / 2, cy = (vp.ymin + vp.ymax) / 2): Viewport {
  const hw = ((vp.xmax - vp.xmin) / 2) * factor
  const hh = ((vp.ymax - vp.ymin) / 2) * factor
  return { ...vp, xmin: cx - hw, xmax: cx + hw, ymin: cy - hh, ymax: cy + hh }
}

export function pan(vp: Viewport, dxFrac: number, dyFrac: number): Viewport {
  const dx = (vp.xmax - vp.xmin) * dxFrac
  const dy = (vp.ymax - vp.ymin) * dyFrac
  return { ...vp, xmin: vp.xmin + dx, xmax: vp.xmax + dx, ymin: vp.ymin + dy, ymax: vp.ymax + dy }
}

/** Auto-fits y to the functions' range over the current x window. */
export function autoY(vp: Viewport, fns: RealFn[], samples = 200): Viewport {
  let lo = Infinity
  let hi = -Infinity
  for (const f of fns.map(safe)) {
    for (let i = 0; i <= samples; i++) {
      const y = f(vp.xmin + ((vp.xmax - vp.xmin) * i) / samples)
      if (Number.isFinite(y)) {
        lo = Math.min(lo, y)
        hi = Math.max(hi, y)
      }
    }
  }
  if (!Number.isFinite(lo)) return vp
  if (hi - lo < 1e-9) {
    lo -= 1
    hi += 1
  }
  const pad = (hi - lo) * 0.05
  return { ...vp, ymin: lo - pad, ymax: hi + pad }
}

function bisect(g: RealFn, a: number, b: number): number {
  let fa = g(a)
  for (let i = 0; i < 100; i++) {
    const m = (a + b) / 2
    const fm = g(m)
    if (fa * fm <= 0) b = m
    else {
      a = m
      fa = fm
    }
  }
  return (a + b) / 2
}

/** All sign-change roots of g inside [a, b], left to right. */
export function rootsIn(g0: RealFn, a: number, b: number, samples = 400): number[] {
  const g = safe(g0)
  const out: number[] = []
  let x0 = a
  let y0 = g(a)
  for (let i = 1; i <= samples; i++) {
    const x1 = a + ((b - a) * i) / samples
    const y1 = g(x1)
    if (Number.isFinite(y0) && Number.isFinite(y1)) {
      if (y0 === 0) out.push(x0)
      else if (y0 * y1 < 0) {
        const r = bisect(g, x0, x1)
        // Reject sign changes across poles.
        if (Math.abs(g(r)) < 1e-6 * Math.max(1, Math.abs(y0), Math.abs(y1))) out.push(r)
      }
    }
    x0 = x1
    y0 = y1
  }
  if (Number.isFinite(y0) && y0 === 0) out.push(x0)
  return out.map((r) => (Math.abs(r) < 1e-12 ? 0 : r))
}

/** Local extremum (golden-section) of f in [a, b]. */
export function extremum(f0: RealFn, a: number, b: number, kind: 'max' | 'min'): { x: number; y: number } {
  const f = safe(f0)
  const sign = kind === 'max' ? -1 : 1
  // Coarse scan to find the best bracket, then refine.
  const n = 400
  let best = a
  let bestV = Infinity
  for (let i = 0; i <= n; i++) {
    const x = a + ((b - a) * i) / n
    const v = sign * f(x)
    if (Number.isFinite(v) && v < bestV) {
      bestV = v
      best = x
    }
  }
  if (!Number.isFinite(bestV)) throw new MathError('MathError', 'Not found')
  let lo = Math.max(a, best - (b - a) / n)
  let hi = Math.min(b, best + (b - a) / n)
  const gr = (Math.sqrt(5) - 1) / 2
  for (let i = 0; i < 100; i++) {
    const c = hi - gr * (hi - lo)
    const d = lo + gr * (hi - lo)
    if (sign * f(c) < sign * f(d)) hi = d
    else lo = c
  }
  const x = (lo + hi) / 2
  return { x: Math.abs(x) < 1e-10 ? 0 : x, y: f(x) }
}
