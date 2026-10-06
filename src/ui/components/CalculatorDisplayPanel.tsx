import { lazy, Suspense } from 'react'
import type { CalculatorDisplayState } from '../../calculators/core/CalculatorDisplay'
import { TextDisplay } from './TextDisplay'

const ScreenDisplay = lazy(() => import('./ScreenDisplay'))
const DocumentDisplay = lazy(() => import('./DocumentDisplay'))

interface Props {
  display: CalculatorDisplayState
  onTouch?: (target: string, payload?: unknown) => void
}

/** Picks the renderer for the engine's display model; no calculator logic here. */
export function CalculatorDisplayPanel({ display, onTouch }: Props) {
  if (display.kind === 'text') return <TextDisplay display={display} />
  return (
    <Suspense fallback={<div className="h-48 rounded-lg bg-neutral-200 dark:bg-neutral-800 animate-pulse" role="status">Loading display…</div>}>
      {display.kind === 'screen' ? <ScreenDisplay display={display} /> : <DocumentDisplay display={display} onTouch={onTouch} />}
    </Suspense>
  )
}
