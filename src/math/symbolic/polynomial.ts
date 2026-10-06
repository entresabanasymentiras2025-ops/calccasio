import { MathError } from '../arithmetic/value'
import { type Sym, type Q, q, qAdd, qMul, qNeg, qInv, qIsInt, qEq, qToNum, gcd, num, numQ, sym, add, mul, pow, contains, print, approx } from './expr'
import { simplify, expand } from './simplify'
import { polynomialRoots } from '../numerical/equations'
import { rootsIn } from '../../calculators/graphing/plot'

/** Dense polynomial with rational coefficients, index = degree. */
export type QPoly = Q[]

/** Converts an expression to a rational-coefficient polynomial in `x`, or null if it is not one. */
export function toQPoly(s: Sym, x: string): QPoly | null {
  const e = expand(s)
  const terms = e.t === 'add' ? e.terms : [e]
  const out: QPoly = []
  for (const t of terms) {
    let c: Q = q(1)
    let deg = 0
    const factors = t.t === 'mul' ? t.factors : [t]
    for (const f of factors) {
      if (f.t === 'num') c = qMul(c, f.q)
      else if (f.t === 'sym' && f.name === x) deg += 1
      else if (f.t === 'pow' && f.base.t === 'sym' && f.base.name === x && f.exp.t === 'num' && qIsInt(f.exp.q) && f.exp.q.n >= 0n) deg += Number(f.exp.q.n)
      else return null
    }
    if (deg > 64) return null
    while (out.length <= deg) out.push(q(0))
    out[deg] = qAdd(out[deg], c)
  }
  while (out.length > 1 && out[out.length - 1].n === 0n) out.pop()
  return out.length ? out : [q(0)]
}

export function polyToSym(p: QPoly, x: string): Sym {
  const terms: Sym[] = []
  for (let d = p.length - 1; d >= 0; d--) {
    if (p[d].n === 0n) continue
    terms.push(mul(numQ(p[d]), d === 0 ? num(1) : d === 1 ? sym(x) : pow(sym(x), num(d))))
  }
  return simplify(terms.length ? add(...terms) : num(0))
}

function evalQ(p: QPoly, v: Q): Q {
  let r = q(0)
  for (let d = p.length - 1; d >= 0; d--) r = qAdd(qMul(r, v), p[d])
  return r
}

/** Synthetic division by (x - r); assumes r is a root. */
function deflate(p: QPoly, r: Q): QPoly {
  const n = p.length - 1
  const out: Q[] = new Array(n).fill(q(0))
  let carry = q(0)
  for (let d = n; d >= 1; d--) {
    carry = qAdd(p[d], qMul(carry, r))
    out[d - 1] = carry
  }
  return out
}

function divisors(n: bigint): bigint[] {
  n = n < 0n ? -n : n
  if (n === 0n) return [1n]
  if (n > 10n ** 12n) return [1n]
  const out: bigint[] = []
  for (let i = 1n; i * i <= n; i++) {
    if (n % i === 0n) {
      out.push(i)
      if (i * i !== n) out.push(n / i)
    }
    if (out.length > 400) break
  }
  return out
}

/** Makes coefficients integers with positive leading coefficient; returns the scale removed. */
function primitive(p: QPoly): { ints: bigint[]; content: Q } {
  let l = 1n
  for (const c of p) l = (l * c.d) / gcd(l, c.d)
  const ints = p.map((c) => (c.n * l) / c.d)
  let g = 0n
  for (const v of ints) g = gcd(g === 0n ? (v < 0n ? -v : v) : g, v)
  if (g === 0n) g = 1n
  const sign = ints[ints.length - 1] < 0n ? -1n : 1n
  return { ints: ints.map((v) => (v / g) * sign), content: q(g * sign, l) }
}

/** Rational roots (with multiplicity) and the remaining factor. */
export function rationalRoots(p: QPoly): { roots: Q[]; rest: QPoly } {
  let cur = [...p]
  const roots: Q[] = []
  // x = 0 roots
  while (cur.length > 1 && cur[0].n === 0n) {
    roots.push(q(0))
    cur = cur.slice(1)
  }
  let found = true
  while (found && cur.length > 2) {
    found = false
    const { ints } = primitive(cur)
    const a0 = ints[0]
    const an = ints[ints.length - 1]
    for (const pp of divisors(a0)) {
      for (const qq of divisors(an)) {
        for (const sgn of [1n, -1n]) {
          const r = q(sgn * pp, qq)
          if (evalQ(cur, r).n === 0n) {
            roots.push(r)
            cur = deflate(cur, r)
            found = true
            break
          }
        }
        if (found) break
      }
      if (found) break
    }
  }
  if (cur.length === 2) {
    roots.push(qNeg(qMul(cur[0], qInv(cur[1]))))
    cur = [cur[1]]
  }
  return { roots, rest: cur }
}

