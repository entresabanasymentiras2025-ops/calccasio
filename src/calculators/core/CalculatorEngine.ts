import type { CalculatorEvent } from './CalculatorEvent'
import type { CalculatorState } from './CalculatorState'
import type { CalculatorDisplayState } from './CalculatorDisplay'
import type { CalculatorMemory } from './CalculatorMemory'
import type { KeyboardLayout } from './CalculatorKeyboard'
import { serializeState, deserializeState } from './serialization'

/**
 * The contract every calculator engine implements. This interface has no
 * dependency on React: the math and state-machine logic must be fully
 * testable by calling these methods directly (see
 * src/calculators/classwiz/ClassWizEngine.test.ts for an example). React
 * components only ever call these methods and re-render from getDisplay()/
 * getState() — they never reach into engine internals.
 */
export interface CalculatorEngine<TState extends CalculatorState = CalculatorState> {
  readonly modelId: string
  readonly keyboardLayout: KeyboardLayout
  initialize(): TState
  pressKey(keyId: string): void
  releaseKey(keyId: string): void
  execute(event: CalculatorEvent): void
  reset(): void
  getState(): TState
  setState(state: TState): void
  getDisplay(): CalculatorDisplayState
  getMemory(): CalculatorMemory
  saveState(): string
  loadState(serialized: string): void
  /** Registers a listener invoked after any state change; returns an unsubscribe function. */
  subscribe(listener: () => void): () => void
}

/**
 * Shared plumbing (subscriptions, generic KEY_PRESS routing, persistence)
 * so concrete engines only need to implement the model-specific pieces:
 * initialize() and handleKeyAction(). Kept intentionally thin — the state
 * machine logic itself lives in each family's engine, not here, per
 * /docs/architecture.md (MS must not be forced to behave like ClassWiz).
 */
export abstract class BaseCalculatorEngine<TState extends CalculatorState> implements CalculatorEngine<TState> {
  readonly modelId: string
  readonly keyboardLayout: KeyboardLayout
  protected state: TState
  private listeners = new Set<() => void>()

  constructor(modelId: string, keyboardLayout: KeyboardLayout) {
    this.modelId = modelId
    this.keyboardLayout = keyboardLayout
    this.state = this.initialize()
  }

  abstract initialize(): TState
  protected abstract handleKeyId(keyId: string): void
  abstract getDisplay(): CalculatorDisplayState

  pressKey(keyId: string): void {
    this.handleKeyId(keyId)
    this.notify()
  }

  releaseKey(_keyId: string): void {
    // Visual-only for most engines; overridden by engines that need key-up behavior.
  }

  /**
   * Generic event dispatch. KEY_PRESS/KEY_RELEASE carry a key id; semantic
   * events (ENTER, CLEAR, NAV_UP, SHIFT, MODE, ...) are routed to whichever
   * key on this model's layout performs that action, so callers never need
   * to know a model's key ids. Engines override this for TOUCH/TEXT_INPUT.
   */
  execute(event: CalculatorEvent): void {
    if (event.type === 'KEY_PRESS' && event.keyId) {
      this.pressKey(event.keyId)
      return
    }
    if (event.type === 'KEY_RELEASE' && event.keyId) {
      this.releaseKey(event.keyId)
      return
    }
    if (event.type === 'RESET') {
      this.reset()
      return
    }
    const actionFor: Partial<Record<CalculatorEvent['type'], string>> = { BACKSPACE: 'BACKSPACE', DELETE: 'DELETE', MENU: 'MENU' }
    const action = actionFor[event.type] ?? event.type
    const key = this.keyboardLayout.keys.find((k) => k.primary.action === action) ?? this.keyboardLayout.keys.find((k) => k.shift?.action === action)
    if (key && key.primary.action === action) this.pressKey(key.id)
  }

  reset(): void {
    this.state = this.initialize()
    this.notify()
  }

  getState(): TState {
    return this.state
  }

  setState(state: TState): void {
    this.state = state
    this.notify()
  }

  getMemory() {
    return this.state.memory
  }

  saveState(): string {
    return serializeState(this.state)
  }

  /**
   * Restores a saved session. Unknown/missing fields fall back to fresh
   * defaults so sessions saved by older builds keep working, and a state
   * saved for a different model is rejected.
   */
  loadState(serialized: string): void {
    const loaded = deserializeState<Partial<TState>>(serialized)
    if (!loaded || typeof loaded !== 'object') throw new Error('Invalid saved state')
    if (loaded.modelId && loaded.modelId !== this.modelId) throw new Error('Saved state belongs to another model')
    const fresh = this.initialize()
    this.state = { ...fresh, ...loaded, settings: { ...fresh.settings, ...(loaded.settings ?? {}) }, memory: { ...fresh.memory, ...(loaded.memory ?? {}) } }
    this.notify()
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  protected notify(): void {
    for (const listener of this.listeners) listener()
  }
}
