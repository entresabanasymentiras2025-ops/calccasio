import { ScientificEngineBase, type ScientificModeDef, type ScientificProfile } from '../scientific/ScientificEngineBase'
import * as Modes from '../scientific/modeCatalog'
import { classWizKeyboard, type ClassWizVariant } from './ClassWizKeyboard'
import type { CalculatorModelConfig } from '../../models/types'

export type ClassWizState = ReturnType<ScientificEngineBase['getState']>

/** Modes that exist on the real hardware family but are not implemented here yet. */
const PLANNED: Record<string, string> = {
  SPREADSHEET: 'Spreadsheet',
  INEQUALITY: 'Inequality',
}

function variantOf(config: CalculatorModelConfig): ClassWizVariant {
  return config.family === 'classwiz-ex' ? 'ex' : 'cw'
}

/**
 * ClassWiz engine (CW and EX generations). Both generations share the
 * natural-display interaction model and the same mode set, so one engine
 * serves them; what differs (key names, mode-menu naming/order) comes from
 * the variant. Mode availability is driven entirely by the model's
 * capability flags from calculatorCatalog.ts.
 */
export class ClassWizEngine extends ScientificEngineBase {
  private readonly variant: ClassWizVariant
  private readonly classWizProfile: ScientificProfile

  constructor(config: CalculatorModelConfig) {
    const variant = variantOf(config)
    super(config, classWizKeyboard(variant))
    this.variant = variant
    const cwOrder: ScientificModeDef[] = [
      Modes.COMP('Calculate'),
      Modes.STAT('Statistics'),
      Modes.DISTRIBUTION('Distribution'),
      Modes.TABLE('Table'),
      Modes.EQUATION('Equation'),
      Modes.COMPLEX('Complex'),
      Modes.BASE_N('Base-N'),
      Modes.MATRIX('Matrix'),
      Modes.VECTOR('Vector'),
      Modes.RATIO('Ratio'),
    ]
    const exOrder: ScientificModeDef[] = [
      Modes.COMP('Calculate'),
      Modes.COMPLEX('Complex'),
      Modes.BASE_N('Base-N'),
      Modes.MATRIX('Matrix'),
      Modes.VECTOR('Vector'),
      Modes.STAT('Statistics'),
      Modes.DISTRIBUTION('Distribution'),
      Modes.TABLE('Table'),
      Modes.EQUATION('Equation/Func'),
      Modes.RATIO('Ratio'),
    ]
    this.classWizProfile = {
      modeMenuTitle: variant === 'cw' ? 'HOME' : 'MENU',
      numberedMenus: false,
      displayRows: 4,
      errorText: (code, message) => `${code.replace('Error', ' ERROR')}\n${message}`,
      modes: variant === 'cw' ? cwOrder : exOrder,
    }
  }

  protected get profile(): ScientificProfile {
    return this.classWizProfile
  }

  get generation(): ClassWizVariant {
    return this.variant
  }

  protected openModeMenu(): void {
    super.openModeMenu()
    const planned = Object.entries(PLANNED)
      .filter(([id]) => (id === 'SPREADSHEET' ? this.config.capabilities.spreadsheet : this.config.capabilities.equation))
      .map(([id, label]) => ({ id, label: `${label} (coming soon)`, action: `planned:${id}` }))
    this.state = { ...this.state, menu: { ...this.state.menu, items: [...this.state.menu.items, ...planned] } }
  }

  protected performMenuAction(action: string): void {
    if (action.startsWith('planned:')) {
      const label = PLANNED[action.slice('planned:'.length)] ?? 'This'
      this.state = { ...this.state, error: { code: 'ModeError', message: `${label} mode is not implemented yet in this build.` } }
      return
    }
    super.performMenuAction(action)
  }
}

export const createClassWizEngine = (config: CalculatorModelConfig) => new ClassWizEngine(config)
