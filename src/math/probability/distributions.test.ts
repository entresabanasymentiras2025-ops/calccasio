import { describe, it, expect } from 'vitest'
import { erf, normalPdf, normalCdf, inverseNormal, binomialPd, binomialCd, poissonPd, poissonCd } from './distributions'

describe('distributions', () => {
  it('erf', () => {
    expect(erf(0)).toBe(0)
    expect(erf(1)).toBeCloseTo(0.8427007929, 9)
    expect(erf(-3)).toBeCloseTo(-0.9999779095, 9)
  })
  it('normal', () => {
    expect(normalPdf(0)).toBeCloseTo(0.3989422804, 9)
    expect(normalCdf(-1, 1)).toBeCloseTo(0.6826894921, 9)
    expect(normalCdf(-Infinity, 1.96)).toBeCloseTo(0.9750021049, 9)
    expect(inverseNormal(0.975)).toBeCloseTo(1.959963985, 7)
    expect(inverseNormal(0.5, 10, 2)).toBeCloseTo(10, 9)
  })
  it('binomial', () => {
    expect(binomialPd(3, 10, 0.5)).toBeCloseTo(0.1171875, 12)
    expect(binomialCd(3, 10, 0.5)).toBeCloseTo(0.171875, 12)
  })
  it('poisson', () => {
    expect(poissonPd(2, 3)).toBeCloseTo(0.2240418077, 9)
    expect(poissonCd(2, 3)).toBeCloseTo(0.4231900811, 9)
  })
})
