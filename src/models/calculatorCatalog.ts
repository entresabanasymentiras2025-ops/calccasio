import type { CalculatorCapabilities, CalculatorModelConfig, CalculatorType, EngineId, ImplementationStatus } from './types'

/**
 * Central registry of every calculator model the platform knows about.
 * Nothing in the app should branch on a model id directly — add a new
 * calculator by appending an entry here (see /docs/architecture.md
 * "Adding a calculator"). Capability tiers below are derived from public
 * CASIO product literature and are intentionally conservative approximations
 * where exact per-SKU specs were not verifiable; see /docs/sources.md.
 */

const NO_CAPS: CalculatorCapabilities = {
  arithmetic: true,
  fractions: false,
  complex: false,
  matrices: false,
  vectors: false,
  statistics: false,
  calculus: false,
  equation: false,
  table: false,
  baseN: false,
  ratio: false,
  distribution: false,
  spreadsheet: false,
  graphing: false,
  programming: false,
  cas: false,
  finance: false,
}

const SCI_BASIC: CalculatorCapabilities = { ...NO_CAPS, fractions: true, statistics: true, table: true, ratio: true }
const SCI_MID: CalculatorCapabilities = { ...SCI_BASIC, complex: true, equation: true, baseN: true, distribution: true }
const SCI_FULL: CalculatorCapabilities = { ...SCI_MID, matrices: true, vectors: true, calculus: true, spreadsheet: true }
const MS_BASIC: CalculatorCapabilities = { ...NO_CAPS, fractions: true, statistics: true }
const MS_MID: CalculatorCapabilities = { ...MS_BASIC, equation: true, baseN: true }
const GRAPHING: CalculatorCapabilities = { ...SCI_FULL, graphing: true, programming: true }
const CAS: CalculatorCapabilities = { ...GRAPHING, cas: true }
const FINANCE: CalculatorCapabilities = { ...NO_CAPS, finance: true, statistics: true }
const MS_FULL: CalculatorCapabilities = { ...MS_MID, complex: true, matrices: true, vectors: true, calculus: true }

interface VariantSpec {
  id: string
  name: string
  caps: CalculatorCapabilities
  region?: string
  language?: string
  features?: string[]
}

/**
 * 'full'    — the family engine implements every mode the model declares.
 * 'partial' — the engine runs (real calculations, modes, persistence) but
 *             some of the model's declared features are still "coming soon".
 * 'planned' — no engine yet; the page shows an honest "Coming soon" state.
 */
function statusFor(id: string, implemented: Map<string, ImplementationStatus> | Set<string>): ImplementationStatus {
  if (implemented instanceof Map) return implemented.get(id) ?? 'planned'
  return implemented.has(id) ? 'full' : 'planned'
}

function buildFamily(
  familyId: string,
  familyLabel: string,
  engine: EngineId,
  type: CalculatorType,
  level: CalculatorModelConfig['level'],
  displayProfile: string,
  keyboardProfile: string,
  variants: VariantSpec[],
  implemented: Map<string, ImplementationStatus> | Set<string>,
  tagline: string,
): CalculatorModelConfig[] {
  return variants.map((v) => ({
    id: v.id,
    name: v.name,
    family: familyId,
    familyLabel,
    engine,
    type,
    level,
    displayProfile,
    keyboardProfile,
    regionVariant: v.region,
    languageProfile: v.language,
    capabilities: v.caps,
    implementationStatus: statusFor(v.id, implemented),
    tagline,
    features: v.features,
  }))
}

