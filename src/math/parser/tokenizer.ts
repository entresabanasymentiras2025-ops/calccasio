import { MathError } from '../arithmetic/value'

export type TokenType =
  | 'NUMBER'
  | 'IDENT'
  | 'PLUS'
  | 'MINUS'
  | 'STAR'
  | 'SLASH'
  | 'CARET'
  | 'BANG'
  | 'PERCENT'
  | 'LPAREN'
  | 'RPAREN'
  | 'COMMA'
  | 'EOF'

export interface Token {
  type: TokenType
  value: string
  pos: number
}

const SIMPLE_TOKENS: Record<string, TokenType> = {
  '+': 'PLUS',
  '-': 'MINUS',
  '−': 'MINUS',
  '*': 'STAR',
  '×': 'STAR',
  '/': 'SLASH',
  '÷': 'SLASH',
  '^': 'CARET',
  '!': 'BANG',
  '%': 'PERCENT',
  '(': 'LPAREN',
  ')': 'RPAREN',
  ',': 'COMMA',
}

const IDENT_START = /[A-Za-zπ]/
const IDENT_CONT = /[A-Za-z0-9_π]/

export function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const n = input.length
  while (i < n) {
    const ch = input[i]
    if (ch === ' ' || ch === '\t' || ch === '\n') {
      i++
      continue
    }
    if (/[0-9.]/.test(ch)) {
      const start = i
      let sawDot = false
      while (i < n && /[0-9.]/.test(input[i])) {
        if (input[i] === '.') {
          if (sawDot) throw new MathError('SyntaxError', 'Malformed number literal')
          sawDot = true
        }
        i++
      }
      // Scientific-notation marker (the calculator's EXP key), uppercase only
      // so it never collides with the lowercase `e` (Euler's number) ident.
      if (input[i] === 'E') {
        i++
        if (input[i] === '+' || input[i] === '-') i++
        if (!/[0-9]/.test(input[i] ?? '')) throw new MathError('SyntaxError', 'Malformed exponent')
        while (i < n && /[0-9]/.test(input[i])) i++
      }
      tokens.push({ type: 'NUMBER', value: input.slice(start, i), pos: start })
      continue
    }
    if (IDENT_START.test(ch)) {
      const start = i
      i++
      while (i < n && IDENT_CONT.test(input[i])) i++
      tokens.push({ type: 'IDENT', value: input.slice(start, i), pos: start })
      continue
    }
    const simple = SIMPLE_TOKENS[ch]
    if (simple) {
      tokens.push({ type: simple, value: ch, pos: i })
      i++
      continue
    }
    throw new MathError('SyntaxError', `Unexpected character '${ch}' at position ${i}`)
  }
  tokens.push({ type: 'EOF', value: '', pos: n })
  return tokens
}
