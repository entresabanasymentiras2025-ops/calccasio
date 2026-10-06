/* oxlint-disable react/refs -- this hook's whole job is a ref holding a
   long-lived, non-rendering CalculatorEngine instance (React's own docs
   sanction lazy-initializing a ref during render). */
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createEngine, isEngineLoaded, loadEngine } from '../../calculators/engineRegistry'
import type { CalculatorEngine } from '../../calculators/core/CalculatorEngine'
import type { CalculatorModelConfig, EngineId } from '../../models/types'
import { loadRaw, saveRaw } from '../../storage/localStorage'
import { logger } from '../../utils/logger'

export function stateKey(modelId: string): string {
  return `calculator-state:${modelId}`
}

/** Loads a family engine's code on demand (lazy chunk). */
export function useEngineLoader(engine: EngineId): { ready: boolean; error: string | null } {
  const [ready, setReady] = useState(() => isEngineLoaded(engine))
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (isEngineLoaded(engine)) {
      setReady(true)
      return
    }
    let cancelled = false
    loadEngine(engine)
      .then(() => !cancelled && setReady(true))
      .catch((err: unknown) => {
        logger.error('engine load failed', engine, err)
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load engine')
      })
    return () => {
      cancelled = true
    }
  }, [engine])
  return { ready, error }
}

/**
 * Bridges a React-agnostic CalculatorEngine into React. The engine is the
 * single source of truth; this hook only subscribes to it (via
 * useSyncExternalStore) and persists/restores its state. No calculator
 * logic lives here. Callers remount it per model (key={config.id}) and must
 * render it only once the engine is loaded (see useEngineLoader).
 */
export function useCalculatorEngine(config: CalculatorModelConfig) {
  const engineRef = useRef<CalculatorEngine | null>(null)
  if (engineRef.current === null) {
    const engine = createEngine(config)
    const saved = loadRaw(stateKey(config.id))
    if (saved) {
      try {
        engine.loadState(saved)
      } catch (err) {
        logger.warn('Discarding incompatible saved state for', config.id, err)
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