const cwVariants: VariantSpec[] = [
  { id: 'fx-82cw', name: 'fx-82CW', caps: SCI_BASIC },
  { id: 'fx-85cw', name: 'fx-85CW', caps: SCI_BASIC },
  { id: 'fx-350cw', name: 'fx-350CW', caps: SCI_MID },
  { id: 'fx-570cw', name: 'fx-570CW', caps: SCI_MID },
  { id: 'fx-991cw', name: 'fx-991CW', caps: SCI_FULL },
  { id: 'fx-8200au', name: 'fx-8200AU', caps: SCI_FULL, region: 'AU' },
  { id: 'fx-880btg', name: 'fx-880BTG', caps: SCI_FULL },
  { id: 'fx-82de-cw', name: 'fx-82DE CW', caps: SCI_BASIC, region: 'DE', language: 'de' },
  { id: 'fx-85de-cw', name: 'fx-85DE CW', caps: SCI_BASIC, region: 'DE', language: 'de' },
  { id: 'fx-87de-cw', name: 'fx-87DE CW', caps: SCI_MID, region: 'DE', language: 'de' },
  { id: 'fx-810de-cw', name: 'fx-810DE CW', caps: SCI_MID, region: 'DE', language: 'de' },
  { id: 'fx-991de-cw', name: 'fx-991DE CW', caps: SCI_FULL, region: 'DE', language: 'de' },
  { id: 'fx-83gt-cw', name: 'fx-83GT CW', caps: SCI_MID, region: 'GB' },
  { id: 'fx-85gt-cw', name: 'fx-85GT CW', caps: SCI_MID, region: 'GB' },
  { id: 'fx-82la-cw', name: 'fx-82LA CW', caps: SCI_BASIC, region: 'LATAM', language: 'es' },
  { id: 'fx-570la-cw', name: 'fx-570LA CW', caps: SCI_MID, region: 'LATAM', language: 'es' },
  { id: 'fx-991la-cw', name: 'fx-991LA CW', caps: SCI_FULL, region: 'LATAM', language: 'es' },
  { id: 'fx-82nl', name: 'fx-82NL', caps: SCI_BASIC, region: 'NL', language: 'nl' },
  { id: 'fx-92-college', name: 'fx-92 Collège', caps: SCI_MID, region: 'FR', language: 'fr' },
  { id: 'fx-92b-secondaire', name: 'fx-92B Secondaire', caps: SCI_MID, region: 'FR', language: 'fr' },
  { id: 'fx-82sp-cw', name: 'fx-82SP CW', caps: SCI_BASIC, region: 'ES', language: 'es' },
  { id: 'fx-85sp-cw', name: 'fx-85SP CW', caps: SCI_BASIC, region: 'ES', language: 'es' },
  { id: 'fx-570sp-cw', name: 'fx-570SP CW', caps: SCI_MID, region: 'ES', language: 'es' },
  { id: 'fx-991sp-cw', name: 'fx-991SP CW', caps: SCI_FULL, region: 'ES', language: 'es' },
  { id: 'fx-jp500cw', name: 'fx-JP500CW', caps: SCI_MID, region: 'JP', language: 'ja' },
  { id: 'fx-jp700cw', name: 'fx-JP700CW', caps: SCI_FULL, region: 'JP', language: 'ja' },
  { id: 'fx-jp900cw', name: 'fx-JP900CW', caps: SCI_FULL, region: 'JP', language: 'ja' },
  { id: 'fx-550az', name: 'fx-550AZ', caps: SCI_MID },
]

