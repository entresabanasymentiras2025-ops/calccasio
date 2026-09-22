import { Link } from 'react-router-dom'
import { calculatorCatalog } from '../../models/calculatorCatalog'
import { CalculatorCard } from '../components/CalculatorCard'

const FEATURES = [
  { title: 'Runs in your browser', body: 'No install, no plugins — real keypress-by-keypress emulation in plain web tech.' },
  { title: 'Keyboard support', body: 'Every calculator responds to your physical keyboard as well as clicks and touch.' },
  { title: 'Responsive', body: 'Usable on desktop, tablet, and phone, with a distraction-free fullscreen mode.' },
  { title: 'Offline-ready', body: 'Once loaded, the math engines keep working without a network connection.' },
  { title: 'Open architecture', body: 'A shared core engine and capability system make it straightforward to add new models.' },
]

export function HomePage() {
  const featured = calculatorCatalog.filter((c) => c.implementationStatus === 'full')

  return (
    <div>
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">Your calculators. Anywhere.</h1>
        <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
          Explore and use independent, from-scratch web emulations of scientific, graphing, CAS, and financial calculator interfaces — right in your
          browser.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/calculators" className="px-6 py-3 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors">
            Explore calculators
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-4">Ready to use</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featured.map((c) => (
            <CalculatorCard key={c.id} config={c} />
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12">
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
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 text-xs text-neutral-500">
          Independent project, not affiliated with, sponsored by, or endorsed by CASIO Computer Co., Ltd. CASIO and its product names are
          trademarks of their respective owners.
        </div>
      </section>
    </div>
  )
}
