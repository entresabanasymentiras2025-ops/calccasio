import { describe, it, expect } from 'vitest'
import { ClassWizEngine } from './ClassWizEngine'
import { getCalculatorById } from '../../models/calculatorCatalog'
import type { TextDisplayState } from '../core/CalculatorDisplay'

const KEY_FOR: Record<string, string> = {
  '0': 'ZERO', '1': 'ONE', '2': 'TWO', '3': 'THREE', '4': 'FOUR', '5': 'FIVE', '6': 'SIX', '7': 'SEVEN', '8': 'EIGHT', '9': 'NINE',
  '.': 'DOT', '+': 'PLUS', '-': 'MINUS', '*': 'MULTIPLY', '/': 'DIVIDE', ',': 'COMMA', '(': 'LPAREN', ')': 'RPAREN', '=': 'EQUALS',
}

function engineFor(id = 'fx-991cw') {
  return new ClassWizEngine(getCalculatorById(id)!)
}

function type(engine: ClassWizEngine, text: string) {
  for (const ch of text) engine.pressKey(KEY_FOR[ch])
}

function lines(engine: ClassWizEngine): string[] {
  return (engine.getDisplay() as TextDisplayState).lines
}

function enterMode(engine: ClassWizEngine, id: string) {
  engine.pressKey('MODE')
  const idx = engine.getState().menu.items.findIndex((i) => i.id === id)
  expect(idx).toBeGreaterThanOrEqual(0)
  for (let k = 0; k < idx; k++) engine.pressKey('NAV_DOWN')
  engine.pressKey('EQUALS')
  expect(engine.getState().mode).toBe(id)
}

describe('capability-filtered modes', () => {
  it('fx-991CW offers matrix/vector/complex', () => {
    const ids = engineFor().availableModes().map((m) => m.id)
    expect(ids).toEqual(expect.arrayContaining(['COMP', 'STAT', 'TABLE', 'EQUATION', 'MATRIX', 'VECTOR', 'COMPLEX', 'BASE_N', 'RATIO', 'DISTRIBUTION']))
  })
  it('fx-82CW does not offer MATRIX, COMPLEX or EQUATION', () => {
    const ids = engineFor('fx-82cw').availableModes().map((m) => m.id)
    expect(ids).not.toContain('MATRIX')
    expect(ids).not.toContain('COMPLEX')
    expect(ids).not.toContain('EQUATION')
    expect(ids).toContain('STAT')
  })
  it('EX generation names the menu key MENU and uses its own mode order', () => {
    const e = engineFor('fx-991ex')
    expect(e.keyboardLayout.keys.find((k) => k.id === 'MODE')!.primary.label).toBe('MENU')
    expect(e.availableModes()[1].id).toBe('COMPLEX')
  })
})

describe('EQUATION mode', () => {
  it('solves a quadratic x² − 3x + 2 = 0', () => {
    const e = engineFor()
    enterMode(e, 'EQUATION')
    e.pressKey('TWO') // Polynomial
    e.pressKey('ONE') // degree 2
    type(e, '1=')
    e.pressKey('NEGATE')
    type(e, '3=2=')
    expect(lines(e)).toEqual(expect.arrayContaining(['x1=2', 'x2=1']))
  })
  it('solves a 2×2 linear system', () => {
    const e = engineFor()
    enterMode(e, 'EQUATION')
    e.pressKey('ONE')
    e.pressKey('ONE') // 2 unknowns
    // 2x + y = 5 ; x − y = 1
    type(e, '2=1=5=1=')
    e.pressKey('NEGATE')
    type(e, '1=1=')
    expect(lines(e).slice(0, 2)).toEqual(['x=2', 'y=1'])
  })
  it('shows complex roots', () => {
    const e = engineFor()
    enterMode(e, 'EQUATION')
    e.pressKey('TWO')
    e.pressKey('ONE')
    type(e, '1=2=5=')
    expect(lines(e)[0]).toBe('x1=-1+2i')
  })
  it('AC returns from results to the form, then to the menu', () => {
    const e = engineFor()
    enterMode(e, 'EQUATION')
    e.pressKey('TWO')
    e.pressKey('ONE')
    type(e, '1=0=')
    e.pressKey('NEGATE')
    type(e, '4=')
    expect(lines(e)[0]).toBe('x1=2')
    e.pressKey('ON')
    expect(lines(e)[0]).toMatch(/^a=/)
    e.pressKey('ON')
    expect(lines(e)[0]).toMatch(/^1:/)
  })
})

describe('MATRIX mode', () => {
  it('computes a 2×2 determinant and inverse', () => {
    const e = engineFor()
    enterMode(e, 'MATRIX')
    e.pressKey('FOUR') // det
    e.pressKey('ONE') // 2x2
    type(e, '4=7=2=6=')
    expect(lines(e)).toEqual(['det(MatA)=', '10'])
    e.pressKey('ON')
    e.pressKey('ON')
    e.pressKey('ON')
    e.pressKey('FIVE') // inverse
    e.pressKey('ONE')
    type(e, '4=7=2=6=')
    expect(lines(e)).toEqual(['MatA⁻¹=', '[ 3/5  -7/10 ]', '[ -1/5  2/5 ]'])
  })
  it('reports a dimension-safe singular matrix error', () => {
    const e = engineFor()
    enterMode(e, 'MATRIX')
    e.pressKey('FIVE')
    e.pressKey('ONE')
    type(e, '1=2=2=4=')
    expect((e.getDisplay() as TextDisplayState).errorMessage).toMatch(/Math ERROR/)
  })
})

