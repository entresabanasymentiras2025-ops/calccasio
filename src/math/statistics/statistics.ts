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
