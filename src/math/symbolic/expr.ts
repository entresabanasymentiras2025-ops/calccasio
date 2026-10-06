import { MathError } from '../arithmetic/value'

/**
 * Symbolic expression tree for the CAS (ClassPad family). Numbers are exact
 * rationals (BigInt) unless they come from an approximation (`real`).
 * Constants π and e are symbols. Everything here is pure data so results
 * can be serialized with the calculator document.
 */
export interface Q {
  n: bigint
  d: bigint
}

export type Sym =
  | { t: 'num'; q: Q }
  | { t: 'real'; v: number }
  | { t: 'sym'; name: string }
  | { t: 'add'; terms: Sym[] }
  | { t: 'mul'; factors: Sym[] }
  | { t: 'pow'; base: Sym; exp: Sym }
  | { t: 'fn'; name: string; arg: Sym }

// ------------------------------------------------------------- rationals

const abs = (a: bigint) => (a < 0n ? -a : a)
export function gcd(a: bigint, b: bigint): bigint {
  a = abs(a)
  b = abs(b)
  while (b) [a, b] = [b, a % b]
  return a || 1n
}
export function q(n: bigint | number, d: bigint | number = 1n): Q {
  let nn = BigInt(n)
  let dd = BigInt(d)
  if (dd === 0n) throw new MathError('MathError', 'Division by zero')
  if (dd < 0n) {
    nn = -nn
    dd = -dd
  }
  const g = gcd(nn, dd)
  return { n: nn / g, d: dd / g }
}
export const qAdd = (a: Q, b: Q) => q(a.n * b.d + b.n * a.d, a.d * b.d)
export const qMul = (a: Q, b: Q) => q(a.n * b.n, a.d * b.d)
export const qNeg = (a: Q) => q(-a.n, a.d)
export const qInv = (a: Q) => q(a.d, a.n)
export const qIsInt = (a: Q) => a.d === 1n
export const qEq = (a: Q, b: Q) => a.n === b.n && a.d === b.d
export const qToNum = (a: Q) => Number(a.n) / Number(a.d)
export function qPowInt(a: Q, e: bigint): Q {
  if (e < 0n) return qPowInt(qInv(a), -e)
  if (e > 2000n) throw new MathError('OverflowError', 'Exponent too large')
  return q(a.n ** e, a.d ** e)
}

// ------------------------------------------------------------- constructors

export const num = (n: bigint | number, d: bigint | number = 1n): Sym => ({ t: 'num', q: q(n, d) })
export const numQ = (v: Q): Sym => ({ t: 'num', q: v })
export const sym = (name: string): Sym => ({ t: 'sym', name })
export const add = (...terms: Sym[]): Sym => ({ t: 'add', terms })
export const mul = (...factors: Sym[]): Sym => ({ t: 'mul', factors })
export const pow = (base: Sym, exp: Sym): Sym => ({ t: 'pow', base, exp })
export const fn = (name: string, arg: Sym): Sym => ({ t: 'fn', name, arg })
export const neg = (a: Sym): Sym => mul(num(-1), a)
export const sub = (a: Sym, b: Sym): Sym => add(a, neg(b))
export const div = (a: Sym, b: Sym): Sym => mul(a, pow(b, num(-1)))

export const ZERO = num(0)
export const ONE = num(1)

export function isNum(s: Sym, v?: number): boolean {
  return s.t === 'num' && (v === undefined || (s.q.d === 1n && s.q.n === BigInt(v)))
}

export function contains(s: Sym, name: string): boolean {
  switch (s.t) {
    case 'sym':
      return s.name === name
    case 'add':
      return s.terms.some((x) => contains(x, name))
    case 'mul':
      return s.factors.some((x) => contains(x, name))
    case 'pow':
      return contains(s.base, name) || contains(s.exp, name)
    case 'fn':
      return contains(s.arg, name)
    default:
      return false
  }
}

export function symbolsIn(s: Sym, out = new Set<string>()): Set<string> {
  if (s.t === 'sym' && s.name !== 'π' && s.name !== 'e') out.add(s.name)
  if (s.t === 'add') s.terms.forEach((x) => symbolsIn(x, out))
  if (s.t === 'mul') s.factors.forEach((x) => symbolsIn(x, out))
  if (s.t === 'pow') {
    symbolsIn(s.base, out)
    symbolsIn(s.exp, out)
  }
  if (s.t === 'fn') symbolsIn(s.arg, out)
  return out
}

export function substitute(s: Sym, name: string, value: Sym): Sym {
  switch (s.t) {
    case 'sym':
      return s.name === name ? value : s
    case 'add':
      return add(...s.terms.map((x) => substitute(x, name, value)))
    case 'mul':
      return mul(...s.factors.map((x) => substitute(x, name, value)))
    case 'pow':
      return pow(substitute(s.base, name, value), substitute(s.exp, name, value))
    case 'fn':
      return fn(s.name, substitute(s.arg, name, value))
    default:
      return s
  }
}

