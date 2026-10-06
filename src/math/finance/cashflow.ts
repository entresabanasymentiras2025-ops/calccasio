import { MathError } from '../arithmetic/value'

/** cashFlows[0] is CF0 (at t=0). Rate is in percent per period. */
export function npv(iPercent: number, cashFlows: number[]): number {
  const i = iPercent / 100
  return cashFlows.reduce((acc, cf, k) => acc + cf / Math.pow(1 + i, k), 0)
}

export function nfv(iPercent: number, cashFlows: number[]): number {
  return npv(iPercent, cashFlows) * Math.pow(1 + iPercent / 100, cashFlows.length - 1)
}

export function irr(cashFlows: number[]): number {
  if (!cashFlows.some((c) => c > 0) || !cashFlows.some((c) => c < 0)) {
    throw new MathError('MathError', 'IRR requires both positive and negative cash flows')
  }
  let lo = -99.999
  let hi = 10000
  let flo = npv(lo, cashFlows)
  if (flo * npv(hi, cashFlows) > 0) {
    // Narrow bracket search.
    const grid = [-99, -50, -10, 0, 5, 10, 20, 50, 100, 500, 1000]
    let found = false
    for (let k = 0; k < grid.length - 1 && !found; k++) {
      if (npv(grid[k], cashFlows) * npv(grid[k + 1], cashFlows) <= 0) {
        lo = grid[k]
        hi = grid[k + 1]
        flo = npv(lo, cashFlows)
        found = true
      }
    }
    if (!found) throw new MathError('MathError', 'IRR could not be found')
  }
  for (let it = 0; it < 300; it++) {
    const mid = (lo + hi) / 2
    const fm = npv(mid, cashFlows)
    if (flo * fm <= 0) hi = mid
    else {
      lo = mid
      flo = fm
    }
  }
  return (lo + hi) / 2
}

/** Discounted payback period (in periods, fractional), or null if never paid back. */
export function paybackPeriod(iPercent: number, cashFlows: number[]): number | null {
  const i = iPercent / 100
  let cum = 0
  for (let k = 0; k < cashFlows.length; k++) {
    const pv = cashFlows[k] / Math.pow(1 + i, k)
    if (cum < 0 && cum + pv >= 0) return k - 1 + -cum / pv
    cum += pv
  }
  return cum >= 0 ? 0 : null
}
