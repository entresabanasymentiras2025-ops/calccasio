import { useEffect } from 'react'
import type { KeyboardLayout } from '../../calculators/core/CalculatorKeyboard'
import { findKeyByPhysicalKey, resolveKeyAction } from '../../calculators/core/CalculatorKeyboard'

interface Props {
  layout: KeyboardLayout
  shift: boolean
  alpha: boolean
  onKeyPress: (keyId: string) => void
}

const VARIANT_STYLES: Record<string, string> = {
  number: 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100',
  operator: 'bg-brand-100 hover:bg-brand-200 text-brand-900 dark:bg-brand-900 dark:hover:bg-brand-800 dark:text-brand-100',
  function: 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-200 text-xs',
  control: 'bg-neutral-200 hover:bg-neutral-300 text-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-100 text-xs',
  modifier: 'bg-amber-200 hover:bg-amber-300 text-amber-950 text-xs font-semibold',
}

export function KeyboardGrid({ layout, shift, alpha, onKeyPress }: Props) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const key = findKeyByPhysicalKey(layout, e.key)
      if (!key) return
      // Avoid stealing browser Tab navigation away from other focusable elements
      // on the page unless the calculator itself has focus.
      if (key.id === 'ALPHA' && !(e.target as HTMLElement)?.closest('[data-keyboard-grid]')) return
      e.preventDefault()
      onKeyPress(key.id)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [layout, onKeyPress])

  return (
    <div
      data-keyboard-grid
      className="grid gap-1.5 select-none"
      style={{ gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))` }}
      role="group"
      aria-label={`${layout.name} keyboard`}
    >
      {layout.keys.map((key) => {
        const action = resolveKeyAction(key, shift, alpha)
        const style = VARIANT_STYLES[key.variant ?? 'function']
        return (
          <button
            key={key.id}
            type="button"
            title={key.tooltip}
            aria-label={action.label}
            className={`relative rounded-md py-2.5 px-1 text-sm font-medium shadow-sm active:scale-95 active:brightness-90 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 min-h-11 ${style}`}
            style={{
              gridColumn: `${key.col} / span ${key.colSpan ?? 1}`,
              gridRow: key.row,
            }}
            onClick={() => onKeyPress(key.id)}
          >
            {key.shift && (
              <span className="absolute top-0.5 left-1 text-[9px] leading-none text-amber-600 dark:text-amber-400">{key.shift.label}</span>
            )}
            {key.alpha && (
              <span className="absolute top-0.5 right-1 text-[9px] leading-none text-red-600 dark:text-red-400">{key.alpha.label}</span>
            )}
            <span>{action.label}</span>
          </button>
        )
      })}
    </div>
  )
}
