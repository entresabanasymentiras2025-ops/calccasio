import { describe, it, expect } from 'vitest'
import { MSEngine } from './MSEngine'
import { getCalculatorById } from '../../models/calculatorCatalog'
import type { TextDisplayState } from '../core/CalculatorDisplay'

const K: Record<string, string> = { '0': 'ZERO', '1': 'ONE', '2': 'TWO', '3': 'THREE', '4': 'FOUR', '5': 'FIVE', '6': 'SIX', '7': 'SEVEN', '8': 'EIGHT', '9': 'NINE', '+': 'PLUS', '-': 'MINUS', '*': 'MULTIPLY', '/': 'DIVIDE', '.': 'DOT', ',': 'COMMA', '(': 'LPAREN', ')': 'RPAREN', '=': 'EQUALS' }
const make = (id = 'fx-991ms') => new MSEngine(getCalculatorById(id)!)
const type = (e: MSEngine, s: string) => [...s].forEach((c) => e.pressKey(K[c]))
const title = (e: MSEngine) => (e.getDisplay() as TextDisplayState).title

describe('MSEngine', () => {
  it('shows decimals by default (no natural fractions)', () => {
    const e = make()
    type(e, '1/4=')
    expect(e.getState().result).toBe('0.25')
  })
  it('a⌟b⌟c fraction input gives a fraction result in MS notation', () => {
    const e = make()
    type(e, '1')
    e.pressKey('FRAC')
    type(e, '2+1')
    e.pressKey('FRAC')
    type(e, '3=')
    expect(e.getState().result).toBe('5⌟6')
    type(e, '+1=')
    expect(e.getState().result).toBe('1.833333333')
  })
  it('MODE pages through screens', () => {
    const e = make()
    e.pressKey('MODE')
    expect(e.getState().menu.path[0]).toBe('MODE 1/6')
    e.pressKey('MODE')
    expect(e.getState().menu.path[0]).toBe('MODE 2/6')
    e.pressKey('ONE') // SD
    expect(e.getState().mode).toBe('SD')
  })
  it('SD mode: DT data entry and S-VAR mean', () => {
    const e = make()
    e.pressKey('MODE')
    e.pressKey('MODE')
    e.pressKey('ONE')
    for (const v of ['2', '4', '9']) {
      type(e, v)
      e.pressKey('MPLUS') // DT
    }
    expect(title(e)).toBe('SD · n=3')
    e.pressKey('SHIFT')
    e.pressKey('TWO') // S-VAR
    e.pressKey('ONE') // x̄
    expect(e.getState().result).toBe('5')
  })
  it('REG Lin: x,y pairs and A/B coefficients', () => {
    const e = make()
    e.pressKey('MODE')
    e.pressKey('MODE')
    e.pressKey('TWO') // REG
    e.pressKey('ONE') // Lin
    for (const [x, y] of [['1', '3'], ['2', '5'], ['3', '7']]) {
      type(e, `${x},${y}`)
      e.pressKey('MPLUS')
    }
    e.pressKey('SHIFT')
    e.pressKey('TWO')
    e.pressKey('SEVEN') // A
    expect(e.getState().result).toBe('1')
    e.pressKey('SHIFT')
    e.pressKey('TWO')
    e.pressKey('EIGHT') // B
    expect(e.getState().result).toBe('2')
  })
  it('SHIFT CLR Scl clears statistical data', () => {
    const e = make()
    e.pressKey('MODE')
    e.pressKey('MODE')
    e.pressKey('ONE')
    type(e, '5')
    e.pressKey('MPLUS')
    e.pressKey('SHIFT')
    e.pressKey('MODE') // CLR
    e.pressKey('ONE') // Scl
    expect(title(e)).toBe('SD · n=0')
  })
  it('fx-82MS has no EQN/BASE/CMPLX modes', () => {
    expect(make('fx-82ms').availableModes().map((m) => m.id)).toEqual(['COMP', 'SD', 'REG'])
  })
  it('fx-991MS has matrices and vectors', () => {
    const ids = make('fx-991ms').availableModes().map((m) => m.id)
    expect(ids).toContain('MATRIX')
    expect(ids).toContain('VECTOR')
  })
})