const exVariants: VariantSpec[] = [
  { id: 'fx-82ex', name: 'fx-82EX', caps: SCI_BASIC },
  { id: 'fx-85ex', name: 'fx-85EX', caps: SCI_BASIC },
  { id: 'fx-350ex', name: 'fx-350EX', caps: SCI_MID },
  { id: 'fx-570ex', name: 'fx-570EX', caps: SCI_MID },
  { id: 'fx-991ex', name: 'fx-991EX', caps: SCI_FULL },
  { id: 'fx-82ar-x', name: 'fx-82AR X', caps: SCI_BASIC, region: 'AR', language: 'ar' },
  { id: 'fx-95ar-x', name: 'fx-95AR X', caps: SCI_MID, region: 'AR', language: 'ar' },
  { id: 'fx-570ar-x', name: 'fx-570AR X', caps: SCI_MID, region: 'AR', language: 'ar' },
  { id: 'fx-991ar-x', name: 'fx-991AR X', caps: SCI_FULL, region: 'AR', language: 'ar' },
  { id: 'fx-82ce-x', name: 'fx-82CE X', caps: SCI_BASIC, region: 'FR', language: 'fr' },
  { id: 'fx-85ce-x', name: 'fx-85CE X', caps: SCI_BASIC, region: 'FR', language: 'fr' },
  { id: 'fx-350ce-x', name: 'fx-350CE X', caps: SCI_MID, region: 'FR', language: 'fr' },
  { id: 'fx-991ce-x', name: 'fx-991CE X', caps: SCI_FULL, region: 'FR', language: 'fr' },
  { id: 'fx-580vn-x', name: 'fx-580VN X', caps: SCI_FULL, region: 'VN', language: 'vi' },
  { id: 'fx-82de-x', name: 'fx-82DE X', caps: SCI_BASIC, region: 'DE', language: 'de' },
  { id: 'fx-85de-x', name: 'fx-85DE X', caps: SCI_BASIC, region: 'DE', language: 'de' },
  { id: 'fx-87de-x', name: 'fx-87DE X', caps: SCI_MID, region: 'DE', language: 'de' },
  { id: 'fx-991de-x', name: 'fx-991DE X', caps: SCI_FULL, region: 'DE', language: 'de' },
  { id: 'fx-83gt-x', name: 'fx-83GT X', caps: SCI_MID, region: 'GB' },
  { id: 'fx-85gt-x', name: 'fx-85GT X', caps: SCI_MID, region: 'GB' },
  { id: 'fx-82la-x', name: 'fx-82LA X', caps: SCI_BASIC, region: 'LATAM', language: 'es' },
  { id: 'fx-350la-x', name: 'fx-350LA X', caps: SCI_MID, region: 'LATAM', language: 'es' },
  { id: 'fx-570la-x', name: 'fx-570LA X', caps: SCI_MID, region: 'LATAM', language: 'es' },
  { id: 'fx-991la-x', name: 'fx-991LA X', caps: SCI_FULL, region: 'LATAM', language: 'es' },
]

const ES_BASIC: CalculatorCapabilities = { ...NO_CAPS, fractions: true, statistics: true, table: true }
const ES_MID: CalculatorCapabilities = { ...ES_BASIC, complex: true, equation: true, baseN: true, calculus: true }
const ES_FULL: CalculatorCapabilities = { ...ES_MID, matrices: true, vectors: true }

const esPlusVariants: VariantSpec[] = [
  { id: 'fx-82es-plus', name: 'fx-82ES PLUS', caps: ES_BASIC },
  { id: 'fx-85es-plus', name: 'fx-85ES PLUS', caps: ES_BASIC },
  { id: 'fx-350es-plus', name: 'fx-350ES PLUS', caps: ES_MID },
  { id: 'fx-570es-plus', name: 'fx-570ES PLUS', caps: ES_MID },
  { id: 'fx-991es-plus', name: 'fx-991ES PLUS', caps: ES_FULL },
  { id: 'fx-300es-plus', name: 'fx-300ES PLUS', caps: ES_BASIC, region: 'US' },
  { id: 'fx-115es-plus', name: 'fx-115ES PLUS', caps: ES_FULL, region: 'US' },
  { id: 'fx-991es-plus-c', name: 'fx-991ES PLUS C', caps: ES_FULL },
  { id: 'fx-991id-plus', name: 'fx-991ID PLUS', caps: ES_FULL, region: 'ID', language: 'id' },
  { id: 'fx-82la-plus', name: 'fx-82LA PLUS', caps: ES_BASIC, region: 'LATAM', language: 'es' },
  { id: 'fx-350la-plus', name: 'fx-350LA PLUS', caps: ES_MID, region: 'LATAM', language: 'es' },
  { id: 'fx-570la-plus', name: 'fx-570LA PLUS', caps: ES_MID, region: 'LATAM', language: 'es' },
  { id: 'fx-991la-plus', name: 'fx-991LA PLUS', caps: ES_FULL, region: 'LATAM', language: 'es' },
  { id: 'fx-87de-plus', name: 'fx-87DE PLUS', caps: ES_MID, region: 'DE', language: 'de' },
  { id: 'fx-570vn-plus', name: 'fx-570VN PLUS', caps: ES_MID, region: 'VN', language: 'vi' },
  { id: 'fx-82au-plus-ii', name: 'fx-82AU PLUS II', caps: ES_BASIC, region: 'AU' },
  { id: 'fx-100au-plus', name: 'fx-100AU PLUS', caps: ES_MID, region: 'AU' },
  { id: 'fx-82za-plus-ii', name: 'fx-82ZA PLUS II', caps: ES_BASIC, region: 'ZA' },
  { id: 'fx-991za-plus-ii', name: 'fx-991ZA PLUS II', caps: ES_FULL, region: 'ZA' },
]

