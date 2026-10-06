import {
  type CalcValue,
  MathError,
  fromLiteral,
  fromDecimal,
  Decimal,
  add,
  sub,
  mul,
  div,
  neg,
  pow,
  sqrt,
  cbrt,
  abs,
  factorial,
  fromInt,
  toNumber,
  isInteger,
  compare,
} from '../arithmetic/value'
import { derivative, integrate } from '../calculus/numerical'
import { ln, log10, logBase, exp, pow10 } from '../arithmetic/log'
import * as trig from '../trigonometry/trig'
import type { AngleMode } from '../trigonometry/trig'
import type { AstNode } from './ast'
import { parse } from './parser'

export interface EvalContext {
  angleMode: AngleMode
  variables: Record<string, CalcValue>
  ans: CalcValue
}

/** Optional evaluation trace hook (used by the dev inspector). */
export function createContext(overrides: Partial<EvalContext> = {}): EvalContext {
  return {
    angleMode: 'DEG',
    variables: {},
    ans: fromInt(0),
    ...overrides,
  }
}

const CONSTANTS: Record<string, () => CalcValue> = {
  'π': () => fromDecimal(new Decimal('3.14159265358979323846')),
  pi: () => fromDecimal(new Decimal('3.14159265358979323846')),
  e: () => fromDecimal(new Decimal('2.71828182845904523536')),
}

type FnImpl = (args: CalcValue[], ctx: EvalContext) => CalcValue

function unaryFn(f: (v: CalcValue) => CalcValue): FnImpl {
  return (args) => {
    if (args.length !== 1) throw new MathError('SyntaxError', 'Expected exactly 1 argument')
    return f(args[0])
  }
}

const FUNCTIONS: Record<string, FnImpl> = {
  sin: (args, ctx) => trig.sin(one(args), ctx.angleMode),
  cos: (args, ctx) => trig.cos(one(args), ctx.angleMode),
  tan: (args, ctx) => trig.tan(one(args), ctx.angleMode),
  asin: (args, ctx) => trig.asin(one(args), ctx.angleMode),
  acos: (args, ctx) => trig.acos(one(args), ctx.angleMode),
  atan: (args, ctx) => trig.atan(one(args), ctx.angleMode),
  sinh: unaryFn(trig.sinh),
  cosh: unaryFn(trig.cosh),
  tanh: unaryFn(trig.tanh),
  asinh: unaryFn(trig.asinh),
  acosh: unaryFn(trig.acosh),
  atanh: unaryFn(trig.atanh),
  ln: unaryFn(ln),
  // CASIO convention: log(base, x) = log_base(x).
  log: (args) => (args.length === 2 ? logBase(args[1], args[0]) : log10(one(args))),
  sqrt: unaryFn(sqrt),
  cbrt: unaryFn(cbrt),
  exp: unaryFn(exp),
  abs: unaryFn(abs),
  nCr: (args) => combinations(two(args)),
  nPr: (args) => permutations(two(args)),
  gcd: (args) => integerReduce(args, bigGcd),
  lcm: (args) => integerReduce(args, (a, b) => (a === 0n || b === 0n ? 0n : (bigAbsI(a * b) / bigGcd(a, b)))),
  int: unaryFn((v) => fromDecimal(toNumberSafe(v) < 0 ? new Decimal(toNumber(v)).ceil() : new Decimal(toNumber(v)).floor())),
  intg: unaryFn((v) => fromDecimal(new Decimal(toNumber(v)).floor())),
  rnd: (args) => {
    const digits = args.length > 1 ? toNumber(args[1]) : 10
    return fromDecimal(new Decimal(toNumber(args[0])).toSignificantDigits(Math.max(1, Math.min(15, digits))))
  },
}

function toNumberSafe(v: CalcValue): number {
  return toNumber(v)
}

function bigAbsI(n: bigint): bigint {
  return n < 0n ? -n : n
}

function bigGcd(a: bigint, b: bigint): bigint {
  a = bigAbsI(a)
  b = bigAbsI(b)
  while (b) [a, b] = [b, a % b]
  return a
}

function toBigIntStrict(v: CalcValue, what: string): bigint {
  if (!isInteger(v)) throw new MathError('MathError', `${what} requires integer arguments`)
  return v.kind === 'rational' ? v.num : BigInt(v.value.toFixed(0))
}

function integerReduce(args: CalcValue[], op: (a: bigint, b: bigint) => bigint): CalcValue {
  if (args.length < 2) throw new MathError('SyntaxError', 'Expected at least 2 arguments')
  return fromInt(args.map((a) => toBigIntStrict(a, 'GCD/LCM')).reduce(op))
}

function two(args: CalcValue[]): [bigint, bigint] {
  if (args.length !== 2) throw new MathError('SyntaxError', 'Expected exactly 2 arguments')
  const n = toBigIntStrict(args[0], 'nCr/nPr')
  const r = toBigIntStrict(args[1], 'nCr/nPr')
  if (n < 0n || r < 0n || r > n) throw new MathError('MathError', 'Invalid n, r for nCr/nPr')
  if (n > 10000n) throw new MathError('OverflowError', 'n too large')
  return [n, r]
}

function permutations([n, r]: [bigint, bigint]): CalcValue {
  let result = 1n
  for (let i = n - r + 1n; i <= n; i++) result *= i
  return fromInt(result)
}

function combinations([n, r]: [bigint, bigint]): CalcValue {
  const k = r > n - r ? n - r : r
  let result = 1n
  for (let i = 1n; i <= k; i++) result = (result * (n - k + i)) / i
  return fromInt(result)
}

/**
 * Functions whose first argument is an expression in X, evaluated lazily
 * (d/dx, ∫, Σ). They receive raw AST nodes rather than evaluated values.
 */
