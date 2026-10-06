import type { KeyDefinition, KeyboardLayout } from '../core/CalculatorKeyboard'

/**
 * Original ES PLUS-family key layout (our own arrangement and legends).
 * Compared with ClassWiz it has MODE/SETUP, CALC/SOLVE, a fraction key,
 * hyp and RCL keys and letters on the function keys rather than digits.
 */
const keys: KeyDefinition[] = [
  { id: 'SHIFT', row: 1, col: 1, variant: 'modifier', primary: { action: 'SHIFT', label: 'SHIFT' }, physicalKeys: ['Shift'] },
  { id: 'ALPHA', row: 1, col: 2, variant: 'modifier', primary: { action: 'ALPHA', label: 'ALPHA' }, physicalKeys: ['Tab', 'Control'] },
  { id: 'NAV_UP', row: 1, col: 3, variant: 'control', primary: { action: 'NAV_UP', label: '▲' }, physicalKeys: ['ArrowUp'] },
  { id: 'MODE', row: 1, col: 4, variant: 'control', primary: { action: 'MODE', label: 'MODE' }, shift: { action: 'SETUP', label: 'SETUP' }, physicalKeys: ['F2'] },
  { id: 'ON', row: 1, col: 5, variant: 'control', primary: { action: 'CLEAR', label: 'ON' }, physicalKeys: ['Escape'] },

  { id: 'CALC', row: 2, col: 1, variant: 'function', primary: { action: 'SOLVE', label: 'SOLVE' }, alpha: { insert: '=', label: '=' }, tooltip: 'SOLVE f(X)=0 (ALPHA: insert "=")' },
  { id: 'INTEGRAL', row: 2, col: 2, variant: 'function', primary: { insert: '∫(', label: '∫' }, shift: { insert: 'd/dx(', label: 'd/dx' } },
  { id: 'NAV_LEFT', row: 2, col: 3, variant: 'control', primary: { action: 'NAV_LEFT', label: '◀' }, physicalKeys: ['ArrowLeft'] },
  { id: 'NAV_RIGHT', row: 2, col: 4, variant: 'control', primary: { action: 'NAV_RIGHT', label: '▶' }, physicalKeys: ['ArrowRight'] },
  { id: 'NAV_DOWN', row: 2, col: 5, variant: 'control', primary: { action: 'NAV_DOWN', label: '▼' }, physicalKeys: ['ArrowDown'] },

  { id: 'FRAC', row: 3, col: 1, variant: 'function', primary: { insert: '⌟', label: '▭/▭' }, tooltip: 'Fraction: a⌟b or a⌟b⌟c' },
  { id: 'SQRT', row: 3, col: 2, variant: 'function', primary: { insert: '√(', label: '√' }, shift: { insert: '∛(', label: '∛' }, physicalKeys: ['r'] },
  { id: 'SQUARE', row: 3, col: 3, variant: 'function', primary: { insert: '²', label: 'x²' }, shift: { insert: '³', label: 'x³' } },
  { id: 'POWER', row: 3, col: 4, variant: 'function', primary: { insert: '^', label: 'x■' }, physicalKeys: ['^'] },
  { id: 'LOG', row: 3, col: 5, variant: 'function', primary: { insert: 'log(', label: 'log' }, shift: { insert: '10^(', label: '10■' }, physicalKeys: ['l'] },

  { id: 'INV', row: 4, col: 1, variant: 'function', primary: { insert: '⁻¹', label: 'x⁻¹' }, shift: { insert: '!', label: 'x!' }, physicalKeys: ['!'] },
  { id: 'LOGAB', row: 4, col: 2, variant: 'function', primary: { insert: 'log(', label: 'log■□' }, shift: { insert: 'Σ(', label: 'Σ' }, tooltip: 'log(base, x)' },
  { id: 'LN', row: 4, col: 3, variant: 'function', primary: { insert: 'ln(', label: 'ln' }, shift: { insert: 'exp(', label: 'e■' }, physicalKeys: ['n'] },
  { id: 'NEGATE', row: 4, col: 4, variant: 'function', primary: { insert: '-', label: '(−)' }, alpha: { insert: 'A', label: 'A' } },
  { id: 'HYP', row: 4, col: 5, variant: 'function', primary: { action: 'HYP', label: 'hyp' }, shift: { insert: 'abs(', label: 'Abs' }, alpha: { insert: 'C', label: 'C' } },

  { id: 'RCL', row: 5, col: 1, variant: 'function', primary: { action: 'RCL', label: 'RCL' }, shift: { action: 'STO', label: 'STO' } },
  { id: 'ENG', row: 5, col: 2, variant: 'function', primary: { action: 'ENG', label: 'ENG' }, shift: { insert: 'i', label: 'i' }, alpha: { insert: 'B', label: 'B' } },
  { id: 'SIN', row: 5, col: 3, variant: 'function', primary: { insert: 'sin(', label: 'sin' }, shift: { insert: 'asin(', label: 'sin⁻¹' }, alpha: { insert: 'D', label: 'D' }, physicalKeys: ['s'] },
  { id: 'COS', row: 5, col: 4, variant: 'function', primary: { insert: 'cos(', label: 'cos' }, shift: { insert: 'acos(', label: 'cos⁻¹' }, alpha: { insert: 'E', label: 'E' }, physicalKeys: ['c'] },
  { id: 'TAN', row: 5, col: 5, variant: 'function', primary: { insert: 'tan(', label: 'tan' }, shift: { insert: 'atan(', label: 'tan⁻¹' }, alpha: { insert: 'F', label: 'F' }, physicalKeys: ['t'] },

  { id: 'LPAREN', row: 6, col: 1, variant: 'function', primary: { insert: '(', label: '(' }, shift: { insert: '%', label: '%' }, physicalKeys: ['('] },
  { id: 'RPAREN', row: 6, col: 2, variant: 'function', primary: { insert: ')', label: ')' }, shift: { insert: ',', label: ',' }, alpha: { insert: 'X', label: 'X' }, physicalKeys: [')'] },
  { id: 'SD', row: 6, col: 3, variant: 'function', primary: { action: 'SD', label: 'S⇔D' }, alpha: { insert: 'Y', label: 'Y' } },
  { id: 'MPLUS', row: 6, col: 4, variant: 'function', primary: { action: 'MEMORY_ADD', label: 'M+' }, shift: { action: 'MEMORY_SUB', label: 'M−' }, alpha: { insert: 'M', label: 'M' } },
  { id: 'NCR', row: 6, col: 5, variant: 'function', primary: { insert: 'nCr(', label: 'nCr' }, shift: { insert: 'nPr(', label: 'nPr' }, tooltip: 'nCr(n, r)' },

  { id: 'SEVEN', row: 7, col: 1, variant: 'number', primary: { insert: '7', label: '7' }, physicalKeys: ['7'] },
  { id: 'EIGHT', row: 7, col: 2, variant: 'number', primary: { insert: '8', label: '8' }, physicalKeys: ['8'] },
  { id: 'NINE', row: 7, col: 3, variant: 'number', primary: { insert: '9', label: '9' }, physicalKeys: ['9'] },
  { id: 'DEL', row: 7, col: 4, variant: 'control', primary: { action: 'BACKSPACE', label: 'DEL' }, shift: { action: 'DELETE', label: 'INS' }, physicalKeys: ['Backspace', 'Delete'] },
  { id: 'AC', row: 7, col: 5, variant: 'control', primary: { action: 'CLEAR', label: 'AC' } },

  { id: 'FOUR', row: 8, col: 1, variant: 'number', primary: { insert: '4', label: '4' }, physicalKeys: ['4'] },
  { id: 'FIVE', row: 8, col: 2, variant: 'number', primary: { insert: '5', label: '5' }, physicalKeys: ['5'] },
  { id: 'SIX', row: 8, col: 3, variant: 'number', primary: { insert: '6', label: '6' }, physicalKeys: ['6'] },
  { id: 'MULTIPLY', row: 8, col: 4, variant: 'operator', primary: { insert: '*', label: '×' }, physicalKeys: ['*', 'x'] },
  { id: 'DIVIDE', row: 8, col: 5, variant: 'operator', primary: { insert: '/', label: '÷' }, physicalKeys: ['/'] },

  { id: 'ONE', row: 9, col: 1, variant: 'number', primary: { insert: '1', label: '1' }, physicalKeys: ['1'] },
  { id: 'TWO', row: 9, col: 2, variant: 'number', primary: { insert: '2', label: '2' }, physicalKeys: ['2'] },
  { id: 'THREE', row: 9, col: 3, variant: 'number', primary: { insert: '3', label: '3' }, physicalKeys: ['3'] },
  { id: 'PLUS', row: 9, col: 4, variant: 'operator', primary: { insert: '+', label: '+' }, physicalKeys: ['+'] },
  { id: 'MINUS', row: 9, col: 5, variant: 'operator', primary: { insert: '-', label: '−' }, physicalKeys: ['-'] },

  { id: 'ZERO', row: 10, col: 1, variant: 'number', primary: { insert: '0', label: '0' }, physicalKeys: ['0'] },
  { id: 'DOT', row: 10, col: 2, variant: 'number', primary: { insert: '.', label: '.' }, shift: { insert: 'π', label: 'π' }, physicalKeys: ['.'] },
  { id: 'EXP', row: 10, col: 3, variant: 'number', primary: { insert: 'E', label: '×10ˣ' }, shift: { insert: 'e', label: 'e' }, physicalKeys: ['E'] },
  { id: 'ANS', row: 10, col: 4, variant: 'number', primary: { insert: 'Ans', label: 'Ans' }, shift: { action: 'OPTN', label: 'FUNC' }, physicalKeys: ['a'] },
  { id: 'EQUALS', row: 10, col: 5, variant: 'control', primary: { action: 'ENTER', label: '=' }, physicalKeys: ['Enter', '='] },
]

export const esPlusKeyboardLayout: KeyboardLayout = { id: 'esplus-standard', name: 'ES PLUS', columns: 5, rows: 10, keys }
