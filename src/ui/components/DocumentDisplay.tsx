import { useEffect, useRef } from 'react'
import type { DocumentDisplayState, ScreenDisplayState } from '../../calculators/core/CalculatorDisplay'
import ScreenDisplay from './ScreenDisplay'

interface Props {
  display: DocumentDisplayState
  onTouch?: (target: string, payload?: unknown) => void
  onText?: (text: string) => void
}

/**
 * Touch-screen renderer for ClassPad-style engines. Everything tappable
 * (apps, toolbar, history entries, soft keyboard) is a real <button> that
 * sends a TOUCH target back to the engine; the input line is a text field
 * that sends TEXT_INPUT. Layout and key sets all come from the engine.
 */
export default function DocumentDisplay({ display, onTouch, onText }: Props) {
  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [display.entries.length])

  const touch = (target: string) => onTouch?.(target)
  const graphScreen: ScreenDisplayState | null = display.graph
    ? {
        kind: 'screen',
        profile: { id: 'classpad-graph', width: 320, height: 220, color: true, background: '#ffffff', foreground: '#111111' },
        statusBar: display.status,
        indicators: [],
        content: display.graph,
        errorMessage: null,
      }
    : null

  return (
    <div className="rounded-lg bg-white text-neutral-900 border border-neutral-300 shadow-inner overflow-hidden select-none" data-testid="document-display">
      <div className="flex items-center justify-between bg-neutral-800 text-neutral-100 text-[11px] px-2 py-1">
        <div className="flex gap-1" role="tablist" aria-label="Applications">
          {display.apps.map((a) => (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={a.id === display.app}
              onClick={() => touch(`app:${a.id}`)}
              className={`px-2 py-0.5 rounded ${a.id === display.app ? 'bg-brand-500 text-white' : 'hover:bg-neutral-700'}`}
            >
              {a.label}
            </button>
          ))}
        </div>
        <span className="font-mono">{display.status}</span>
      </div>
      <div className="flex flex-wrap gap-1 px-1.5 py-1 bg-neutral-100 border-b border-neutral-200" role="toolbar" aria-label="Commands">
        {display.toolbar.map((t) => (
          <button key={t.id} type="button" onClick={() => touch(t.id)} className="text-[11px] px-2 py-1 rounded bg-white border border-neutral-300 hover:bg-brand-50 active:bg-brand-100">
            {t.label}
          </button>
        ))}
      </div>

      {graphScreen && (
        <div className="border-b border-neutral-200">
          <ScreenDisplay display={graphScreen} />
        </div>
      )}

      <div ref={listRef} className={`${graphScreen ? 'h-24' : 'h-56'} overflow-y-auto px-2 py-1 font-mono text-sm`} role="log" aria-live="polite">
        {display.entries.length === 0 && <p className="text-neutral-400 text-xs py-2">{display.app === 'main' ? 'Type an expression, e.g. factor(x^2-5x+6), and press EXE.' : 'Type y = f(x) (e.g. x^2-1) and press EXE to add a graph.'}</p>}
        {display.entries.map((e, i) => (
          <button key={i} type="button" onClick={() => touch(`entry:${i}`)} className="block w-full text-left border-b border-neutral-100 py-1 hover:bg-neutral-50" title="Tap to reuse the result">
            <div className="text-neutral-700 break-all">{e.input}</div>
            {e.output && <div className={`text-right break-all ${e.error ? 'text-red-600' : 'text-neutral-950 font-semibold'}`}>{e.output}</div>}
          </button>
        ))}
      </div>

      <div className="px-2 py-1.5 border-t border-neutral-200 bg-neutral-50">
        <label className="sr-only" htmlFor="cas-input">
          Input
        </label>
        <input
          id="cas-input"
          value={display.editing}
          onChange={(ev) => onText?.(ev.target.value)}
          onKeyDown={(ev) => {
            if (ev.key === 'Enter') {
              ev.preventDefault()
              touch('key:ENTER')
            }
          }}
          className="w-full font-mono text-sm px-2 py-1 rounded border border-neutral-300 focus-visible:outline-2 focus-visible:outline-brand-500"
          autoComplete="off"
          spellCheck={false}
          placeholder={display.app === 'main' ? 'e.g. solve(x^2-4=0,x)' : 'e.g. x^2-1'}
        />
        {display.errorMessage && (
          <p className="text-xs text-red-600 mt-1" role="alert">
            {display.errorMessage}
          </p>
        )}
      </div>

      <div className="bg-neutral-200 px-1.5 pt-1 pb-1.5">
        <div className="flex gap-1 mb-1" role="tablist" aria-label="Soft keyboard">
          {display.softKeyboard.tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={t.id === display.softKeyboard.active}
              onClick={() => touch(`tab:${t.id}`)}
              className={`text-[11px] px-2 py-0.5 rounded ${t.id === display.softKeyboard.active ? 'bg-neutral-700 text-white' : 'bg-white'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-6 gap-1">
          {display.softKeyboard.keys.map((k) => (
            <button key={k.target} type="button" onClick={() => touch(k.target)} className="text-xs py-1.5 rounded bg-white hover:bg-brand-50 active:scale-95 font-mono min-h-9" aria-label={`Insert ${k.label}`}>
              {k.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
