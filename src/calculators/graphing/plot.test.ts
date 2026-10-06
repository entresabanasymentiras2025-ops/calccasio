import { describe, it, expect } from 'vitest'
import { sampleCurve, rootsIn, extremum, zoom, pan, autoY, STANDARD_VIEWPORT } from './plot'

describe('plot utilities', () => {
  it('samples a continuous curve as one segment', () => {
    const c = sampleCurve((x) => x * x, STANDARD_VIEWPORT, 100, 'Y1', '#00f')
    expect(c.segments).toHaveLength(1)
    expect(c.segments[0]).toHaveLength(101)
  })
  it('breaks at an asymptote', () => {
    const c = sampleCurve((x) => 1 / x, STANDARD_VIEWPORT, 101, 'Y1', '#00f')
    expect(c.segments.length).toBeGreaterThanOrEqual(2)
  })
  it('finds roots', () => {
    const r = rootsIn((x) => x * x - 2, -5, 5)
    expect(r).toHaveLength(2)
    expect(r[1]).toBeCloseTo(Math.SQRT2, 9)
  })
  it('ignores poles', () => {
    expect(rootsIn((x) => 1 / x, -1, 1.3)).toHaveLength(0)
  })
  it('finds extrema', () => {
    const m = extremum((x) => 3 - (x - 1) ** 2, -5, 5, 'max')
    expect(m.x).toBeCloseTo(1, 6)
    expect(m.y).toBeCloseTo(3, 9)
  })
  it('zoom and pan', () => {
    expect(zoom(STANDARD_VIEWPORT, 0.5).xmax).toBeCloseTo(3.15)
    expect(pan(STANDARD_VIEWPORT, 0.1, 0).xmin).toBeCloseTo(-5.04)
    expect(autoY({ ...STANDARD_VIEWPORT }, [(x) => x]).ymax).toBeCloseTo(6.93)
  })
})
