const SECTIONS = [
  {
    title: 'How the project works',
    body: `Every calculator model is an entry in models/calculatorCatalog.ts describing its family, engine, capabilities
and implementation status. Opening /calculator/:id looks up that entry, instantiates the matching engine through
engineRegistry.ts, and renders a generic KeyboardGrid + CalculatorDisplayPanel driven entirely by that engine's
state. No component branches on a specific model id.`,
  },
  {
    title: 'Architecture',
    body: `src/math holds the dependency-light math engine (tokenizer, parser, evaluator, and per-topic modules for
trigonometry, statistics, matrices, complex numbers and calculus). src/calculators/core defines the
React-agnostic CalculatorEngine contract (initialize, pressKey, execute, getState, getDisplay, saveState/loadState).
Each family (currently ClassWiz) implements that contract in its own folder. src/ui only ever talks to the
CalculatorEngine interface.`,
  },
  {
    title: 'Add a calculator',
    body: `1) Add an entry to models/calculatorCatalog.ts with its capabilities.
2) If it's a new family, implement CalculatorEngine in src/calculators/<family>/ and register it in
engineRegistry.ts via registerEngine(). 3) If it needs a new keyboard layout, add a KeyboardLayout config next to
the engine. Existing UI (catalog, calculator page, compare) picks it up automatically — nothing else changes.`,
  },
  {
    title: 'Create a math function',
    body: `Add the pure function to the relevant src/math/<topic> module (it should take/return CalcValue or plain
numbers and throw MathError on invalid input), then wire it into the FUNCTIONS table in
src/math/parser/evaluator.ts if it should be callable as name(args) from an expression.`,
  },
  {
    title: 'Run tests',
    body: `npm test runs the Vitest unit/integration suite (math engine, calculator engines, React components).
npm run test:e2e runs the Playwright end-to-end suite against a production build. npm run build type-checks and
bundles the app.`,
  },
]

export function DocsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Documentation</h1>
      <p className="text-sm text-neutral-500 mt-1">
        Full technical documents (calculator matrix, architecture decisions, limitations, legal notes, roadmap, licenses, sources) live in{' '}
        <code>/docs</code> in the project repository.
      </p>
      <div className="mt-8 space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">{s.title}</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 whitespace-pre-line">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
