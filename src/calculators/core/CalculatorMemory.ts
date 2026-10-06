import type { CalcValue } from '../../math/arithmetic/value'

export interface HistoryEntry {
  id: string
  input: string
  result: string
  timestamp: number
  /** Mode the calculation was made in (history replay is per-mode). */
  mode?: string
}

export interface CalculatorMemory {
  /** Named variables (A-F, X, Y, M, ...), each calculator model keeps its own map. */
  variables: Record<string, CalcValue>
  /** Last computed result, referenced by the "Ans" identifier. */
  ans: CalcValue
  /** Independent accumulator memory (the M+ / M- / MR / MC keys). */
  independentMemory: CalcValue
  history: HistoryEntry[]
}

export function createHistoryEntry(input: string, result: string): HistoryEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    input,
    result,
    timestamp: Date.now(),
  }
}
