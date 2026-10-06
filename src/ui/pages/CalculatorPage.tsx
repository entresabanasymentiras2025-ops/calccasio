import { Link, useParams } from 'react-router-dom'
import { getCalculatorById, missingCapabilities } from '../../models/calculatorCatalog'
import { isEngineAvailable } from '../../calculators/engineRegistry'
import { CalculatorView } from '../components/CalculatorView'
import { useEngineLoader } from '../hooks/useCalculatorEngine'
import { usePageMeta } from '../hooks/usePageMeta'
import { CAPABILITY_LABELS } from '../capabilityLabels'
import { LegalNotice } from '../components/LegalNotice'
import { useFavoritesStore } from '../../storage/favoritesStore'
import type { CalculatorCapabilities, CalculatorModelConfig } from '../../models/types'

const TYPE_LABEL: Record<CalculatorModelConfig['type'], string> = { scientific: 'Scientific Calculator', graphing: 'Graphing Calculator', cas: 'CAS Calculator', financial: 'Financial Calculator' }

export function CalculatorPage() {
  const { id } = useParams<{ id: string }>()
  const config = id ? getCalculatorById(id) : undefined
  usePageMeta(
    config ? `${config.name} Emulator — ${TYPE_LABEL[config.type]} Online | CASIO Emulator Hub` : 'Calculator not found | CASIO Emulator Hub',
    config ? `Use an independent web-based emulation interface for the ${config.name} (${config.familyLabel} family). Not an official CASIO product.` : 'Unknown calculator.',
  )

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
  return <CalculatorPageBody key={config.id} config={config} />
}

function CalculatorPageBody({ config }: { config: CalculatorModelConfig }) {
  const available = isEngineAvailable(config.engine) && config.implementationStatus !== 'planned'
  const { ready, error } = useEngineLoader(config.engine)
  const isFavorite = useFavoritesStore((s) => s.isFavorite(config.id))
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite)

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      <Link to="/calculators" className="text-sm text-neutral-500 hover:text-brand-600">
        ← Calculadoras
      </Link>
      <div className="flex items-center gap-3 mt-2">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{config.name}</h1>
        <button type="button" onClick={() => toggleFavorite(config.id)} aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'} className={`text-xl ${isFavorite ? 'text-amber-500' : 'text-neutral-300 hover:text-amber-400'}`}>
          {isFavorite ? '★' : '☆'}
        </button>
      </div>
      <p className="text-sm text-neutral-500 mb-6">
        {config.familyLabel} · {config.tagline}
      </p>

      {!available ? (
        <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 p-10 text-center">
          <p className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">Coming soon</p>
          <p className="text-sm text-neutral-500 mt-2">This model is on the roadmap.</p>
        </div>
      ) : error ? (
        <p role="alert" className="text-red-600">
          Could not load the {config.familyLabel} engine: {error}. If you are offline, reconnect once so it can be cached.
        </p>
      ) : !ready ? (
        <div className="h-96 max-w-sm rounded-3xl bg-neutral-200 dark:bg-neutral-800 animate-pulse" aria-busy="true" aria-label="Loading calculator" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,auto)_1fr] gap-8 items-start">
          <CalculatorView key={config.id} config={config} />
          <InfoPanel config={config} />
        </div>
      )}
    </div>
  )
}

function InfoPanel({ config }: { config: CalculatorModelConfig }) {
  const missing = new Set(missingCapabilities(config))
  const declared = (Object.keys(config.capabilities) as Array<keyof CalculatorCapabilities>).filter((k) => config.capabilities[k])
  return (
    <aside className="text-sm text-neutral-600 dark:text-neutral-400 space-y-5 max-w-md" aria-label="Calculator information">
      <section>
        <h2 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Familia / Family</h2>
        <p>
          {config.familyLabel} · engine <code className="text-xs">{config.engine}</code>
          {config.regionVariant ? ` · regional variant ${config.regionVariant}` : ''}
        </p>
      </section>
      <section>
        <h2 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Funciones / Functions</h2>
        <ul className="flex flex-wrap gap-1.5" aria-label="Capabilities">
          {declared.map((k) => (
            <li key={k} className={`text-xs px-2 py-0.5 rounded-full border ${missing.has(k) ? 'border-dashed border-neutral-300 text-neutral-400' : 'border-emerald-300 text-emerald-700 dark:text-emerald-300'}`}>
              {CAPABILITY_LABELS[k]}
              {missing.has(k) ? ' — coming soon' : ''}
            </li>
          ))}
        </ul>
        <p className="text-xs mt-2">
          Status: <strong>{config.implementationStatus === 'full' ? '🟢 Core implemented' : config.implementationStatus === 'partial' ? '🟡 Partial implementation' : '⚪ Planned'}</strong>
        </p>
      </section>
      <section>
        <h2 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Atajos / Shortcuts</h2>
        <ul className="space-y-0.5 text-xs">
          <li>0–9, + − * / ^ ( ) — digits and operators</li>
          <li>Enter or = — evaluate / EXE · Backspace/Delete — DEL</li>
          <li>Escape — AC / EXIT · Arrow keys — cursor and menus</li>
          <li>Tap Shift — SHIFT · Tap Ctrl or Tab — ALPHA</li>
          <li>Use the “Shortcuts” button for this model&apos;s full list.</li>
        </ul>
      </section>
      <section>
        <h2 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Historial y memoria</h2>
        <p className="text-xs">Each calculator keeps its own memory, variables, history and mode, saved automatically in this browser. Use Save/Restore for a manual snapshot and Reset for factory state.</p>
      </section>
      <LegalNotice className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-3 text-xs" />
    </aside>
  )
}
