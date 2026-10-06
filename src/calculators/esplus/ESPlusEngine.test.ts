import { describe, it, expect } from 'vitest'
import { ESPlusEngine } from './ESPlusEngine'
import { getCalculatorById } from '../../models/calculatorCatalog'
import type { TextDisplayState } from '../core/CalculatorDisplay'

const K: Record<string, string> = { '0': 'ZERO', '1': 'ONE', '2': 'TWO', '3': 'THREE', '4': 'FOUR', '5': 'FIVE', '6': 'SIX', '7': 'SEVEN', '8': 'EIGHT', '9': 'NINE', '+': 'PLUS', '-': 'MINUS', '*': 'MULTIPLY', '/': 'DIVIDE', '.': 'DOT', '(': 'LPAREN', ')': 'RPAREN', '=': 'EQUALS' }
const make = (id = 'fx-991es-plus') => new ESPlusEngine(getCalculatorById(id)!)
const type = (e: ESPlusEngine, s: string) => [...s].forEach((c) => e.pressKey(K[c]))

describe('ESPlusEngine', () => {
  it('evaluates with exact fractions', () => {
    const e = make()
    type(e, '1/3+1/6=')
    expect(e.getState().result).toBe('1/2')
  })
  it('numbered MODE menu selected by digit (2 = CMPLX)', () => {
    const e = make()
    e.pressKey('MODE')
    expect((e.getDisplay() as TextDisplayState).lines[0]).toBe('1:COMP')
    e.pressKey('TWO')
    expect(e.getState().mode).toBe('COMPLEX')
  })
  it('fx-82ES PLUS only offers COMP, STAT and TABLE', () => {
    expect(make('fx-82es-plus').availableModes().map((m) => m.id)).toEqual(['COMP', 'STAT', 'TABLE'])
  })
  it('SETUP is SHIFT+MODE', () => {
    const e = make()
    e.pressKey('SHIFT')
    e.pressKey('MODE')
    expect(e.getState().menu.path[0]).toBe('SETUP')
  })
  it('fraction key a⌟b', () => {
    const e = make()
    type(e, '1')
    e.pressKey('FRAC')
    type(e, '2+1')
    e.pressKey('FRAC')
    type(e, '3=')
    expect(e.getState().result).toBe('5/6')
  })
  it('SOLVE finds X for X²−2 = 0 starting at X = 0', () => {
    const e = make()
    e.pressKey('ALPHA')
    e.pressKey('RPAREN') // X
    e.pressKey('SQUARE')
    type(e, '-2')
    e.pressKey('CALC') // SOLVE
    expect(e.getState().result).toMatch(/^X=1\.414213562/)
  })
  it('RCL shows a stored variable', () => {
    const e = make()
    type(e, '9=')
    e.pressKey('SHIFT')
    e.pressKey('RCL') // STO
    e.pressKey('NEGATE') // A (alpha legend on (−))
    e.pressKey('RCL')
    e.pressKey('NEGATE')
    expect(e.getState().result).toBe('9')
  })
  it('uses ES PLUS error wording', () => {
    const e = make()
    type(e, '1/0=')
    expect((e.getDisplay() as TextDisplayState).errorMessage).toMatch(/^Math ERROR/)
    e.pressKey('ON')
    type(e, '2++=')
    expect((e.getDisplay() as TextDisplayState).errorMessage).toMatch(/^Syntax ERROR/)
  })
  it('EQN limited to 3 unknowns', () => {
    const e = make()
    e.pressKey('MODE')
    e.pressKey('FIVE') // EQN
    e.pressKey('ONE') // simul
    expect((e.getDisplay() as TextDisplayState).lines.join(' ')).not.toMatch(/4 Unknowns/)
  })
  it('ENG notation', () => {
    const e = make()
    type(e, '12345=')
    e.pressKey('ENG')
    expect(e.getState().result).toBe('12.345×10^3')
  })
})
