import type { KeyDefinition, KeyboardLayout } from '../core/CalculatorKeyboard'

/**
 * Original MS-family key layout. The MS interaction model is the classic
 * one: MODE pages through numbered screens, fractions use the a⌟b⌟c key,
 * statistics data is entered with DT (the M+ key in SD/REG modes) and
 * results are recalled through S-SUM / S-VAR (SHIFT+1 / SHIFT+2).
 */
const keys: KeyDefinition[] = [
  { id: 'SHIFT', row: 1, col: 1, variant: 'modifier', primary: { action: 'SHIFT', label: 'SHIFT' }, physicalKeys: ['Shift'] },
  { id: 'ALPHA', row: 1, col: 2, variant: 'modifier', primary: { action: 'ALPHA', label: 'ALPHA' }, physicalKeys: ['Tab', 'Control'] },
  { id: 'NAV_UP', row: 1, col: 3, variant: 'control', primary: { action: 'NAV_UP', label: '▲' }, physicalKeys: ['ArrowUp'] },
  { id: 'MODE', row: 1, col: 4, variant: 'control', primary: { action: 'MODE', label: 'MODE' }, shift: { action: 'SCL', label: 'CLR' }, physicalKeys: ['F2'] },
  { id: 'ON', row: 1, col: 5, variant: 'control', primary: { action: 'CLEAR', label: 'ON' }, physicalKeys: ['Escape'] },

  { id: 'CALC', row: 2, col: 1, variant: 'function', primary: { action: 'SOLVE', label: 'SOLVE' }, alpha: { insert: '=', label: '=' } },
  { id: 'INTEGRAL', row: 2, col: 2, variant: 'function', primary: { insert: '∫(', label: '∫dx' }, shift: { insert: 'd/dx(', label: 'd/dx' } },
  { id: 'NAV_LEFT', row: 2, col: 3, variant: 'control', primary: { action: 'NAV_LEFT', label: '◀' }, physicalKeys: ['ArrowLeft'] },
  { id: 'NAV_RIGHT', row: 2, col: 4, variant: 'control', primary: { action: 'NAV_RIGHT', label: '▶' }, physicalKeys: ['ArrowRight'] },
  { id: 'NAV_DOWN', row: 2, col: 5, variant: 'control', primary: { action: 'NAV_DOWN', label: '▼' }, physicalKeys: ['ArrowDown'] },

  { id: 'INV', row: 3, col: 1, variant: 'function', primary: { insert: '⁻¹', label: 'x⁻¹' }, shift: { insert: '!', label: 'x!' }, physicalKeys: ['!'] },
  { id: 'NCR', row: 3, col: 2, variant: 'function', primary: { insert: 'nCr(', label: 'nCr' }, shift: { insert: 'nPr(', label: 'nPr' } },
  { id: 'SQRT', row: 3, col: 3, variant: 'function', primary: { insert: '√(', label: '√' }, shift: { insert: '∛(', label: '∛' }, physicalKeys: ['r'] },
  { id: 'SQUARE', row: 3, col: 4, variant: 'function', primary: { insert: '²', label: 'x²' }, shift: { insert: '³', label: 'x³' } },
  { id: 'POWER', row: 3, col: 5, variant: 'function', primary: { insert: '^', label: '^' }, physicalKeys: ['^'] },

  { id: 'FRAC', row: 4, col: 1, variant: 'function', primary: { insert: '⌟', label: 'a b/c' }, tooltip: 'Fraction separator: 1⌟2⌟3 = 1 2/3' },
  { id: 'LOG', row: 4, col: 2, variant: 'function', primary: { insert: 'log(', label: 'log' }, shift: { insert: '10^(', label: '10ˣ' }, physicalKeys: ['l'] },
  { id: 'LN', row: 4, col: 3, variant: 'function', primary: { insert: 'ln(', label: 'ln' }, shift: { insert: 'exp(', label: 'eˣ' }, physicalKeys: ['n'] },
  { id: 'NEGATE', row: 4, col: 4, variant: 'function', primary: { insert: '-', label: '(−)' }, alpha: { insert: 'A', label: 'A' } },
  { id: 'HYP', row: 4, col: 5, variant: 'function', primary: { action: 'HYP', label: 'hyp' }, alpha: { insert: 'C', label: 'C' } },

  { id: 'RCL', row: 5, col: 1, variant: 'function', primary: { action: 'RCL', label: 'RCL' }, shift: { action: 'STO', label: 'STO' } },
  { id: 'ENG', row: 5, col: 2, variant: 'function', primary: { action: 'ENG', label: 'ENG' }, shift: { insert: 'i', label: 'i' }, alpha: { insert: 'B', label: 'B' } },
  { id: 'SIN', row: 5, col: 3, variant: 'function', primary: { insert: 'sin(', label: 'sin' }, shift: { insert: 'asin(', label: 'sin⁻¹' }, alpha: { insert: 'D', label: 'D' }, physicalKeys: ['s'] },
  { id: 'COS', row: 5, col: 4, variant: 'function', primary: { insert: 'cos(', label: 'cos' }, shift: { insert: 'acos(', label: 'cos⁻¹' }, alpha: { insert: 'E', label: 'E' }, physicalKeys: ['c'] },
  { id: 'TAN', row: 5, col: 5, variant: 'function', primary: { insert: 'tan(', label: 'tan' }, shift: { insert: 'atan(', label: 'tan⁻¹' }, alpha: { insert: 'F', label: 'F' }, physicalKeys: ['t'] },

  { id: 'LPAREN', row: 6, col: 1, variant: 'function', primary: { insert: '(', label: '(' }, physicalKeys: ['('] },
  { id: 'RPAREN', row: 6, col: 2, variant: 'function', primary: { insert: ')', label: ')' }, alpha: { insert: 'X', label: 'X' }, physicalKeys: [')'] },
  { id: 'COMMA', row: 6, col: 3, variant: 'function', primary: { insert: ',', label: ',' }, alpha: { insert: 'Y', label: 'Y' }, physicalKeys: [','] },
  { id: 'MPLUS', row: 6, col: 4, variant: 'function', primary: { action: 'MEMORY_ADD', label: 'M+' }, shift: { action: 'MEMORY_SUB', label: 'M−' }, alpha: { insert: 'M', label: 'M' }, tooltip: 'M+ (DT in SD/REG)' },
  { id: 'PERCENT', row: 6, col: 5, variant: 'function', primary: { insert: '%', label: '%' }, physicalKeys: ['%'] },

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

  { id: 'ONE', row: 9, col: 1, variant: 'number', primary: { insert: '1', label: '1' }, shift: { action: 'S_SUM', label: 'S-SUM' }, physicalKeys: ['1'] },
  { id: 'TWO', row: 9, col: 2, variant: 'number', primary: { insert: '2', label: '2' }, shift: { action: 'S_VAR', label: 'S-VAR' }, physicalKeys: ['2'] },
  { id: 'THREE', row: 9, col: 3, variant: 'number', primary: { insert: '3', label: '3' }, physicalKeys: ['3'] },
  { id: 'PLUS', row: 9, col: 4, variant: 'operator', primary: { insert: '+', label: '+' }, physicalKeys: ['+'] },
  { id: 'MINUS', row: 9, col: 5, variant: 'operator', primary: { insert: '-', label: '−' }, physicalKeys: ['-'] },

  { id: 'ZERO', row: 10, col: 1, variant: 'number', primary: { insert: '0', label: '0' }, physicalKeys: ['0'] },
  { id: 'DOT', row: 10, col: 2, variant: 'number', primary: { insert: '.', label: '.' }, physicalKeys: ['.'] },
  { id: 'EXP', row: 10, col: 3, variant: 'number', primary: { insert: 'E', label: 'EXP' }, shift: { insert: 'π', label: 'π' }, physicalKeys: ['E'] },
  { id: 'ANS', row: 10, col: 4, variant: 'number', primary: { insert: 'Ans', label: 'Ans' }, shift: { action: 'OPTN', label: 'FUNC' }, physicalKeys: ['a'] },
  { id: 'EQUALS', row: 10, col: 5, variant: 'control', primary: { action: 'ENTER', label: '=' }, physicalKeys: ['Enter', '='] },
]

export const msKeyboardLayout: KeyboardLayout = { id: 'ms-standard', name: 'MS', columns: 5, rows: 10, keys }
