import { MathError, toNumber, fromDecimal, Decimal, type CalcValue } from '../../../math/arithmetic/value'
import { evaluate, createContext } from '../../../math/parser/evaluator'
import type { AngleMode } from '../../../math/trigonometry/trig'

/**
 * A deliberately small, sandboxed teaching language for the graphing
 * calculators' PRGM app. It is an original BASIC-style dialect (not a copy
 * of any vendor language). Programs are parsed into a tree and interpreted
 * by this module only: there is no eval(), no new Function(), and the only
 * capabilities a program has are reading/writing single-letter numeric
 * variables, printing text and asking for numeric input. A step budget
 * stops runaway loops.
 *
 *   A=5           assignment (also: 5→A)
 *   PRINT expr, "text", ...
 *   INPUT A       or INPUT "prompt", A
 *   IF cond THEN … [ELSE …] END
 *   FOR I=1 TO 10 [STEP 2] … NEXT
 *   WHILE cond … WEND
 *   STOP
 *   ' comment
 *
 * Conditions support = <> ≠ < > <= >= ≤ ≥ combined with AND / OR / NOT.
 */

export type Stmt =
  | { kind: 'assign'; name: string; expr: string; line: number }
  | { kind: 'print'; items: Array<{ text?: string; expr?: string }>; line: number }
  | { kind: 'input'; prompt: string; name: string; line: number }
  | { kind: 'if'; cond: string; then: Stmt[]; else: Stmt[]; line: number }
  | { kind: 'for'; name: string; from: string; to: string; step: string; body: Stmt[]; line: number }
  | { kind: 'while'; cond: string; body: Stmt[]; line: number }
  | { kind: 'stop'; line: number }

export class ProgramError extends Error {
  readonly line: number
  constructor(message: string, line: number) {
    super(`Line ${line}: ${message}`)
    this.line = line
  }
}

const NAME = /^[A-Z]$/

function splitTopLevel(text: string, sep: string): string[] {
  const out: string[] = []
  let depth = 0
  let inStr = false
  let cur = ''
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') inStr = !inStr
    if (!inStr) {
      if (ch === '(') depth++
      if (ch === ')') depth--
      if (depth === 0 && text.startsWith(sep, i)) {
        out.push(cur)
        cur = ''
        i += sep.length - 1
        continue
      }
    }
    cur += ch
  }
  out.push(cur)
  return out
}

