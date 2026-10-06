import { describe, it, expect } from 'vitest'
import { solveLinearSystem, polynomialRoots, solveNumeric } from './equations'

describe('equations', () => {
  it('solves a 2x2 system', () => {
    expect(solveLinearSystem([[2, 1], [1, -1]], [5, 1])).toEqual([2, 1])
  })
  it('solves a 3x3 system', () => {
    const [x, y, z] = solveLinearSystem([[1, 1, 1], [0, 2, 5], [2, 5, -1]], [6, -4, 27])
    expect(x).toBeCloseTo(5)
    expect(y).toBeCloseTo(3)
    expect(z).toBeCloseTo(-2)
  })
  it('rejects singular systems', () => {
    expect(() => solveLinearSystem([[1, 2], [2, 4]], [1, 2])).toThrow()
  })
  it('quadratic with real roots', () => {
    expect(polynomialRoots([1, -3, 2])).toEqual([{ re: 2, im: 0 }, { re: 1, im: 0 }])
  })
  it('quadratic with complex roots', () => {
    const r = polynomialRoots([1, 2, 5])
    expect(r[0].re).toBeCloseTo(-1)
    expect(Math.abs(r[0].im)).toBeCloseTo(2)
  })
  it('cubic', () => {
    const r = polynomialRoots([1, -6, 11, -6]).map((z) => z.re)
    expect(r[0]).toBeCloseTo(3)
    expect(r[1]).toBeCloseTo(2)
    expect(r[2]).toBeCloseTo(1)
  })
  it('quartic with complex pair', () => {
    const r = polynomialRoots([1, 0, 0, 0, -1])
    expect(r.filter((z) => z.im === 0).map((z) => z.re).sort()).toEqual([-1, 1])
    expect(r.filter((z) => z.im !== 0)).toHaveLength(2)
  })
  it('numeric solve', () => {
    expect(solveNumeric((x) => x * x - 2, 1)).toBeCloseTo(Math.SQRT2, 12)
  })
})
