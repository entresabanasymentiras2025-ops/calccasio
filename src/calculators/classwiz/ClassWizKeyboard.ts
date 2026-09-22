import type { KeyDefinition, KeyboardLayout } from '../core/CalculatorKeyboard'

/**
 * Original key layout for the ClassWiz-family engine. This is our own
 * design (grid position, iconography and legends), not a reproduction of
 * any CASIO physical keyboard artwork. Row/col place keys on a 5-column
 * grid; NAV_UP/DOWN/LEFT/RIGHT are recognized by the keyboard component and
 * rendered as a directional cluster instead of plain grid buttons.
 */
const keys: KeyDefinition[] = [
  // Row 1 — modifiers & control
  { id: 'SHIFT', row: 1, col: 1, variant: 'modifier', primary: { action: 'SHIFT', label: 'SHIFT' }, tooltip: 'Access the yellow secondary functions', physicalKeys: ['Shift'] },
  { id: 'ALPHA', row: 1, col: 2, variant: 'modifier', primary: { action: 'ALPHA', label: 'ALPHA' }, tooltip: 'Access variables A-F, X, Y, M', physicalKeys: ['Tab'] },
  { id: 'MODE', row: 1, col: 3, variant: 'control', primary: { action: 'MODE', label: 'MODE' }, physicalKeys: ['F2'] },
  { id: 'NAV_UP', row: 1, col: 4, variant: 'control', primary: { action: 'NAV_UP', label: '▲' }, physicalKeys: ['ArrowUp'] },
  { id: 'ON', row: 1, col: 5, variant: 'control', primary: { action: 'CLEAR', label: 'ON' }, tooltip: 'All clear', physicalKeys: ['Escape'] },

  // Row 2
  { id: 'LOG', row: 2, col: 1, variant: 'function', primary: { insert: 'log(', label: 'log' }, shift: { insert: '10^(', label: '10ˣ' } },
  { id: 'LN', row: 2, col: 2, variant: 'function', primary: { insert: 'ln(', label: 'ln' }, shift: { insert: 'exp(', label: 'eˣ' } },
  { id: 'NAV_LEFT', row: 2, col: 3, variant: 'control', primary: { action: 'NAV_LEFT', label: '◀' }, physicalKeys: ['ArrowLeft'] },
  { id: 'NAV_RIGHT', row: 2, col: 5, variant: 'control', primary: { action: 'NAV_RIGHT', label: '▶' }, physicalKeys: ['ArrowRight'] },

  // Row 3
  { id: 'INV', row: 3, col: 1, variant: 'function', primary: { insert: '⁻¹', label: 'x⁻¹' }, shift: { insert: '!', label: 'x!' } },
  { id: 'SQUARE', row: 3, col: 2, variant: 'function', primary: { insert: '²', label: 'x²' }, shift: { insert: '³', label: 'x³' } },
  { id: 'NAV_DOWN', row: 3, col: 4, variant: 'control', primary: { action: 'NAV_DOWN', label: '▼' }, physicalKeys: ['ArrowDown'] },
  { id: 'DEL', row: 3, col: 5, variant: 'control', primary: { action: 'BACKSPACE', label: 'DEL' }, shift: { action: 'DELETE', label: 'INS' }, physicalKeys: ['Backspace'] },

  // Row 4
  { id: 'SQRT', row: 4, col: 1, variant: 'function', primary: { insert: '√(', label: '√' }, shift: { insert: '∛(', label: '∛' } },
  { id: 'POWER', row: 4, col: 2, variant: 'function', primary: { insert: '^', label: 'xʸ' } },
  { id: 'LPAREN', row: 4, col: 3, variant: 'function', primary: { insert: '(', label: '(' }, alpha: { insert: 'X', label: 'X' }, physicalKeys: ['('] },
  { id: 'RPAREN', row: 4, col: 4, variant: 'function', primary: { insert: ')', label: ')' }, alpha: { insert: 'Y', label: 'Y' }, physicalKeys: [')'] },
  { id: 'COMMA', row: 4, col: 5, variant: 'function', primary: { insert: ',', label: ',' }, physicalKeys: [','] },

  // Row 5 — trig
  { id: 'SIN', row: 5, col: 1, variant: 'function', primary: { insert: 'sin(', label: 'sin' }, shift: { insert: 'asin(', label: 'sin⁻¹' } },
  { id: 'COS', row: 5, col: 2, variant: 'function', primary: { insert: 'cos(', label: 'cos' }, shift: { insert: 'acos(', label: 'cos⁻¹' } },
  { id: 'TAN', row: 5, col: 3, variant: 'function', primary: { insert: 'tan(', label: 'tan' }, shift: { insert: 'atan(', label: 'tan⁻¹' } },
  { id: 'EXP', row: 5, col: 4, variant: 'function', primary: { insert: 'E', label: '×10ˣ' } },
  { id: 'ANS', row: 5, col: 5, variant: 'function', primary: { insert: 'Ans', label: 'Ans' } },

  // Row 6 — 7 8 9, divide, M+
  { id: 'SEVEN', row: 6, col: 1, variant: 'number', primary: { insert: '7', label: '7' }, alpha: { insert: 'D', label: 'D' }, physicalKeys: ['7'] },
  { id: 'EIGHT', row: 6, col: 2, variant: 'number', primary: { insert: '8', label: '8' }, alpha: { insert: 'E', label: 'E' }, physicalKeys: ['8'] },
  { id: 'NINE', row: 6, col: 3, variant: 'number', primary: { insert: '9', label: '9' }, alpha: { insert: 'F', label: 'F' }, physicalKeys: ['9'] },
  { id: 'DIVIDE', row: 6, col: 4, variant: 'operator', primary: { insert: '/', label: '÷' }, alpha: { insert: 'e', label: 'e' }, physicalKeys: ['/'] },
  { id: 'MPLUS', row: 6, col: 5, variant: 'function', primary: { action: 'MEMORY_ADD', label: 'M+' } },

  // Row 7 — 4 5 6, multiply, M-
  { id: 'FOUR', row: 7, col: 1, variant: 'number', primary: { insert: '4', label: '4' }, alpha: { insert: 'A', label: 'A' }, physicalKeys: ['4'] },
  { id: 'FIVE', row: 7, col: 2, variant: 'number', primary: { insert: '5', label: '5' }, alpha: { insert: 'B', label: 'B' }, physicalKeys: ['5'] },
  { id: 'SIX', row: 7, col: 3, variant: 'number', primary: { insert: '6', label: '6' }, alpha: { insert: 'C', label: 'C' }, physicalKeys: ['6'] },
  { id: 'MULTIPLY', row: 7, col: 4, variant: 'operator', primary: { insert: '*', label: '×' }, alpha: { insert: 'π', label: 'π' }, physicalKeys: ['*'] },
  { id: 'MMINUS', row: 7, col: 5, variant: 'function', primary: { action: 'MEMORY_SUB', label: 'M-' } },

  // Row 8 — 1 2 3, minus, MR/STO
  { id: 'ONE', row: 8, col: 1, variant: 'number', primary: { insert: '1', label: '1' }, physicalKeys: ['1'] },
  { id: 'TWO', row: 8, col: 2, variant: 'number', primary: { insert: '2', label: '2' }, physicalKeys: ['2'] },
  { id: 'THREE', row: 8, col: 3, variant: 'number', primary: { insert: '3', label: '3' }, physicalKeys: ['3'] },
  { id: 'MINUS', row: 8, col: 4, variant: 'operator', primary: { insert: '-', label: '−' }, physicalKeys: ['-'] },
  { id: 'MR', row: 8, col: 5, variant: 'function', primary: { action: 'MEMORY_RECALL', label: 'MR' }, shift: { action: 'MEMORY_CLEAR', label: 'MC' } },

  // Row 9 — 0, ., negate, plus, STO
  { id: 'ZERO', row: 9, col: 1, variant: 'number', primary: { insert: '0', label: '0' }, alpha: { insert: 'M', label: 'M' }, physicalKeys: ['0'] },
  { id: 'DOT', row: 9, col: 2, variant: 'number', primary: { insert: '.', label: '.' }, physicalKeys: ['.'] },
  { id: 'NEGATE', row: 9, col: 3, variant: 'number', primary: { insert: '-', label: '(-)' } },
  { id: 'PLUS', row: 9, col: 4, variant: 'operator', primary: { insert: '+', label: '+' }, physicalKeys: ['+'] },
  { id: 'STO', row: 9, col: 5, variant: 'function', primary: { action: 'STO', label: 'STO' } },

  // Row 10 — equals, spanning
  { id: 'EQUALS', row: 10, col: 5, variant: 'control', primary: { action: 'ENTER', label: '=' }, physicalKeys: ['Enter', '='] },
]

export const classWizKeyboardLayout: KeyboardLayout = {
  id: 'classwiz-standard',
  name: 'ClassWiz Standard',
  columns: 5,
  rows: 10,
  keys,
}
