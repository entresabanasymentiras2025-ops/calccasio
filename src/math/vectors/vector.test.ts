import { describe, it, expect } from 'vitest'
import { dot, cross, norm, angleBetween, add } from './vector'

describe('vectors', () => {
  it('dot/cross/norm', () => {
    expect(dot([1, 2, 3], [4, 5, 6])).toBe(32)
    expect(cross([1, 0, 0], [0, 1, 0])).toEqual([0, 0, 1])
    expect(norm([3, 4])).toBe(5)
    expect(add([1, 2], [3, 4])).toEqual([4, 6])
  })
  it('angle', () => expect(angleBetween([1, 0], [0, 1])).toBeCloseTo(Math.PI / 2))
  it('dimension errors', () => expect(() => dot([1], [1, 2])).toThrow())
})
