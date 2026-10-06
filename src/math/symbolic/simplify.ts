import { MathError } from '../arithmetic/value'
import { type Sym, type Q, q, qAdd, qMul, qEq, qIsInt, qPowInt, qNeg, num, numQ, add, mul, pow, fn, print, isNum, ZERO, ONE, sym } from './expr'

/** Splits n = s² · r with r square-free (trial division for modest sizes). */
function squareFactor(n: bigint): { outside: bigint; inside: bigint } {
  let outside = 1n
  let inside = n
  for (let p = 2n; p * p <= inside && p < 10000n; p++) {
    while (inside % (p * p) === 0n) {
      inside /= p * p
      outside *= p
    }
  }
  return { outside, inside }
}

function splitCoeff(term: Sym): { c: Q; rest: Sym } {
  if (term.t === 'num') return { c: term.q, rest: ONE }
  if (term.t === 'mul' && term.factors.length && term.factors[0].t === 'num') {
    const rest = term.factors.slice(1)
    return { c: term.factors[0].q, rest: rest.length === 1 ? rest[0] : mul(...rest) }
  }
  return { c: q(1), rest: term }
}

function degreeKey(s: Sym): number {
  if (s.t === 'sym') return 1
  if (s.t === 'pow' && s.exp.t === 'num') return Number(s.exp.q.n) / Number(s.exp.q.d)
  if (s.t === 'mul') return s.factors.reduce((a, f) => a + degreeKey(f), 0)
  if (s.t === 'num') return 0
  return 0.5
}

/** Exponents of plain symbols in a monomial (coefficients ignored); null for non-monomials. */
function expMap(s: Sym): Record<string, number> | null {
  const out: Record<string, number> = {}
  const factors = s.t === 'mul' ? s.factors : [s]
  for (const f of factors) {
    if (f.t === 'num' || f.t === 'real') continue
    if (f.t === 'sym') out[f.name] = (out[f.name] ?? 0) + 1
    else if (f.t === 'pow' && f.base.t === 'sym' && f.exp.t === 'num') out[f.base.name] = (out[f.base.name] ?? 0) + Number(f.exp.q.n) / Number(f.exp.q.d)
    else return null
  }
  return out
}

/** Term order: total degree descending, then lexicographic (a before b) by exponent, then text. */
function compareTerms(a: Sym, b: Sym): number {
  const d = degreeKey(b) - degreeKey(a)
  if (d !== 0) return d
  const ea = expMap(a)
  const eb = expMap(b)
  if (ea && eb) {
    const vars = [...new Set([...Object.keys(ea), ...Object.keys(eb)])].sort()
    for (const v of vars) {
      const diff = (eb[v] ?? 0) - (ea[v] ?? 0)
      if (diff !== 0) return diff
    }
  }
  return print(a).localeCompare(print(b))
}

function hasReal(s: Sym): boolean {
  if (s.t === 'real') return true
  if (s.t === 'add') return s.terms.some(hasReal)
  if (s.t === 'mul') return s.factors.some(hasReal)
  if (s.t === 'pow') return hasReal(s.base) || hasReal(s.exp)
  if (s.t === 'fn') return hasReal(s.arg)
  return false
}

const PI = sym('π')

