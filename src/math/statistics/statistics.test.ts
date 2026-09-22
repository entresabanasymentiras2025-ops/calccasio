import { describe, it, expect } from 'vitest'
import { summarize, median, linearRegression } from './statistics'

describe('statistics', () => {
  it('computes mean and stddev', () => {
    const s = summarize([2, 4, 4, 4, 5, 5, 7, 9])
    expect(s.mean).toBe(5)
    expect(s.populationStdDev).toBeCloseTo(2)
  })
  it('computes median for even and odd sets', () => {
    expect(median([1, 2, 3])).toBe(2)
    expect(median([1, 2, 3, 4])).toBe(2.5)
  })
  it('computes linear regression', () => {
    const { slope, intercept, r } = linearRegression([1, 2, 3, 4], [2, 4, 6, 8])
    expect(slope).toBeCloseTo(2)
    expect(intercept).toBeCloseTo(0)
    expect(r).toBeCloseTo(1)
  })
})
