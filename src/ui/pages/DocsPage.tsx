import { usePageMeta } from '../hooks/usePageMeta'

const SECTIONS: Array<{ id: string; title: string; body: string }> = [
  {
    id: 'how',
    title: 'How the project works',
    body: `Every model is an entry in src/models/calculatorCatalog.ts (family, engine, display/keyboard profile,
capability flags, optional feature list). Opening /calculator/:id looks the entry up, lazily loads that family's
engine chunk (engineRegistry.ts), restores the model's saved session from localStorage and renders a generic
display + keyboard driven only by the engine's state. No React component branches on a model id.`,
  },
  {
    id: 'architecture',
    title: 'Architecture',
    body: `src/math — tokenizer → parser → AST → evaluators (exact rationals with BigInt, Decimal fallback), plus
trigonometry, statistics, matrices, vectors, complex, base-n, probability, equations, finance and a symbolic CAS.
src/calculators/core — the React-free CalculatorEngine contract, state, events, memory, keyboard and display models
and the menu system. src/calculators/shared — form applets and number formatting reused by several families.
src/calculators/<family> — ClassWiz, ES PLUS, MS, graphing (9860 / CG50 / CG100), ClassPad and Financial engines.
src/ui — React pages and components; they only call engine.pressKey / execute and render engine.getDisplay().`,
  },
  {
    id: 'add-calculator',
    title: 'Add a calculator',
    body: `Same family: add a VariantSpec to the family list in calculatorCatalog.ts with accurate capability flags —
the engine filters its modes from those flags, so nothing else changes.
New family: implement CalculatorEngine (usually by extending BaseCalculatorEngine, ScientificEngineBase or
GraphingEngineBase), export a factory and register it with registerEngine('<id>', loader, true). Plugins can also
call registerCalculator(config) at runtime.`,
  },
  {
    id: 'function',
    title: 'Create a math function',
    body: `Write a pure function in src/math/<topic> that throws MathError on invalid input and add unit tests next to it.
Expose it to expressions with registerFunction('name', (args, ctx) => value) from src/math/parser/evaluator.ts, or add
it to the FUNCTIONS table there. Lazy functions that need an unevaluated argument (d/dx, ∫, Σ) go in LAZY_FUNCTIONS.`,
  },
  {
    id: 'keyboard',
    title: 'Create a keyboard',
    body: `A keyboard is data: a KeyboardLayout with KeyDefinition entries (grid position, primary / shift / alpha actions,
tooltip, physicalKeys). Actions either insert text or name an action (ENTER, NAV_UP, MODE, F1…). Register it with
registerKeyboardLayout(layout) so a model can select it through its keyboardProfile.`,
  },
  {
    id: 'display',
    title: 'Create a display',
    body: `Engines return one of three view models from getDisplay(): 'text' (character LCD lines, cursor, indicators,
highlight), 'screen' (dot-matrix canvas: lines, icon menus, tables or graphs with a ScreenProfile) or 'document'
(touch documents with toolbar and soft keyboard). Screen sizes are registered with registerDisplayProfile().`,
  },
  {
    id: 'model',
    title: 'Create a model',
    body: `Models declare: id, name, family, engine, type, level, displayProfile, keyboardProfile, regionVariant,
languageProfile, capabilities and optional features. The implementation status is derived automatically from the
capabilities the engine supports (ENGINE_SUPPORT), so the catalog can never advertise a feature that does not work.`,
  },
  {
    id: 'tests',
    title: 'Run tests',
    body: `npm test — Vitest unit and integration tests (math, engines, golden files, React components).
npm run test:e2e — Playwright against a production build (npm run build && preview).
npm run lint — oxlint. npm run build — type-check + production bundle.`,
  },
]

export function DocsPage() {
  usePageMeta('Documentation | CASIO Emulator Hub', 'How the emulator hub is built and how to extend it.')
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Documentation</h1>
      <p className="text-sm text-neutral-500 mt-1">
        In-depth documents (calculator matrix, architecture, limitations, legal, roadmap, licenses, sources and decision records) are in the repository&apos;s <code>/docs</code> folder.
      </p>
      <nav className="mt-6 flex flex-wrap gap-2 text-sm" aria-label="Sections">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 hover:underline">
            {s.title}
          </a>
        ))}
      </nav>
      <div className="mt-8 space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id}>
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">{s.title}</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 whitespace-pre-line">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
