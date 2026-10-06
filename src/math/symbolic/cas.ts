import { MathError, fromLiteral } from '../arithmetic/value'
import type { AstNode } from '../parser/ast'
import { parse } from '../parser/parser'
import { type Sym, numQ, num, sym, add, mul, pow, fn, print, approx, formatReal, substitute, contains } from './expr'
import { simplify, expand } from './simplify'
import { factor, solve, mainVariable } from './polynomial'
import { diff, integrate, definiteIntegral } from './calculus'

/**
 * CAS front end: Parser → AST (shared) → symbolic tree → simplifier /
 * symbolic evaluator / numeric evaluator. Supported commands:
 *   simplify(e)  expand(e)  factor(e)  solve(eq [, x])
 *   diff(e [, x [, n]])  integrate(e [, x [, a, b]])  approx(e)
 * A bare expression is simplified. Equations use `=`.
 */
export interface CasContext {
  variables: Record<string, Sym>
  ans: Sym | null
}

export interface CasResult {
  output: string
  value: Sym | null
}

const FN_ALIASES: Record<string, string> = { asin: 'asin', acos: 'acos', atan: 'atan', abs: 'abs' }

export function toSym(node: AstNode, ctx: CasContext): Sym {
  switch (node.type) {
    case 'Number': {
      const v = fromLiteral(node.value)
      if (v.kind !== 'rational') throw new MathError('SyntaxError', 'Bad number')
      return numQ({ n: v.num, d: v.den })
    }
    case 'Identifier': {
      if (node.name === 'pi') return sym('π')
      if (node.name === 'Ans') {
        if (!ctx.ans) throw new MathError('MathError', 'Ans is empty')
        return ctx.ans
      }
      if (node.name in ctx.variables) return ctx.variables[node.name]
      // Multi-letter identifiers like "xy" are implicit products of single-letter variables.
      if (/^[a-zA-Z]+$/.test(node.name) && node.name.length > 1 && !['pi'].includes(node.name)) {
        return mul(...[...node.name].map((c) => (c in ctx.variables ? ctx.variables[c] : sym(c))))
      }
      return sym(node.name)
    }
    case 'UnaryOp':
      return node.op === '-' ? mul(num(-1), toSym(node.operand, ctx)) : toSym(node.operand, ctx)
    case 'PostfixOp':
      return node.op === '!' ? fn('fact', toSym(node.operand, ctx)) : mul(toSym(node.operand, ctx), num(1, 100))
    case 'BinaryOp': {
      const a = toSym(node.left, ctx)
      const b = toSym(node.right, ctx)
      switch (node.op) {
        case '+':
          return add(a, b)
        case '-':
          return add(a, mul(num(-1), b))
        case '*':
          return mul(a, b)
        case '/':
          return mul(a, pow(b, num(-1)))
        case '^':
          return pow(a, b)
      }
      break
    }
    case 'Equation':
      // Represent lhs = rhs as lhs − rhs (= 0) for solving.
      return add(toSym(node.left, ctx), mul(num(-1), toSym(node.right, ctx)))
    case 'FunctionCall': {
      if (node.args.length !== 1) throw new MathError('SyntaxError', `${node.name} expects 1 argument here`)
      const arg = toSym(node.args[0], ctx)
      if (node.name === 'sqrt') return pow(arg, num(1, 2))
      if (node.name === 'cbrt') return pow(arg, num(1, 3))
      if (node.name === 'exp') return pow(sym('e'), arg)
      const known = ['sin', 'cos', 'tan', 'ln', 'log', 'sinh', 'cosh', 'tanh', ...Object.keys(FN_ALIASES)]
      if (!known.includes(node.name)) throw new MathError('SyntaxError', `Unknown function ${node.name}`)
      return fn(node.name, arg)
    }
  }
  throw new MathError('SyntaxError', 'Unsupported expression')
}

function varArg(node: AstNode | undefined, fallback: string): string {
  if (!node) return fallback
  if (node.type !== 'Identifier' || !/^[a-zA-Z]$/.test(node.name)) throw new MathError('SyntaxError', 'Expected a single-letter variable')
  return node.name
}

const COMMANDS = new Set(['simplify', 'expand', 'factor', 'solve', 'diff', 'integrate', 'approx', 'subst'])

export function evaluateCas(input: string, ctx: CasContext): CasResult {
  const text = input.trim()
  if (!text) throw new MathError('SyntaxError', 'Empty input')
  // Assignment: name := expr
  const assign = /^([a-zA-Z])\s*:=\s*(.+)$/.exec(text)
  if (assign) {
    const value = simplify(toSym(parse(assign[2], { allowEquations: false }), ctx))
    ctx.variables[assign[1]] = value
    return { output: `${assign[1]} := ${print(value)}`, value }
  }
  const ast = parse(text, { allowEquations: true })
  if (ast.type === 'FunctionCall' && COMMANDS.has(ast.name)) return runCommand(ast.name, ast.args, ctx)
  if (ast.type === 'Equation') {
    const e = simplify(toSym(ast, ctx))
    return { output: `${print(simplify(toSym(ast.left, ctx)))}=${print(simplify(toSym(ast.right, ctx)))}`, value: e }
  }
  const value = simplify(toSym(ast, ctx))
  return { output: print(value), value }
}

function runCommand(name: string, args: AstNode[], ctx: CasContext): CasResult {
  if (args.length === 0) throw new MathError('SyntaxError', `${name} needs an argument`)
  const e = toSym(args[0], ctx)
  const x = varArg(args[1], mainVariable(e))
  switch (name) {
    case 'simplify': {
      const v = simplify(e)
      return { output: print(v), value: v }
    }
    case 'expand': {
      const v = expand(e)
      return { output: print(v), value: v }
    }
    case 'factor': {
      const v = factor(e, x)
      return { output: print(v), value: simplify(v) }
    }
    case 'approx': {
      const v = approx(simplify(e))
      return { output: formatReal(v), value: { t: 'real', v } }
    }
    case 'subst': {
      if (args.length !== 3) throw new MathError('SyntaxError', 'subst(expr, x, value)')
      const v = simplify(substitute(e, x, toSym(args[2], ctx)))
      return { output: print(v), value: v }
    }
    case 'solve': {
      const r = solve(simplify(e), x)
      const body = r.solutions.map((s) => `${x}=${print(s)}`).join(', ')
      const output = r.solutions.length ? `{${body}}` : `{} ${r.note ?? 'No solution'}`
      return { output: r.note && r.solutions.length ? `${output}  (${r.note})` : output, value: r.solutions[0] ?? null }
    }
    case 'diff': {
      const n = args[2] ? Number(print(simplify(toSym(args[2], ctx)))) : 1
      if (!Number.isInteger(n) || n < 1 || n > 10) throw new MathError('MathError', 'Order must be an integer 1–10')
      let v = simplify(e)
      for (let i = 0; i < n; i++) v = diff(v, x)
      return { output: print(v), value: v }
    }
    case 'integrate': {
      if (args.length === 4) {
        const r = definiteIntegral(simplify(e), x, simplify(toSym(args[2], ctx)), simplify(toSym(args[3], ctx)))
        return { output: r.exact ? print(r.value) : `${print(r.value)} (numeric)`, value: r.value }
      }
      if (!contains(e, x) && args.length < 2) {
        const v = simplify(mul(e, sym(x)))
        return { output: print(v), value: v }
      }
      const v = integrate(e, x)
      return { output: print(v), value: v }
    }
  }
  throw new MathError('SyntaxError', `Unknown command ${name}`)
}
