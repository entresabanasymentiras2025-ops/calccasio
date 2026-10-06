import { MathError } from '../arithmetic/value'

export interface StatSummary {
  n: number
  sum: number
  mean: number
  variance: number
  populationStdDev: number
  sampleStdDev: number
  min: number
  max: number
}

function assertNonEmpty(data: number[]): void {
  if (data.length === 0) throw new MathError('MathError', 'Statistics require at least one data point')
}

export function summarize(data: number[]): StatSummary {
  assertNonEmpty(data)
  const n = data.length
  const sum = data.reduce((a, b) => a + b, 0)
  const mean = sum / n
  const variance = data.reduce((acc, x) => acc + (x - mean) ** 2, 0) / n
  const sampleVariance = n > 1 ? (data.reduce((acc, x) => acc + (x - mean) ** 2, 0) / (n - 1)) : 0
  return {
    n,
    sum,
    mean,
    variance,
    populationStdDev: Math.sqrt(variance),
    sampleStdDev: Math.sqrt(sampleVariance),
    min: Math.min(...data),
    max: Math.max(...data),
  }
}

export function median(data: number[]): number {
  assertNonEmpty(data)
  const sorted = [...data].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

export interface LinearRegression {
  slope: number
  intercept: number
  r: number
}

export function linearRegression(xs: number[], ys: number[]): LinearRegression {
  if (xs.length !== ys.length || xs.length < 2) {
    throw new MathError('DimensionError', 'Linear regression requires paired x/y data with at least 2 points')
  }
  const n = xs.length
  const sumX = xs.reduce((a, b) => a + b, 0)
  const sumY = ys.reduce((a, b) => a + b, 0)
  const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0)
  const sumXX = xs.reduce((acc, x) => acc + x * x, 0)
  const sumYY = ys.reduce((acc, y) => acc + y * y, 0)
  const denom = n * sumXX - sumX * sumX
  if (denom === 0) throw new MathError('MathError', 'Cannot regress: x values have zero variance')
  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n
  const rDenom = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY))
  const r = rDenom === 0 ? 0 : (n * sumXY - sumX * sumY) / rDenom
  return { slope, intercept, r }
}

/** Quartiles using the CASIO-style method: median of lower/upper halves (excluding the median for odd n). */
export function quartiles(data: number[]): { q1: number; q3: number } {
  assertNonEmpty(data)
  const sorted = [...data].sort((a, b) => a - b)
  const n = sorted.length
  if (n === 1) return { q1: sorted[0], q3: sorted[0] }
  const half = Math.floor(n / 2)
  const lower = sorted.slice(0, half)
  const upper = sorted.slice(n % 2 === 0 ? half : half + 1)
  return { q1: median(lower), q3: median(upper) }
}

/** Expands (value, frequency) pairs into a flat data list (the FREQ column). */
export function expandFrequencies(values: number[], freqs: number[]): number[] {
  if (values.length !== freqs.length) throw new MathError('DimensionError', 'Each value needs a frequency')
  const out: number[] = []
  values.forEach((v, i) => {
    const f = freqs[i]
    if (!Number.isInteger(f) || f < 0) throw new MathError('MathError', 'Frequencies must be non-negative integers')
    if (out.length + f > 100000) throw new MathError('MemoryError', 'Too many data points')
    for (let k = 0; k < f; k++) out.push(v)
  })
  return out
}

export interface PairedSums {
  n: number
  sumX: number
  sumY: number
  sumX2: number
  sumY2: number
  sumXY: number
}

export function pairedSums(xs: number[], ys: number[]): PairedSums {
  if (xs.length !== ys.length) throw new MathError('DimensionError', 'x and y lists must have the same length')
  return {
    n: xs.length,
    sumX: xs.reduce((a, b) => a + b, 0),
    sumY: ys.reduce((a, b) => a + b, 0),
    sumX2: xs.reduce((a, b) => a + b * b, 0),
    sumY2: ys.reduce((a, b) => a + b * b, 0),
    sumXY: xs.reduce((a, x, i) => a + x * ys[i], 0),
  }
}

export interface QuadraticRegression {
  a: number
  b: number
  c: number
}

/** y = a + b·x + c·x² by least squares (normal equations). */
export function quadraticRegression(xs: number[], ys: number[]): QuadraticRegression {
  if (xs.length !== ys.length || xs.length < 3) {
    throw new MathError('DimensionError', 'Quadratic regression requires at least 3 paired points')
  }
  const s = (p: number, q = 0) => xs.reduce((acc, x, i) => acc + x ** p * ys[i] ** q, 0)
  const m = [
    [xs.length, s(1), s(2)],
    [s(1), s(2), s(3)],
    [s(2), s(3), s(4)],
  ]
  const rhs = [s(0, 1), xs.reduce((a, x, i) => a + x * ys[i], 0), xs.reduce((a, x, i) => a + x * x * ys[i], 0)]
  const [a, b, c] = gauss3(m, rhs)
  return { a, b, c }
}

function gauss3(m: number[][], rhs: number[]): number[] {
  const a = m.map((r, i) => [...r, rhs[i]])
  const n = 3
  for (let col = 0; col < n; col++) {
    let p = col
    for (let r = col + 1; r < n; r++) if (Math.abs(a[r][col]) > Math.abs(a[p][col])) p = r
    if (Math.abs(a[p][col]) < 1e-14) throw new MathError('MathError', 'Regression is singular for this data')
    ;[a[col], a[p]] = [a[p], a[col]]
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const f = a[r][col] / a[col][col]
      for (let c = col; c <= n; c++) a[r][c] -= f * a[col][c]
    }
  }
  return a.map((row, i) => row[n] / row[i])
}

/** y = a + b·ln(x). */
export function logarithmicRegression(xs: number[], ys: number[]): LinearRegression {
  if (xs.some((x) => x <= 0)) throw new MathError('DomainError', 'Logarithmic regression requires x > 0')
  const r = linearRegression(xs.map(Math.log), ys)
  return { slope: r.slope, intercept: r.intercept, r: r.r }
}

/** y = a·e^(b·x). Returned as { intercept: a, slope: b }. */
export function exponentialRegression(xs: number[], ys: number[]): LinearRegression {
  if (ys.some((y) => y <= 0)) throw new MathError('DomainError', 'Exponential regression requires y > 0')
  const r = linearRegression(xs, ys.map(Math.log))
  return { slope: r.slope, intercept: Math.exp(r.intercept), r: r.r }
}

/** y = a·x^b. Returned as { intercept: a, slope: b }. */
export function powerRegression(xs: number[], ys: number[]): LinearRegression {
  if (xs.some((x) => x <= 0) || ys.some((y) => y <= 0)) throw new MathError('DomainError', 'Power regression requires x > 0 and y > 0')
  const r = linearRegression(xs.map(Math.log), ys.map(Math.log))
  return { slope: r.slope, intercept: Math.exp(r.intercept), r: r.r }
}
