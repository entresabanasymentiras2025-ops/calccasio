import { Decimal, MathError, fromDecimal, type CalcValue, toDecimal } from '../../math/arithmetic/value'
import { formatValue, formattedToPlainText } from '../../math/numerical/format'
import type { CalculatorSettings } from '../core/CalculatorState'

/** Best rational approximation via continued fractions, or null if none with den ≤ maxDen is (near-)exact. */
export function toFraction(x: number, maxDen = 10000): { num: number; den: number } | null {
  if (!Number.isFinite(x) || Number.isInteger(x)) return null
  const sign = x < 0 ? -1 : 1
  let v = Math.abs(x)
  let [h0, h1, k0, k1] = [0, 1, 1, 0]
  for (let i = 0; i < 40; i++) {
    const a = Math.floor(v)
    ;[h0, h1] = [h1, a * h1 + h0]
    ;[k0, k1] = [k1, a * k1 + k0]
    if (k1 > maxDen) return null
    if (Math.abs(h1 / k1 - Math.abs(x)) <= 1e-12 * Math.max(1, Math.abs(x))) return k1 === 1 ? null : { num: sign * h1, den: k1 }
    const frac = v - a
    if (frac < 1e-15) break
    v = 1 / frac
  }
  return null
}

function applyNumberFormat(v: CalcValue, settings: Partial<CalculatorSettings>): string | null {
  const nf = settings.numberFormat
  if (!nf || nf.kind === 'norm') return null
  const d = toDecimal(v)
  if (nf.kind === 'fix') return d.toFixed(nf.digits)
  const [m, e] = d.toExponential(Math.max(0, nf.digits - 1)).split('e')
  return `${m}×10^${e.replace('+', '')}`
}

/** Formats an exact/decimal CalcValue honoring SETUP (fraction style, Fix/Sci). */
export function formatCalcValue(v: CalcValue, settings: Partial<CalculatorSettings>, sigDigits = 10): string {
  const fixed = applyNumberFormat(v, settings)
  const style = settings.fractionDisplay ?? 'mixed'
  if (fixed !== null && !(v.kind === 'rational' && v.den !== 1n && style !== 'decimal')) return fixed
  if (v.kind === 'rational' && v.den !== 1n && style === 'improper') {
    return `${v.num}/${v.den}`
  }
  return formattedToPlainText(formatValue(v, { preferFraction: style !== 'decimal', significantDigits: sigDigits }))
}

/** Formats a floating-point result; recognises near-exact fractions when fractions are enabled. */
export function formatReal(x: number, settings: Partial<CalculatorSettings> = {}, sigDigits = 10): string {
  if (!Number.isFinite(x)) throw new MathError('MathError', 'Result out of range')
  const clean = Math.abs(x) < 1e-13 ? 0 : x
  if ((settings.fractionDisplay ?? 'mixed') !== 'decimal') {
    const fr = toFraction(clean)
    if (fr) {
      return formatCalcValue({ kind: 'rational', num: BigInt(fr.num), den: BigInt(fr.den) }, settings, sigDigits)
    }
  }
  return formatCalcValue(fromDecimal(new Decimal(clean.toPrecision(15))), settings, sigDigits)
}
