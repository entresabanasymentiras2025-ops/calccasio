import { useMemo, useState, useSyncExternalStore } from 'react'
import { calculatorCatalog, getCalculatorById } from '../../models/calculatorCatalog'
import { useCalculatorEngine, useEngineLoader } from '../hooks/useCalculatorEngine'
import { CalculatorDisplayPanel } from '../components/CalculatorDisplayPanel'
import { KeyboardGrid } from '../components/KeyboardGrid'
import { tokenize } from '../../math/parser/tokenizer'
import { parse } from '../../math/parser/parser'
import { normalizeExpression } from '../../math/parser/normalize'
import { serializeState } from '../../calculators/core/serialization'
import type { CalculatorEventType } from '../../calculators/core/CalculatorEvent'
import type { CalculatorModelConfig } from '../../models/types'
import { logger } from '../../utils/logger'

const EVENTS: CalculatorEventType[] = ['SHIFT', 'ALPHA', 'MODE', 'MENU', 'ENTER', 'CLEAR', 'BACKSPACE', 'DELETE', 'NAV_UP', 'NAV_DOWN', 'NAV_LEFT', 'NAV_RIGHT', 'ZOOM_IN', 'ZOOM_OUT', 'RESET']

/**
 * Internal developer tool (not linked from public navigation). Available in
 * development builds, or in production after opting in with ?dev=1 (stored
 * in sessionStorage). It never exposes anything beyond this browser's own
 * calculator state.
 */
export function DevInspectorPage() {
  const allowed = useMemo(() => {
    if (import.meta.env.DEV) return true
    try {
      if (new URLSearchParams(window.location.search).get('dev') === '1') sessionStorage.setItem('hub-dev', '1')
      return sessionStorage.getItem('hub-dev') === '1'
    } catch {
      return false
    }
  }, [])
  const [modelId, setModelId] = useState('fx-991cw')
  const config = getCalculatorById(modelId)!
  if (!allowed) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Not available</h1>
        <p className="text-sm text-neutral-500 mt-2">This internal tool is disabled in production builds.</p>
      </div>
    )
  }
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold">Calculator inspector</h1>
      <label className="text-sm flex gap-2 items-center mt-3">
        Model
        <select value={modelId} onChange={(e) => setModelId(e.target.value)} className="border rounded px-2 py-1 bg-white dark:bg-neutral-900">
          {calculatorCatalog.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <Loaded key={config.id} config={config} />
    </div>
  )
}

function Loaded({ config }: { config: CalculatorModelConfig }) {
  const { ready, error } = useEngineLoader(config.engine)
  if (error) return <p className="text-red-600">{error}</p>
  if (!ready) return <p>Loading engine…</p>
  return <Inspector config={config} />
}

function Inspector({ config }: { config: CalculatorModelConfig }) {
  const { engine, state, display } = useCalculatorEngine(config)
  const [expr, setExpr] = useState('2+3sin(30)^2')
  const logs = useSyncExternalStore(logger.subscribe, () => logger.entries().length)
  const [debug, setDebug] = useState(logger.isDebugEnabled())

  let tokens = ''
  let ast = ''
  try {
    tokens = JSON.stringify(tokenize(normalizeExpression(expr)).map((t) => `${t.type}:${t.value}`))
    ast = JSON.stringify(parse(expr, { allowEquations: true }), null, 2)
  } catch (err) {
    ast = String(err)
  }
  const stateJson = JSON.stringify(JSON.parse(serializeState(state)), null, 2)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      <div>
        <CalculatorDisplayPanel display={display} onTouch={(t) => engine.execute({ type: 'TOUCH', payload: { target: t } })} onText={(t) => engine.execute({ type: 'TEXT_INPUT', payload: t })} />
        <div className="mt-2">
          <KeyboardGrid layout={engine.keyboardLayout} shift={state.shift} alpha={state.alpha} onKeyPress={(k) => engine.pressKey(k)} />
        </div>
        <h2 className="font-semibold mt-4 text-sm">Dispatch events</h2>
        <div className="flex flex-wrap gap-1 mt-1">
          {EVENTS.map((ev) => (
            <button key={ev} type="button" className="text-[11px] px-2 py-0.5 rounded border" onClick={() => engine.execute({ type: ev })}>
              {ev}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <h2 className="font-semibold text-sm">State</h2>
        <pre className="text-[10px] bg-neutral-100 dark:bg-neutral-900 p-2 rounded max-h-96 overflow-auto">{stateJson}</pre>
        <h2 className="font-semibold text-sm">Memory</h2>
        <pre className="text-[10px] bg-neutral-100 dark:bg-neutral-900 p-2 rounded max-h-40 overflow-auto">{serializeState(engine.getMemory())}</pre>
      </div>
      <div className="space-y-3">
        <h2 className="font-semibold text-sm">Tokens / AST</h2>
        <input value={expr} onChange={(e) => setExpr(e.target.value)} className="w-full border rounded px-2 py-1 font-mono text-sm bg-white dark:bg-neutral-900" aria-label="Expression to inspect" />
        <pre className="text-[10px] bg-neutral-100 dark:bg-neutral-900 p-2 rounded overflow-auto">{tokens}</pre>
        <pre className="text-[10px] bg-neutral-100 dark:bg-neutral-900 p-2 rounded max-h-64 overflow-auto">{ast}</pre>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Logs ({logs})</h2>
          <label className="text-xs flex gap-1 items-center">
            <input
              type="checkbox"
              checked={debug}
              onChange={(e) => {
                logger.setDebug(e.target.checked)
                setDebug(e.target.checked)
              }}
            />
            debug
          </label>
        </div>
        <pre className="text-[10px] bg-neutral-100 dark:bg-neutral-900 p-2 rounded max-h-64 overflow-auto">
          {logger
            .entries()
            .slice(-60)
            .map((l) => `${new Date(l.time).toISOString().slice(11, 19)} ${l.level.toUpperCase()} ${l.args.join(' ')}`)
            .join('\n')}
        </pre>
      </div>
    </div>
  )
}
