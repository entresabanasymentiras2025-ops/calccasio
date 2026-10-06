import { useEffect, useRef } from 'react'
import type { KeyboardLayout } from '../../calculators/core/CalculatorKeyboard'

const PRETTY: Record<string, string> = { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Escape: 'Esc', Backspace: '⌫', Delete: 'Del', Control: 'Ctrl (tap)', Shift: 'Shift (tap)' }

/** Lists the physical-keyboard shortcuts declared by the current model's layout. */
export function ShortcutsDialog({ layout, onClose }: { layout: KeyboardLayout; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const rows = layout.keys.filter((k) => k.physicalKeys?.length)
  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto p-5 outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Keyboard shortcuts — {layout.name}</h2>
          <button type="button" onClick={onClose} className="text-sm px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">
            Close
          </button>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {rows.map((k) => (
              <tr key={k.id} className="border-b border-neutral-100 dark:border-neutral-800">
                <td className="py-1 font-mono">{k.physicalKeys!.map((p) => PRETTY[p] ?? p).join(' / ')}</td>
                <td className="py-1 text-right">{k.primary.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-neutral-500 mt-3">Tap Shift or Ctrl on their own to toggle the calculator&apos;s SHIFT / ALPHA. Shortcuts are ignored while typing in a text field.</p>
      </div>
    </div>
  )
}
