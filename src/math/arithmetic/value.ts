import Decimal from 'decimal.js'

Decimal.set({ precision: 32, rounding: Decimal.ROUND_HALF_UP })

/**
 * CalcValue represents a numeric value the way a real calculator's engine
 * keeps it internally: exact rationals stay exact (BigInt numerator /
 * denominator) for as long as every operation involved is rational, and
 * only fall back to Decimal (fixed high-precision) once an irrational
 * operation (sqrt of a non-perfect-square, trig, log, ...) is applied.
 * This mirrors why e.g. `1/3 * 3` shows `1` while `sqrt(2)` shows a decimal.
 */
export type CalcValue =
  | { kind: 'rational'; num: bigint; den: bigint }
  | { kind: 'decimal'; value: Decimal }

export class MathError extends Error {
  code: 'SyntaxError' | 'MathError' | 'DomainError' | 'DimensionError' | 'MemoryError' | 'ModeError' | 'OverflowError' | 'InputError'
  constructor(code: MathError['code'], message: string) {
    super(message)
    this.code = code
    this.name = code
  }
}

function bigAbs(n: bigint): bigint {
  return n < 0n ? -n : n
}

function bigGcd(a: bigint, b: bigint): bigint {
  a = bigAbs(a)
  b = bigAbs(b)
  while (b) {
    ;[a, b] = [b, a % b]
  }
  return a === 0n ? 1n : a
}

export function rational(num: bigint, den: bigint): CalcValue {
  if (den === 0n) throw new MathError('MathError', 'Division by zero')
  if (den < 0n) {
    num = -num
    den = -den
  }
  const g = bigGcd(num, den)
  return { kind: 'rational', num: num / g, den: den / g }
}

export function fromInt(n: number | bigint): CalcValue {
  return rational(BigInt(n), 1n)
}

export function fromDecimal(d: Decimal | number | string): CalcValue {
  return { kind: 'decimal', value: new Decimal(d) }
}

/** Parse a decimal literal string ("3.14", "5", "0.001", "1.5E10") into an exact rational when possible. */
export function fromLiteral(text: string): CalcValue {
  const match = /^(\d+(?:\.\d+)?)(?:E([+-]?\d+))?$/.exec(text)
  if (!match) throw new MathError('SyntaxError', `Invalid numeric literal: ${text}`)
  const [, mantissa, exponent] = match
  const [intPart, fracPart = ''] = mantissa.split('.')
  let num = BigInt((intPart || '0') + fracPart)
  let den = 10n ** BigInt(fracPart.length)
  if (exponent !== undefined) {
    const exp = BigInt(exponent)
    if (exp >= 0n) num *= 10n ** exp
    else den *= 10n ** -exp
  }
  return rational(num, den)
}

export function toDecimal(v: CalcValue): Decimal {
  if (v.kind === 'decimal') return v.value
  return new Decimal(v.num.toString()).div(new Decimal(v.den.toString()))
}

export function toNumber(v: CalcValue): number {
  return toDecimal(v).toNumber()
}

export function isZero(v: CalcValue): boolean {
  return v.kind === 'rational' ? v.num === 0n : v.value.isZero()
}

export function isInteger(v: CalcValue): boolean {
  if (v.kind === 'rational') return v.den === 1n
  return v.value.isInteger()
}

export function isNegative(v: CalcValue): boolean {
  return v.kind === 'rational' ? v.num < 0n : v.value.isNegative()
}

export function add(a: CalcValue, b: CalcValue): CalcValue {
  if (a.kind === 'rational' && b.kind === 'rational') {
    return rational(a.num * b.den + b.num * a.den, a.den * b.den)
  }
  return fromDecimal(toDecimal(a).add(toDecimal(b)))
}

export function sub(a: CalcValue, b: CalcValue): CalcValue {
  if (a.kind === 'rational' && b.kind === 'rational') {
    return rational(a.num * b.den - b.num * a.den, a.den * b.den)
  }
  return fromDecimal(toDecimal(a).sub(toDecimal(b)))
}

