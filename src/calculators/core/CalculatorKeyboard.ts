/**
 * Declarative description of a physical key. The UI renders these; it never
 * hardcodes per-model button layouts in React components. `primary` is what
 * pressing the key alone does; `shift`/`alpha` are the secondary functions
 * printed above the key on real hardware, activated via the SHIFT/ALPHA
 * modifier keys.
 */
export interface KeyAction {
  /** Text inserted into the expression, or a semantic action id (e.g. "CLEAR"). */
  insert?: string
  /** A CalculatorEventType to dispatch instead of inserting text. */
  action?: string
  label: string
}

export interface KeyDefinition {
  id: string
  row: number
  col: number
  /** Column/row span for visually larger keys (e.g. "=" spanning 2 columns). */
  colSpan?: number
  primary: KeyAction
  shift?: KeyAction
  alpha?: KeyAction
  /** Visual styling hint: 'number' | 'operator' | 'function' | 'control' | 'modifier'. */
  variant?: 'number' | 'operator' | 'function' | 'control' | 'modifier'
  tooltip?: string
  /** Physical keyboard key(s) that trigger this button, e.g. ["Enter"], ["+"]. */
  physicalKeys?: string[]
}

export interface KeyboardLayout {
  id: string
  name: string
  columns: number
  rows: number
  keys: KeyDefinition[]
}

export function findKeyByPhysicalKey(layout: KeyboardLayout, physicalKey: string): KeyDefinition | undefined {
  return layout.keys.find((k) => k.physicalKeys?.includes(physicalKey))
}

export function resolveKeyAction(key: KeyDefinition, shift: boolean, alpha: boolean): KeyAction {
  if (alpha && key.alpha) return key.alpha
  if (shift && key.shift) return key.shift
  return key.primary
}
