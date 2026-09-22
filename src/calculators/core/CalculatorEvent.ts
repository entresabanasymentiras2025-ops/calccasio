/**
 * The event vocabulary every calculator engine understands. Concrete
 * engines can add family-specific event types (e.g. graphing engines add
 * `PLOT`), but the ones listed here are handled generically by the shared
 * UI layer (keyboard, physical key bindings, touch surface).
 */
export type CalculatorEventType =
  | 'KEY_PRESS'
  | 'KEY_RELEASE'
  | 'SHIFT'
  | 'ALPHA'
  | 'MODE'
  | 'MENU'
  | 'ENTER'
  | 'CLEAR'
  | 'BACKSPACE'
  | 'DELETE'
  | 'NAV_UP'
  | 'NAV_DOWN'
  | 'NAV_LEFT'
  | 'NAV_RIGHT'
  | 'ZOOM_IN'
  | 'ZOOM_OUT'
  | 'TOUCH'
  | 'RESET'

export interface CalculatorEvent {
  type: CalculatorEventType
  /** Key identifier for KEY_PRESS / KEY_RELEASE events (see CalculatorKeyboard). */
  keyId?: string
  /** Arbitrary payload for engine-specific extensions (touch coordinates, etc). */
  payload?: unknown
}

export function keyPress(keyId: string): CalculatorEvent {
  return { type: 'KEY_PRESS', keyId }
}

export function keyRelease(keyId: string): CalculatorEvent {
  return { type: 'KEY_RELEASE', keyId }
}
