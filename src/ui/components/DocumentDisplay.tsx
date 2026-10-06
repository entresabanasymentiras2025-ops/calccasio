import type { DocumentDisplayState } from '../../calculators/core/CalculatorDisplay'

export default function DocumentDisplay({ display }: { display: DocumentDisplayState; onTouch?: (target: string, payload?: unknown) => void }) {
  return <div role="status">{display.app}</div>
}
