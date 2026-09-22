import { type CalcValue, MathError, fromDecimal, toDecimal, Decimal, isNegative, isZero } from './value'

export function ln(v: CalcValue): CalcValue {
  if (isNegative(v) || isZero(v)) throw new MathError('DomainError', 'ln domain is (0, ∞)')
  return fromDecimal(toDecimal(v).ln())
}

export function log10(v: CalcValue): CalcValue {
  if (isNegative(v) || isZero(v)) throw new MathError('DomainError', 'log domain is (0, ∞)')
  return fromDecimal(toDecimal(v).log(10))
}

export function logBase(v: CalcValue, base: CalcValue): CalcValue {
  if (isNegative(v) || isZero(v)) throw new MathError('DomainError', 'log domain is (0, ∞)')
  const b = toDecimal(base)
  if (b.lte(0) || b.eq(1)) throw new MathError('DomainError', 'Invalid logarithm base')
  return fromDecimal(toDecimal(v).ln().div(b.ln()))
}

export function exp(v: CalcValue): CalcValue {
  return fromDecimal(toDecimal(v).exp())
}

export function pow10(v: CalcValue): CalcValue {
  return fromDecimal(new Decimal(10).pow(toDecimal(v)))
}
