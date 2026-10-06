import { ScientificEngineBase, type ScientificModeDef, type ScientificProfile } from '../scientific/ScientificEngineBase'
import { financialKeyboardLayout } from './FinancialKeyboard'
import * as FM from './financialModes'
import { statMode } from '../shared/scientificModes'
import type { CalculatorModelConfig } from '../../models/types'
import type { KeyAction } from '../core/CalculatorKeyboard'
import type { FormEnv } from '../shared/FormApplet'
import { formatReal } from '../shared/formatNumber'
import { layoutFor, registerKeyboardLayout } from '../registry'

registerKeyboardLayout(financialKeyboardLayout)

const ALL_MODES: Array<ScientificModeDef & { feature?: string }> = [
  { id: 'COMP', label: 'COMP', capability: null, kind: 'expression' },
  { id: 'SMPL', label: 'SMPL', capability: 'finance', kind: 'form', form: FM.simple },
  { id: 'CMPD', label: 'CMPD', capability: 'finance', kind: 'form', form: FM.compoundInterest },
  { id: 'CASH', label: 'CASH', capability: 'finance', kind: 'form', form: FM.cashFlow },
  { id: 'AMRT', label: 'AMRT', capability: 'finance', kind: 'form', form: FM.amortization },
  { id: 'CNVR', label: 'CNVR', capability: 'finance', kind: 'form', form: FM.conversion },
  { id: 'COST', label: 'COST', capability: 'finance', kind: 'form', form: FM.costSellMargin },
  { id: 'STAT', label: 'STAT', capability: 'statistics', kind: 'form', form: statMode },
  { id: 'DAYS', label: 'DAYS', capability: 'finance', kind: 'form', form: FM.days },
  { id: 'DEPR', label: 'DEPR', capability: 'finance', kind: 'form', form: FM.depreciation, feature: 'depreciation' },
  { id: 'BOND', label: 'BOND', capability: 'finance', kind: 'form', form: FM.bond, feature: 'bond' },
  { id: 'BEVN', label: 'BEVN', capability: 'finance', kind: 'form', form: FM.breakEven, feature: 'breakEven' },
]

/**
 * FinancialEngine (FC-100V / FC-200V). Each financial mode has its own key;
 * values are entered per variable and the highlighted variable is computed
 * with SOLVE (or EXE for modes that produce a result list). Which advanced
 * modes exist (DEPR, BOND, BEVN) comes from the model's `features` list in
 * the catalog — never from model-id checks.
 */
export class FinancialEngine extends ScientificEngineBase {
  private readonly fp: ScientificProfile

  constructor(config: CalculatorModelConfig) {
    super(config, layoutFor(config, financialKeyboardLayout))
    const features = new Set(config.features ?? [])
    this.fp = {
      modeMenuTitle: 'MODE',
      numberedMenus: true,
      displayRows: 4,
      errorText: (code, message) => `${code === 'SyntaxError' ? 'Syntax ERROR' : 'Math ERROR'}\n${message}`,
      modes: ALL_MODES.filter((m) => !m.feature || features.has(m.feature)),
    }
  }

  protected get profile(): ScientificProfile {
    return this.fp
  }

  initialize() {
    const s = super.initialize()
    return { ...s, settings: { ...s.settings, fractionDisplay: 'decimal' as const } }
  }

  protected formEnv(): FormEnv {
    return { ...super.formEnv(), fmt: (x) => formatReal(x, { ...this.state.settings, fractionDisplay: 'decimal' }, 12) }
  }

  protected dispatch(action: KeyAction): void {
    if (action.action?.startsWith('GOTO:')) {
      const id = action.action.slice(5)
      if (this.availableModes().some((m) => m.id === id)) this.switchMode(id)
      else this.state = { ...this.state, error: { code: 'ModeError', message: `${id} is not available on ${this.config.name}` } }
      return
    }
    super.dispatch(action)
  }
}

export const createFinancialEngine = (config: CalculatorModelConfig) => new FinancialEngine(config)
