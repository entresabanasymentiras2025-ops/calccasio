import type { CalculatorEngine } from './core/CalculatorEngine'
import type { CalculatorModelConfig, EngineId } from '../models/types'
import { ClassWizEngine } from './classwiz/ClassWizEngine'

type EngineFactory = (config: CalculatorModelConfig) => CalculatorEngine

/**
 * Maps a model's declared `engine` id to the concrete engine implementation.
 * Families without a registered factory yet (ES PLUS, MS, graphing, CAS,
 * financial, ...) are intentionally absent — registerEngine() lets a future
 * change add them without touching any call site (see /docs/architecture.md
 * "Adding a calculator").
 */
const registry = new Map<EngineId, EngineFactory>([['classwiz', (config) => new ClassWizEngine(config)]])

export function registerEngine(id: EngineId, factory: EngineFactory): void {
  registry.set(id, factory)
}

export function isEngineAvailable(id: EngineId): boolean {
  return registry.has(id)
}

export function createEngine(config: CalculatorModelConfig): CalculatorEngine {
  const factory = registry.get(config.engine)
  if (!factory) {
    throw new Error(`No engine registered for "${config.engine}" (model ${config.id})`)
  }
  return factory(config)
}
