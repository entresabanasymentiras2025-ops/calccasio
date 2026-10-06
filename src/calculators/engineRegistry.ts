import type { CalculatorEngine } from './core/CalculatorEngine'
import type { CalculatorModelConfig, EngineId } from '../models/types'

export type EngineFactory = (config: CalculatorModelConfig) => CalculatorEngine
type EngineLoader = () => Promise<EngineFactory>

/**
 * Maps a model's declared `engine` id to its implementation. Engines are
 * registered as lazy loaders so each family's code is only downloaded when
 * a calculator of that family is opened (route-level code splitting).
 * registerEngine() accepts either a factory or a loader, so plugins and
 * tests can add engines without touching any call site.
 */
const loaders = new Map<EngineId, EngineLoader>()
const factories = new Map<EngineId, EngineFactory>()

export function registerEngine(id: EngineId, factoryOrLoader: EngineFactory | EngineLoader, lazy = false): void {
  if (lazy) loaders.set(id, factoryOrLoader as EngineLoader)
  else factories.set(id, factoryOrLoader as EngineFactory)
}

export function isEngineAvailable(id: EngineId): boolean {
  return factories.has(id) || loaders.has(id)
}

export function isEngineLoaded(id: EngineId): boolean {
  return factories.has(id)
}

export async function loadEngine(id: EngineId): Promise<EngineFactory> {
  const existing = factories.get(id)
  if (existing) return existing
  const loader = loaders.get(id)
  if (!loader) throw new Error(`No engine registered for "${id}"`)
  const factory = await loader()
  factories.set(id, factory)
  return factory
}

/** Synchronous creation; the engine must already be loaded (see loadEngine). */
export function createEngine(config: CalculatorModelConfig): CalculatorEngine {
  const factory = factories.get(config.engine)
  if (!factory) throw new Error(`Engine "${config.engine}" is not loaded (model ${config.id}); call loadEngine() first`)
  return factory(config)
}

registerEngine('classwiz', async () => (await import('./classwiz/ClassWizEngine')).createClassWizEngine, true)
registerEngine('esplus', async () => (await import('./esplus/ESPlusEngine')).createESPlusEngine, true)
registerEngine('ms', async () => (await import('./ms/MSEngine')).createMSEngine, true)
registerEngine('graph9860', async () => (await import('./graph9860/Graph9860Engine')).createGraph9860Engine, true)
registerEngine('cg50', async () => (await import('./cg50/CG50Engine')).createCG50Engine, true)
registerEngine('cg100', async () => (await import('./cg100/CG100Engine')).createCG100Engine, true)
registerEngine('classpad', async () => (await import('./classpad/ClassPadEngine')).createClassPadEngine, true)
registerEngine('financial', async () => (await import('./financial/FinancialEngine')).createFinancialEngine, true)