export function mainVariable(s: Sym, preferred = 'x'): string {
  const names: string[] = []
  const walk = (e: Sym) => {
    if (e.t === 'sym' && e.name !== 'π' && e.name !== 'e' && !names.includes(e.name)) names.push(e.name)
    if (e.t === 'add') e.terms.forEach(walk)
    if (e.t === 'mul') e.factors.forEach(walk)
    if (e.t === 'pow') {
      walk(e.base)
      walk(e.exp)
    }
    if (e.t === 'fn') walk(e.arg)
  }
  walk(s)
  return names.includes(preferred) ? preferred : (names[0] ?? preferred)
}

/** Factors a univariate polynomial over the rationals (linear factors + irreducible remainder). */
export function factor(s: Sym, x = mainVariable(s)): Sym {
  const p = toQPoly(s, x)
  if (!p || p.length <= 2) return simplify(s)
  const { roots, rest } = rationalRoots(p)
  const counts = new Map<string, { r: Q; m: number }>()
  for (const r of roots) {
    const k = `${r.n}/${r.d}`
    const e = counts.get(k)
    if (e) e.m++
    else counts.set(k, { r, m: 1 })
  }
  // Leading coefficient bookkeeping: each (d·x − n) factor has leading coeff d.
  let lead = rest[rest.length - 1]
  const factors: Sym[] = []
  const restPrim = rest.length > 1 ? primitive(rest) : null
  if (restPrim) lead = qMul(lead, qInv(q(restPrim.ints[restPrim.ints.length - 1])))
  for (const { r, m } of counts.values()) {
    lead = qMul(lead, qInv(qPowLike(q(r.d), m)))
    const lin = simplify(add(mul(num(r.d), sym(x)), num(-r.n)))
    factors.push(m === 1 ? lin : pow(lin, num(m)))
  }
  if (restPrim) factors.push(polyToSym(restPrim.ints.map((v) => q(v)), x))
  const out = qEq(lead, q(1)) ? factors : [numQ(lead), ...factors]
  return out.length === 1 ? out[0] : { t: 'mul', factors: out }
}

function qPowLike(a: Q, m: number): Q {
  let r = q(1)
  for (let i = 0; i < m; i++) r = qMul(r, a)
  return r
}

export interface SolveResult {
  variable: string
  solutions: Sym[]
  exact: boolean
  note?: string
}

/** Solves expr = 0 for x: exact for polynomials up to degree 2 after removing rational roots, numeric otherwise. */
export function solve(expr: Sym, x: string): SolveResult {
  if (!contains(expr, x)) throw new MathError('MathError', `Equation does not contain ${x}`)
  const p = toQPoly(expr, x)
  if (p) {
    if (p.length === 1) return { variable: x, solutions: [], exact: true, note: p[0].n === 0n ? 'All real numbers' : 'No solution' }
    const { roots, rest } = rationalRoots(p)
    const sols: Sym[] = roots.map((r) => numQ(r))
    let exact = true
    let note: string | undefined
    if (rest.length === 3) {
      const [c, b, a] = rest
      const disc = qAdd(qMul(b, b), qNeg(qMul(q(4), qMul(a, c))))
      if (disc.n < 0n) note = 'Complex roots omitted (real mode)'
      else {
        const sq = simplify(pow(numQ(disc), num(1, 2)))
        const twoA = qMul(q(2), a)
        sols.push(simplify(mul(add(numQ(qNeg(b)), mul(num(-1), sq)), numQ(qInv(twoA)))))
        sols.push(simplify(mul(add(numQ(qNeg(b)), sq), numQ(qInv(twoA)))))
      }
    } else if (rest.length > 3) {
      exact = false
      const real = polynomialRoots([...rest].reverse().map(qToNum)).filter((z) => z.im === 0)
      sols.push(...real.map((z) => ({ t: 'real' as const, v: z.re })))
    }
    const uniq = dedupe(sols)
    uniq.sort((a, b) => approxSafe(a) - approxSafe(b))
    return { variable: x, solutions: uniq, exact, note }
  }
  // Non-polynomial: numeric scan over a wide window.
  const f = (v: number) => approx(expr, { [x]: v })
  const roots = rootsIn(f, -100, 100, 4000)
  const out = dedupeNum(roots).map((v) => ({ t: 'real' as const, v }))
  return { variable: x, solutions: out, exact: false, note: out.length ? 'Numeric solutions in [-100, 100]' : 'No solution found in [-100, 100]' }
}

function approxSafe(s: Sym): number {
  try {
    return approx(s)
  } catch {
    return 0
  }
}

function dedupe(list: Sym[]): Sym[] {
  const seen = new Set<string>()
  return list.filter((s) => {
    const k = print(s)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

function dedupeNum(list: number[]): number[] {
  const out: number[] = []
  for (const v of list) if (!out.some((w) => Math.abs(w - v) < 1e-7 * Math.max(1, Math.abs(v)))) out.push(Number(v.toPrecision(12)))
  return out
}