const msVariants: VariantSpec[] = [
  { id: 'fx-82ms', name: 'fx-82MS', caps: MS_BASIC },
  { id: 'fx-85ms', name: 'fx-85MS', caps: MS_BASIC },
  { id: 'fx-95ms', name: 'fx-95MS', caps: MS_MID },
  { id: 'fx-100ms', name: 'fx-100MS', caps: MS_MID },
  { id: 'fx-570ms', name: 'fx-570MS', caps: MS_FULL },
  { id: 'fx-991ms', name: 'fx-991MS', caps: MS_FULL },
]

const graph9860Variants: VariantSpec[] = [
  { id: 'fx-9750giii', name: 'fx-9750GIII', caps: GRAPHING },
  { id: 'fx-9860giii', name: 'fx-9860GIII', caps: GRAPHING },
  { id: 'graph35-plus-e-ii', name: 'GRAPH35+ E II', caps: GRAPHING },
]

const cg50Variants: VariantSpec[] = [
  { id: 'fx-cg50', name: 'fx-CG50', caps: GRAPHING },
  { id: 'fx-cg50-au', name: 'fx-CG50 AU', caps: GRAPHING, region: 'AU' },
  { id: 'graph90-plus-e', name: 'GRAPH90+ E', caps: GRAPHING },
]

const cg100Variants: VariantSpec[] = [
  { id: 'fx-cg100', name: 'fx-CG100', caps: GRAPHING },
  { id: 'graph-math-plus', name: 'GRAPH MATH+', caps: GRAPHING },
  { id: 'fx-1au-graph', name: 'fx-1AU GRAPH', caps: GRAPHING, region: 'AU' },
]

const classPadVariants: VariantSpec[] = [
  { id: 'fx-cp400', name: 'fx-CP400', caps: CAS },
  { id: 'fx-cg500', name: 'fx-CG500', caps: CAS },
]

const financialVariants: VariantSpec[] = [
  { id: 'fc-100v', name: 'FC-100V', caps: FINANCE },
  { id: 'fc-200v', name: 'FC-200V', caps: FINANCE, features: ['depreciation', 'bond', 'breakEven'] },
]

// Implementation status per family. Every model of a family runs on the
// family's engine and gets its modes from its own capability flags, so
// regional variants work through configuration alone. ClassWiz/ES PLUS/MS
// models are 'partial' where the hardware has modes we have not built
// (spreadsheet, inequality, CALC prompts...); graphing and CAS families are
// 'partial' by design for this phase — see /docs/calculator-matrix.md.
type Cap = keyof CalculatorCapabilities
const SCIENTIFIC_CORE: Cap[] = ['arithmetic', 'fractions', 'complex', 'matrices', 'vectors', 'statistics', 'calculus', 'equation', 'table', 'baseN']

/** Capabilities each engine actually implements today (keep in sync with the engines' mode lists). */
export const ENGINE_SUPPORT: Record<EngineId, ReadonlySet<Cap>> = {
  classwiz: new Set<Cap>([...SCIENTIFIC_CORE, 'ratio', 'distribution']),
  'classwiz-ex': new Set<Cap>([...SCIENTIFIC_CORE, 'ratio', 'distribution']),
  esplus: new Set<Cap>(SCIENTIFIC_CORE),
  ms: new Set<Cap>(SCIENTIFIC_CORE.filter((c) => c !== 'table')),
  graph9860: new Set<Cap>(['arithmetic', 'fractions', 'matrices', 'statistics', 'calculus', 'equation', 'table', 'graphing', 'programming']),
  cg50: new Set<Cap>(['arithmetic', 'fractions', 'matrices', 'statistics', 'calculus', 'equation', 'table', 'graphing', 'programming']),
  cg100: new Set<Cap>(['arithmetic', 'fractions', 'matrices', 'statistics', 'calculus', 'equation', 'table', 'graphing', 'programming']),
  classpad: new Set<Cap>(['arithmetic', 'fractions', 'calculus', 'equation', 'graphing', 'cas']),
  financial: new Set<Cap>(['arithmetic', 'finance', 'statistics']),
}

