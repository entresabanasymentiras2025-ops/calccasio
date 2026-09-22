import { describe, it, expect } from 'vitest'
import { evaluate, createContext } from './evaluator'
import { formatValue, formattedToPlainText } from '../numerical/format'
import { MathError } from '../arithmetic/value'

function evalToText(input: string, ctx = createContext()): string {
  const value = evaluate(input, ctx)
  return formattedToPlainText(formatValue(value))
}

describe('evaluator - arithmetic', () => {
  it('adds', () => expect(evalToText('2+2')).toBe('4'))
  it('subtracts', () => expect(evalToText('10-3')).toBe('7'))
  it('multiplies', () => expect(evalToText('6*7')).toBe('42'))
  it('divides exactly', () => expect(evalToText('7/2')).toBe('3 1/2'))
  it('respects operator precedence', () => expect(evalToText('2+3*4')).toBe('14'))
  it('respects parentheses', () => expect(evalToText('(2+3)*4')).toBe('20'))
  it('handles unary minus', () => expect(evalToText('-5+3')).toBe('-2'))
  it('handles negative exponent precedence: -2^2 = -4', () => expect(evalToText('-2^2')).toBe('-4'))
  it('handles right-associative power', () => expect(evalToText('2^3^2')).toBe('512'))
  it('supports implicit multiplication with parens', () => expect(evalToText('2(3+4)')).toBe('14'))
  it('supports implicit multiplication with constants', () => {
    const ctx = createContext()
    expect(evalToText('2π', ctx)).not.toBe('')
  })
})

describe('evaluator - powers and roots', () => {
  it('squares', () => expect(evalToText('5^2')).toBe('25'))
  it('square root perfect square stays exact', () => expect(evalToText('sqrt(144)')).toBe('12'))
  it('square root of non-perfect square is decimal', () => {
    const text = evalToText('sqrt(2)')
    expect(text.startsWith('1.41421356')).toBe(true)
  })
  it('cube root of negative number', () => expect(evalToText('cbrt(-27)')).toBe('-3'))
  it('x^2 postfix notation via caret expansion', () => expect(evalToText('3²')).toBe('9'))
  it('x^-1 postfix notation', () => expect(evalToText('4⁻¹')).toBe('1/4'))
})

describe('evaluator - factorial and percent', () => {
  it('factorial', () => expect(evalToText('5!')).toBe('120'))
  it('0! = 1', () => expect(evalToText('0!')).toBe('1'))
  it('rejects factorial of negative number', () => expect(() => evalToText('(-1)!')).toThrow(MathError))
  it('percent divides by 100', () => expect(evalToText('50%')).toBe('1/2'))
})

describe('evaluator - trigonometry', () => {
  it('sin(30) in degrees = 0.5', () => expect(evalToText('sin(30)')).toBe('0.5'))
  it('cos(60) in degrees = 0.5', () => expect(evalToText('cos(60)')).toBe('0.5'))
  it('tan(45) in degrees = 1', () => expect(evalToText('tan(45)')).toBe('1'))
  it('sin(pi/2) in radians = 1', () => {
    const ctx = createContext({ angleMode: 'RAD' })
    expect(evalToText('sin(π/2)', ctx)).toBe('1')
  })
  it('asin(1) in degrees = 90', () => expect(evalToText('asin(1)')).toBe('90'))
  it('rejects out-of-domain asin', () => expect(() => evalToText('asin(2)')).toThrow(MathError))
})

describe('evaluator - logarithms', () => {
  it('log base 10', () => expect(evalToText('log(100)')).toBe('2'))
  it('ln(1) = 0', () => expect(evalToText('ln(1)')).toBe('0'))
  it('log base 2 of 8', () => expect(evalToText('log(8,2)')).toBe('3'))
  it('rejects log of non-positive number', () => expect(() => evalToText('log(0)')).toThrow(MathError))
})

describe('evaluator - errors', () => {
  it('throws on division by zero', () => expect(() => evalToText('1/0')).toThrow(MathError))
  it('throws SyntaxError on malformed input', () => expect(() => evalToText('2+*3')).toThrow(MathError))
  it('throws SyntaxError on unmatched parens', () => expect(() => evalToText('(2+3')).toThrow(MathError))
  it('throws on unknown identifier', () => expect(() => evalToText('foo+1')).toThrow(MathError))
})

describe('evaluator - variables and Ans', () => {
  it('resolves Ans', () => {
    const ctx = createContext({ ans: evaluate('10', createContext()) })
    expect(evalToText('Ans+5', ctx)).toBe('15')
  })
  it('resolves a memory variable', () => {
    const ctx = createContext({ variables: { A: evaluate('7', createContext()) } })
    expect(evalToText('A*2', ctx)).toBe('14')
  })
})
