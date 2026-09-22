import type { HistoryEntry } from '../../calculators/core/CalculatorMemory'

interface Props {
  history: HistoryEntry[]
  onReuse: (input: string) => void
  onClear: () => void
}

export function HistoryPanel({ history, onReuse, onClear }: Props) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 max-h-[32rem] overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">History</h3>
        {history.length > 0 && (
          <button type="button" onClick={onClear} className="text-[11px] text-neutral-400 hover:text-red-500">
            Clear
          </button>
        )}
      </div>
      {history.length === 0 ? (
        <p className="text-xs text-neutral-400">No calculations yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {[...history].reverse().map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => onReuse(entry.input)}
                className="w-full text-left text-xs font-mono rounded-md px-2 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                title="Reuse this expression"
              >
                <div className="text-neutral-500 truncate">{entry.input}</div>
                <div className="text-neutral-900 dark:text-neutral-100 font-semibold">= {entry.result}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
