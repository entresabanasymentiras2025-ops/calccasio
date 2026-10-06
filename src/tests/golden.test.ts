import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createEngine, loadEngine } from '../calculators/engineRegistry'
import { getCalculatorById } from '../models/calculatorCatalog'
import { evaluateCas } from '../math/symbolic/cas'
import { solveTvm, type TvmInput, type TvmVariable } from '../math/finance/tvm'

/**
 * Golden files (tests/golden/*.json) pin expected calculator output for
 * many inputs. Expressions are fed through the real engines (not just the
 * math layer) so formatting and error mapping are covered too.
 */
interface Case {
  input: string
  expected?: string
  error?: string
}
const golden = <T,>(name: string): T[] => JSON.parse(readFileSync(resolve(__dirname, '../../tests/golden', name), 'utf8'))

beforeAll(async () => {
  await Promise.all([loadEngine('classwiz'), loadEngine('esplus'), loadEngine('ms')])
})

function runOn(modelId: string, input: string) {
  const engine = createEngine(getCalculatorById(modelId)!)
  engine.setState({ ...engine.getState(), expression: input, cursorPos: input.length })
  engine.execute({ type: 'ENTER' })
  return engine.getState()
}

for (const [file, model] of [
  ['classwiz.json', 'fx-991cw'],
  ['esplus.json', 'fx-991es-plus'],
  ['ms.json', 'fx-991ms'],
] as const) {
  describe(`golden ${file} on ${model}`, () => {
    for (const c of golden<Case>(file)) {
      it(`${c.input} → ${c.expected ?? c.error}`, () => {
        const s = runOn(model, c.input)
        if (c.error) expect(s.error?.code).toBe(c.error)
        else {
          expect(s.error).toBeNull()
          expect(s.result).toBe(c.expected)
        }
      })
    }
  })
}

describe('golden cas.json', () => {
  for (const c of golden<Case>('cas.json')) {
    it(`${c.input} → ${c.expected}`, () => expect(evaluateCas(c.input, { variables: {}, ans: null }).output).toBe(c.expected))
  }
})

describe('golden financial.json', () => {
  for (const c of golden<{ input: TvmInput; solve: TvmVariable; expected: number }>('financial.json')) {
    it(`TVM solve ${c.solve}`, () => expect(solveTvm(c.input, c.solve)).toBeCloseTo(c.expected, 5))
  }
})
