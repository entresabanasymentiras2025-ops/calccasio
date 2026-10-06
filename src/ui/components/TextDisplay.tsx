import type { TextDisplayState } from '../../calculators/core/CalculatorDisplay'

function renderLine(text: string, lineIndex: number, display: TextDisplayState) {
  if (display.cursorLine !== lineIndex || display.cursorCol === null) {
    return <span>{text || ' '}</span>
  }
  const col = display.cursorCol
  return (
    <span>
      {text.slice(0, col)}
      <span className="inline-block w-[2px] h-[1.1em] align-middle bg-lcd-fg mx-[1px] animate-pulse" aria-hidden />
      {text.slice(col)}
    </span>
  )
}

/** Character-LCD renderer (ClassWiz, ES PLUS, MS, financial). Pure view of TextDisplayState. */
export function TextDisplay({ display }: { display: TextDisplayState }) {
  const align = display.align ?? 'mixed'
  const isListy = align === 'left'
  return (
    <div className="lcd rounded-lg bg-lcd-bg text-lcd-fg px-3 py-2.5 shadow-inner select-none" role="status" aria-live="polite" data-testid="lcd">
      <div className="flex gap-2.5 text-[10px] font-mono uppercase tracking-wide h-4 mb-1 overflow-hidden">
        {display.indicators.map((ind) => (
          <span key={ind.id} className={ind.active ? 'opacity-100 font-bold' : 'opacity-15'} aria-hidden={!ind.active}>
            {ind.label}
          </span>
        ))}
      </div>
      {display.title && <div className="text-[11px] font-mono font-semibold truncate border-b border-lcd-fg/30 mb-1">{display.title}</div>}
      <div
        className={`font-mono leading-snug min-h-[5.5rem] flex flex-col ${isListy ? 'justify-start items-stretch text-base' : 'justify-end items-end text-2xl'} break-all`}
      >
        {display.errorMessage ? (
          <div className="text-base self-stretch text-left whitespace-pre-line" role="alert">
            {display.errorMessage}
            <div className="text-[10px] opacity-70 mt-1">[AC] / [◀] / [▶] to return</div>
          </div>
        ) : (
          display.lines.map((line, i) => {
            const isResult = align === 'mixed' && i === display.lines.length - 1 && display.lines.length > 1
            const inverted = display.highlightLine === i
            return (
              <div
                key={i}
                className={[
                  isListy ? 'px-1 rounded-sm' : '',
                  inverted ? 'bg-lcd-fg text-lcd-bg' : '',
                  align === 'mixed' && !isResult && display.lines.length > 1 ? 'text-lg self-start opacity-80' : '',
                ].join(' ')}
              >
                {renderLine(line, i, display)}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
