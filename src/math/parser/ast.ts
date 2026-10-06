export type AstNode =
  | { type: 'Number'; value: string }
  | { type: 'Identifier'; name: string }
  | { type: 'BinaryOp'; op: '+' | '-' | '*' | '/' | '^'; left: AstNode; right: AstNode }
  | { type: 'UnaryOp'; op: '+' | '-'; operand: AstNode }
  | { type: 'PostfixOp'; op: '!' | '%'; operand: AstNode }
  | { type: 'FunctionCall'; name: string; args: AstNode[] }
  | { type: 'Equation'; left: AstNode; right: AstNode }
