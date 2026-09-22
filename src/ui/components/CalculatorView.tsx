import { useCallback, useState } from 'react'
import type { CalculatorModelConfig } from '../../models/types'
import { useCalculatorEngine } from '../hooks/useCalculatorEngine'
import { CalculatorDisplayPanel } from './CalculatorDisplayPanel'
import { KeyboardGrid } from './KeyboardGrid'
import { HistoryPanel } from './HistoryPanel'

interface Props {
  config: CalculatorModelConfig
}

export function CalculatorView({ config }: Props) {
  const { engine, state, display } = useCalculatorEngine(config)
  const [fullscreen, setFullscreen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const onKeyPress = useCallback((keyId: string) => engine.pressKey(keyId), [engine])
  const onReset = useCallback(() => {
    if (window.confirm('Reset this calculator to factory state? This clears memory and history.')) {
      engine.reset()
    }
  }, [engine])

  const onReuseHistory = useCallback(
    (input: string) => {
      const s = engine.getState()
      engine.setState({ ...s, expression: input, cursorPos: input.length, result: null, error: null })
    },
    [engine],
  )

  return (
    <div className={fullscreen ? 'fixed inset-0 z-50 bg-neutral-950 flex items-center justify-center p-4' : ''}>
      <div className={`flex gap-4 ${fullscreen ? 'items-start' : ''}`}>
        <div className={`w-full max-w-sm rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-lg ${fullscreen ? 'max-w-md' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{config.name}</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setShowHistory((v) => !v)}
                className="text-xs px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                History
              </button>
              <button
                type="button"
                onClick={onReset}
                className="text-xs px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setFullscreen((v) => !v)}
                className="text-xs px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                {fullscreen ? 'Exit' : 'Fullscreen'}
              </button>
            </div>
          </div>

          <CalculatorDisplayPanel display={display} />

          <div className="mt-3">
            <KeyboardGrid layout={engine.keyboardLayout} shift={state.shift} alpha={state.alpha} onKeyPress={onKeyPress} />
          </div>

          <div className="mt-2 text-[11px] text-neutral-400 text-center">
            Mode: {state.mode} · Angle: {state.settings.angleMode}
          </div>
        </div>

        {showHistory && (
          <div className="w-64 shrink-0">
            <HistoryPanel
              history={state.memory.history}
              onReuse={onReuseHistory}
              onClear={() => engine.setState({ ...engine.getState(), memory: { ...engine.getState().memory, history: [] } })}
            />
          </div>
        )}
      </div>
    </div>
  )
}
