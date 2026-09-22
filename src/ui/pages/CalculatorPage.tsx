import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCalculatorById } from '../../models/calculatorCatalog'
import { isEngineAvailable } from '../../calculators/engineRegistry'
import { CalculatorView } from '../components/CalculatorView'

export function CalculatorPage() {
  const { id } = useParams<{ id: string }>()
  const config = id ? getCalculatorById(id) : undefined

  useEffect(() => {
    if (!config) return
    const prevTitle = document.title
    document.title = `${config.name} Emulator — Scientific Calculator Online | CASIO Emulator Hub`
    let meta = document.querySelector('meta[name="description"]')
    const prevDescription = meta?.getAttribute('content') ?? ''
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute(
      'content',
      `Use an independent, from-scratch web-based emulation of the ${config.name} interface. Not an official CASIO product.`,
    )
    return () => {
      document.title = prevTitle
      meta?.setAttribute('content', prevDescription)
    }
  }, [config])

  if (!config) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Calculator not found</h1>
        <Link to="/calculators" className="text-brand-600 hover:underline mt-4 inline-block">
          ← Back to calculators
        </Link>
      </div>
    )
  }

  const available = isEngineAvailable(config.engine)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link to="/calculators" className="text-sm text-neutral-500 hover:text-brand-600">
        ← Calculators
      </Link>
      <h1 className="text-2xl font-bold mt-2 text-neutral-900 dark:text-neutral-100">{config.name}</h1>
      <p className="text-sm text-neutral-500 mb-6">
        {config.familyLabel} · {config.tagline}
      </p>

      {available && config.implementationStatus === 'full' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8">
          <CalculatorView key={config.id} config={config} />
          <InfoPanel />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 p-10 text-center">
          <p className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">Coming soon</p>
          <p className="text-sm text-neutral-500 mt-2 max-w-md mx-auto">
            The {config.familyLabel} engine for {config.name} hasn&apos;t been built yet. This model is on the roadmap — see{' '}
            <Link to="/docs" className="text-brand-600 hover:underline">
              /docs/roadmap
            </Link>{' '}
            for the implementation order.
          </p>
        </div>
      )}
    </div>
  )
}

function InfoPanel() {
  return (
    <aside className="text-sm text-neutral-600 dark:text-neutral-400 space-y-4 max-w-xs">
      <div>
        <h2 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Keyboard shortcuts</h2>
        <ul className="space-y-0.5 text-xs">
          <li>0–9, +, -, *, / — digits and operators</li>
          <li>Enter or = — evaluate</li>
          <li>Backspace — delete</li>
          <li>Escape — clear</li>
          <li>Arrow keys — move cursor / navigate menus</li>
          <li>Shift — SHIFT functions</li>
          <li>Tab (while focused) — ALPHA functions</li>
        </ul>
      </div>
      <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-3 text-xs">
        Independent project, not affiliated with, sponsored by, or endorsed by CASIO Computer Co., Ltd. CASIO and its product names are trademarks
        of their respective owners.
      </div>
    </aside>
  )
}
