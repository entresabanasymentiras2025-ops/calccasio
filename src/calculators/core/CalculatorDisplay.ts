export interface DisplayIndicator {
  id: string
  label: string
  active: boolean
}

/**
 * A read-only view model the display component renders. Engines derive this
 * from their internal state on every change; the display component itself
 * holds no calculator logic. Text-based scientific calculators use `kind:
 * 'text'`; graphing/CAS engines can extend this with a `'canvas'` variant
 * (see /docs/architecture.md) without touching this shared contract.
 */
export interface TextDisplayState {
  kind: 'text'
  /** Line(s) shown on the LCD, top to bottom (e.g. expression, result). */
  lines: string[]
  /** Cursor position within the currently-edited line, or null when not editing. */
  cursorLine: number | null
  cursorCol: number | null
  indicators: DisplayIndicator[]
  errorMessage: string | null
}

export type CalculatorDisplayState = TextDisplayState

export function emptyIndicators(ids: string[]): DisplayIndicator[] {
  return ids.map((id) => ({ id, label: id, active: false }))
}