export function parseProgram(source: string): Stmt[] {
  const lines = source.split(/\r?\n/).map((raw, i) => ({ text: raw.replace(/'.*$/, '').trim(), line: i + 1 }))
  let pos = 0

  function block(terminators: string[]): { body: Stmt[]; end: string } {
    const body: Stmt[] = []
    while (pos < lines.length) {
      const { text, line } = lines[pos]
      const upper = text.toUpperCase()
      const word = upper.split(/\s+/)[0]
      if (terminators.includes(word)) {
        pos++
        return { body, end: word }
      }
      pos++
      if (!text) continue
      body.push(statement(text, upper, line))
    }
    if (terminators.length) throw new ProgramError(`Missing ${terminators.join('/')}`, lines.length)
    return { body, end: '' }
  }

  function statement(text: string, upper: string, line: number): Stmt {
    if (upper === 'STOP') return { kind: 'stop', line }
    if (upper.startsWith('PRINT')) {
      const rest = text.slice(5).trim()
      const items = rest ? splitTopLevel(rest, ',').map((p) => p.trim()).map((p) => (p.startsWith('"') ? { text: p.replace(/^"|"$/g, '') } : { expr: p })) : [{ text: '' }]
      return { kind: 'print', items, line }
    }
    if (upper.startsWith('INPUT')) {
      const parts = splitTopLevel(text.slice(5).trim(), ',').map((p) => p.trim())
      const name = (parts.length === 2 ? parts[1] : parts[0]).toUpperCase()
      if (!NAME.test(name)) throw new ProgramError('INPUT needs a variable A–Z', line)
      const prompt = parts.length === 2 ? parts[0].replace(/^"|"$/g, '') : `${name}?`
      return { kind: 'input', prompt, name, line }
    }
    if (upper.startsWith('IF ')) {
      const m = /^IF\s+(.+?)\s+THEN$/i.exec(text)
      if (!m) throw new ProgramError('Expected IF <condition> THEN', line)
      const thenPart = block(['ELSE', 'END'])
      let elsePart: Stmt[] = []
      if (thenPart.end === 'ELSE') elsePart = block(['END']).body
      return { kind: 'if', cond: m[1], then: thenPart.body, else: elsePart, line }
    }
    if (upper.startsWith('FOR ')) {
      const m = /^FOR\s+([A-Z])\s*=\s*(.+?)\s+TO\s+(.+?)(?:\s+STEP\s+(.+))?$/i.exec(text)
      if (!m) throw new ProgramError('Expected FOR V=a TO b [STEP s]', line)
      const body = block(['NEXT']).body
      return { kind: 'for', name: m[1].toUpperCase(), from: m[2], to: m[3], step: m[4] ?? '1', body, line }
    }
    if (upper.startsWith('WHILE ')) {
      const body = block(['WEND']).body
      return { kind: 'while', cond: text.slice(6).trim(), body, line }
    }
    const arrow = /^(.+?)(?:→|->)\s*([A-Za-z])$/.exec(text)
    if (arrow) return { kind: 'assign', name: arrow[2].toUpperCase(), expr: arrow[1], line }
    const assign = /^([A-Za-z])\s*=\s*(.+)$/.exec(text)
    if (assign) return { kind: 'assign', name: assign[1].toUpperCase(), expr: assign[2], line }
    if (['ELSE', 'END', 'NEXT', 'WEND'].includes(upper)) throw new ProgramError(`Unexpected ${upper}`, line)
    throw new ProgramError(`Unknown statement "${text}"`, line)
  }

  return block([]).body
}

export interface VMEnv {
  angleMode: AngleMode
  variables: Record<string, CalcValue>
}

export type VMEvent = { type: 'print'; text: string } | { type: 'input'; prompt: string; name: string }

const MAX_STEPS = 100000

function num(expr: string, env: VMEnv, line: number): number {
  try {
    return toNumber(evaluate(expr, createContext({ angleMode: env.angleMode, variables: env.variables })))
  } catch (err) {
    throw new ProgramError(err instanceof MathError ? `${err.code}: ${err.message}` : 'Error', line)
  }
}

export function evalCondition(cond: string, env: VMEnv, line: number): boolean {
  const ors = splitTopLevel(cond, ' OR ')
  if (ors.length > 1) return ors.some((c) => evalCondition(c, env, line))
  const ands = splitTopLevel(cond, ' AND ')
  if (ands.length > 1) return ands.every((c) => evalCondition(c, env, line))
  const t = cond.trim()
  if (/^NOT\s+/i.test(t)) return !evalCondition(t.replace(/^NOT\s+/i, ''), env, line)
  const m = /^(.+?)(<=|>=|<>|≠|≤|≥|=|<|>)(.+)$/.exec(t)
  if (!m) return num(t, env, line) !== 0
  const a = num(m[1], env, line)
  const b = num(m[3], env, line)
  const eps = 1e-12 * Math.max(1, Math.abs(a), Math.abs(b))
  switch (m[2]) {
    case '=':
      return Math.abs(a - b) <= eps
    case '<>':
    case '≠':
      return Math.abs(a - b) > eps
    case '<':
      return a < b
    case '>':
      return a > b
    case '<=':
    case '≤':
      return a <= b
    default:
      return a >= b
  }
}

function fmt(x: number): string {
  if (Number.isInteger(x)) return String(x)
  return String(Number(x.toPrecision(10)))
}

/**
 * Runs a program as a generator: yields print/input events. For an input
 * event, resume with `next(value)`; the value is stored in the variable.
 */
export function* runProgram(stmts: Stmt[], env: VMEnv): Generator<VMEvent, void, number | undefined> {
  let steps = 0
  const tick = (line: number) => {
    if (++steps > MAX_STEPS) throw new ProgramError('Step limit exceeded (possible infinite loop)', line)
  }
  const set = (name: string, v: number) => {
    env.variables[name] = fromDecimal(new Decimal(v))
  }
  class Stop {}
  function* exec(list: Stmt[]): Generator<VMEvent, void, number | undefined> {
    for (const s of list) {
      tick(s.line)
      switch (s.kind) {
        case 'assign':
          set(s.name, num(s.expr, env, s.line))
          break
        case 'print':
          yield { type: 'print', text: s.items.map((it) => (it.text !== undefined ? it.text : fmt(num(it.expr!, env, s.line)))).join(' ') }
          break
        case 'input': {
          const v = yield { type: 'input', prompt: s.prompt, name: s.name }
          if (v === undefined || !Number.isFinite(v)) throw new ProgramError('Input cancelled', s.line)
          set(s.name, v)
          break
        }
        case 'if':
          yield* exec(evalCondition(s.cond, env, s.line) ? s.then : s.else)
          break
        case 'for': {
          const step = num(s.step, env, s.line)
          if (step === 0) throw new ProgramError('STEP cannot be 0', s.line)
          const to = num(s.to, env, s.line)
          set(s.name, num(s.from, env, s.line))
          while (step > 0 ? toNumber(env.variables[s.name]) <= to + 1e-12 : toNumber(env.variables[s.name]) >= to - 1e-12) {
            tick(s.line)
            yield* exec(s.body)
            set(s.name, toNumber(env.variables[s.name]) + step)
          }
          break
        }
        case 'while':
          while (evalCondition(s.cond, env, s.line)) {
            tick(s.line)
            yield* exec(s.body)
          }
          break
        case 'stop':
          throw new Stop()
      }
    }
  }
  try {
    yield* exec(stmts)
  } catch (e) {
    if (!(e instanceof Stop)) throw e
  }
}

export const SAMPLE_PROGRAMS: Array<{ name: string; source: string }> = [
  {
    name: 'SUMSQ',
    source: `' Sum of squares 1..N
INPUT "N", N
S=0
FOR I=1 TO N
S=S+I^2
NEXT
PRINT "SUM=", S`,
  },
  {
    name: 'COLLATZ',
    source: `' Steps for the Collatz sequence of N
INPUT N
C=0
WHILE N<>1
IF N/2=int(N/2) THEN
N=N/2
ELSE
N=3N+1
END
C=C+1
WEND
PRINT "STEPS", C`,
  },
]
