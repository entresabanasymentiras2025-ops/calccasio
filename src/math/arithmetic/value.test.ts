import { describe, it, expect } from 'vitest'
import { fromLiteral, add, mul, div, pow, sqrt, factorial, toDecimal, rational, cbrt } from './value'

describe('CalcValue rationals', () => {
  it('parses decimal literals exactly', () => {
    const v = fromLiteral('0.1')
    expect(toDecimal(v).toString()).toBe('0.1')
  })
  it('parses scientific literals', () => {
    const v = fromLiteral('1.5E3')
    expect(toDecimal(v).toString()).toBe('1500')
  })
  it('keeps 1/3 * 3 exact', () => {
    const oneThird = div(rational(1n, 1n), rational(3n, 1n))
    const result = mul(oneThird, rational(3n, 1n))
    expect(toDecimal(result).toString()).toBe('1')
  })
  it('adds fractions with different denominators', () => {
    const a = div(rational(1n, 1n), rational(2n, 1n))
    const b = div(rational(1n, 1n), rational(3n, 1n))
    expect(toDecimal(add(a, b)).toString()).toBe('0.83333333333333333333333333333333')
  })
  it('integer powers stay exact', () => {
    const v = pow(rational(2n, 1n), rational(10n, 1n))
    expect(toDecimal(v).toString()).toBe('1024')
  })
  it('perfect square roots stay exact', () => {
    expect(toDecimal(sqrt(rational(49n, 1n))).toString()).toBe('7')
  })
  it('cube root handles negatives exactly for perfect cubes', () => {
    expect(toDecimal(cbrt(rational(-8n, 1n))).toString()).toBe('-2')
  })
  it('factorial of small integers', () => {
    expect(toDecimal(factorial(rational(6n, 1n))).toString()).toBe('720')
  })
})