describe('STAT mode', () => {
  it('1-variable statistics from a comma-separated list', () => {
    const e = engineFor()
    enterMode(e, 'STAT')
    e.pressKey('ONE')
    type(e, '2,4,4,4,5,5,7,9=')
    e.pressKey('EQUALS') // compute (freq left empty)
    const out = lines(e)
    expect(out[0]).toBe('x̄=5')
    e.pressKey('NAV_DOWN')
    e.pressKey('NAV_DOWN')
    e.pressKey('NAV_DOWN')
    e.pressKey('NAV_DOWN')
    expect(lines(e)[0]).toBe('σx=2')
  })
  it('linear regression', () => {
    const e = engineFor()
    enterMode(e, 'STAT')
    e.pressKey('TWO')
    type(e, '1,2,3,4=3,5,7,9=')
    e.pressKey('EQUALS')
    expect(lines(e).slice(0, 3)).toEqual(['a=1', 'b=2', 'r=1'])
  })
})

describe('TABLE, DISTRIBUTION, RATIO, VECTOR', () => {
  it('table of the default f(x)=X² from 1 to 5', () => {
    const e = engineFor()
    enterMode(e, 'TABLE')
    e.pressKey('EQUALS') // f(x) editing not started: compute with defaults
    expect(lines(e)).toEqual(['x | f(x)', '1 | 1', '2 | 4', '3 | 9'])
  })
  it('normal CD between -1 and 1', () => {
    const e = engineFor()
    enterMode(e, 'DISTRIBUTION')
    e.pressKey('TWO')
    e.pressKey('EQUALS')
    expect(lines(e)[0]).toBe('p=0.6826894921')
    expect(e.getState().memory.ans.kind).toBe('decimal')
  })
  it('ratio A:B = X:D', () => {
    const e = engineFor()
    enterMode(e, 'RATIO')
    e.pressKey('ONE')
    type(e, '3=4=8=')
    expect(lines(e)[0]).toBe('X=6')
  })
  it('vector cross product', () => {
    const e = engineFor()
    enterMode(e, 'VECTOR')
    e.pressKey('FOUR') // cross
    e.pressKey('ONE') // 3D
    type(e, '1=0=0=0=1=0=')
    expect(lines(e)).toEqual(['VctA×VctB=', '[ 0  0  1 ]'])
  })
})

describe('COMPLEX and BASE-N', () => {
  it('complex multiplication', () => {
    const e = engineFor()
    enterMode(e, 'COMPLEX')
    type(e, '(1+2')
    e.pressKey('IMAG')
    type(e, ')(3-')
    e.pressKey('IMAG')
    type(e, ')=')
    expect(e.getState().result).toBe('5+5i')
  })
  it('BASE-N with HEX radix chosen from OPTN', () => {
    const e = engineFor()
    enterMode(e, 'BASE_N')
    e.pressKey('OPTN')
    e.pressKey('TWO') // HEX
    e.pressKey('ALPHA')
    e.pressKey('NINE') // F
    type(e, '+1=')
    expect(e.getState().result).toBe('10')
  })
})

describe('COMP extras', () => {
  it('S⇔D toggles fraction and decimal', () => {
    const e = engineFor()
    type(e, '1/3=')
    expect(e.getState().result).toBe('1/3')
    e.pressKey('SD')
    expect(e.getState().result).toBe('0.3333333333')
    e.pressKey('SD')
    expect(e.getState().result).toBe('1/3')
  })
  it('SETUP switches to radians', () => {
    const e = engineFor()
    e.pressKey('SHIFT')
    e.pressKey('OPTN') // SETTINGS
    e.pressKey('EQUALS') // Angle Unit
    e.pressKey('TWO') // Radian
    expect(e.getState().settings.angleMode).toBe('RAD')
  })
  it('Fix 2 number format', () => {
    const e = engineFor()
    e.pressKey('SHIFT')
    e.pressKey('OPTN')
    e.pressKey('TWO') // Number Format
    e.pressKey('TWO') // Fix
    e.pressKey('THREE') // Fix 2
    e.pressKey('SQRT')
    type(e, '2)=')
    expect(e.getState().result).toBe('1.41')
  })
  it('integral from the ∫ key', () => {
    const e = engineFor()
    e.pressKey('INTEGRAL')
    e.pressKey('ALPHA')
    e.pressKey('LPAREN')
    e.pressKey('SQUARE')
    type(e, ',0,3)=')
    expect(e.getState().result).toBe('9')
  })
  it('history replay with ▲ restores previous calculation', () => {
    const e = engineFor()
    type(e, '6*7=')
    type(e, '1+1=')
    e.pressKey('ON')
    e.pressKey('NAV_UP')
    expect(e.getState().expression).toBe('1+1')
    e.pressKey('NAV_UP')
    expect(e.getState().expression).toBe('6*7')
  })
  it('mode and form inputs persist through save/load', () => {
    const e = engineFor()
    enterMode(e, 'RATIO')
    e.pressKey('ONE')
    type(e, '3=')
    const restored = engineFor()
    restored.loadState(e.saveState())
    expect(restored.getState().mode).toBe('RATIO')
    expect(lines(restored)[0]).toBe('A=3')
  })
})
