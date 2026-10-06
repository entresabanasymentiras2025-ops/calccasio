import { MathError } from '../arithmetic/value'

// ---- Cost / Sell / Margin -------------------------------------------------
export function sellFromCost(cost: number, marginPct: number): number {
  if (marginPct >= 100) throw new MathError('MathError', 'Margin must be < 100%')
  return cost / (1 - marginPct / 100)
}
export function costFromSell(sell: number, marginPct: number): number {
  return sell * (1 - marginPct / 100)
}
export function marginFrom(cost: number, sell: number): number {
  if (sell === 0) throw new MathError('MathError', 'Selling price cannot be 0')
  return (1 - cost / sell) * 100
}

// ---- Day counts -----------------------------------------------------------
/** Parses MMDDYYYY / YYYY-MM-DD into a UTC day number, validating the date. */
export function parseDate(text: string): number {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text.trim()) ?? null
  let y: number, mo: number, d: number
  if (m) {
    ;[y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  } else if (/^\d{8}$/.test(text.trim())) {
    const t = text.trim()
    ;[mo, d, y] = [Number(t.slice(0, 2)), Number(t.slice(2, 4)), Number(t.slice(4))]
  } else {
    throw new MathError('InputError', 'Date must be YYYY-MM-DD or MMDDYYYY')
  }
  const ms = Date.UTC(y, mo - 1, d)
  const back = new Date(ms)
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) {
    throw new MathError('InputError', 'Invalid calendar date')
  }
  if (y < 1901 || y > 2099) throw new MathError('InputError', 'Year must be between 1901 and 2099')
  return Math.round(ms / 86400000)
}

export function formatDate(dayNumber: number): string {
  const d = new Date(dayNumber * 86400000)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

export function daysBetween(d1: string, d2: string): number {
  return parseDate(d2) - parseDate(d1)
}

export function addDays(d1: string, days: number): string {
  if (!Number.isInteger(days)) throw new MathError('InputError', 'Days must be an integer')
  return formatDate(parseDate(d1) + days)
}

// ---- Depreciation ---------------------------------------------------------
export type DepreciationMethod = 'SL' | 'FP' | 'SYD' | 'DB'

export interface DepreciationResult {
  depreciation: number
  residual: number
}

/**
 * Depreciation for year j of an asset with cost PV, salvage FV, life n
 * years. FP uses I% as the fixed rate; DB uses I% as the declining-balance
 * factor (e.g. 200 = double declining). Full first year assumed (see
 * /docs/limitations.md for the partial-first-year YR1 note).
 */
export function depreciate(method: DepreciationMethod, n: number, iPercent: number, pv: number, fv: number, j: number): DepreciationResult {
  if (!Number.isInteger(j) || j < 1) throw new MathError('MathError', 'Year j must be an integer ≥ 1')
  if (n <= 0) throw new MathError('MathError', 'Useful life n must be > 0')
  let book = pv
  let dep = 0
  const sydTotal = (n * (n + 1)) / 2
  for (let year = 1; year <= j; year++) {
    switch (method) {
      case 'SL':
        dep = year <= n ? (pv - fv) / n : 0
        break
      case 'FP':
        dep = book * (iPercent / 100)
        break
      case 'SYD':
        dep = year <= n ? ((pv - fv) * (n - year + 1)) / sydTotal : 0
        break
      case 'DB':
        dep = Math.min(book * (iPercent / 100 / n), Math.max(0, book - fv))
        break
    }
    if (method !== 'FP') dep = Math.min(dep, Math.max(0, book - fv))
    book -= dep
  }
  return { depreciation: dep, residual: book }
}

// ---- Bonds (term mode, on a coupon date) ----------------------------------
/**
 * Price per 100 of redemption value. `n` is the number of coupon periods,
 * `couponPct` the annual coupon rate, `yieldPct` the annual yield, `freq`
 * coupon payments per year (1 or 2).
 */
export function bondPrice(n: number, redemption: number, couponPct: number, yieldPct: number, freq: 1 | 2 = 2): number {
  const r = yieldPct / 100 / freq
  const cpn = (redemption * couponPct) / 100 / freq
  if (Math.abs(r) < 1e-14) return redemption + cpn * n
  const v = Math.pow(1 + r, -n)
  return redemption * v + (cpn * (1 - v)) / r
}

export function bondYield(n: number, redemption: number, couponPct: number, price: number, freq: 1 | 2 = 2): number {
  let lo = -50
  let hi = 1000
  const f = (y: number) => bondPrice(n, redemption, couponPct, y, freq) - price
  if (f(lo) * f(hi) > 0) throw new MathError('MathError', 'Yield could not be solved for this price')
  for (let it = 0; it < 300; it++) {
    const mid = (lo + hi) / 2
    if (f(lo) * f(mid) <= 0) hi = mid
    else lo = mid
  }
  return (lo + hi) / 2
}

// ---- Break-even -----------------------------------------------------------
export function breakEvenQuantity(price: number, variableCostUnit: number, fixedCost: number, profit = 0): number {
  const contribution = price - variableCostUnit
  if (contribution <= 0) throw new MathError('MathError', 'Price must exceed variable cost per unit')
  return (fixedCost + profit) / contribution
}

export function marginOfSafety(sales: number, breakEvenSales: number): number {
  if (sales === 0) throw new MathError('MathError', 'Sales cannot be 0')
  return (sales - breakEvenSales) / sales
}

export function operatingLeverage(sales: number, variableCost: number, fixedCost: number): number {
  const ebit = sales - variableCost - fixedCost
  if (ebit === 0) throw new MathError('MathError', 'Operating income is 0')
  return (sales - variableCost) / ebit
}
