import { ScientificEngineBase, type ScientificProfile } from '../scientific/ScientificEngineBase'
import * as Modes from '../scientific/modeCatalog'
import { esPlusKeyboardLayout } from './ESPlusKeyboard'
import type { CalculatorModelConfig } from '../../models/types'

/** Error codes as the ES PLUS family words them on its two-line LCD. */
export function esPlusErrorText(code: string, message: string): string {
  const head: Record<string, string> = {
    SyntaxError: 'Syntax ERROR',
    MathError: 'Math ERROR',
    DomainError: 'Math ERROR',
    OverflowError: 'Math ERROR',
    DimensionError: 'Dimension ERROR',
    MemoryError: 'Stack ERROR',
    ModeError: 'Argument ERROR',
    InputError: 'Argument ERROR',
  }
  return `${head[code] ?? 'Math ERROR'}\n${message}`
}

/**
 * ES PLUS engine. Independent of ClassWiz: numbered MODE list selected with
 * digit keys (1:COMP 2:CMPLX ...), SETUP via SHIFT+MODE, SOLVE on the CALC
 * key, fraction key syntax (a⌟b), RCL/STO, hyp menu and its own error
 * vocabulary. Polynomial EQN is limited to degree 3 and simultaneous EQN to
 * 3 unknowns, matching the family's published capability tier.
 */
export class ESPlusEngine extends ScientificEngineBase {
  private readonly esProfile: ScientificProfile = {
    modeMenuTitle: 'MODE',
    numberedMenus: true,
    displayRows: 2,
    errorText: esPlusErrorText,
    modes: [
      Modes.COMP('COMP'),
      Modes.COMPLEX('CMPLX'),
      Modes.STAT('STAT'),
      Modes.BASE_N('BASE-N'),
      Modes.EQUATION('EQN', 3, 3),
      Modes.MATRIX('MATRIX'),
      Modes.TABLE('TABLE'),
      Modes.VECTOR('VECTOR'),
    ],
  }

  constructor(config: CalculatorModelConfig) {
    super(config, esPlusKeyboardLayout)
  }

  protected get profile(): ScientificProfile {
    return this.esProfile
  }
}

export const createESPlusEngine = (config: CalculatorModelConfig) => new ESPlusEngine(config)