type LazyFnImpl = (args: AstNode[], ctx: EvalContext) => CalcValue

function withX(node: AstNode, ctx: EvalContext): (x: number) => number {
  return (x: number) => toNumber(evaluateAst(node, { ...ctx, variables: { ...ctx.variables, X: fromDecimal(new Decimal(x)) } }))
}

function cleanFloat(x: number): CalcValue {
  if (!Number.isFinite(x)) throw new MathError('MathError', 'Result out of range')
  // Round away the numerical-method noise below ~1e-10 relative, as hardware does when displaying.
  return fromDecimal(new Decimal(x).toSignificantDigits(12))
}

const LAZY_FUNCTIONS: Record<string, LazyFnImpl> = {
  diff: (args, ctx) => {
    if (args.length !== 2) throw new MathError('SyntaxError', 'd/dx(f(X), a) expects 2 arguments')
    const a = toNumber(evaluateAst(args[1], ctx))
    return cleanFloat(derivative(withX(args[0], ctx), a))
  },
  integ: (args, ctx) => {
    if (args.length !== 3) throw new MathError('SyntaxError', '∫(f(X), a, b) expects 3 arguments')
    const a = toNumber(evaluateAst(args[1], ctx))
    const b = toNumber(evaluateAst(args[2], ctx))
    return cleanFloat(integrate(withX(args[0], ctx), a, b, 2000))
  },
  sum: (args, ctx) => {
    if (args.length !== 3) throw new MathError('SyntaxError', 'Σ(f(X), a, b) expects 3 arguments')
    const a = evaluateAst(args[1], ctx)
    const b = evaluateAst(args[2], ctx)
    if (!isInteger(a) || !isInteger(b)) throw new MathError('MathError', 'Σ bounds must be integers')
    if (compare(a, b) > 0) throw new MathError('MathError', 'Σ lower bound exceeds upper bound')
    const lo = Number(toBigIntStrict(a, 'Σ'))
    const hi = Number(toBigIntStrict(b, 'Σ'))
    if (hi - lo > 100000) throw new MathError('OverflowError', 'Σ range too large')
    let total: CalcValue = fromInt(0)
    for (let k = lo; k <= hi; k++) {
      total = add(total, evaluateAst(args[0], { ...ctx, variables: { ...ctx.variables, X: fromInt(k) } }))
    }
    return total
  },
  prod: (args, ctx) => {
    if (args.length !== 3) throw new MathError('SyntaxError', 'Π(f(X), a, b) expects 3 arguments')
    const lo = Number(toBigIntStrict(evaluateAst(args[1], ctx), 'Π'))
    const hi = Number(toBigIntStrict(evaluateAst(args[2], ctx), 'Π'))
    if (hi - lo > 10000) throw new MathError('OverflowError', 'Π range too large')
    let total: CalcValue = fromInt(1)
    for (let k = lo; k <= hi; k++) total = mul(total, evaluateAst(args[0], { ...ctx, variables: { ...ctx.variables, X: fromInt(k) } }))
    return total
  },
}

/** Extension point: add a function to the shared evaluator (see /docs "Create a math function"). */
export function registerFunction(name: string, impl: (args: CalcValue[], ctx: EvalContext) => CalcValue): void {
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name)) throw new Error(`Invalid function name: ${name}`)
  FUNCTIONS[name] = impl
}

export function listFunctions(): string[] {
  return [...Object.keys(FUNCTIONS), ...Object.keys(LAZY_FUNCTIONS)].sort()
}

function one(args: CalcValue[]): CalcValue {
  if (args.length !== 1) throw new MathError('SyntaxError', 'Expected exactly 1 argument')
  return args[0]
}

export function evaluateAst(node: AstNode, ctx: EvalContext): CalcValue {
  switch (node.type) {
    case 'Number':
      return fromLiteral(node.value)
    case 'Identifier': {
      const name = node.name
      if (CONSTANTS[name]) return CONSTANTS[name]()
      if (name === 'Ans') return ctx.ans
      if (Object.prototype.hasOwnProperty.call(ctx.variables, name)) return ctx.variables[name]
      throw new MathError('SyntaxError', `Unknown identifier '${name}'`)
    }
    case 'UnaryOp': {
      const v = evaluateAst(node.operand, ctx)
      return node.op === '-' ? neg(v) : v
    }
    case 'PostfixOp': {
      const v = evaluateAst(node.operand, ctx)
      if (node.op === '!') return factorial(v)
      // Percent: simplified as x / 100 (a common calculator simplification;
      // real hardware applies context-sensitive percent in +/- expressions).
      return div(v, fromInt(100))
    }
    case 'BinaryOp': {
      const left = evaluateAst(node.left, ctx)
      const right = evaluateAst(node.right, ctx)
      switch (node.op) {
        case '+':
          return add(left, right)
        case '-':
          return sub(left, right)
        case '*':
          return mul(left, right)
        case '/':
          return div(left, right)
        case '^':
          return pow(left, right)
      }
      break
    }
    case 'FunctionCall': {
      const lazy = LAZY_FUNCTIONS[node.name]
      if (lazy) return lazy(node.args, ctx)
      const impl = FUNCTIONS[node.name]
      if (!impl) throw new MathError('SyntaxError', `Unknown function '${node.name}'`)
      const args = node.args.map((a) => evaluateAst(a, ctx))
      return impl(args, ctx)
    }
  }
  throw new MathError('SyntaxError', 'Unrecognized expression')
}

export function evaluate(input: string, ctx: EvalContext): CalcValue {
  const ast = parse(input)
  return evaluateAst(ast, ctx)
}

export { pow10 }
