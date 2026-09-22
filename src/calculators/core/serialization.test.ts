import { describe, it, expect } from 'vitest'
import { serializeState, deserializeState } from './serialization'
import { rational } from '../../math/arithmetic/value'

describe('state serialization', () => {
  it('round-trips BigInt fields inside CalcValue', () => {
    const state = { value: rational(7n, 3n), nested: { list: [rational(-1n, 2n)] } }
    const text = serializeState(state)
    expect(text).not.toContain('7n')
    const restored = deserializeState<typeof state>(text)
    expect(restored.value).toEqual({ kind: 'rational', num: 7n, den: 3n })
    expect(restored.nested.list[0]).toEqual({ kind: 'rational', num: -1n, den: 2n })
  })
})
