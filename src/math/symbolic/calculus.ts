import { MathError } from '../arithmetic/value'
import { type Sym, num, sym, add, mul, pow, fn, contains, substitute, approx, isNum, qIsInt } from './expr'
import { simplify, expand } from './simplify'
import { toQPoly } from './polynomial'
import { integrate as simpson } from '../calculus/numerical'

/** Symbolic derivative d/dx. */
export function diff(s: Sym, x: string): Sym {
  return simplify(d(s, x))
}

function d(s: Sym, x: string): Sym {
  if (!contains(s, x)) return num(0)
  switch (s.t) {
    case 'sym':
      return num(s.name === x ? 1 : 0)
    case 'add':
      return add(...s.terms.map((t) => d(t, x)))
    case 'mul': {
      const terms = s.factors.map((f, i) => mul(...s.factors.map((g, j) => (i === j ? d(f, x) : g))))
      return add(...terms)
    }
    case 'pow': {
      if (!contains(s.exp, x)) return mul(s.exp, pow(s.base, add(s.exp, num(-1))), d(s.base, x))
      if (!contains(s.base, x)) return mul(s, fn('ln', s.base), d(s.exp, x))
      // f^g = e^(g ln f)
      return mul(s, d(mul(s.exp, fn('ln', s.base)), x))
    }
    case 'fn': {
      const u = s.arg
      const du = d(u, x)
      switch (s.name) {
        case 'sin':
          return mul(fn('cos', u), du)
        case 'cos':
          return mul(num(-1), fn('sin', u), du)
        case 'tan':
          return mul(pow(fn('cos', u), num(-2)), du)
        case 'ln':
          return mul(pow(u, num(-1)), du)
        case 'log':
          return mul(pow(mul(u, fn('ln', num(10))), num(-1)), du)
        case 'asin':
          return mul(pow(add(num(1), mul(num(-1), pow(u, num(2)))), num(-1, 2)), du)
        case 'acos':
          return mul(num(-1), pow(add(num(1), mul(num(-1), pow(u, num(2)))), num(-1, 2)), du)
        case 'atan':
          return mul(pow(add(num(1), pow(u, num(2))), num(-1)), du)
        case 'sinh':
          return mul(fn('cosh', u), du)
        case 'cosh':
          return mul(fn('sinh', u), du)
        case 'tanh':
          return mul(pow(fn('cosh', u), num(-2)), du)
        case 'abs':
          return mul(u, pow(fn('abs', u), num(-1)), du)
      }
      throw new MathError('MathError', `Cannot differentiate ${s.name}`)
    }
    default:
      return num(0)
  }
}

/** If s = a·x + b (a ≠ 0, a and b free of x) returns a. */
function linearCoeff(s: Sym, x: string): Sym | null {
  const p = toQPoly(s, x)
  if (!p || p.length !== 2) return null
  return simplify({ t: 'num', q: p[1] })
}

/** Symbolic antiderivative (no constant of integration). Throws when no rule applies. */
export function integrate(s: Sym, x: string): Sym {
  return simplify(antiderivative(expand(s), x))
}

function antiderivative(s: Sym, x: string): Sym {
  if (!contains(s, x)) return mul(s, sym(x))
  if (s.t === 'add') return add(...s.terms.map((t) => antiderivative(t, x)))
  // Pull constant factors out.
  if (s.t === 'mul') {
    const consts = s.factors.filter((f) => !contains(f, x))
    const vars = s.factors.filter((f) => contains(f, x))
    if (consts.length) return mul(...consts, antiderivative(vars.length === 1 ? vars[0] : mul(...vars), x))
    // Polynomial products already expanded; try polynomial form.
    const p = toQPoly(s, x)
    if (p) return antiderivative(simplify(polyExpr(p, x)), x)
    throw new MathError('MathError', `Cannot integrate ${'product'} symbolically`)
  }
  if (s.t === 'sym') return mul(num(1, 2), pow(sym(x), num(2)))
  if (s.t === 'pow') {
    const { base, exp } = s
    if (!contains(exp, x)) {
      const a = linearCoeff(base, x)
      if (a) {
        if (isNum(exp, -1)) return mul(pow(a, num(-1)), fn('ln', fn('abs', base)))
        const n1 = simplify(add(exp, num(1)))
        return mul(pow(mul(a, n1), num(-1)), pow(base, n1))
      }
    }
    if (base.t === 'sym' && base.name === 'e') {
      const a = linearCoeff(exp, x)
      if (a) return mul(pow(a, num(-1)), s)
    }
    if (!contains(base, x)) {
      const a = linearCoeff(exp, x)
      if (a) return mul(pow(mul(a, fn('ln', base)), num(-1)), s)
    }
  }
  if (s.t === 'fn') {
    const a = linearCoeff(s.arg, x)
    if (a) {
      const inv = pow(a, num(-1))
      switch (s.name) {
        case 'sin':
          return mul(num(-1), inv, fn('cos', s.arg))
        case 'cos':
          return mul(inv, fn('sin', s.arg))
        case 'tan':
          return mul(num(-1), inv, fn('ln', fn('abs', fn('cos', s.arg))))
        case 'sinh':
          return mul(inv, fn('cosh', s.arg))
        case 'cosh':
          return mul(inv, fn('sinh', s.arg))
        case 'ln':
          return mul(inv, add(mul(s.arg, fn('ln', s.arg)), mul(num(-1), s.arg)))
      }
    }
  }
  throw new MathError('MathError', 'No symbolic antiderivative found (try a definite integral for a numeric value)')
}

function polyExpr(p: ReturnType<typeof toQPoly>, x: string): Sym {
  return add(...(p ?? []).map((c, deg) => mul({ t: 'num', q: c }, pow(sym(x), num(deg)))))
}

/** Definite integral: exact via the antiderivative when possible, otherwise Simpson's rule. */
export function definiteIntegral(s: Sym, x: string, a: Sym, b: Sym): { value: Sym; exact: boolean } {
  try {
    const F = integrate(s, x)
    const value = simplify(add(substitute(F, x, b), mul(num(-1), substitute(F, x, a))))
    // Guard against antiderivatives with singularities inside [a, b] (e.g. ln|x| across 0).
    const numeric = simpson((v) => approx(s, { [x]: v }), approx(a), approx(b), 2000)
    const exactNum = approx(value)
    if (Number.isFinite(exactNum) && Math.abs(exactNum - numeric) <= 1e-6 * Math.max(1, Math.abs(numeric))) return { value, exact: true }
    return { value: { t: 'real', v: numeric }, exact: false }
  } catch (err) {
    if (err instanceof MathError && err.code !== 'MathError') throw err
    const numeric = simpson((v) => approx(s, { [x]: v }), approx(a), approx(b), 4000)
    if (!Number.isFinite(numeric)) throw new MathError('MathError', 'Integral does not converge')
    return { value: { t: 'real', v: numeric }, exact: false }
  }
}

export { qIsInt }