/** Exact values for common function arguments; null when not special. */
function specialFn(name: string, a: Sym): Sym | null {
  if (isNum(a, 0)) {
    if (name === 'sin' || name === 'tan' || name === 'asin' || name === 'atan' || name === 'sinh' || name === 'tanh') return ZERO
    if (name === 'cos' || name === 'cosh') return ONE
  }
  if (name === 'ln' && isNum(a, 1)) return ZERO
  if (name === 'ln' && a.t === 'sym' && a.name === 'e') return ONE
  if (name === 'ln' && a.t === 'pow' && a.base.t === 'sym' && a.base.name === 'e') return a.exp
  if (name === 'log' && isNum(a, 1)) return ZERO
  if (name === 'abs' && a.t === 'num') return numQ({ n: a.q.n < 0n ? -a.q.n : a.q.n, d: a.q.d })
  if (name === 'fact' && a.t === 'num' && qIsInt(a.q) && a.q.n >= 0n && a.q.n <= 500n) {
    let r = 1n
    for (let i = 2n; i <= a.q.n; i++) r *= i
    return num(r)
  }
  // Multiples of π for sin/cos.
  const piMultiple = (s: Sym): Q | null => {
    if (s.t === 'sym' && s.name === 'π') return q(1)
    if (s.t === 'mul' && s.factors.length === 2 && s.factors[0].t === 'num' && s.factors[1].t === 'sym' && s.factors[1].name === 'π') return s.factors[0].q
    return null
  }
  const k = piMultiple(a)
  if (k && (name === 'sin' || name === 'cos')) {
    // reduce k mod 2 and look up multiples of 1/6, 1/4
    const twelfths = (k.n * 12n) / k.d
    if ((k.n * 12n) % k.d !== 0n) return null
    const t = Number(((twelfths % 24n) + 24n) % 24n)
    const table: Record<number, [Sym, Sym]> = {
      0: [ZERO, ONE],
      2: [num(1, 2), mul(num(1, 2), pow(num(3), num(1, 2)))],
      3: [mul(num(1, 2), pow(num(2), num(1, 2))), mul(num(1, 2), pow(num(2), num(1, 2)))],
      4: [mul(num(1, 2), pow(num(3), num(1, 2))), num(1, 2)],
      6: [ONE, ZERO],
    }
    const reduce = (tt: number): [Sym, Sym] | null => {
      if (table[tt]) return table[tt]
      if (tt > 6 && tt <= 12) {
        const r = table[12 - tt]
        return r ? [r[0], mul(num(-1), r[1])] : null
      }
      if (tt > 12) {
        const r = reduce(tt - 12)
        return r ? [mul(num(-1), r[0]), mul(num(-1), r[1])] : null
      }
      return null
    }
    const r = reduce(t)
    if (r) return simplify(name === 'sin' ? r[0] : r[1])
  }
  void PI
  return null
}

export function simplify(s: Sym): Sym {
  switch (s.t) {
    case 'num':
    case 'real':
    case 'sym':
      return s
    case 'fn': {
      const a = simplify(s.arg)
      if (s.name === 'sqrt') return simplify(pow(a, num(1, 2)))
      if (s.name === 'exp') return simplify(pow(sym('e'), a))
      const special = specialFn(s.name, a)
      if (special) return special
      if (a.t === 'real') {
        const out = fn(s.name, a)
        return { t: 'real', v: approxFn(out) }
      }
      return fn(s.name, a)
    }
    case 'pow':
      return simplifyPow(simplify(s.base), simplify(s.exp))
    case 'mul':
      return simplifyMul(s.factors.map(simplify))
    case 'add':
      return simplifyAdd(s.terms.map(simplify))
  }
}

function approxFn(s: Sym): number {
  // Local import cycle avoidance: numeric evaluation of a single function node.
  const f = s as { t: 'fn'; name: string; arg: { t: 'real'; v: number } }
  const table: Record<string, (x: number) => number> = { sin: Math.sin, cos: Math.cos, tan: Math.tan, ln: Math.log, log: Math.log10, abs: Math.abs, asin: Math.asin, acos: Math.acos, atan: Math.atan }
  const g = table[f.name]
  return g ? g(f.arg.v) : NaN
}

