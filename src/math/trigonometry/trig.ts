import { type CalcValue, MathError, fromDecimal, toDecimal, Decimal } from '../arithmetic/value'

export type AngleMode = 'DEG' | 'RAD' | 'GRAD'

/**
 * Transcendental functions (trig, log, exp) are computed at IEEE-754 double
 * precision and re-wrapped as Decimal. Real CASIO hardware also carries a
 * bounded internal precision (~15 significant digits) for these functions,
 * so this matches observed calculator behavior while keeping the
 * implementation dependency-free. See /docs/decisions/ for the rationale.
 */
function unary(fn: (x: number) => number, v: CalcValue): CalcValue {
  const result = fn(toDecimal(v).toNumber())
  if (!Number.isFinite(result)) throw new MathError('MathError', 'Result out of range')
  return fromDecimal(new Decimal(result))
}

function toRadians(v: CalcValue, mode: AngleMode): number {
  const n = toDecimal(v).toNumber()
  switch (mode) {
    case 'DEG':
      return (n * Math.PI) / 180
    case 'GRAD':
      return (n * Math.PI) / 200
    case 'RAD':
      return n
  }
}

function fromRadians(rad: number, mode: AngleMode): CalcValue {
  switch (mode) {
    case 'DEG':
      return fromDecimal(new Decimal((rad * 180) / Math.PI))
    case 'GRAD':
      return fromDecimal(new Decimal((rad * 200) / Math.PI))
    case 'RAD':
      return fromDecimal(new Decimal(rad))
  }
}

export function sin(v: CalcValue, mode: AngleMode): CalcValue {
  return fromDecimal(new Decimal(Math.sin(toRadians(v, mode))))
}
export function cos(v: CalcValue, mode: AngleMode): CalcValue {
  return fromDecimal(new Decimal(Math.cos(toRadians(v, mode))))
}
export function tan(v: CalcValue, mode: AngleMode): CalcValue {
  const c = Math.cos(toRadians(v, mode))
  if (Math.abs(c) < 1e-12) throw new MathError('MathError', 'tan undefined at this angle')
  return fromDecimal(new Decimal(Math.tan(toRadians(v, mode))))
}
export function asin(v: CalcValue, mode: AngleMode): CalcValue {
  const n = toDecimal(v).toNumber()
  if (n < -1 || n > 1) throw new MathError('DomainError', 'asin domain is [-1, 1]')
  return fromRadians(Math.asin(n), mode)
}
export function acos(v: CalcValue, mode: AngleMode): CalcValue {
  const n = toDecimal(v).toNumber()
  if (n < -1 || n > 1) throw new MathError('DomainError', 'acos domain is [-1, 1]')
  return fromRadians(Math.acos(n), mode)
}
export function atan(v: CalcValue, mode: AngleMode): CalcValue {
  return fromRadians(Math.atan(toDecimal(v).toNumber()), mode)
}

export function sinh(v: CalcValue): CalcValue {
  return unary(Math.sinh, v)
}
export function cosh(v: CalcValue): CalcValue {
  return unary(Math.cosh, v)
}
export function tanh(v: CalcValue): CalcValue {
  return unary(Math.tanh, v)
}
export function asinh(v: CalcValue): CalcValue {
  return unary(Math.asinh, v)
}
export function acosh(v: CalcValue): CalcValue {
  const n = toDecimal(v).toNumber()
  if (n < 1) throw new MathError('DomainError', 'acosh domain is [1, ∞)')
  return unary(Math.acosh, v)
}
export function atanh(v: CalcValue): CalcValue {
  const n = toDecimal(v).toNumber()
  if (n <= -1 || n >= 1) throw new MathError('DomainError', 'atanh domain is (-1, 1)')
  return unary(Math.atanh, v)
}
