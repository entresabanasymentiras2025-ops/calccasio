import type { ScientificModeDef } from './ScientificEngineBase'
import { statMode, tableMode, equationMode, matrixMode, vectorMode, ratioMode, distributionMode } from '../shared/scientificModes'

/**
 * Building blocks for scientific mode menus. Families pick, order and
 * label these; the engine then filters them by each model's capability
 * flags so e.g. fx-82CW never offers MATRIX.
 */
export const COMP = (label = 'Calculate'): ScientificModeDef => ({ id: 'COMP', label, capability: null, kind: 'expression' })
export const COMPLEX = (label = 'Complex'): ScientificModeDef => ({ id: 'COMPLEX', label, capability: 'complex', kind: 'complex' })
export const BASE_N = (label = 'Base-N'): ScientificModeDef => ({ id: 'BASE_N', label, capability: 'baseN', kind: 'baseN' })
export const STAT = (label = 'Statistics'): ScientificModeDef => ({ id: 'STAT', label, capability: 'statistics', kind: 'form', form: statMode })
export const TABLE = (label = 'Table'): ScientificModeDef => ({ id: 'TABLE', label, capability: 'table', kind: 'form', form: () => tableMode() })
export const EQUATION = (label = 'Equation', maxUnknowns = 4, maxDegree = 4): ScientificModeDef => ({
  id: 'EQUATION',
  label,
  capability: 'equation',
  kind: 'form',
  form: () => equationMode(maxUnknowns, maxDegree),
})
export const MATRIX = (label = 'Matrix'): ScientificModeDef => ({ id: 'MATRIX', label, capability: 'matrices', kind: 'form', form: matrixMode })
export const VECTOR = (label = 'Vector'): ScientificModeDef => ({ id: 'VECTOR', label, capability: 'vectors', kind: 'form', form: vectorMode })
export const RATIO = (label = 'Ratio'): ScientificModeDef => ({ id: 'RATIO', label, capability: 'ratio', kind: 'form', form: ratioMode })
export const DISTRIBUTION = (label = 'Distribution'): ScientificModeDef => ({ id: 'DISTRIBUTION', label, capability: 'distribution', kind: 'form', form: distributionMode })
