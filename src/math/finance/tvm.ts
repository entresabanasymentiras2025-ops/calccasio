import { MathError } from '../arithmetic/value'

/**
 * Time-value-of-money (compound interest) with the cash-flow sign
 * convention used by financial calculators: money received is positive,
 * money paid out is negative. The governing equation is
 *
 *   PV + PMT·(1 + i·S)·(1 − (1+i)^−n)/i + FV·(1+i)^−n = 0
 *
 * where i is the effective rate per payment period derived from the
 * nominal annual rate I% compounded C/Y times per year with P/Y payments
 * per year, and S = 1 for payments at the beginning of the period.
 */
export interface TvmInput {
  n: number
  iPercent: number
  pv: number
  pmt: number
  fv: number
  py: number
  cy: number
  begin: boolean
}

export type TvmVariable = 'n' | 'iPercent' | 'pv' | 'pmt' | 'fv'

export function periodicRate(iPercent: number, py: number, cy: number): number {
  if (py <= 0 || cy <= 0) throw new MathError('MathError', 'P/Y and C/Y must be positive')
  return Math.pow(1 + iPercent / (100 * cy), cy / py) - 1
}

function residual(t: TvmInput): number {
  const i = periodicRate(t.iPercent, t.py, t.cy)
  const s = t.begin ? 1 : 0
  if (Math.abs(i) < 1e-14) return t.pv + t.pmt * t.n + t.fv
  const v = Math.pow(1 + i, -t.n)
  return t.pv + (t.pmt * (1 + i * s) * (1 - v)) / i + t.fv * v
}

export function solveTvm(input: TvmInput, unknown: TvmVariable): number {
  const t = { ...input }
  const i = periodicRate(t.iPercent, t.py, t.cy)
  const s = t.begin ? 1 : 0
  const zeroRate = Math.abs(i) < 1e-14
  switch (unknown) {
    case 'pv':
      t.pv = 0
      return -residual(t)
    case 'fv': {
      t.fv = 0
      const r = residual(t)
      return zeroRate ? -r : -r * Math.pow(1 + i, t.n)
    }
    case 'pmt': {
      if (t.n === 0) throw new MathError('MathError', 'n must be non-zero')
      const v = Math.pow(1 + i, -t.n)
      const annuity = zeroRate ? t.n : ((1 + i * s) * (1 - v)) / i
      return -(t.pv + t.fv * (zeroRate ? 1 : v)) / annuity
    }
    case 'n': {
      if (zeroRate) {
        if (t.pmt === 0) throw new MathError('MathError', 'Cannot solve n with zero rate and zero payment')
        return -(t.pv + t.fv) / t.pmt
      }
      const a = t.pmt * (1 + i * s)
      const num = a - t.fv * i
      const den = a + t.pv * i
      if (num / den <= 0) throw new MathError('MathError', 'No solution for n with these values')
      return Math.log(num / den) / Math.log(1 + i)
    }
    case 'iPercent':
      return solveRate(t)
  }
}

function solveRate(t: TvmInput): number {
  const f = (iPct: number) => residual({ ...t, iPercent: iPct })
  // Bracket a sign change on a log-ish grid, then bisect.
  const grid = [-99, -50, -10, -1, 0, 0.0001, 0.01, 0.1, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]
  for (let k = 0; k < grid.length - 1; k++) {
    let lo = grid[k]
    let hi = grid[k + 1]
    let flo = f(lo)
    const fhi = f(hi)
    if (!Number.isFinite(flo) || !Number.isFinite(fhi)) continue
    if (flo === 0) return lo
    if (flo * fhi > 0) continue
    for (let it = 0; it < 200; it++) {
      const mid = (lo + hi) / 2
      const fm = f(mid)
      if (flo * fm <= 0) hi = mid
      else {
        lo = mid
        flo = fm
      }
    }
    return (lo + hi) / 2
  }
  throw new MathError('MathError', 'Interest rate could not be solved (check signs of PV/PMT/FV)')
}

export interface AmortizationRow {
  bal: number
  int: number
  prn: number
  sumInt: number
  sumPrn: number
}

/** Amortization for payments PM1..PM2 (inclusive); returns the values at PM2 plus Σ over the range. */
export function amortize(input: TvmInput, pm1: number, pm2: number): AmortizationRow {
  if (!Number.isInteger(pm1) || !Number.isInteger(pm2) || pm1 < 1 || pm2 < pm1) {
    throw new MathError('MathError', 'Require integers 1 ≤ PM1 ≤ PM2')
  }
  if (pm2 > 100000) throw new MathError('OverflowError', 'Too many periods')
  const i = periodicRate(input.iPercent, input.py, input.cy)
  let bal = input.pv
  let sumInt = 0
  let sumPrn = 0
  let int = 0
  let prn = 0
  for (let k = 1; k <= pm2; k++) {
    int = input.begin && k === 1 ? 0 : -bal * i
    prn = input.pmt - int
    bal = bal + prn
    if (k >= pm1) {
      sumInt += int
      sumPrn += prn
    }
  }
  return { bal, int, prn, sumInt, sumPrn }
}

export function simpleInterest(days: number, iPercent: number, pv: number, basis: 365 | 360 = 365): { si: number; sfv: number } {
  const si = -(days / basis) * (iPercent / 100) * pv
  return { si, sfv: -(pv + si) }
}

export function nominalToEffective(apr: number, n: number): number {
  if (n <= 0) throw new MathError('MathError', 'Compounding periods must be positive')
  return (Math.pow(1 + apr / 100 / n, n) - 1) * 100
}

export function effectiveToNominal(eff: number, n: number): number {
  if (n <= 0) throw new MathError('MathError', 'Compounding periods must be positive')
  return n * (Math.pow(1 + eff / 100, 1 / n) - 1) * 100
}
