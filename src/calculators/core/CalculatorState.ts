import type { AngleMode } from '../../math/trigonometry/trig'
import type { CalculatorMemory } from './CalculatorMemory'

export type { AngleMode }

export interface MenuItem {
  id: string
  label: string
  action?: string
  children?: MenuItem[]
}

export interface MenuState {
  open: boolean
  path: string[]
  items: MenuItem[]
  selectedIndex: number
}

export function closedMenu(items: MenuItem[] = []): MenuState {
  return { open: false, path: [], items, selectedIndex: 0 }
}

export interface CalculatorSettings {
  angleMode: AngleMode
  displayDigits: number
  fractionDisplay: 'mixed' | 'decimal'
}

export interface CalculatorErrorState {
  code: string
  message: string
}

/**
 * The full, serializable state of one calculator instance. Every concrete
 * engine (ClassWiz, ES PLUS, MS, ...) uses this same envelope so the store
 * and persistence layer stay generic; model-specific extras (e.g. graphState
 * for graphing calculators) are added as optional fields here rather than
 * forcing each engine to invent its own top-level shape.
 */
export interface CalculatorState {
  modelId: string
  mode: string
  /** Text currently being typed/edited (pre-evaluation). */
  expression: string
  /** Formatted text of the last evaluated result, shown on the result line. */
  result: string | null
  cursorPos: number
  shift: boolean
  alpha: boolean
  memory: CalculatorMemory
  menu: MenuState
  settings: CalculatorSettings
  error: CalculatorErrorState | null
}
