import type { AngleMode } from '../../math/trigonometry/trig'
import type { CalculatorMemory } from './CalculatorMemory'

export type { AngleMode }

export interface MenuItem {
  id: string
  label: string
  action?: string
  children?: MenuItem[]
  /** Short icon glyph for icon-grid menus (graphing MAIN MENU, ClassWiz HOME). */
  icon?: string
  disabled?: boolean
}

export interface MenuLevel {
  items: MenuItem[]
  selectedIndex: number
  title: string
}

export interface MenuState {
  open: boolean
  /** Breadcrumb of titles, root first. */
  path: string[]
  items: MenuItem[]
  selectedIndex: number
  /** Parent levels for submenu navigation (see core/Menu.ts). */
  stack?: MenuLevel[]
  /** >1 renders as an icon grid with 2D navigation. */
  columns?: number
}

export function closedMenu(items: MenuItem[] = []): MenuState {
  return { open: false, path: [], items, selectedIndex: 0, stack: [] }
}

export interface CalculatorSettings {
  angleMode: AngleMode
  displayDigits: number
  /** How exact rational results are shown: mixed (a b/c), improper (d/c) or always decimal. */
  fractionDisplay: 'mixed' | 'improper' | 'decimal'
  /** Number format: Norm (auto), Fix n decimals, Sci n significant digits. */
  numberFormat?: { kind: 'norm' } | { kind: 'fix'; digits: number } | { kind: 'sci'; digits: number }
  complexFormat?: 'rect' | 'polar'
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
  /** Serializable per-mode sub-state (form applets, BASE-N radix, statistics editor...). */
  modeState?: Record<string, unknown>
  /** Graphing calculators: viewport, function list, current app. */
  graphState?: Record<string, unknown>
  /** CAS/ClassPad: document with input/output lines. */
  documentState?: Record<string, unknown>
}