const FN_NUMERIC: Record<string, (x: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  ln: Math.log,
  log: Math.log10,
  abs: Math.abs,
  fact: (x) => {
    if (!Number.isInteger(x) || x < 0 || x > 170) return NaN
    let r = 1
    for (let i = 2; i <= x; i++) r *= i
    return r
  },
}

/** Numeric evaluation (radians), with optional variable values. */
export function approx(s: Sym, vars: Record<string, number> = {}): number {
  switch (s.t) {
    case 'num':
      return qToNum(s.q)
    case 'real':
      return s.v
    case 'sym':
      if (s.name === 'π') return Math.PI
      if (s.name === 'e') return Math.E
      if (s.name in vars) return vars[s.name]
      throw new MathError('MathError', `Variable ${s.name} has no value`)
    case 'add':
      return s.terms.reduce((a, x) => a + approx(x, vars), 0)
    case 'mul':
      return s.factors.reduce((a, x) => a * approx(x, vars), 1)
    case 'pow': {
      const b = approx(s.base, vars)
      const e = approx(s.exp, vars)
      if (b < 0 && s.exp.t === 'num' && s.exp.q.d % 2n === 1n) {
        const r = Math.pow(-b, e)
        return s.exp.q.n % 2n === 0n ? r : -r
      }
      return Math.pow(b, e)
    }
    case 'fn': {
      const f = FN_NUMERIC[s.name]
      if (!f) throw new MathError('SyntaxError', `Unknown function ${s.name}`)
      return f(approx(s.arg, vars))
    }
  }
}

// ------------------------------------------------------------- printing

function prec(s: Sym): number {
  if (s.t === 'add') return 1
  if (s.t === 'mul') return 2
  if (s.t === 'num' && (s.q.n < 0n || s.q.d !== 1n)) return 2
  if (s.t === 'real' && s.v < 0) return 2
  if (s.t === 'pow') return 3
  return 4
}

function wrap(s: Sym, min: number): string {
  const text = print(s)
  return prec(s) < min ? `(${text})` : text
}

function qText(v: Q): string {
  return v.d === 1n ? v.n.toString() : `${v.n}/${v.d}`
}

export function formatReal(v: number): string {
  if (!Number.isFinite(v)) return v > 0 ? '∞' : v < 0 ? '-∞' : 'undefined'
  if (Math.abs(v) < 1e-13) return '0'
  return String(Number(v.toPrecision(10))).replace('e+', 'E').replace('e-', 'E-')
}

function printMul(factors: Sym[]): string {
  let coeff: Q = q(1)
  const numer: Sym[] = []
  const denom: Sym[] = []
  for (const f of factors) {
    if (f.t === 'num') coeff = qMul(coeff, f.q)
    else if (f.t === 'pow' && f.exp.t === 'num' && f.exp.q.n < 0n) {
      const e = qNeg(f.exp.q)
      denom.push(qEq(e, q(1)) ? f.base : pow(f.base, numQ(e)))
    } else numer.push(f)
  }
  const sign = coeff.n < 0n ? '-' : ''
  const cn = abs(coeff.n)
  const parts: string[] = []
  if (cn !== 1n || numer.length === 0) parts.push(cn.toString())
  let prevText = ''
  numer.forEach((f, i) => {
    const text = wrap(f, 3)
    const bothGroups = prevText.endsWith(')') && prevText.startsWith('(') && text.startsWith('(')
    const needsStar = (parts.length > 0 && /^[0-9]/.test(text)) || (i > 0 && !bothGroups)
    parts.push(needsStar ? `*${text}` : text)
    prevText = text
  })
  let out = parts.join('')
  if (coeff.d !== 1n) denom.unshift(num(coeff.d))
  if (denom.length) {
    const d = denom.length === 1 && prec(denom[0]) >= 3 ? print(denom[0]) : `(${denom.map((x) => wrap(x, 3)).join('*')})`
    out = `${out}/${d}`
  }
  return sign + out
}

export function print(s: Sym): string {
  switch (s.t) {
    case 'num':
      return qText(s.q)
    case 'real':
      return formatReal(s.v)
    case 'sym':
      return s.name
    case 'add': {
      let out = ''
      s.terms.forEach((t, i) => {
        const text = print(t)
        if (i === 0) out = prec(t) < 1 ? `(${text})` : text
        else out += text.startsWith('-') ? `-${text.slice(1)}` : `+${text}`
      })
      return out
    }
    case 'mul':
      return printMul(s.factors)
    case 'pow': {
      if (s.exp.t === 'num' && qEq(s.exp.q, q(1, 2))) return `√(${print(s.base)})`
      if (s.exp.t === 'num' && s.exp.q.n < 0n) return printMul([s])
      if (s.base.t === 'sym' && s.base.name === 'e') return `e^${wrap(s.exp, 4)}`
      return `${wrap(s.base, 4)}^${wrap(s.exp, 4)}`
    }
    case 'fn':
      if (s.name === 'abs') return `|${print(s.arg)}|`
      if (s.name === 'fact') return `${wrap(s.arg, 4)}!`
      return `${s.name}(${print(s.arg)})`
  }
}
