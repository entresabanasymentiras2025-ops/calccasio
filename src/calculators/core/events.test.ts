import { describe, it, expect, beforeAll } from 'vitest'
import { createEngine, loadEngine, isEngineAvailable } from '../engineRegistry'
import { calculatorCatalog, getCalculatorById, missingCapabilities } from '../../models/calculatorCatalog'
import { registerCalculator, getKeyboardLayout } from '../registry'
import type { EngineId } from '../../models/types'

const ENGINES: EngineId[] = ['classwiz', 'esplus', 'ms', 'graph9860', 'cg50', 'cg100', 'classpad', 'financial']

beforeAll(async () => {
  await Promise.all(ENGINES.map((e) => loadEngine(e)))
})

describe('engine registry and catalog', () => {
  it('every cataloged model has an engine and can be instantiated', () => {
    for (const config of calculatorCatalog) {
      expect(isEngineAvailable(config.engine)).toBe(true)
      const engine = createEngine(config)
      expect(engine.getDisplay()).toBeTruthy()
      expect(() => engine.loadState(engine.saveState())).not.toThrow()
    }
  })
  it('status is derived from engine support (no advertised feature is fake)', () => {
    for (const c of calculatorCatalog) {
      expect(c.implementationStatus).toBe(missingCapabilities(c).length ? 'partial' : 'full')
    }
    expect(getCalculatorById('fx-82cw')!.implementationStatus).toBe('full')
    expect(getCalculatorById('fx-991cw')!.implementationStatus).toBe('partial') // spreadsheet pending
  })
  it('all MVP model URLs exist', () => {
    for (const id of ['fx-991cw', 'fx-991ex', 'fx-991es-plus', 'fx-991ms', 'fx-9860giii', 'fx-cg50', 'fx-cg100', 'fx-cp400']) expect(getCalculatorById(id)).toBeTruthy()
  })
  it('registerCalculator adds a model through configuration only', () => {
    const base = getCalculatorById('fx-570cw')!
    registerCalculator({ ...base, id: 'fx-test-cw', name: 'fx-TEST CW' })
    const engine = createEngine(getCalculatorById('fx-test-cw')!)
    engine.execute({ type: 'KEY_PRESS', keyId: 'TWO' })
    expect(engine.getState().expression).toBe('2')
    expect(() => registerCalculator({ ...base, id: 'fx-test-cw' })).toThrow()
  })
  it('keyboard layouts are registered by profile id', () => {
    expect(getKeyboardLayout('cg100-standard')?.keys.some((k) => k.id === 'TOOLS')).toBe(true)
  })
})

describe('semantic events', () => {
  it('ENTER / CLEAR / NAV events route to the right key on any model', () => {
    const e = createEngine(getCalculatorById('fx-991es-plus')!)
    e.execute({ type: 'KEY_PRESS', keyId: 'SEVEN' })
    e.execute({ type: 'ENTER' })
    expect(e.getState().result).toBe('7')
    e.execute({ type: 'CLEAR' })
    expect(e.getState().expression).toBe('')
    e.execute({ type: 'MODE' })
    expect(e.getState().menu.open).toBe(true)
    e.execute({ type: 'RESET' })
    expect(e.getState().menu.open).toBe(false)
  })
  it('loadState rejects another model’s state and tolerates old shapes', () => {
    const a = createEngine(getCalculatorById('fx-991cw')!)
    const b = createEngine(getCalculatorById('fx-991ms')!)
    expect(() => b.loadState(a.saveState())).toThrow()
    a.loadState(JSON.stringify({ modelId: 'fx-991cw', expression: '12' }))
    expect(a.getState().expression).toBe('12')
    expect(a.getState().memory.history).toEqual([])
  })
  it('memory is not shared between models', () => {
    const a = createEngine(getCalculatorById('fx-991cw')!)
    const b = createEngine(getCalculatorById('fx-991ex')!)
    a.pressKey('FIVE')
    a.pressKey('MPLUS')
    const mem = b.getState().memory.independentMemory
    expect(mem.kind === 'rational' && mem.num).toBe(0n)
  })
})
