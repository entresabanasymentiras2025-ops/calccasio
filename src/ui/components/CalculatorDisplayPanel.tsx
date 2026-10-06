import { lazy, Suspense } from 'react'
import type { CalculatorDisplayState } from '../../calculators/core/CalculatorDisplay'
import { TextDisplay } from './TextDisplay'

const ScreenDisplay = lazy(() => import('./ScreenDisplay'))
const DocumentDisplay = lazy(() => import('./DocumentDisplay'))

interface Props {
  display: CalculatorDisplayState
  onTouch?: (target: string) => void
  onText?: (text: string) => void
}

/** Picks the renderer for the engine's display model; no calculator logic here. */
export function CalculatorDisplayPanel({ display, onTouch, onText }: Props) {
  if (display.kind === 'text') return <TextDisplay display={display} />
  return (
    <Suspense fallback={<div className="h-48 rounded-lg bg-neutral-200 dark:bg-neutral-800 animate-pulse">Loading display…</div>}>
      {display.kind === 'screen' ? (
        <>
          <ScreenDisplay display={display} />
          {display.textEntry && (
            <div className="mt-2">
              <label className="text-xs font-semibold text-neutral-500" htmlFor="program-editor">
                {display.textEntry.label} — editor (EXIT to return)
              </label>
              <textarea
                id="program-editor"
                value={display.textEntry.value}
                onChange={(e) => onText?.(e.target.value)}
                rows={8}
                spellCheck={false}
                className="w-full mt-1 font-mono text-xs p-2 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              />
            </div>
          )}
        </>
      ) : (
        <DocumentDisplay display={display} onTouch={onTouch} onText={onText} />
      )}
    </Suspense>
  )
}
