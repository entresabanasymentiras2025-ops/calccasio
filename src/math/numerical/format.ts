import { type CalcValue, Decimal, toDecimal, isNegative } from '../arithmetic/value'

export type FormattedValue =
  | { kind: 'integer'; text: string }
  | { kind: 'decimal'; text: string }
  | { kind: 'fraction'; whole: string | null; numerator: string; denominator: string; negative: boolean }
  | { kind: 'scientific'; mantissa: string; exponent: string; negative: boolean }

export interface FormatOptions {
  /** Maximum significant digits shown, matching typical ClassWiz 10-digit mantissa. */
  significantDigits?: number
  /** When true, exact rationals with denominator != 1 render as a fraction. */
  preferFraction?: boolean
}

const SUPERSCRIPT_DIGITS: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '-': '⁻',
}

export function toSuperscript(text: string): string {
  return text
    .split('')
    .map((c) => SUPERSCRIPT_DIGITS[c] ?? c)
    .join('')
}

function formatDecimalString(d: Decimal, significantDigits: number): { text: string; scientific: boolean } {
  if (d.isZero()) return { text: '0', scientific: false }
  const exponent = d.abs().log(10).floor().toNumber()
  const useScientific = exponent >= significantDigits || exponent < -9
  if (useScientific) {
    const normalized = d.toSignificantDigits(significantDigits)
    const [mantissa, exp] = normalized.toExponential(significantDigits - 1).split('e')
    const trimmedMantissa = trimTrailingZeros(mantissa)
    return { text: `${trimmedMantissa}E${exp.replace('+', '')}`, scientific: true }
  }
  const rounded = d.toSignificantDigits(significantDigits)
  return { text: trimTrailingZeros(rounded.toFixed()), scientific: false }
}

function trimTrailingZeros(text: string): string {
  if (!text.includes('.')) return text
  return text.replace(/0+$/, '').replace(/\.$/, '')
}

export function formatValue(v: CalcValue, opts: FormatOptions = {}): FormattedValue {
  const significantDigits = opts.significantDigits ?? 10
  const preferFraction = opts.preferFraction ?? true

  if (v.kind === 'rational' && preferFraction && v.den !== 1n) {
    const negative = v.num < 0n
    const absNum = negative ? -v.num : v.num
    const whole = absNum / v.den
    const remainder = absNum % v.den
    return {
      kind: 'fraction',
      whole: whole > 0n ? whole.toString() : null,
      numerator: remainder.toString(),
      denominator: v.den.toString(),
      negative,
    }
  }

  const d = toDecimal(v)
  const negative = isNegative(v)
  const { text, scientific } = formatDecimalString(d.abs(), significantDigits)

  if (scientific) {
    const [mantissa, exponent] = text.split('E')
    return { kind: 'scientific', mantissa, exponent, negative }
  }
  const signed = negative && text !== '0' ? `-${text}` : text
  return { kind: d.isInteger() ? 'integer' : 'decimal', text: signed }
}

export function formattedToPlainText(f: FormattedValue): string {
  switch (f.kind) {
    case 'integer':
    case 'decimal':
      return f.text
    case 'fraction': {
      const sign = f.negative ? '-' : ''
      return f.whole ? `${sign}${f.whole} ${f.numerator}/${f.denominator}` : `${sign}${f.numerator}/${f.denominator}`
    }
    case 'scientific':
      return `${f.negative ? '-' : ''}${f.mantissa}×10${toSuperscript(f.exponent)}`
  }
}