export function mul(a: CalcValue, b: CalcValue): CalcValue {
  if (a.kind === 'rational' && b.kind === 'rational') {
    return rational(a.num * b.num, a.den * b.den)
  }
  return fromDecimal(toDecimal(a).mul(toDecimal(b)))
}

export function div(a: CalcValue, b: CalcValue): CalcValue {
  if (isZero(b)) throw new MathError('MathError', 'Division by zero')
  if (a.kind === 'rational' && b.kind === 'rational') {
    return rational(a.num * b.den, a.den * b.num)
  }
  return fromDecimal(toDecimal(a).div(toDecimal(b)))
}

export function neg(a: CalcValue): CalcValue {
  if (a.kind === 'rational') return rational(-a.num, a.den)
  return fromDecimal(a.value.neg())
}

export function abs(a: CalcValue): CalcValue {
  return isNegative(a) ? neg(a) : a
}

/** Integer exponent keeps exactness; non-integer falls back to Decimal. */
export function pow(a: CalcValue, b: CalcValue): CalcValue {
  if (a.kind === 'rational' && b.kind === 'rational' && b.den === 1n) {
    const exp = b.num
    if (exp >= 0n) {
      return rational(a.num ** exp, a.den ** exp)
    }
    if (a.num === 0n) throw new MathError('MathError', 'Division by zero')
    return rational(a.den ** -exp, a.num ** -exp)
  }
  const base = toDecimal(a)
  if (base.isNegative() && !toDecimal(b).isInteger()) {
    throw new MathError('DomainError', 'Negative base with fractional exponent')
  }
  return fromDecimal(base.pow(toDecimal(b)))
}

function bigIntSqrt(n: bigint): bigint | null {
  if (n < 0n) return null
  if (n < 2n) return n
  let x0 = n
  let x1 = (x0 + 1n) / 2n
  while (x1 < x0) {
    x0 = x1
    x1 = (x0 + n / x0) / 2n
  }
  return x0 * x0 === n ? x0 : null
}

export function sqrt(a: CalcValue): CalcValue {
  if (isNegative(a)) throw new MathError('DomainError', 'Square root of negative number')
  if (a.kind === 'rational') {
    const n = bigIntSqrt(a.num)
    const d = bigIntSqrt(a.den)
    if (n !== null && d !== null) return rational(n, d)
  }
  return fromDecimal(toDecimal(a).sqrt())
}

export function factorial(a: CalcValue): CalcValue {
  if (!isInteger(a) || isNegative(a)) {
    throw new MathError('DomainError', 'Factorial requires a non-negative integer')
  }
  const n = a.kind === 'rational' ? a.num : BigInt(a.value.toFixed(0))
  if (n > 1000n) throw new MathError('OverflowError', 'Factorial overflow')
  let result = 1n
  for (let i = 2n; i <= n; i++) result *= i
  return fromInt(result)
}

export function reciprocal(a: CalcValue): CalcValue {
  return div(fromInt(1), a)
}

function bigIntCbrt(n: bigint): bigint | null {
  if (n === 0n) return 0n
  const sign = n < 0n ? -1n : 1n
  const abs = sign * n
  let lo = 0n
  let hi = abs
  while (lo < hi) {
    const mid = (lo + hi + 1n) / 2n
    if (mid * mid * mid <= abs) lo = mid
    else hi = mid - 1n
  }
  return lo * lo * lo === abs ? sign * lo : null
}

export function cbrt(a: CalcValue): CalcValue {
  if (a.kind === 'rational') {
    const n = bigIntCbrt(a.num)
    const d = bigIntCbrt(a.den)
    if (n !== null && d !== null) return rational(n, d)
  }
  const d = toDecimal(a)
  const sign = d.isNegative() ? -1 : 1
  return fromDecimal(d.abs().pow(new Decimal(1).div(3)).mul(sign))
}

export function compare(a: CalcValue, b: CalcValue): number {
  if (a.kind === 'rational' && b.kind === 'rational') {
    const l = a.num * b.den
    const r = b.num * a.den
    return l < r ? -1 : l > r ? 1 : 0
  }
  return toDecimal(a).cmp(toDecimal(b))
}

export { Decimal }
