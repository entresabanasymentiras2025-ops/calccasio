import { MathError, toNumber, fromLiteral, type CalcValue } from '../arithmetic/value'
import type { AstNode } from '../parser/ast'
import { parse } from '../parser/parser'
import type { AngleMode } from '../trigonometry/trig'
import * as C from './complex'
import type { Complex } from './complex'

export interface ComplexContext {
  angleMode: AngleMode
  variables: Record<string, CalcValue | Complex>
  ans: Complex
}

function isComplex(v: CalcValue | Complex): v is Complex {
  return typeof (v as Complex).re === 'number'
}

function toAngle(rad: number, mode: AngleMode): number {
  return mode === 'DEG' ? (rad * 180) / Math.PI : mode === 'GRAD' ? (rad * 200) / Math.PI : rad
}

function fromAngle(a: number, mode: AngleMode): number {
  return mode === 'DEG' ? (a * Math.PI) / 180 : mode === 'GRAD' ? (a * Math.PI) / 200 : a
}

function real(c: Complex, what: string): number {
  if (Math.abs(c.im) > 1e-12) throw new MathError('MathError', `${what} requires a real argument`)
  return c.re
}

function cpow(a: Complex, b: Complex): Complex {
  if (b.im === 0 && Number.isInteger(b.re) && Math.abs(b.re) <= 64) {
    let result = C.complex(1)
    const n = Math.abs(b.re)
    for (let i = 0; i < n; i++) result = C.multiply(result, a)
    return b.re < 0 ? C.divide(C.complex(1), result) : result
  }
  if (a.re === 0 && a.im === 0) return C.complex(0)
  // a^b = exp(b * ln a)
  const lnA = C.complex(Math.log(C.modulus(a)), C.argument(a))
  const e = C.multiply(b, lnA)
  return C.fromPolar(Math.exp(e.re), e.im)
}

function csqrt(a: Complex): Complex {
  const r = Math.sqrt(C.modulus(a))
  const theta = C.argument(a) / 2
  return C.fromPolar(r, theta)
}

/**
 * Evaluates an expression over the complex numbers (CMPLX mode). Uses the
 * same parser/AST as the real evaluator; `i` is the imaginary unit and `∠`
 * is not needed because `polar(r, θ)` builds a number from polar form.
 * Double precision is used throughout (documented in /docs/limitations.md).
 */
export function evaluateComplexAst(node: AstNode, ctx: ComplexContext): Complex {
  switch (node.type) {
    case 'Number':
      return C.complex(toNumber(fromLiteral(node.value)))
    case 'Identifier': {
      if (node.name === 'i') return C.complex(0, 1)
      if (node.name === 'π' || node.name === 'pi') return C.complex(Math.PI)
      if (node.name === 'e') return C.complex(Math.E)
      if (node.name === 'Ans') return ctx.ans
      const v = ctx.variables[node.name]
      if (v !== undefined) return isComplex(v) ? v : C.complex(toNumber(v))
      throw new MathError('SyntaxError', `Unknown identifier '${node.name}'`)
    }
    case 'UnaryOp': {
      const v = evaluateComplexAst(node.operand, ctx)
      return node.op === '-' ? C.complex(0 - v.re, 0 - v.im) : v
    }
    case 'PostfixOp': {
      const v = evaluateComplexAst(node.operand, ctx)
      if (node.op === '%') return C.complex(v.re / 100, v.im / 100)
      const n = real(v, 'Factorial')
      if (!Number.isInteger(n) || n < 0 || n > 170) throw new MathError('MathError', 'Invalid factorial argument')
      let f = 1
      for (let k = 2; k <= n; k++) f *= k
      return C.complex(f)
    }
    case 'BinaryOp': {
      const a = evaluateComplexAst(node.left, ctx)
      const b = evaluateComplexAst(node.right, ctx)
      switch (node.op) {
        case '+':
          return C.add(a, b)
        case '-':
          return C.subtract(a, b)
        case '*':
          return C.multiply(a, b)
        case '/':
          if (b.re === 0 && b.im === 0) throw new MathError('MathError', 'Division by zero')
          return C.divide(a, b)
        case '^':
          return cpow(a, b)
      }
      break
    }
    case 'FunctionCall': {
      const args = node.args.map((a) => evaluateComplexAst(a, ctx))
      const x = args[0]
      if (!x) throw new MathError('SyntaxError', 'Missing argument')
      switch (node.name) {
        case 'abs':
          return C.complex(C.modulus(x))
        case 'arg':
          return C.complex(toAngle(C.argument(x), ctx.angleMode))
        case 'conj':
          return C.conjugate(x)
        case 're':
          return C.complex(x.re)
        case 'im':
          return C.complex(x.im)
        case 'sqrt':
          return csqrt(x)
        case 'polar':
          if (args.length !== 2) throw new MathError('SyntaxError', 'polar(r, θ) expects 2 arguments')
          return C.fromPolar(real(args[0], 'polar'), fromAngle(real(args[1], 'polar'), ctx.angleMode))
        case 'sin':
          return C.complex(Math.sin(fromAngle(real(x, 'sin'), ctx.angleMode)))
        case 'cos':
          return C.complex(Math.cos(fromAngle(real(x, 'cos'), ctx.angleMode)))
        case 'tan':
          return C.complex(Math.tan(fromAngle(real(x, 'tan'), ctx.angleMode)))
        case 'ln':
          if (x.re === 0 && x.im === 0) throw new MathError('MathError', 'ln(0) is undefined')
          return C.complex(Math.log(C.modulus(x)), C.argument(x))
        case 'exp':
          return C.fromPolar(Math.exp(x.re), x.im)
      }
      throw new MathError('SyntaxError', `Function '${node.name}' is not available in complex mode`)
    }
  }
  throw new MathError('SyntaxError', 'Unrecognized expression')
}

export function evaluateComplex(input: string, ctx: ComplexContext): Complex {
  return evaluateComplexAst(parse(input), ctx)
}

function fmt(n: number): string {
  if (Math.abs(n) < 1e-12) return '0'
  const s = Number(n.toPrecision(10)).toString()
  return s.replace('e+', 'E').replace('e-', 'E-')
}

export function formatComplex(c: Complex, form: 'rect' | 'polar' = 'rect', angleMode: AngleMode = 'DEG'): string {
  if (form === 'polar') {
    return `${fmt(C.modulus(c))}∠${fmt(toAngle(C.argument(c), angleMode))}`
  }
  const re = Math.abs(c.re) < 1e-12 ? 0 : c.re
  const im = Math.abs(c.im) < 1e-12 ? 0 : c.im
  if (im === 0) return fmt(re)
  const imText = Math.abs(im) === 1 ? 'i' : `${fmt(Math.abs(im))}i`
  if (re === 0) return im < 0 ? `-${imText}` : imText
  return `${fmt(re)}${im < 0 ? '-' : '+'}${imText}`
}