/** Capabilities a model declares that its engine does not implement yet ("coming soon"). */
export function missingCapabilities(config: Pick<CalculatorModelConfig, 'engine' | 'capabilities'>): Cap[] {
  const support = ENGINE_SUPPORT[config.engine]
  return (Object.keys(config.capabilities) as Cap[]).filter((k) => config.capabilities[k] && !support.has(k))
}

function derivedStatus(engine: EngineId, variants: VariantSpec[]): Map<string, ImplementationStatus> {
  return new Map(variants.map((v) => [v.id, missingCapabilities({ engine, capabilities: v.caps }).length === 0 ? 'full' : 'partial']))
}

export const calculatorCatalog: CalculatorModelConfig[] = [
  ...buildFamily(
    'classwiz-cw',
    'ClassWiz CW',
    'classwiz',
    'scientific',
    'advanced',
    'classwiz-cw',
    'classwiz-standard',
    cwVariants,
    derivedStatus('classwiz', cwVariants),
    'Natural textbook display scientific calculator (latest ClassWiz generation).',
  ),
  ...buildFamily(
    'classwiz-ex',
    'ClassWiz EX',
    'classwiz',
    'scientific',
    'advanced',
    'classwiz-ex',
    'classwiz-standard',
    exVariants,
    derivedStatus('classwiz', exVariants),
    'Natural textbook display scientific calculator (previous ClassWiz generation).',
  ),
  ...buildFamily(
    'esplus',
    'ES PLUS',
    'esplus',
    'scientific',
    'intermediate',
    'esplus',
    'esplus-standard',
    esPlusVariants,
    derivedStatus('esplus', esPlusVariants),
    'Two-line natural display scientific calculator.',
  ),
  ...buildFamily('ms', 'MS', 'ms', 'scientific', 'basic', 'ms', 'ms-standard', msVariants, derivedStatus('ms', msVariants), 'Classic single-line display scientific calculator.'),
  ...buildFamily(
    'graphing-9860',
    'Graphing (9750/9860)',
    'graph9860',
    'graphing',
    'advanced',
    'graph9860',
    'graph9860-standard',
    graph9860Variants,
    derivedStatus('graph9860', graph9860Variants),
    'Monochrome graphing calculator with programming support.',
  ),
  ...buildFamily('cg50', 'fx-CG50', 'cg50', 'graphing', 'advanced', 'cg50', 'cg50-standard', cg50Variants, derivedStatus('cg50', cg50Variants), 'Full-color graphing calculator.'),
  ...buildFamily('cg100', 'fx-CG100', 'cg100', 'graphing', 'advanced', 'cg100', 'cg100-standard', cg100Variants, derivedStatus('cg100', cg100Variants), 'Full-color graphing calculator with a redesigned keyboard and HOME screen.'),
  ...buildFamily('classpad', 'ClassPad / CAS', 'classpad', 'cas', 'advanced', 'classpad', 'classpad-standard', classPadVariants, derivedStatus('classpad', classPadVariants), 'Touchscreen CAS calculator with symbolic algebra.'),
  ...buildFamily('financial', 'Financial', 'financial', 'financial', 'intermediate', 'financial', 'financial-standard', financialVariants, derivedStatus('financial', financialVariants), 'Financial calculator for interest, cash flow and amortization.'),
]

export function getCalculatorById(id: string): CalculatorModelConfig | undefined {
  return calculatorCatalog.find((c) => c.id === id)
}

export function getCalculatorsByFamily(family: string): CalculatorModelConfig[] {
  return calculatorCatalog.filter((c) => c.family === family)
}
