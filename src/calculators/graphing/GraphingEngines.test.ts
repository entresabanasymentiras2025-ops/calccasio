import { describe, it, expect } from 'vitest'
import { Graph9860Engine } from '../graph9860/Graph9860Engine'
import { CG50Engine } from '../cg50/CG50Engine'
import { CG100Engine } from '../cg100/CG100Engine'
import { getCalculatorById } from '../../models/calculatorCatalog'
import type { ScreenDisplayState, ScreenContent } from '../core/CalculatorDisplay'
import type { GraphingEngineBase } from './GraphingEngineBase'

const D: Record<string, string> = { '0': 'ZERO', '1': 'ONE', '2': 'TWO', '3': 'THREE', '4': 'FOUR', '5': 'FIVE', '6': 'SIX', '7': 'SEVEN', '8': 'EIGHT', '9': 'NINE', '+': 'PLUS', '-': 'MINUS', '*': 'MULTIPLY', '/': 'DIVIDE', '.': 'DOT', ',': 'COMMA' }
const type = (e: GraphingEngineBase, s: string) => [...s].forEach((c) => e.pressKey(D[c]))
const screen = (e: GraphingEngineBase) => e.getDisplay() as ScreenDisplayState
const lines = (c: ScreenContent) => (c.type === 'lines' ? c.lines.map((l) => l.text) : [])

function g9860() {
  return new Graph9860Engine(getCalculatorById('fx-9860giii')!)
}

describe('Graph9860Engine', () => {
  it('starts on the icon MAIN MENU and opens RUN with a digit', () => {
    const e = g9860()
    expect(screen(e).content.type).toBe('icons')
    e.pressKey('ONE')
    expect(e.getState().mode).toBe('RUN')
    type(e, '2+3')
    e.pressKey('EXE')
    expect(lines(screen(e).content)).toEqual(['2+3', '5', ''])
  })
  it('stores with → and recalls', () => {
    const e = g9860()
    e.pressKey('ONE')
    type(e, '7')
    e.pressKey('STO')
    e.pressKey('ALPHA')
    e.pressKey('XVAR') // A
    e.pressKey('EXE')
    e.pressKey('ALPHA')
    e.pressKey('XVAR')
    type(e, '*2')
    e.pressKey('EXE')
    expect(lines(screen(e).content).slice(-2)[0]).toBe('14')
  })
  it('draws graphs and finds a root with G-SOLV', () => {
    const e = g9860()
    e.pressKey('THREE') // GRAPH
    expect(screen(e).softkeys).toContain('DRAW')
    e.pressKey('F6') // DRAW (Y1=X²-2, Y2=sin X)
    const c = screen(e).content
    expect(c.type).toBe('graph')
    if (c.type === 'graph') expect(c.curves.map((x) => x.label)).toEqual(['Y1', 'Y2'])
    e.pressKey('F5') // G-SOLV
    e.pressKey('F1') // ROOT
    const c2 = screen(e).content
    expect(c2.type === 'graph' && c2.info?.[1]).toBe('X=-1.414213562')
  })
  it('trace moves along the curve and zoom changes the viewport', () => {
    const e = g9860()
    e.pressKey('THREE')
    e.pressKey('F6')
    e.pressKey('F1') // TRACE
    e.pressKey('NAV_RIGHT')
    const c = screen(e).content
    expect(c.type === 'graph' && c.cursor).toBeTruthy()
    e.pressKey('EXIT')
    e.pressKey('ZOOMIN')
    const c2 = screen(e).content
    expect(c2.type === 'graph' && c2.viewport.xmax).toBeCloseTo(3.15)
  })
  it('edits a function in the list', () => {
    const e = g9860()
    e.pressKey('THREE')
    e.pressKey('NAV_DOWN')
    e.pressKey('NAV_DOWN') // Y3
    e.pressKey('XVAR')
    type(e, '+1')
    e.pressKey('EXE')
    expect(lines(screen(e).content)[2]).toBe('■Y3=X+1')
  })
  it('TABLE app tabulates selected functions', () => {
    const e = g9860()
    e.pressKey('FOUR')
    e.pressKey('F6')
    const c = screen(e).content
    expect(c.type).toBe('table')
    if (c.type === 'table') expect(c.rows[3].slice(0, 2)).toEqual(['0', '-2'])
  })
  it('STAT list editor + 1-VAR', () => {
    const e = g9860()
    e.pressKey('TWO')
    for (const v of ['2', '4', '6']) {
      type(e, v)
      e.pressKey('EXE')
    }
    e.pressKey('F2')
    e.pressKey('F1')
    expect(lines(screen(e).content)[0]).toBe('x̄=4')
  })
  it('EQUA solves a quadratic', () => {
    const e = g9860()
    e.pressKey('FIVE')
    e.pressKey('TWO')
    e.pressKey('ONE')
    type(e, '1')
    e.pressKey('EXE')
    e.pressKey('NEGATE')
    type(e, '5')
    e.pressKey('EXE')
    type(e, '6')
    e.pressKey('EXE')
    expect(lines(screen(e).content).slice(1, 3)).toEqual(['x1=3', 'x2=2'])
  })
  it('PRGM runs a program that asks for INPUT', () => {
    const e = g9860()
    e.pressKey('SIX')
    e.pressKey('F1') // EXE SUMSQ
    expect(lines(screen(e).content).at(-1)).toBe('N ')
    type(e, '3')
    e.pressKey('EXE')
    expect(lines(screen(e).content)).toEqual(['N 3', 'SUM= 14', '- Done -'])
  })
  it('PRGM editor accepts TEXT_INPUT and runs the new code', () => {
    const e = g9860()
    e.pressKey('SIX')
    e.pressKey('F3') // NEW
    expect(screen(e).textEntry).toBeTruthy()
    e.execute({ type: 'TEXT_INPUT', payload: 'FOR I=1 TO 3\nPRINT I*I\nNEXT' })
    e.pressKey('EXIT')
    e.pressKey('F1')
    expect(lines(screen(e).content)).toEqual(['1', '4', '9', '- Done -'])
  })
  it('planned apps show "coming soon" rather than a fake app', () => {
    const e = g9860()
    e.pressKey('NINE')
    expect(screen(e).errorMessage).toMatch(/coming soon/)
  })
  it('persists the graph state', () => {
    const e = g9860()
    e.pressKey('THREE')
    e.pressKey('F6')
    e.pressKey('ZOOMIN')
    const r = g9860()
    r.loadState(e.saveState())
    const c = screen(r).content
    expect(c.type === 'graph' && c.viewport.xmax).toBeCloseTo(3.15)
  })
})

describe('CG50 and CG100 differ from the 9860', () => {
  it('CG50 uses a colour 384×216 screen with coloured curves', () => {
    const e = new CG50Engine(getCalculatorById('fx-cg50')!)
    expect(screen(e).profile).toMatchObject({ width: 384, height: 216, color: true })
    e.pressKey('THREE')
    e.pressKey('F6')
    const c = screen(e).content
    expect(c.type === 'graph' && c.curves[1].color).toBe('#dc2626')
  })
  it('CG100 has no F-keys and exposes commands through TOOLS', () => {
    const e = new CG100Engine(getCalculatorById('fx-cg100')!)
    expect(e.keyboardLayout.keys.some((k) => k.id === 'F1')).toBe(false)
    e.pressKey('THREE') // Graph&Table
    expect(screen(e).softkeys).toBeUndefined()
    e.pressKey('TOOLS')
    const items = lines(screen(e).content)
    expect(items.join(' ')).toMatch(/DRAW/)
    expect(items.join(' ')).toMatch(/TABLE/)
  })
})
