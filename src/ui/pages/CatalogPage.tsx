import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { calculatorCatalog } from '../../models/calculatorCatalog'
import type { CalculatorType, CalculatorLevel, ImplementationStatus } from '../../models/types'
import { CalculatorCard } from '../components/CalculatorCard'
import { usePageMeta } from '../hooks/usePageMeta'

const TYPES: { value: CalculatorType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'scientific', label: 'Científica' },
  { value: 'graphing', label: 'Gráfica' },
  { value: 'cas', label: 'CAS' },
  { value: 'financial', label: 'Financiera' },
]
const LEVELS: { value: CalculatorLevel | 'all'; label: string }[] = [
  { value: 'all', label: 'All levels' },
  { value: 'basic', label: 'Básica' },
  { value: 'intermediate', label: 'Intermedia' },
  { value: 'advanced', label: 'Avanzada' },
]
const STATUSES: { value: ImplementationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Any status' },
  { value: 'full', label: '🟢 Core implemented' },
  { value: 'partial', label: '🟡 Partial' },
  { value: 'planned', label: '⚪ Planned' },
]

export function CatalogPage() {
  usePageMeta('Calculator catalog | CASIO Emulator Hub', 'Browse independent web emulations of scientific, graphing, CAS and financial calculators.')
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const type = (params.get('type') ?? 'all') as CalculatorType | 'all'
  const level = (params.get('level') ?? 'all') as CalculatorLevel | 'all'
  const status = (params.get('status') ?? 'all') as ImplementationStatus | 'all'
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (!value || value === 'all') next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return calculatorCatalog.filter((c) => {
      if (type !== 'all' && c.type !== type) return false
      if (level !== 'all' && c.level !== level) return false
      if (status !== 'all' && c.implementationStatus !== status) return false
      if (q && ![c.name, c.id, c.familyLabel, c.regionVariant ?? ''].some((s) => s.toLowerCase().includes(q))) return false
      return true
    })
  }, [query, type, level, status])
  const families = new Set(calculatorCatalog.map((c) => c.family)).size

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Calculators</h1>
      <p className="text-sm text-neutral-500 mt-1">
        {calculatorCatalog.length} models across {families} families · showing {results.length}
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => set('q', e.target.value)}
          placeholder="Buscar calculadora..."
          aria-label="Buscar calculadora"
          className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by type">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={type === t.value}
              onClick={() => set('type', t.value)}
              className={`text-sm px-3 py-1 rounded-full border ${type === t.value ? 'bg-brand-600 text-white border-brand-600' : 'border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
            >
              {t.label}
            </button>
          ))}
          <select value={level} onChange={(e) => set('level', e.target.value)} aria-label="Level" className="rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1 text-sm">
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <select value={status} onChange={(e) => set('status', e.target.value)} aria-label="Implementation status" className="rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1 text-sm">
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {results.map((c) => (
          <CalculatorCard key={c.id} config={c} />
        ))}
      </div>
      {results.length === 0 && <p className="text-center text-neutral-500 mt-12">No calculators match your search.</p>}
    </div>
  )
}
