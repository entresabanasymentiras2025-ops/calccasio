import type { CalcValue } from '../../math/arithmetic/value'

/**
 * CalcValue uses BigInt for exact rationals, which JSON.stringify cannot
 * serialize on its own. These helpers round-trip state through a
 * plain-JSON-safe shape for localStorage persistence.
 */
export function serializeState(state: unknown): string {
  return JSON.stringify(state, (_key, value) => {
    if (typeof value === 'bigint') return { __bigint__: value.toString() }
    return value
  })
}

export function deserializeState<T>(text: string): T {
  return JSON.parse(text, (_key, value) => {
    if (value && typeof value === 'object' && '__bigint__' in value) {
      return BigInt(value.__bigint__)
    }
    return value
  }) as T
}

export function cloneCalcValue(v: CalcValue): CalcValue {
  return deserializeState<CalcValue>(serializeState(v))
}