function simplifyPow(base: Sym, exp: Sym): Sym {
  if (isNum(exp, 0)) {
    if (isNum(base, 0)) throw new MathError('MathError', '0^0 is undefined')
    return ONE
  }
  if (isNum(exp, 1)) return base
  if (isNum(base, 1)) return ONE
  if (isNum(base, 0)) {
    if (exp.t === 'num' && exp.q.n < 0n) throw new MathError('MathError', 'Division by zero')
    return ZERO
  }
  if (base.t === 'real' || exp.t === 'real') {
    if ((base.t === 'real' || base.t === 'num') && (exp.t === 'real' || exp.t === 'num')) {
      const b = base.t === 'real' ? base.v : Number(base.q.n) / Number(base.q.d)
      const e = exp.t === 'real' ? exp.v : Number(exp.q.n) / Number(exp.q.d)
      return { t: 'real', v: Math.pow(b, e) }
    }
  }
  if (base.t === 'num' && exp.t === 'num') {
    if (qIsInt(exp.q)) return numQ(qPowInt(base.q, exp.q.n))
    // Rational exponent p/r: exact r-th roots when possible, else simplify square roots.
    if (exp.q.d === 2n && base.q.n > 0n) {
      const p = exp.q.n
      const rootN = squareFactor(base.q.n)
      const rootD = squareFactor(base.q.d)
      // √(a/b) = √(a·b)/b to keep the radicand an integer
      if (rootD.inside !== 1n) {
        return simplify(mul(pow(numQ(q(1, base.q.d)), exp), pow(num(base.q.n * base.q.d), exp)))
      }
      const outside = q(rootN.outside, rootD.outside)
      const coeff = numQ(qPowInt(outside, p))
      if (rootN.inside === 1n) return coeff
      // Already in lowest form (square-free radicand, exponent ±1/2): stop here.
      if (rootN.outside === 1n && (p === 1n || p === -1n)) return pow(base, exp)
      const inner = num(rootN.inside)
      // p is odd: inner^(p/2) = inner^((p-1)/2) * √inner
      const whole = (p - (p > 0n ? 1n : -1n)) / 2n
      const rest = p > 0n ? q(1, 2) : q(-1, 2)
      return simplifyMul([coeff, numQ(qPowInt(q(rootN.inside), whole)), pow(inner, numQ(rest))])
    }
    if (base.q.n < 0n && exp.q.d % 2n === 0n) throw new MathError('MathError', 'Non-real result (even root of a negative number)')
    // exact odd roots of perfect powers
    const r = Number(exp.q.d)
    const tryRoot = (v: bigint) => {
      const sign = v < 0n ? -1n : 1n
      const a = v < 0n ? -v : v
      const guess = BigInt(Math.round(Math.pow(Number(a), 1 / r)))
      for (const g of [guess - 1n, guess, guess + 1n]) if (g >= 0n && g ** BigInt(r) === a) return sign * g
      return null
    }
    const rn = tryRoot(base.q.n)
    const rd = tryRoot(base.q.d)
    if (rn !== null && rd !== null) return numQ(qPowInt(q(rn, rd), exp.q.n))
    return pow(base, exp)
  }
  if (base.t === 'pow' && exp.t === 'num' && base.exp.t === 'num' && (qIsInt(exp.q) || qIsInt(base.exp.q))) {
    return simplifyPow(base.base, numQ(qMul(base.exp.q, exp.q)))
  }
  if (base.t === 'mul' && exp.t === 'num' && qIsInt(exp.q)) {
    return simplifyMul(base.factors.map((f) => simplifyPow(f, exp)))
  }
  if (base.t === 'sym' && base.name === 'e' && exp.t === 'fn' && exp.name === 'ln') return exp.arg
  return pow(base, exp)
}

function simplifyMul(factors: Sym[]): Sym {
  const flat: Sym[] = []
  for (const f of factors) {
    if (f.t === 'mul') flat.push(...f.factors)
    else flat.push(f)
  }
  let coeff: Q = q(1)
  let real: number | null = null
  const groups = new Map<string, { base: Sym; exp: Sym }>()
  for (const f of flat) {
    if (f.t === 'num') {
      coeff = qMul(coeff, f.q)
      continue
    }
    if (f.t === 'real') {
      real = (real ?? 1) * f.v
      continue
    }
    const base = f.t === 'pow' ? f.base : f
    const exp = f.t === 'pow' ? f.exp : ONE
    // Numeric bases with fractional exponents (radicals) group by base value.
    const key = print(base)
    const g = groups.get(key)
    if (g) g.exp = simplify(add(g.exp, exp))
    else groups.set(key, { base, exp })
  }
  if (coeff.n === 0n) return ZERO
  const rest: Sym[] = []
  for (const { base, exp } of groups.values()) {
    const p = simplifyPow(base, exp)
    if (p.t === 'num') coeff = qMul(coeff, p.q)
    else if (p.t === 'mul') {
      for (const x of p.factors) {
        if (x.t === 'num') coeff = qMul(coeff, x.q)
        else rest.push(x)
      }
    } else if (!isNum(p, 1)) rest.push(p)
  }
  if (coeff.n === 0n) return ZERO
  rest.sort((a, b) => degreeKey(b) - degreeKey(a) || print(a).localeCompare(print(b)))
  if (real !== null) {
    const v = real * (Number(coeff.n) / Number(coeff.d))
    if (rest.length === 0) return { t: 'real', v }
    return mul({ t: 'real', v }, ...rest)
  }
  const out: Sym[] = qEq(coeff, q(1)) ? rest : [numQ(coeff), ...rest]
  if (out.length === 0) return ONE
  if (out.length === 1) return out[0]
  return mul(...out)
}

