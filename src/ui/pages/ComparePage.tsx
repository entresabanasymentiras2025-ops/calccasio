import { useState } from 'react'
import { calculatorCatalog, getCalculatorById } from '../../models/calculatorCatalog'
import type { CalculatorCapabilities } from '../../models/types'

const CAPABILITY_LABELS: Record<keyof CalculatorCapabilities, string> = {
  arithmetic: 'Arithmetic',
  fractions: 'Fractions',
  complex: 'Complex numbers',
  matrices: 'Matrices',
  vectors: 'Vectors',
  statistics: 'Statistics',
  calculus: 'Calculus',
  equation: 'Equation solver',
  table: 'Table',
  baseN: 'Base-N',
  ratio: 'Ratio',
  distribution: 'Distribution',
  spreadsheet: 'Spreadsheet',
  graphing: 'Graphing',
  programming: 'Programming',
  cas: 'CAS (symbolic algebra)',
  finance: 'Finance',
}

function CalculatorSelect({ value, onChange, label }: { value: string; onChange: (id: string) => void; label: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-neutral-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2"
      >
        {calculatorCatalog.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  )
}

export function ComparePage() {
  const [idA, setIdA] = useState(calculatorCatalog[0].id)
  const [idB, setIdB] = useState(calculatorCatalog[1].id)
  const a = getCalculatorById(idA)!
  const b = getCalculatorById(idB)!

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Compare calculators</h1>
      <p className="text-sm text-neutral-500 mt-1">A plain functional comparison — no subjective rankings.</p>

      <div className="grid grid-cols-2 gap-4 mt-6 max-w-xl">
        <CalculatorSelect value={idA} onChange={setIdA} label="Calculator A" />
        <CalculatorSelect value={idB} onChange={setIdB} label="Calculator B" />
      </div>

      <table className="mt-8 w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-neutral-200 dark:border-neutral-800">
            <th className="text-left py-2 font-medium text-neutral-500">Feature</th>
            <th className="text-center py-2 font-medium">{a.name}</th>
            <th className="text-center py-2 font-medium">{b.name}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-neutral-100 dark:border-neutral-900">
            <td className="py-2 text-neutral-500">Type</td>
            <td className="text-center capitalize">{a.type}</td>
            <td className="text-center capitalize">{b.type}</td>
          </tr>
          <tr className="border-b border-neutral-100 dark:border-neutral-900">
            <td className="py-2 text-neutral-500">Level</td>
            <td className="text-center capitalize">{a.level}</td>
            <td className="text-center capitalize">{b.level}</td>
          </tr>
          <tr className="border-b border-neutral-100 dark:border-neutral-900">
            <td className="py-2 text-neutral-500">Implementation</td>
            <td className="text-center capitalize">{a.implementationStatus}</td>
            <td className="text-center capitalize">{b.implementationStatus}</td>
          </tr>
          {(Object.keys(CAPABILITY_LABELS) as (keyof CalculatorCapabilities)[]).map((key) => (
            <tr key={key} className="border-b border-neutral-100 dark:border-neutral-900">
              <td className="py-2 text-neutral-500">{CAPABILITY_LABELS[key]}</td>
              <td className="text-center">{a.capabilities[key] ? '✓' : '—'}</td>
              <td className="text-center">{b.capabilities[key] ? '✓' : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
