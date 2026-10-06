import { MathError } from '../arithmetic/value'

export type Radix = 'DEC' | 'HEX' | 'BIN' | 'OCT'

export const RADIX_BASE: Record<Radix, number> = { DEC: 10, HEX: 16, BIN: 2, OCT: 8 }

const WORD = 32n
const MASK = (1n << WORD) - 1n

/** Wraps an integer to a signed 32-bit two's-complement value, as BASE-N mode does. */
export function wrap32(n: bigint): bigint {
  const u = n & MASK
  return u >= 1n << (WORD - 1n) ? u - (1n << WORD) : u
}

function digitValue(ch: string): number {
  const c = ch.toUpperCase()
  if (c >= '0' && c <= '9') return c.charCodeAt(0) - 48
  if (c >= 'A' && c <= 'F') return c.charCodeAt(0) - 55
  return 99
}

type Tok = { t: 'num'; v: bigint } | { t: 'op'; v: string }

const WORD_OPS = ['and', 'or', 'xor', 'xnor', 'not', 'neg']

function tokenize(input: string, radix: Radix): Tok[] {
  const base = RADIX_BASE[radix]
  const out: Tok[] = []
  let i = 0
  const s = input.replace(/\s+/g, ' ')
  while (i < s.length) {
    const ch = s[i]
    if (ch === ' ') {
      i++
      continue
    }
    const word = WORD_OPS.find((w) => s.slice(i, i + w.length).toLowerCase() === w)
    if (word) {
      out.push({ t: 'op', v: word })
      i += word.length
      continue
    }
    // Explicit radix prefix: d10, h1F, b101, o17
    let localBase = base
    if (/[dhbo]/.test(ch) && i + 1 < s.length && digitValue(s[i + 1]) < 16) {
      localBase = { d: 10, h: 16, b: 2, o: 8 }[ch as 'd' | 'h' | 'b' | 'o']
      i++
    }
    if (digitValue(s[i]) < localBase) {
      let v = 0n
      while (i < s.length && digitValue(s[i]) < localBase) {
        v = v * BigInt(localBase) + BigInt(digitValue(s[i]))
        i++
      }
      out.push({ t: 'num', v })
      continue
    }
    if ('+-*/()'.includes(ch) || ch === '×' || ch === '÷' || ch === '−') {
      out.push({ t: 'op', v: ch === '×' ? '*' : ch === '÷' ? '/' : ch === '−' ? '-' : ch })
      i++
      continue
    }
    throw new MathError('SyntaxError', `Invalid ${radix} digit or symbol '${ch}'`)
  }
  return out
}

/**
 * Integer-only BASE-N evaluator with 32-bit wrap-around and logical
 * operators. Precedence (low→high): or/xor/xnor, and, +/-, ×/÷, unary
 * (-, not, neg). Division truncates toward zero, as on the hardware.
 */
export function evaluateBaseN(input: string, radix: Radix): bigint {
  const toks = tokenize(input, radix)
  let p = 0
  const peek = () => toks[p]
  const isOp = (v: string) => peek()?.t === 'op' && peek()!.v === v

  function orExpr(): bigint {
    let l = andExpr()
    while (isOp('or') || isOp('xor') || isOp('xnor')) {
      const op = (toks[p++] as { v: string }).v
      const r = andExpr()
      l = op === 'or' ? l | r : op === 'xor' ? l ^ r : ~(l ^ r)
      l = wrap32(l)
    }
    return l
  }
  function andExpr(): bigint {
    let l = addExpr()
    while (isOp('and')) {
      p++
      l = wrap32(l & addExpr())
    }
    return l
  }
  function addExpr(): bigint {
    let l = mulExpr()
    while (isOp('+') || isOp('-')) {
      const op = (toks[p++] as { v: string }).v
      const r = mulExpr()
      l = wrap32(op === '+' ? l + r : l - r)
    }
    return l
  }
  function mulExpr(): bigint {
    let l = unary()
    while (isOp('*') || isOp('/')) {
      const op = (toks[p++] as { v: string }).v
      const r = unary()
      if (op === '/' && r === 0n) throw new MathError('MathError', 'Division by zero')
      l = wrap32(op === '*' ? l * r : l / r)
    }
    return l
  }
  function unary(): bigint {
    if (isOp('-') || isOp('neg')) {
      p++
      return wrap32(-unary())
    }
    if (isOp('not')) {
      p++
      return wrap32(~unary())
    }
    return primary()
  }
  function primary(): bigint {
    const t = peek()
    if (!t) throw new MathError('SyntaxError', 'Unexpected end of input')
    if (t.t === 'num') {
      p++
      return wrap32(t.v)
    }
    if (t.v === '(') {
      p++
      const v = orExpr()
      if (!isOp(')')) throw new MathError('SyntaxError', "Expected ')'")
      p++
      return v
    }
    throw new MathError('SyntaxError', `Unexpected '${t.v}'`)
  }
  if (toks.length === 0) throw new MathError('SyntaxError', 'Empty expression')
  const v = orExpr()
  if (p !== toks.length) throw new MathError('SyntaxError', 'Unexpected trailing input')
  return v
}

/** Formats a 32-bit value in a radix. Non-decimal radices show the unsigned two's-complement bit pattern. */
export function formatBaseN(v: bigint, radix: Radix): string {
  if (radix === 'DEC') return wrap32(v).toString()
  const u = v & MASK
  return u.toString(RADIX_BASE[radix]).toUpperCase()
}
