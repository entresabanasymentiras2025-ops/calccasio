import { describe, it, expect, beforeEach } from 'vitest'
import { ClassWizEngine } from './ClassWizEngine'
import { getCalculatorById } from '../../models/calculatorCatalog'

const config = getCalculatorById('fx-991cw')!

function press(engine: ClassWizEngine, ...keyIds: string[]) {
  for (const id of keyIds) engine.pressKey(id)
}

describe('ClassWizEngine - basic arithmetic', () => {
  let engine: ClassWizEngine
  beforeEach(() => {
    engine = new ClassWizEngine(config)
  })

  it('computes 2 + 2 = 4', () => {
    press(engine, 'TWO', 'PLUS', 'TWO', 'EQUALS')
    expect(engine.getState().result).toBe('4')
  })

  it('shows the expression as it is typed', () => {
    press(engine, 'ONE', 'TWO', 'THREE')
    expect(engine.getState().expression).toBe('123')
  })

  it('backspace removes the last character', () => {
    press(engine, 'ONE', 'TWO', 'THREE', 'DEL')
    expect(engine.getState().expression).toBe('12')
  })

  it('CLEAR (ON) resets the current line but not memory', () => {
    press(engine, 'SEVEN', 'MPLUS', 'ONE', 'TWO', 'ON')
    expect(engine.getState().expression).toBe('')
    const mem = engine.getState().memory.independentMemory
    expect(mem.kind === 'rational' ? mem.num : -1).toBe(7n)
  })

  it('continues from Ans when an operator follows a result', () => {
    press(engine, 'FIVE', 'EQUALS')
    expect(engine.getState().result).toBe('5')
    press(engine, 'PLUS', 'THREE', 'EQUALS')
    expect(engine.getState().result).toBe('8')
  })

  it('starting a new number after a result clears the expression', () => {
    press(engine, 'FIVE', 'EQUALS', 'NINE')
    expect(engine.getState().expression).toBe('9')
  })
})

describe('ClassWizEngine - SHIFT and functions', () => {
  it('SHIFT + sqrt uses cube root', () => {
    const engine = new ClassWizEngine(config)
    press(engine, 'SHIFT', 'SQRT')
    expect(engine.getState().expression).toBe('∛(')
  })

  it('SHIFT is a one-shot modifier that clears after use', () => {
    const engine = new ClassWizEngine(config)
    press(engine, 'SHIFT', 'SQRT')
    expect(engine.getState().shift).toBe(false)
  })

  it('sin(30) = 0.5 in DEG mode', () => {
    const engine = new ClassWizEngine(config)
    press(engine, 'SIN', 'THREE', 'ZERO', 'RPAREN', 'EQUALS')
    expect(engine.getState().result).toBe('0.5')
  })

  it('SHIFT + sin inserts inverse sine', () => {
    const engine = new ClassWizEngine(config)
    press(engine, 'SHIFT', 'SIN')
    expect(engine.getState().expression).toBe('asin(')
  })
})

describe('ClassWizEngine - memory', () => {
  it('M+ adds the result to independent memory, MR recalls it', () => {
    const engine = new ClassWizEngine(config)
    press(engine, 'FIVE', 'EQUALS', 'MPLUS')
    press(engine, 'THREE', 'EQUALS', 'MPLUS')
    press(engine, 'MR', 'EQUALS')
    expect(engine.getState().result).toBe('8')
  })

  it('MC clears independent memory', () => {
    const engine = new ClassWizEngine(config)
    press(engine, 'FIVE', 'MPLUS', 'SHIFT', 'MR')
    const mem = engine.getState().memory.independentMemory
    expect(mem.kind === 'rational' ? mem.num : -1).toBe(0n)
  })

  it('STO then ALPHA+letter stores the result into a variable', () => {
    const engine = new ClassWizEngine(config)
    press(engine, 'SEVEN', 'EQUALS', 'STO', 'ALPHA', 'FOUR') // ALPHA+4 => A
    press(engine, 'ALPHA', 'FOUR', 'EQUALS') // recall A
    expect(engine.getState().result).toBe('7')
  })
})

describe('ClassWizEngine - modes', () => {
  it('MODE opens a menu', () => {
    const engine = new ClassWizEngine(config)
    press(engine, 'MODE')
    expect(engine.getState().menu.open).toBe(true)
  })

  it('selecting COMP mode closes the menu and keeps COMP active', () => {
    const engine = new ClassWizEngine(config)
    press(engine, 'MODE', 'EQUALS')
    expect(engine.getState().menu.open).toBe(false)
    expect(engine.getState().mode).toBe('COMP')
  })

  it('selecting an unimplemented mode shows an error, not a fake mode', () => {
    const engine = new ClassWizEngine(config)
    press(engine, 'MODE', 'NAV_DOWN', 'EQUALS')
    expect(engine.getState().menu.open).toBe(false)
    expect(engine.getState().mode).toBe('COMP')
    expect(engine.getState().error?.code).toBe('ModeError')
  })
})

describe('ClassWizEngine - errors', () => {
  it('division by zero surfaces a MathError', () => {
    const engine = new ClassWizEngine(config)
    press(engine, 'ONE', 'DIVIDE', 'ZERO', 'EQUALS')
    expect(engine.getState().error?.code).toBe('MathError')
    expect(engine.getState().result).toBe(null)
  })
})

describe('ClassWizEngine - persistence', () => {
  it('round-trips state through saveState/loadState', () => {
    const engine = new ClassWizEngine(config)
    press(engine, 'FOUR', 'TWO')
    const saved = engine.saveState()

    const restored = new ClassWizEngine(config)
    restored.loadState(saved)
    expect(restored.getState().expression).toBe('42')
  })
})
