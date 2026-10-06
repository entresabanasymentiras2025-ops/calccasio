import { describe, it, expect } from 'vitest'
import { evaluateComplex, formatComplex } from './complexEvaluator'

const ctx = { angleMode: 'DEG' as const, variables: {}, ans: { re: 0, im: 0 } }
const f = (s: string, form: 'rect' | 'polar' = 'rect') => formatComplex(evaluateComplex(s, ctx), form, 'DEG')

describe('complex evaluator', () => {
  it('multiplies', () => expect(f('(1+2i)(3-i)')).toBe('5+5i'))
  it('divides', () => expect(f('(1+2i)/(3+4i)')).toBe('0.44+0.08i'))
  it('i² = -1', () => expect(f('i^2')).toBe('-1'))
  it('modulus and argument', () => {
    expect(f('abs(3+4i)')).toBe('5')
    expect(f('arg(1+i)')).toBe('45')
  })
  it('conjugate', () => expect(f('conj(3+4i)')).toBe('3-4i'))
  it('sqrt of negative', () => expect(f('sqrt(-4)')).toBe('2i'))
  it('polar form', () => expect(f('1+i', 'polar')).toBe('1.414213562∠45'))
  it('polar input', () => expect(f('polar(2,90)')).toBe('2i'))
})
