import { useState } from 'react'
import type { HistoryEntry } from '../../calculators/core/CalculatorMemory'

interface Props {
  history: HistoryEntry[]
  onReuse: (input: string) => void
  onDelete: (id: string) => void
  onClear: () => void
}

/** Calculation history: repeat, copy, delete one, clear all. Data comes from the engine's persisted memory. */
export function HistoryPanel({ history, onReuse, onDelete, onClear }: Props) {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = async (entry: HistoryEntry) => {
    const text = `${entry.input} = ${entry.result}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(entry.id)
      window.setTimeout(() => setCopied(null), 1200)
    } catch {
      setCopied(null)
    }
  }
  return (
    <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 max-h-[32rem] overflow-y-auto" aria-label="History">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">History</h3>
        {history.length > 0 && (
          <button type="button" onClick={onClear} className="text-[11px] text-neutral-500 hover:text-red-600">
            Clear history
          </button>
        )}
      </div>
      {history.length === 0 ? (
        <p className="text-xs text-neutral-500">No calculations yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {[...history].reverse().map((entry) => (
            <li key={entry.id} className="group rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800 px-2 py-1.5">
              <div className="text-xs font-mono text-neutral-500 break-all">{entry.input}</div>
              <div className="text-xs font-mono font-semibold text-neutral-900 dark:text-neutral-100 break-all">= {entry.result}</div>
              <div className="flex gap-2 mt-1 text-[11px]">
                <button type="button" className="text-brand-600 hover:underline" onClick={() => onReuse(entry.input)} aria-label={`Repeat ${entry.input}`}>
                  Repeat
                </button>
                <button type="button" className="text-neutral-500 hover:underline" onClick={() => copy(entry)} aria-label={`Copy ${entry.input}`}>
                  {copied === entry.id ? 'Copied ✓' : 'Copy'}
                </button>
                <button type="button" className="text-neutral-500 hover:text-red-600 hover:underline" onClick={() => onDelete(entry.id)} aria-label={`Delete ${entry.input}`}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
