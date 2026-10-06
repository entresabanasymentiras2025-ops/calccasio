import { describe, it, expect } from 'vitest'
import { FinancialEngine } from './FinancialEngine'
import { getCalculatorById } from '../../models/calculatorCatalog'
import type { TextDisplayState } from '../core/CalculatorDisplay'

const K: Record<string, string> = { '0': 'ZERO', '1': 'ONE', '2': 'TWO', '3': 'THREE', '4': 'FOUR', '5': 'FIVE', '6': 'SIX', '7': 'SEVEN', '8': 'EIGHT', '9': 'NINE', '+': 'PLUS', '-': 'DATESEP', '*': 'MULTIPLY', '/': 'DIVIDE', '.': 'DOT', ',': 'COMMA' }
const make = (id = 'fc-200v') => new FinancialEngine(getCalculatorById(id)!)
const type = (e: FinancialEngine, s: string) => [...s].forEach((c) => e.pressKey(K[c]))
const lines = (e: FinancialEngine) => (e.getDisplay() as TextDisplayState).lines

function setField(e: FinancialEngine, label: string, value: string) {
  for (let i = 0; i < 12 && !lines(e).some((l, idx) => l.startsWith(`${label}=`) && (e.getDisplay() as TextDisplayState).highlightLine === idx); i++) e.pressKey('NAV_DOWN')
  if (value.startsWith('-')) {
    e.pressKey('NEGATE')
    value = value.slice(1)
  }
  type(e, value)
  e.pressKey('NAV_DOWN')
  e.pressKey('NAV_UP')
}

describe('FinancialEngine', () => {
  it('CMPD: SOLVE PMT for a 30-year mortgage', () => {
    const e = make()
    e.pressKey('M_CMPD')
    setField(e, 'n', '360')
    setField(e, 'I%', '6')
    setField(e, 'PV', '200000')
    setField(e, 'PMT', '')
    e.pressKey('SOLVE')
    const pmt = lines(e).find((l) => l.startsWith('PMT='))
    expect(pmt).toBe('PMT=-1199.10105031')
  })
  it('SMPL: simple interest', () => {
    const e = make()
    e.pressKey('M_SMPL')
    e.pressKey('NAV_DOWN')
    type(e, '120')
    e.pressKey('EXE')
    type(e, '7')
    e.pressKey('EXE')
    e.pressKey('NEGATE')
    type(e, '1000')
    e.pressKey('EXE')
    expect(lines(e)[0]).toBe('SI=23.0136986301')
  })
  it('DAYS: SOLVE days between two dates', () => {
    const e = make()
    e.pressKey('M_DAYS')
    e.pressKey('NAV_DOWN')
    e.pressKey('NAV_DOWN')
    e.pressKey('SOLVE')
    expect(lines(e)).toContain('Dys=364')
  })
  it('CASH: NPV and IRR', () => {
    const e = make()
    e.pressKey('M_CASH')
    type(e, '10')
    e.pressKey('EXE')
    e.pressKey('NEGATE')
    type(e, '100,60,60')
    e.pressKey('EXE')
    expect(lines(e)[0]).toBe('NPV=4.13223140496')
    expect(lines(e)[1]).toMatch(/^IRR=13\.0662/)
  })
  it('FC-100V does not have BOND (feature-driven, not id-driven)', () => {
    const e = make('fc-100v')
    expect(e.availableModes().map((m) => m.id)).not.toContain('BOND')
    e.pressKey('M_BOND')
    expect((e.getDisplay() as TextDisplayState).errorMessage).toMatch(/not available/)
    expect(make('fc-200v').availableModes().map((m) => m.id)).toContain('BOND')
  })
  it('COMP mode does arithmetic', () => {
    const e = make()
    e.pressKey('SHIFT')
    e.pressKey('M_SMPL') // COMP
    type(e, '2*21')
    e.pressKey('EXE')
    expect(e.getState().result).toBe('42')
  })
})
