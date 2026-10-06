import { GraphingEngineBase, type GraphingProfile } from '../graphing/GraphingEngineBase'
import { fkeyGraphingKeyboard } from '../graphing/fkeyKeyboard'
import { getDisplayProfile, layoutFor, registerKeyboardLayout } from '../registry'
import type { CalculatorModelConfig } from '../../models/types'

const keyboard = fkeyGraphingKeyboard('graph9860-standard', 'fx-9860 family')
registerKeyboardLayout(keyboard)

/**
 * Monochrome 128×64 graphing calculator (fx-9750GIII / fx-9860GIII /
 * GRAPH35+ E II). Icon MAIN MENU with digit shortcuts, F-key soft
 * commands, single-colour plotting.
 */
export class Graph9860Engine extends GraphingEngineBase {
  private readonly p: GraphingProfile = {
    screen: getDisplayProfile('graph9860')!,
    menuTitle: 'MAIN MENU',
    menuColumns: 4,
    softkeyMode: 'fkeys',
    rows: 6,
    curveColors: ['#000', '#000', '#000', '#000', '#000', '#000'],
    errorText: (code, message) => `${code.replace('Error', ' ERROR')}\n${message}`,
    apps: [
      { id: 'RUN', label: 'RUN-MAT', icon: '×÷', color: '', kind: 'run' },
      { id: 'STAT', label: 'STAT', icon: '▥', color: '', kind: 'stat' },
      { id: 'GRAPH', label: 'GRAPH', icon: '∿', color: '', kind: 'graph' },
      { id: 'TABLE', label: 'TABLE', icon: '▦', color: '', kind: 'table' },
      { id: 'EQUA', label: 'EQUA', icon: 'x=', color: '', kind: 'equa' },
      { id: 'PRGM', label: 'PRGM', icon: '{ }', color: '', kind: 'prgm' },
      { id: 'MAT', label: 'MATRIX', icon: '[ ]', color: '', kind: 'matrix' },
      { id: 'CONICS', label: 'CONICS', icon: '◯', color: '', kind: null, planned: true },
      { id: 'PYTHON', label: 'PYTHON', icon: 'Py', color: '', kind: null, planned: true },
    ],
  }

  constructor(config: CalculatorModelConfig) {
    super(config, layoutFor(config, keyboard))
  }

  protected get profile(): GraphingProfile {
    return this.p
  }
}

export const createGraph9860Engine = (config: CalculatorModelConfig) => new Graph9860Engine(config)
