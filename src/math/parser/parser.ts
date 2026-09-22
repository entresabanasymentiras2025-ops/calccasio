import { MathError } from '../arithmetic/value'
import { tokenize, type Token, type TokenType } from './tokenizer'
import { normalizeExpression } from './normalize'
import type { AstNode } from './ast'

/**
 * Grammar (precedence low -> high), right-associative '^', implicit
 * multiplication supported between a closing factor and the next opening
 * one (e.g. "2π", "2(3+4)", "(2)(3)", "3sin(30)"):
 *
 *   expression := term (('+' | '-') term)*
 *   term       := unary (('*' | '/' | implicit) unary)*
 *   unary      := ('-' | '+') unary | power
 *   power      := postfix ('^' unary)?
 *   postfix    := primary ('!' | '%')*
 *   primary    := NUMBER | IDENT ('(' args ')')? | '(' expression ')'
 */
export function parse(input: string): AstNode {
  const tokens = tokenize(normalizeExpression(input))
  let pos = 0

  function peek(): Token {
    return tokens[pos]
  }
  function check(type: TokenType): boolean {
    return peek().type === type
  }
  function advance(): Token {
    return tokens[pos++]
  }
  function expect(type: TokenType, message: string): Token {
    if (!check(type)) throw new MathError('SyntaxError', message)
    return advance()
  }

  function parseExpression(): AstNode {
    let left = parseTerm()
    while (check('PLUS') || check('MINUS')) {
      const op = advance().type === 'PLUS' ? '+' : '-'
      const right = parseTerm()
      left = { type: 'BinaryOp', op, left, right }
    }
    return left
  }

  function startsFactor(): boolean {
    return check('NUMBER') || check('IDENT') || check('LPAREN')
  }

  function parseTerm(): AstNode {
    let left = parseUnary()
    for (;;) {
      if (check('STAR') || check('SLASH')) {
        const op = advance().type === 'STAR' ? '*' : '/'
        const right = parseUnary()
        left = { type: 'BinaryOp', op, left, right }
      } else if (startsFactor()) {
        const right = parseUnary()
        left = { type: 'BinaryOp', op: '*', left, right }
      } else {
        break
      }
    }
    return left
  }

  function parseUnary(): AstNode {
    if (check('MINUS') || check('PLUS')) {
      const op = advance().type === 'MINUS' ? '-' : '+'
      return { type: 'UnaryOp', op, operand: parseUnary() }
    }
    return parsePower()
  }

  function parsePower(): AstNode {
    const base = parsePostfix()
    if (check('CARET')) {
      advance()
      const exponent = parseUnary()
      return { type: 'BinaryOp', op: '^', left: base, right: exponent }
    }
    return base
  }

  function parsePostfix(): AstNode {
    let node = parsePrimary()
    for (;;) {
      if (check('BANG')) {
        advance()
        node = { type: 'PostfixOp', op: '!', operand: node }
      } else if (check('PERCENT')) {
        advance()
        node = { type: 'PostfixOp', op: '%', operand: node }
      } else {
        break
      }
    }
    return node
  }

  function parseArgs(): AstNode[] {
    const args: AstNode[] = [parseExpression()]
    while (check('COMMA')) {
      advance()
      args.push(parseExpression())
    }
    return args
  }

  function parsePrimary(): AstNode {
    if (check('NUMBER')) {
      return { type: 'Number', value: advance().value }
    }
    if (check('IDENT')) {
      const name = advance().value
      if (check('LPAREN')) {
        advance()
        const args = check('RPAREN') ? [] : parseArgs()
        expect('RPAREN', `Expected ')' after arguments to ${name}(`)
        return { type: 'FunctionCall', name, args }
      }
      return { type: 'Identifier', name }
    }
    if (check('LPAREN')) {
      advance()
      const expr = parseExpression()
      expect('RPAREN', "Expected ')'")
      return expr
    }
    throw new MathError('SyntaxError', `Unexpected token '${peek().value || peek().type}'`)
  }

  const result = parseExpression()
  expect('EOF', 'Unexpected trailing input')
  return result
}
