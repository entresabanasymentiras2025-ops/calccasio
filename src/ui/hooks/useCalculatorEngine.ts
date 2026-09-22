/* oxlint-disable react/refs -- this hook's whole job is a ref holding a
   long-lived, non-rendering CalculatorEngine instance (React's own docs
   sanction lazy-initializing a ref during render; oxlint's rule doesn't
   special-case that, and flags every later read of the same ref-derived
   value in this file too). */
import { useEffect, useRef, useSyncExternalStore } from 'react'
import { createEngine } from '../../calculators/engineRegistry'
import type { CalculatorEngine } from '../../calculators/core/CalculatorEngine'
import type { CalculatorModelConfig } from '../../models/types'
import { loadRaw, saveRaw } from '../../storage/localStorage'

function stateKey(modelId: string): string {
  return `calculator-state:${modelId}`
}

/**
 * Bridges a React-agnostic CalculatorEngine into React. The engine is the
 * single source of truth; this hook only subscribes to it and triggers
 * re-renders via useSyncExternalStore, and persists/restores state on
 * mount/change. No calculator logic lives here.
 *
 * Callers must remount this hook when `config.id` changes (e.g. render the
 * component with `key={config.id}`) — the engine is created once per mount,
 * the standard lazy-ref-initialization pattern, rather than compared against
 * the previous id on every render.
 */
export function useCalculatorEngine(config: CalculatorModelConfig) {
  const engineRef = useRef<CalculatorEngine | null>(null)
  if (engineRef.current === null) {
    const engine = createEngine(config)
    const saved = loadRaw(stateKey(config.id))
    if (saved) {
      try {
        engine.loadState(saved)
      } catch {
        // Corrupt or incompatible saved state — fall back to a fresh session.
      }
    }
    engineRef.current = engine
  }
  const engine = engineRef.current

  const state = useSyncExternalStore(
    (onStoreChange) => engine.subscribe(onStoreChange),
    () => engine.getState(),
  )

  useEffect(() => {
    saveRaw(stateKey(config.id), engine.saveState())
  }, [config.id, engine, state])

  return { engine, state, display: engine.getDisplay() }
}
