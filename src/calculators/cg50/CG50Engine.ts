import { GraphingEngineBase, type GraphingProfile } from '../graphing/GraphingEngineBase'
import { fkeyGraphingKeyboard } from '../graphing/fkeyKeyboard'
import { getDisplayProfile, layoutFor, registerKeyboardLayout } from '../registry'
import type { CalculatorModelConfig } from '../../models/types'

const keyboard = fkeyGraphingKeyboard('cg50-standard', 'fx-CG50 family')
registerKeyboardLayout(keyboard)

/**
 * Colour 384×216 graphing calculator (fx-CG50 / fx-CG50 AU / GRAPH90+ E).
 * Shares the generic graphing infrastructure but has its own colour
 * screen profile, per-function curve colours and app catalogue.
 */
export class CG50Engine extends GraphingEngineBase {
  private readonly p: GraphingProfile = {
    screen: getDisplayProfile('cg50')!,
    menuTitle: 'Main Menu',
    menuColumns: 4,
    softkeyMode: 'fkeys',
    rows: 6,
    curveColors: ['#1d4ed8', '#dc2626', '#16a34a', '#c026d3', '#111827', '#0891b2'],
    errorText: (code, message) => `${code.replace('Error', ' ERROR')}\n${message}`,
    apps: [
      { id: 'RUN', label: 'Run-Matrix', icon: '×÷', color: '#e0e7ff', kind: 'run' },
      { id: 'STAT', label: 'Statistics', icon: '▥', color: '#dcfce7', kind: 'stat' },
      { id: 'GRAPH', label: 'Graph', icon: '∿', color: '#fee2e2', kind: 'graph' },
      { id: 'TABLE', label: 'Table', icon: '▦', color: '#fef9c3', kind: 'table' },
      { id: 'EQUA', label: 'Equation', icon: 'x=', color: '#f3e8ff', kind: 'equa' },
      { id: 'PRGM', label: 'Program', icon: '{ }', color: '#e0f2fe', kind: 'prgm' },
      { id: 'MAT', label: 'Matrix', icon: '[ ]', color: '#ffedd5', kind: 'matrix' },
      { id: 'GEOM', label: 'Geometry', icon: '△', color: '#f1f5f9', kind: null, planned: true },
      { id: 'PICT', label: 'Picture Plot', icon: '▣', color: '#f1f5f9', kind: null, planned: true },
      { id: '3D', label: '3D Graph', icon: '⬡', color: '#f1f5f9', kind: null, planned: true },
      { id: 'PYTHON', label: 'Python', icon: 'Py', color: '#f1f5f9', kind: null, planned: true },
    ],
  }

  constructor(config: CalculatorModelConfig) {
    super(config, layoutFor(config, keyboard))
  }

  protected get profile(): GraphingProfile {
    return this.p
  }
}

export const createCG50Engine = (config: CalculatorModelConfig) => new CG50Engine(config)
