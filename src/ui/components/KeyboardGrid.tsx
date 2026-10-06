import { memo, useEffect, useState } from 'react'
import type { KeyboardLayout } from '../../calculators/core/CalculatorKeyboard'
import { findKeyByPhysicalKey, resolveKeyAction } from '../../calculators/core/CalculatorKeyboard'

interface Props {
  layout: KeyboardLayout
  shift: boolean
  alpha: boolean
  onKeyPress: (keyId: string) => void
  /** Disable the global physical-keyboard listener (e.g. when two calculators are on screen). */
  captureKeyboard?: boolean
}

const VARIANT_STYLES: Record<string, string> = {
  number: 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 text-base',
  operator: 'bg-brand-100 hover:bg-brand-200 text-brand-900 dark:bg-brand-900 dark:hover:bg-brand-800 dark:text-brand-100 text-base',
  function: 'bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-700 dark:hover:bg-neutral-800 dark:text-neutral-200 text-xs',
  control: 'bg-neutral-200 hover:bg-neutral-300 text-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-100 text-xs',
  modifier: 'bg-amber-200 hover:bg-amber-300 text-amber-950 text-xs font-semibold',
}

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable
}

/**
 * Generic virtual keyboard: renders any KeyboardLayout (no per-model key
 * code here), shows SHIFT/ALPHA legends, and maps physical keys through the
 * layout's physicalKeys. Visual pressed state is shown for both pointer and
 * physical-key presses.
 */
export const KeyboardGrid = memo(function KeyboardGrid({ layout, shift, alpha, onKeyPress, captureKeyboard = true }: Props) {
  const [pressed, setPressed] = useState<string | null>(null)

  useEffect(() => {
    if (!captureKeyboard) return
    // Shift/Control act as the calculator's SHIFT/ALPHA only when tapped on
    // their own (released without another key), so typing "(" or "E" with the
    // physical Shift held never toggles the calculator's modifier by accident.
    let soloModifier: string | null = null
    function press(id: string) {
      setPressed(id)
      window.setTimeout(() => setPressed((p) => (p === id ? null : p)), 120)
      onKeyPress(id)
    }
    function onKeyUp(e: KeyboardEvent) {
      if ((e.key === 'Shift' || e.key === 'Control') && soloModifier === e.key) {
        const key = findKeyByPhysicalKey(layout, e.key)
        if (key && !isTypingTarget(e.target)) press(key.id)
      }
      soloModifier = null
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Shift' || e.key === 'Control') {
        soloModifier = e.repeat ? soloModifier : e.key
        return
      }
      soloModifier = null
      if (isTypingTarget(e.target) || e.metaKey || e.altKey || e.ctrlKey) return
      const key = findKeyByPhysicalKey(layout, e.key)
      if (!key) return
      // Keep Tab for normal focus navigation unless focus is inside the calculator.
      if (e.key === 'Tab' && !(e.target as HTMLElement)?.closest?.('[data-keyboard-grid]')) return
      e.preventDefault()
      press(key.id)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [layout, onKeyPress, captureKeyboard])

  return (
    <div
      data-keyboard-grid
      className="grid gap-1.5 select-none touch-manipulation"
      style={{ gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))` }}
      role="group"
      aria-label={`${layout.name} keyboard`}
    >
      {layout.keys.map((key) => {
        const action = resolveKeyAction(key, shift, alpha)
        const style = VARIANT_STYLES[key.variant ?? 'function']
        const physical = key.physicalKeys?.length ? ` (key: ${key.physicalKeys.join(' / ')})` : ''
        const secondary = [key.shift && `SHIFT: ${key.shift.label}`, key.alpha && `ALPHA: ${key.alpha.label}`].filter(Boolean).join(' · ')
        return (
          <button
            key={key.id}
            type="button"
            title={[key.tooltip, secondary, physical.trim()].filter(Boolean).join(' — ') || undefined}
            aria-label={action.label}
            data-key-id={key.id}
            className={`relative rounded-lg pt-3 pb-1.5 px-1 font-medium shadow-sm transition-transform duration-75 active:scale-95 active:brightness-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 min-h-11 ${style} ${pressed === key.id ? 'scale-95 brightness-90' : ''}`}
            style={{ gridColumn: `${key.col} / span ${key.colSpan ?? 1}`, gridRow: key.row }}
            onClick={() => onKeyPress(key.id)}
          >
            {key.shift && (
              <span aria-hidden className={`absolute top-0.5 left-1 text-[9px] leading-none ${shift ? 'text-amber-700 font-bold' : 'text-amber-600 dark:text-amber-400'}`}>
                {key.shift.label}
              </span>
            )}
            {key.alpha && (
              <span aria-hidden className={`absolute top-0.5 right-1 text-[9px] leading-none ${alpha ? 'text-red-700 font-bold' : 'text-red-600 dark:text-red-400'}`}>
                {key.alpha.label}
              </span>
            )}
            <span>{action.label}</span>
          </button>
        )
      })}
    </div>
  )
})
