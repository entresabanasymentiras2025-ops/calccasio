/**
 * Capability flags a model declares. The UI and engines read these instead
 * of branching on model id ("if model === 'fx-991cw'") anywhere in the
 * codebase — see /docs/architecture.md §"Capability-driven configuration".
 */
export interface CalculatorCapabilities {
  arithmetic: boolean
  fractions: boolean
  complex: boolean
  matrices: boolean
  vectors: boolean
  statistics: boolean
  calculus: boolean
  equation: boolean
  table: boolean
  baseN: boolean
  ratio: boolean
  distribution: boolean
  spreadsheet: boolean
  graphing: boolean
  programming: boolean
  cas: boolean
  finance: boolean
}

export type EngineId = 'classwiz' | 'classwiz-ex' | 'esplus' | 'ms' | 'graph9860' | 'cg50' | 'cg100' | 'classpad' | 'financial'

export type ImplementationStatus = 'full' | 'partial' | 'planned'

export type CalculatorType = 'scientific' | 'graphing' | 'cas' | 'financial'

export type CalculatorLevel = 'basic' | 'intermediate' | 'advanced'

export interface CalculatorModelConfig {
  id: string
  name: string
  family: string
  familyLabel: string
  engine: EngineId
  type: CalculatorType
  level: CalculatorLevel
  displayProfile: string
  keyboardProfile: string
  regionVariant?: string
  languageProfile?: string
  capabilities: CalculatorCapabilities
  implementationStatus: ImplementationStatus
  tagline: string
  /** Optional finer-grained feature switches within a capability (e.g. FC-200V's BOND mode). */
  features?: string[]
}
