export interface DisplayIndicator {
  id: string
  label: string
  active: boolean
}

/**
 * Read-only view models the display components render. Engines derive
 * these from their internal state on every change; display components
 * hold no calculator logic. Three shapes exist:
 *
 * - `text`     character LCDs (ClassWiz, ES PLUS, MS, financial)
 * - `screen`   dot-matrix graphing screens drawn on <canvas>
 * - `document` ClassPad-style touch documents with tappable controls
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
  /** Small heading (mode name, menu breadcrumb). */
  title?: string
  /** Line drawn inverted (menu selection, focused form field). */
  highlightLine?: number | null
  /** Default alignment: expression lines left, result lines right. */
  align?: 'left' | 'right' | 'mixed'
}

export interface ScreenLine {
  text: string
  inverted?: boolean
  align?: 'left' | 'right' | 'center'
  color?: string
}

export interface Viewport {
  xmin: number
  xmax: number
  ymin: number
  ymax: number
  xscl: number
  yscl: number
}

export interface GraphCurve {
  label: string
  color: string
  /** Polyline segments in world coordinates (broken at discontinuities). */
  segments: Array<Array<[number, number]>>
}

export type ScreenContent =
  | { type: 'lines'; lines: ScreenLine[]; cursor?: { line: number; col: number } | null }
  | { type: 'icons'; items: Array<{ label: string; icon: string; color?: string; disabled?: boolean }>; selected: number; columns: number }
  | {
      type: 'graph'
      viewport: Viewport
      axes: boolean
      grid: boolean
      curves: GraphCurve[]
      points?: Array<{ x: number; y: number; color: string }>
      cursor?: { x: number; y: number } | null
      info?: string[]
    }
  | { type: 'table'; headers: string[]; rows: string[][]; selectedRow: number; selectedCol?: number; footer?: string }

export interface ScreenProfile {
  id: string
  width: number
  height: number
  color: boolean
  background: string
  foreground: string
}

export interface ScreenDisplayState {
  kind: 'screen'
  profile: ScreenProfile
  statusBar: string
  indicators: DisplayIndicator[]
  content: ScreenContent
  /** Function-key labels shown along the bottom (F1–F6). */
  softkeys?: string[]
  errorMessage: string | null
  /** When set, the UI shows a text editor bound to this buffer (program editor); edits arrive as TEXT_INPUT events. */
  textEntry?: { label: string; value: string }
}

export interface DocumentEntry {
  input: string
  output: string
  error?: boolean
}

export interface DocumentDisplayState {
  kind: 'document'
  app: string
  apps: Array<{ id: string; label: string }>
  /** Tappable toolbar actions for the current app (TOUCH targets). */
  toolbar: Array<{ id: string; label: string; title?: string }>
  entries: DocumentEntry[]
  editing: string
  cursorCol: number
  /** Optional embedded graph (Graph app). */
  graph?: Extract<ScreenContent, { type: 'graph' }>
  indicators: DisplayIndicator[]
  status: string
  errorMessage: string | null
  /** On-screen soft keyboard defined by the engine (tabs + keys); taps arrive as TOUCH events. */
  softKeyboard: { tabs: Array<{ id: string; label: string }>; active: string; keys: Array<{ label: string; target: string }> }
}

export type CalculatorDisplayState = TextDisplayState | ScreenDisplayState | DocumentDisplayState

export function emptyIndicators(ids: string[]): DisplayIndicator[] {
  return ids.map((id) => ({ id, label: id, active: false }))
}
