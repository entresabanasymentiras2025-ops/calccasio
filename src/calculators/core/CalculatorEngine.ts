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

  execute(event: CalculatorEvent): void {
    if (event.type === 'KEY_PRESS' && event.keyId) {
      this.pressKey(event.keyId)
      return
    }
    if (event.type === 'RESET') {
      this.reset()
    }
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

  loadState(serialized: string): void {
    this.state = deserializeState<TState>(serialized)
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
