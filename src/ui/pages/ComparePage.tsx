import { useSearchParams } from 'react-router-dom'
import { calculatorCatalog, getCalculatorById, missingCapabilities } from '../../models/calculatorCatalog'
import type { CalculatorCapabilities, CalculatorModelConfig } from '../../models/types'
import { CAPABILITY_LABELS } from '../capabilityLabels'
import { getDisplayProfile } from '../../calculators/registry'
import { usePageMeta } from '../hooks/usePageMeta'

function CalculatorSelect({ value, onChange, label }: { value: string; onChange: (id: string) => void; label: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-neutral-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2">
        {calculatorCatalog.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.familyLabel})
          </option>
        ))}
      </select>
    </label>
  )
}

function screenText(c: CalculatorModelConfig): string {
  const p = getDisplayProfile(c.displayProfile)
  if (p) return `${p.width}×${p.height} dots, ${p.color ? 'colour' : 'monochrome'}`
  return c.type === 'financial' ? 'Character LCD (multi-line)' : c.family === 'ms' ? 'Two-line character LCD' : 'Natural-display character LCD'
}

function capCell(c: CalculatorModelConfig, k: keyof CalculatorCapabilities): string {
  if (!c.capabilities[k]) return '—'
  return missingCapabilities(c).includes(k) ? '✓ (here: coming soon)' : '✓'
}

/** Functional, non-subjective comparison of two models (no rankings). */
export function ComparePage() {
  usePageMeta('Compare calculators | CASIO Emulator Hub', 'Side-by-side functional comparison of calculator models.')
  const [params, setParams] = useSearchParams()
  const idA = params.get('a') ?? 'fx-991cw'
  const idB = params.get('b') ?? 'fx-cg50'
  const a = getCalculatorById(idA) ?? calculatorCatalog[0]
  const b = getCalculatorById(idB) ?? calculatorCatalog[1]
  const set = (k: 'a' | 'b', v: string) => {
    const next = new URLSearchParams(params)
    next.set(k, v)
    setParams(next, { replace: true })
  }
  const rows: Array<[string, (c: CalculatorModelConfig) => string]> = [
    ['Type', (c) => c.type],
    ['Level', (c) => c.level],
    ['Family / engine', (c) => `${c.familyLabel} / ${c.engine}`],
    ['Screen', screenText],
    ['Memory', (c) => (c.engine === 'classpad' ? 'Variables + document history' : c.type === 'graphing' ? 'Variables A–Z, lists, programs' : 'Variables, Ans, independent memory M')],
    ['Implementation', (c) => c.implementationStatus],
  ]
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Compare calculators</h1>
      <p className="text-sm text-neutral-500 mt-1">A plain functional comparison — no subjective rankings.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 max-w-2xl">
        <CalculatorSelect value={a.id} onChange={(v) => set('a', v)} label="Calculator A" />
        <CalculatorSelect value={b.id} onChange={(v) => set('b', v)} label="Calculator B" />
      </div>
      <div className="overflow-x-auto">
        <table className="mt-8 w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-800">
              <th className="text-left py-2 font-medium text-neutral-500">Feature</th>
              <th className="text-center py-2 font-medium">{a.name}</th>
              <th className="text-center py-2 font-medium">{b.name}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, f]) => (
              <tr key={label} className="border-b border-neutral-100 dark:border-neutral-900">
                <td className="py-2 text-neutral-500">{label}</td>
                <td className="text-center capitalize">{f(a)}</td>
                <td className="text-center capitalize">{f(b)}</td>
              </tr>
            ))}
            {(Object.keys(CAPABILITY_LABELS) as (keyof CalculatorCapabilities)[]).map((key) => (
              <tr key={key} className={`border-b border-neutral-100 dark:border-neutral-900 ${a.capabilities[key] !== b.capabilities[key] ? 'bg-brand-50/60 dark:bg-brand-900/20' : ''}`}>
                <td className="py-2 text-neutral-500">{CAPABILITY_LABELS[key]}</td>
                <td className="text-center">{capCell(a, key)}</td>
                <td className="text-center">{capCell(b, key)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-neutral-500 mt-4">Highlighted rows differ. “✓” means the real model has the feature (per public product information); “coming soon” marks features this emulator has not built yet.</p>
    </div>
  )
}
