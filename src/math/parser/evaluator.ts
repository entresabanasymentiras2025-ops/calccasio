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
} from '../arithmetic/value'
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
  log: (args) => (args.length === 2 ? logBase(args[0], args[1]) : log10(one(args))),
  sqrt: unaryFn(sqrt),
  cbrt: unaryFn(cbrt),
  exp: unaryFn(exp),
  abs: unaryFn(abs),
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
      if (name in ctx.variables) return ctx.variables[name]
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
