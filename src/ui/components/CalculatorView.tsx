import { useCallback, useEffect, useRef, useState } from 'react'
import type { CalculatorModelConfig } from '../../models/types'
import { useCalculatorEngine } from '../hooks/useCalculatorEngine'
import { CalculatorDisplayPanel } from './CalculatorDisplayPanel'
import { KeyboardGrid } from './KeyboardGrid'
import { HistoryPanel } from './HistoryPanel'
import { ShortcutsDialog } from './ShortcutsDialog'
import { loadRaw, saveRaw } from '../../storage/localStorage'

interface Props {
  config: CalculatorModelConfig
  /** Show the side history panel initially. */
  initialHistory?: boolean
}

/**
 * Hosts one calculator: display + keyboard + toolbar (history, snapshot
 * save/restore, reset, shortcuts, fullscreen). All behaviour comes from the
 * engine; this component only forwards events and renders engine output.
 */
export function CalculatorView({ config, initialHistory = false }: Props) {
  const { engine, state, display } = useCalculatorEngine(config)
  const [fullscreen, setFullscreen] = useState(false)
  const [showHistory, setShowHistory] = useState(initialHistory)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const flash = (msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(null), 1600)
  }

  const onKeyPress = useCallback((keyId: string) => engine.pressKey(keyId), [engine])
  const onTouch = useCallback((target: string) => engine.execute({ type: 'TOUCH', payload: { target } }), [engine])
  const onText = useCallback((text: string) => engine.execute({ type: 'TEXT_INPUT', payload: text }), [engine])

  const onReset = useCallback(() => {
    if (window.confirm('Reset this calculator to factory state? This clears memory, variables and history.')) {
      engine.reset()
      flash('Calculator reset')
    }
  }, [engine])

  const onSaveSnapshot = () => {
    saveRaw(`snapshot:${config.id}`, engine.saveState())
    flash('State saved')
  }
  const onRestoreSnapshot = () => {
    const snap = loadRaw(`snapshot:${config.id}`)
    if (!snap) return flash('No saved state yet')
    try {
      engine.loadState(snap)
      flash('State restored')
    } catch {
      flash('Saved state is incompatible')
    }
  }

  const onReuseHistory = useCallback(
    (input: string) => {
      if (engine.getDisplay().kind === 'document') {
        engine.execute({ type: 'TEXT_INPUT', payload: input })
        return
      }
      const s = engine.getState()
      engine.setState({ ...s, expression: input, cursorPos: input.length, result: null, error: null })
    },
    [engine],
  )
  const setHistory = (history: typeof state.memory.history) => {
    const s = engine.getState()
    engine.setState({ ...s, memory: { ...s.memory, history } })
  }

  const toggleFullscreen = async () => {
    const next = !fullscreen
    setFullscreen(next)
    try {
      if (next && rootRef.current?.requestFullscreen && !document.fullscreenElement) await rootRef.current.requestFullscreen()
      if (!next && document.fullscreenElement) await document.exitFullscreen()
    } catch {
      // Fullscreen API can be unavailable (iOS Safari, iframes): the overlay still works.
    }
  }
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setFullscreen(false)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])
  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F11') return
      if (e.key === 'Escape' && !document.fullscreenElement && e.shiftKey) setFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen])

  const btn = 'text-xs px-2 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-brand-500'
  const wide = config.type === 'graphing' || config.type === 'cas'

  return (
    <div
      ref={rootRef}
      className={fullscreen ? 'fixed inset-0 z-50 bg-neutral-100 dark:bg-neutral-950 overflow-auto flex items-start sm:items-center justify-center p-2 sm:p-4' : ''}
      data-fullscreen={fullscreen || undefined}
    >
      <div className="flex flex-col lg:flex-row gap-4 items-start w-full justify-center">
        <div
          className={`calculator-shell w-full rounded-3xl border border-neutral-300 dark:border-neutral-700 bg-gradient-to-b from-neutral-50 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 p-3 sm:p-4 shadow-xl mx-auto ${wide ? 'max-w-md' : 'max-w-sm'}`}
          style={fullscreen ? { maxWidth: `min(${wide ? 30 : 26}rem, calc((100dvh - 2rem) * ${wide ? 0.62 : 0.52}))` } : undefined}
        >
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-600 dark:text-neutral-300">{config.name}</span>
            <div className="flex gap-1 flex-wrap" role="toolbar" aria-label="Calculator actions">
              <button type="button" onClick={() => setShowHistory((v) => !v)} className={btn} aria-pressed={showHistory}>
                History
              </button>
              <button type="button" onClick={() => setShowShortcuts(true)} className={btn}>
                Shortcuts
              </button>
              <button type="button" onClick={onSaveSnapshot} className={btn} title="Save a snapshot of the full state">
                Save
              </button>
              <button type="button" onClick={onRestoreSnapshot} className={btn} title="Restore the saved snapshot">
                Restore
              </button>
              <button type="button" onClick={onReset} className={btn}>
                Reset
              </button>
              <button type="button" onClick={toggleFullscreen} className={btn} aria-pressed={fullscreen}>
                {fullscreen ? 'Exit' : 'Fullscreen'}
              </button>
            </div>
          </div>

          <CalculatorDisplayPanel display={display} onTouch={onTouch} onText={onText} />

          <div className="mt-3">
            <KeyboardGrid layout={engine.keyboardLayout} shift={state.shift} alpha={state.alpha} onKeyPress={onKeyPress} />
          </div>

          <div className="mt-2 text-[11px] text-neutral-500 text-center" aria-live="polite">
            {notice ?? (
              <>
                Mode: <span data-testid="current-mode">{state.mode}</span> · Angle: {state.settings.angleMode}
              </>
            )}
          </div>
        </div>

        {showHistory && (
          <div className="w-full lg:w-72 shrink-0">
            <HistoryPanel
              history={state.memory.history}
              onReuse={onReuseHistory}
              onDelete={(id) => setHistory(state.memory.history.filter((h) => h.id !== id))}
              onClear={() => setHistory([])}
            />
          </div>
        )}
      </div>
      {showShortcuts && <ShortcutsDialog layout={engine.keyboardLayout} onClose={() => setShowShortcuts(false)} />}
    </div>
  )
}
