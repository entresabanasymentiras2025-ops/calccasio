import { describe, it, expect } from 'vitest'
import { evaluateBaseN, formatBaseN } from './baseN'

describe('BASE-N', () => {
  it('hex arithmetic', () => expect(formatBaseN(evaluateBaseN('1F+1', 'HEX'), 'HEX')).toBe('20'))
  it('binary logic', () => expect(formatBaseN(evaluateBaseN('1010 and 0110', 'BIN'), 'BIN')).toBe('10'))
  it('two’s complement display', () => expect(formatBaseN(evaluateBaseN('0-1', 'DEC'), 'HEX')).toBe('FFFFFFFF'))
  it('not', () => expect(evaluateBaseN('not 0', 'DEC')).toBe(-1n))
  it('integer division truncates', () => expect(evaluateBaseN('7/2', 'DEC')).toBe(3n))
  it('32-bit overflow wraps', () => expect(evaluateBaseN('7FFFFFFF+1', 'HEX')).toBe(-2147483648n))
  it('rejects invalid digits', () => expect(() => evaluateBaseN('12', 'BIN')).toThrow())
  it('radix prefixes', () => expect(evaluateBaseN('hF+b11', 'DEC')).toBe(18n))
})
