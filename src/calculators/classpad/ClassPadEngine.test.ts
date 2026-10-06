import { describe, it, expect } from 'vitest'
import { ClassPadEngine } from './ClassPadEngine'
import { getCalculatorById } from '../../models/calculatorCatalog'
import type { DocumentDisplayState } from '../core/CalculatorDisplay'

const make = () => new ClassPadEngine(getCalculatorById('fx-cp400')!)
const doc = (e: ClassPadEngine) => e.getDisplay() as DocumentDisplayState
const text = (e: ClassPadEngine, t: string) => e.execute({ type: 'TEXT_INPUT', payload: t })
const touch = (e: ClassPadEngine, target: string) => e.execute({ type: 'TOUCH', payload: { target } })

describe('ClassPadEngine', () => {
  it('evaluates CAS input from the text field', () => {
    const e = make()
    text(e, 'factor(x^2-5x+6)')
    e.pressKey('EXE')
    expect(doc(e).entries.at(-1)).toEqual({ input: 'factor(x^2-5x+6)', output: '(x-2)(x-3)' })
  })
  it('toolbar commands wrap the current input', () => {
    const e = make()
    text(e, '(x+1)^2')
    touch(e, 'tool:expand')
    expect(doc(e).entries.at(-1)?.output).toBe('x^2+2x+1')
  })
  it('soft keyboard and hardware keys insert text', () => {
    const e = make()
    touch(e, 'tab:calc')
    touch(e, 'insert:diff(')
    e.pressKey('X')
    e.pressKey('POWER')
    e.pressKey('THREE')
    e.pressKey('RPAREN')
    e.pressKey('EXE')
    expect(doc(e).entries.at(-1)?.output).toBe('3x^2')
  })
  it('errors are shown in the work area, not thrown', () => {
    const e = make()
    text(e, '2+*3')
    e.pressKey('EXE')
    expect(doc(e).entries.at(-1)?.error).toBe(true)
  })
  it('graph app adds functions and plots them', () => {
    const e = make()
    touch(e, 'app:graph')
    text(e, 'x^3')
    e.pressKey('EXE')
    const d = doc(e)
    expect(d.graph?.curves.map((c) => c.label)).toEqual(['y1', 'y2', 'y3'])
    touch(e, 'graph:zin')
    expect(doc(e).graph?.viewport.xmax).toBeCloseTo(3.15)
  })
  it('variables persist through save/load', () => {
    const e = make()
    text(e, 'a:=5')
    e.pressKey('EXE')
    const r = make()
    r.loadState(e.saveState())
    text(r, 'a^2')
    r.pressKey('EXE')
    expect(doc(r).entries.at(-1)?.output).toBe('25')
  })
})
