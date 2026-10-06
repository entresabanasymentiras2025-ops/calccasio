import { Link } from 'react-router-dom'
import { calculatorCatalog, getCalculatorById } from '../../models/calculatorCatalog'
import { CalculatorCard } from '../components/CalculatorCard'
import { LegalNotice } from '../components/LegalNotice'
import { usePageMeta } from '../hooks/usePageMeta'
import type { CalculatorType } from '../../models/types'

const POPULAR = ['fx-991cw', 'fx-991ex', 'fx-991es-plus', 'fx-991ms', 'fx-9860giii', 'fx-cg50', 'fx-cg100', 'fx-cp400']

const CATEGORIES: Array<{ type: CalculatorType; title: string; body: string }> = [
  { type: 'scientific', title: 'Scientific', body: 'ClassWiz CW / EX, ES PLUS and MS families: fractions, statistics, equations, matrices, complex, base-n.' },
  { type: 'graphing', title: 'Graphing', body: 'Function plotting with trace, zoom and G-Solve, tables, list statistics and a sandboxed program VM.' },
  { type: 'cas', title: 'CAS', body: 'A ClassPad-style touch document with exact simplify, expand, factor, solve, derivatives and integrals.' },
  { type: 'financial', title: 'Financial', body: 'Simple and compound interest, cash flows (NPV/IRR), amortization, dates, depreciation, bonds, break-even.' },
]

const FEATURES = [
  { title: 'Runs in your browser', body: 'Every engine is local TypeScript: no server, no plugins, no external math API.' },
  { title: 'Keyboard support', body: 'Physical keys, mouse and touch all drive the same calculator engine.' },
  { title: 'Responsive', body: 'Desktop, tablet and phone layouts, plus a distraction-free fullscreen mode.' },
  { title: 'Offline-ready', body: 'Installable PWA: engines you have opened keep working without a connection.' },
  { title: 'Open-source architecture', body: 'Engines, keyboards, displays and models are plug-ins over a shared core.' },
]

export function HomePage() {
  usePageMeta('CASIO Emulator Hub — Scientific & Graphing Calculators in your browser', 'Independent web emulations of scientific, graphing, CAS and financial calculator interfaces. Not affiliated with CASIO.')
  const popular = POPULAR.map((id) => getCalculatorById(id)).filter((c) => c !== undefined)

  return (
    <div>
      <section className="max-w-6xl mx-auto px-4 pt-14 pb-10 text-center">
        <p className="text-sm font-semibold tracking-wide text-brand-600 uppercase">Your calculators. Anywhere.</p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">Calculadoras científicas y gráficas en tu navegador</h1>
        <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">Explora y utiliza emulaciones web independientes de diferentes familias de calculadoras.</p>
        <div className="mt-8 flex justify-center gap-3 flex-wrap">
          <Link to="/calculators" className="px-6 py-3 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors">
            Explorar calculadoras
          </Link>
          <Link to="/calculator/fx-991cw" className="px-6 py-3 rounded-lg border border-neutral-300 dark:border-neutral-700 font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800">
            Open fx-991CW
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8" aria-labelledby="popular">
        <h2 id="popular" className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-4">
          Popular calculators
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {popular.map((c) => (
            <CalculatorCard key={c.id} config={c} />
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Categories">
        {CATEGORIES.map((c) => (
          <Link key={c.type} to={`/calculators?type=${c.type}`} className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 hover:border-brand-400 bg-white dark:bg-neutral-900">
            <h3 className="font-semibold">{c.title}</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{c.body}</p>
            <p className="text-xs text-neutral-500 mt-2">{calculatorCatalog.filter((m) => m.type === c.type).length} models →</p>
          </Link>
        ))}
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12" aria-label="Features">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title}>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{f.title}</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16">
        <LegalNotice className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 text-xs text-neutral-500" />
      </section>
    </div>
  )
}
