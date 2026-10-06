import { Link } from 'react-router-dom'
import type { CalculatorCapabilities, CalculatorModelConfig } from '../../models/types'
import { useFavoritesStore } from '../../storage/favoritesStore'
import { CAPABILITY_LABELS } from '../capabilityLabels'

const STATUS_BADGE: Record<CalculatorModelConfig['implementationStatus'], { label: string; className: string }> = {
  full: { label: '🟢 Core implemented', className: 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950' },
  partial: { label: '🟡 Partial', className: 'text-amber-800 bg-amber-50 dark:text-amber-300 dark:bg-amber-950' },
  planned: { label: '⚪ Planned', className: 'text-neutral-600 bg-neutral-100 dark:text-neutral-400 dark:bg-neutral-800' },
}

export function CalculatorCard({ config }: { config: CalculatorModelConfig }) {
  const isFavorite = useFavoritesStore((s) => s.isFavorite(config.id))
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite)
  const badge = STATUS_BADGE[config.implementationStatus]
  const caps = (Object.keys(config.capabilities) as Array<keyof CalculatorCapabilities>).filter((k) => k !== 'arithmetic' && config.capabilities[k])
  const playable = config.implementationStatus !== 'planned'

  return (
    <article className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{config.name}</h3>
          <p className="text-xs text-neutral-500">{config.familyLabel}</p>
        </div>
        <button type="button" onClick={() => toggleFavorite(config.id)} aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'} className={`text-lg ${isFavorite ? 'text-amber-500' : 'text-neutral-300 hover:text-amber-400'}`}>
          {isFavorite ? '★' : '☆'}
        </button>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{config.tagline}</p>
      <div className="flex flex-wrap gap-1 text-[11px] text-neutral-500">
        <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 capitalize">{config.type}</span>
        <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 capitalize">{config.level}</span>
        {config.regionVariant && <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">{config.regionVariant}</span>}
      </div>
      <p className="text-[11px] text-neutral-500 line-clamp-2">{caps.map((k) => CAPABILITY_LABELS[k]).join(' · ')}</p>
      <div className={`text-[11px] px-2 py-1 rounded-md w-fit ${badge.className}`}>{badge.label}</div>
      <Link
        to={`/calculator/${config.id}`}
        className={`mt-auto text-center text-sm font-medium rounded-md py-2 transition-colors ${playable ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-700'}`}
        aria-label={`Open ${config.name}`}
      >
        {playable ? 'Abrir' : 'Preview'}
      </Link>
    </article>
  )
}
