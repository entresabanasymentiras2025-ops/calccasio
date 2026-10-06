import type { CalculatorCapabilities } from '../models/types'

export const CAPABILITY_LABELS: Record<keyof CalculatorCapabilities, string> = {
  arithmetic: 'Arithmetic',
  fractions: 'Fractions',
  complex: 'Complex numbers',
  matrices: 'Matrices',
  vectors: 'Vectors',
  statistics: 'Statistics',
  calculus: 'Calculus',
  equation: 'Equation solver',
  table: 'Table',
  baseN: 'Base-N',
  ratio: 'Ratio',
  distribution: 'Distribution',
  spreadsheet: 'Spreadsheet',
  graphing: 'Graphing',
  programming: 'Programming',
  cas: 'CAS (symbolic algebra)',
  finance: 'Finance',
}