function simplifyAdd(terms: Sym[]): Sym {
  const flat: Sym[] = []
  for (const t of terms) {
    if (t.t === 'add') flat.push(...t.terms)
    else flat.push(t)
  }
  let constant: Q = q(0)
  let real: number | null = null
  const groups = new Map<string, { c: Q; rest: Sym; creal: number | null }>()
  for (const t of flat) {
    if (t.t === 'num') {
      constant = qAdd(constant, t.q)
      continue
    }
    if (t.t === 'real') {
      real = (real ?? 0) + t.v
      continue
    }
    let c: Q
    let rest: Sym
    let creal: number | null = null
    if (t.t === 'mul' && t.factors[0]?.t === 'real') {
      creal = t.factors[0].v
      c = q(0)
      rest = t.factors.length === 2 ? t.factors[1] : mul(...t.factors.slice(1))
    } else ({ c, rest } = splitCoeff(t))
    const key = print(rest)
    const g = groups.get(key)
    if (g) {
      if (creal !== null || g.creal !== null) g.creal = (g.creal ?? Number(g.c.n) / Number(g.c.d)) + (creal ?? Number(c.n) / Number(c.d))
      else g.c = qAdd(g.c, c)
    } else groups.set(key, { c, rest, creal })
  }
  const out: Sym[] = []
  for (const { c, rest, creal } of groups.values()) {
    if (creal !== null) {
      if (Math.abs(creal) > 1e-15) out.push(simplifyMul([{ t: 'real', v: creal }, rest]))
      continue
    }
    if (c.n === 0n) continue
    out.push(simplifyMul([numQ(c), rest]))
  }
  out.sort(compareTerms)
  if (real !== null) {
    const v = real + Number(constant.n) / Number(constant.d)
    if (Math.abs(v) > 1e-15 || out.length === 0) out.push({ t: 'real', v })
  } else if (constant.n !== 0n) out.push(numQ(constant))
  if (out.length === 0) return ZERO
  if (out.length === 1) return out[0]
  return add(...out)
}

/** Distributes products over sums and expands small integer powers of sums. */
export function expand(s: Sym): Sym {
  const e = expandRaw(simplify(s))
  return simplify(e)
}

function expandRaw(s: Sym): Sym {
  switch (s.t) {
    case 'add':
      return simplify(add(...s.terms.map(expandRaw)))
    case 'mul': {
      let acc: Sym[] = [ONE]
      for (const f of s.factors.map(expandRaw)) {
        const parts = f.t === 'add' ? f.terms : [f]
        const next: Sym[] = []
        for (const a of acc) for (const b of parts) next.push(simplify(mul(a, b)))
        if (next.length > 5000) throw new MathError('MemoryError', 'Expansion too large')
        acc = next
      }
      return simplify(add(...acc))
    }
    case 'pow': {
      const base = expandRaw(s.base)
      if (base.t === 'add' && s.exp.t === 'num' && qIsInt(s.exp.q) && s.exp.q.n > 1n && s.exp.q.n <= 20n) {
        let acc: Sym = base
        for (let i = 1n; i < s.exp.q.n; i++) acc = expandRaw(mul(acc, base))
        return acc
      }
      return simplify(pow(base, s.exp))
    }
    case 'fn':
      return fn(s.name, expandRaw(s.arg))
    default:
      return s
  }
}

export function isRealValued(s: Sym): boolean {
  return hasReal(s)
}

export function negate(s: Sym): Sym {
  return simplify(mul(num(-1), s))
}

export { qNeg }
