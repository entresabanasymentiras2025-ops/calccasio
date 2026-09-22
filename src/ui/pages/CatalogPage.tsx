import { useMemo, useState } from 'react'
import { calculatorCatalog } from '../../models/calculatorCatalog'
import type { CalculatorType, CalculatorLevel } from '../../models/types'
import { CalculatorCard } from '../components/CalculatorCard'

const TYPES: { value: CalculatorType | 'all'; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'scientific', label: 'Scientific' },
  { value: 'graphing', label: 'Graphing' },
  { value: 'cas', label: 'CAS' },
  { value: 'financial', label: 'Financial' },
]

const LEVELS: { value: CalculatorLevel | 'all'; label: string }[] = [
  { value: 'all', label: 'All levels' },
  { value: 'basic', label: 'Basic' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

export function CatalogPage() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<CalculatorType | 'all'>('all')
  const [level, setLevel] = useState<CalculatorLevel | 'all'>('all')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return calculatorCatalog.filter((c) => {
      if (type !== 'all' && c.type !== type) return false
      if (level !== 'all' && c.level !== level) return false
      if (q && !c.name.toLowerCase().includes(q) && !c.familyLabel.toLowerCase().includes(q)) return false
      return true
    })
  }, [query, type, level])

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Calculators</h1>
      <p className="text-sm text-neutral-500 mt-1">{calculatorCatalog.length} models across 9 families.</p>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar calculadora..."
          className="flex-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as CalculatorType | 'all')}
          className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value as CalculatorLevel | 'all')}
          className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
        >
          {LEVELS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
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
