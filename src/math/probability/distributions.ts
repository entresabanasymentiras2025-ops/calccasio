import { MathError } from '../arithmetic/value'

/** erf via Abramowitz–Stegun 7.1.26 refined with a series for small |x| (≈1e-15 abs error). */
export function erf(x: number): number {
  const sign = x < 0 ? -1 : 1
  const ax = Math.abs(x)
  if (ax < 2.5) {
    // Maclaurin series converges quickly here.
    let sum = ax
    let term = ax
    for (let n = 1; n < 100; n++) {
      term *= (-ax * ax) / n
      const add = term / (2 * n + 1)
      sum += add
      if (Math.abs(add) < 1e-17) break
    }
    return (sign * 2 * sum) / Math.sqrt(Math.PI)
  }
  // Continued fraction for erfc at larger |x|.
  let f = 0
  for (let n = 60; n >= 1; n--) f = n / 2 / (ax + f)
  const erfc = Math.exp(-ax * ax) / Math.sqrt(Math.PI) / (ax + f)
  return sign * (1 - erfc)
}

function assertSigma(sigma: number): void {
  if (!(sigma > 0)) throw new MathError('DomainError', 'σ must be > 0')
}

export function normalPdf(x: number, mu = 0, sigma = 1): number {
  assertSigma(sigma)
  const z = (x - mu) / sigma
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI))
}

export function normalCdf(lower: number, upper: number, mu = 0, sigma = 1): number {
  assertSigma(sigma)
  const phi = (x: number) => 0.5 * (1 + erf((x - mu) / (sigma * Math.SQRT2)))
  return phi(upper) - phi(lower)
}

/** Inverse normal (left tail area) via bisection on normalCdf — robust and accurate to ~1e-12. */
export function inverseNormal(area: number, mu = 0, sigma = 1): number {
  if (!(area > 0 && area < 1)) throw new MathError('DomainError', 'Area must be in (0, 1)')
  assertSigma(sigma)
  let lo = -40
  let hi = 40
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    if (normalCdf(-Infinity, mid) < area) lo = mid
    else hi = mid
  }
  return mu + sigma * ((lo + hi) / 2)
}

function logFactorial(n: number): number {
  let s = 0
  for (let k = 2; k <= n; k++) s += Math.log(k)
  return s
}

function assertTrials(n: number, p: number): void {
  if (!Number.isInteger(n) || n < 0 || n > 100000) throw new MathError('DomainError', 'N must be an integer in [0, 100000]')
  if (!(p >= 0 && p <= 1)) throw new MathError('DomainError', 'p must be in [0, 1]')
}

export function binomialPd(x: number, n: number, p: number): number {
  assertTrials(n, p)
  if (!Number.isInteger(x) || x < 0 || x > n) return 0
  if (p === 0) return x === 0 ? 1 : 0
  if (p === 1) return x === n ? 1 : 0
  return Math.exp(logFactorial(n) - logFactorial(x) - logFactorial(n - x) + x * Math.log(p) + (n - x) * Math.log(1 - p))
}

export function binomialCd(x: number, n: number, p: number): number {
  let s = 0
  for (let k = 0; k <= Math.min(Math.floor(x), n); k++) s += binomialPd(k, n, p)
  return Math.min(1, s)
}

export function poissonPd(x: number, lambda: number): number {
  if (!(lambda > 0)) throw new MathError('DomainError', 'λ must be > 0')
  if (!Number.isInteger(x) || x < 0) return 0
  return Math.exp(-lambda + x * Math.log(lambda) - logFactorial(x))
}

export function poissonCd(x: number, lambda: number): number {
  let s = 0
  for (let k = 0; k <= Math.floor(x); k++) s += poissonPd(k, lambda)
  return Math.min(1, s)
}
