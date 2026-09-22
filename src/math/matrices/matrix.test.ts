import { describe, it, expect } from 'vitest'
import { add, multiply, transpose, determinant, inverse } from './matrix'
import { MathError } from '../arithmetic/value'

describe('matrix operations', () => {
  it('adds matrices', () => {
    expect(add([[1, 2]], [[3, 4]])).toEqual([[4, 6]])
  })
  it('rejects mismatched shapes', () => {
    expect(() => add([[1, 2]], [[1]])).toThrow(MathError)
  })
  it('multiplies matrices', () => {
    expect(
      multiply(
        [
          [1, 2],
          [3, 4],
        ],
        [
          [5, 6],
          [7, 8],
        ],
      ),
    ).toEqual([
      [19, 22],
      [43, 50],
    ])
  })
  it('transposes', () => {
    expect(
      transpose([
        [1, 2],
        [3, 4],
        [5, 6],
      ]),
    ).toEqual([
      [1, 3, 5],
      [2, 4, 6],
    ])
  })
  it('computes 2x2 determinant', () => {
    expect(
      determinant([
        [1, 2],
        [3, 4],
      ]),
    ).toBe(-2)
  })
  it('computes 3x3 determinant', () => {
    expect(
      determinant([
        [6, 1, 1],
        [4, -2, 5],
        [2, 8, 7],
      ]),
    ).toBe(-306)
  })
  it('computes inverse', () => {
    const inv = inverse([
      [4, 7],
      [2, 6],
    ])
    expect(inv[0][0]).toBeCloseTo(0.6)
    expect(inv[0][1]).toBeCloseTo(-0.7)
    expect(inv[1][0]).toBeCloseTo(-0.2)
    expect(inv[1][1]).toBeCloseTo(0.4)
  })
  it('rejects singular matrix inverse', () => {
    expect(() =>
      inverse([
        [1, 2],
        [2, 4],
      ]),
    ).toThrow(MathError)
  })
})
