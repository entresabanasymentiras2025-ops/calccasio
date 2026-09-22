import type { CalculatorDisplayState } from '../../calculators/core/CalculatorDisplay'

interface Props {
  display: CalculatorDisplayState
}

function renderLine(text: string, lineIndex: number, display: CalculatorDisplayState) {
  if (display.cursorLine !== lineIndex || display.cursorCol === null) {
    return <span>{text || ' '}</span>
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

export function CalculatorDisplayPanel({ display }: Props) {
  return (
    <div className="rounded-lg bg-lcd-bg text-lcd-fg px-4 py-3 shadow-inner select-none" role="status" aria-live="polite">
      <div className="flex gap-3 text-[10px] font-mono uppercase tracking-wide h-4 mb-1">
        {display.indicators.map((ind) => (
          <span key={ind.id} className={ind.active ? 'opacity-100 font-bold' : 'opacity-20'}>
            {ind.label}
          </span>
        ))}
      </div>
      <div className="font-mono text-2xl leading-snug min-h-[4.5rem] flex flex-col justify-end items-end break-all">
        {display.errorMessage ? (
          <span className="text-red-800 text-base">{display.errorMessage}</span>
        ) : (
          display.lines.map((line, i) => (
            <div key={i} className={i === display.lines.length - 1 ? '' : 'text-lg opacity-70'}>
              {renderLine(line, i, display)}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
