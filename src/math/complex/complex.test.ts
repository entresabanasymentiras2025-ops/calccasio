import { describe, it, expect } from 'vitest'
import { complex, add, multiply, divide, modulus, conjugate } from './complex'

describe('complex numbers', () => {
  it('adds', () => expect(add(complex(1, 2), complex(3, 4))).toEqual({ re: 4, im: 6 }))
  it('multiplies', () => expect(multiply(complex(1, 2), complex(3, 4))).toEqual({ re: -5, im: 10 }))
  it('divides', () => {
    const r = divide(complex(1, 2), complex(3, 4))
    expect(r.re).toBeCloseTo(0.44, 2)
    expect(r.im).toBeCloseTo(0.08, 2)
  })
  it('computes modulus', () => expect(modulus(complex(3, 4))).toBe(5))
  it('computes conjugate', () => expect(conjugate(complex(3, 4))).toEqual({ re: 3, im: -4 }))
})
