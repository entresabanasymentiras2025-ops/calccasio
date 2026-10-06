import type { KeyDefinition, KeyboardLayout } from '../core/CalculatorKeyboard'

/**
 * Original keyboard for the fx-CG100 family engine: no F-keys; screen
 * commands live in a TOOLS pop-up menu, with HOME / SETTINGS / BACK and an
 * OK key in the centre of the cursor pad.
 */
const L = (insert: string) => ({ insert, label: insert })
const keys: KeyDefinition[] = [
  { id: 'HOME', row: 1, col: 1, variant: 'control', primary: { action: 'MENU', label: 'HOME' }, physicalKeys: ['Home'] },
  { id: 'SETTINGS', row: 1, col: 2, variant: 'control', primary: { action: 'SETUP', label: 'SETTINGS' } },
  { id: 'TOOLS', row: 1, col: 3, variant: 'control', primary: { action: 'TOOLS', label: 'TOOLS' }, tooltip: 'Commands for this screen', physicalKeys: ['F3'] },
  { id: 'BACK', row: 1, col: 4, variant: 'control', primary: { action: 'EXIT', label: 'BACK' }, physicalKeys: ['Escape'] },
  { id: 'NAV_UP', row: 1, col: 5, variant: 'control', primary: { action: 'NAV_UP', label: '▲' }, physicalKeys: ['ArrowUp'] },
  { id: 'AC', row: 1, col: 6, variant: 'control', primary: { action: 'CLEAR', label: 'AC' } },

  { id: 'SHIFT', row: 2, col: 1, variant: 'modifier', primary: { action: 'SHIFT', label: 'SHIFT' }, physicalKeys: ['Shift'] },
  { id: 'ALPHA', row: 2, col: 2, variant: 'modifier', primary: { action: 'ALPHA', label: 'ALPHA' }, physicalKeys: ['Tab', 'Control'] },
  { id: 'XVAR', row: 2, col: 3, variant: 'function', primary: { insert: 'X', label: 'x' }, alpha: L('A'), physicalKeys: ['x', 'X'] },
  { id: 'NAV_LEFT', row: 2, col: 4, variant: 'control', primary: { action: 'NAV_LEFT', label: '◀' }, physicalKeys: ['ArrowLeft'] },
  { id: 'OK', row: 2, col: 5, variant: 'control', primary: { action: 'ENTER', label: 'OK' } },
  { id: 'NAV_RIGHT', row: 2, col: 6, variant: 'control', primary: { action: 'NAV_RIGHT', label: '▶' }, physicalKeys: ['ArrowRight'] },

  { id: 'SQUARE', row: 3, col: 1, variant: 'function', primary: { insert: '²', label: 'x²' }, shift: { insert: '√(', label: '√' }, alpha: L('B') },
  { id: 'POWER', row: 3, col: 2, variant: 'function', primary: { insert: '^', label: 'xʸ' }, alpha: L('C'), physicalKeys: ['^'] },
  { id: 'LPAREN', row: 3, col: 3, variant: 'function', primary: { insert: '(', label: '(' }, alpha: L('D'), physicalKeys: ['('] },
  { id: 'RPAREN', row: 3, col: 4, variant: 'function', primary: { insert: ')', label: ')' }, alpha: L('E'), physicalKeys: [')'] },
  { id: 'NAV_DOWN', row: 3, col: 5, variant: 'control', primary: { action: 'NAV_DOWN', label: '▼' }, physicalKeys: ['ArrowDown'] },
  { id: 'COMMA', row: 3, col: 6, variant: 'function', primary: { insert: ',', label: ',' }, alpha: L('F'), physicalKeys: [','] },

  { id: 'LOG', row: 4, col: 1, variant: 'function', primary: { insert: 'log(', label: 'log' }, shift: { insert: '10^(', label: '10ˣ' }, alpha: L('G') },
  { id: 'LN', row: 4, col: 2, variant: 'function', primary: { insert: 'ln(', label: 'ln' }, shift: { insert: 'exp(', label: 'eˣ' }, alpha: L('H') },
  { id: 'SIN', row: 4, col: 3, variant: 'function', primary: { insert: 'sin(', label: 'sin' }, shift: { insert: 'asin(', label: 'sin⁻¹' }, alpha: L('I') },
  { id: 'COS', row: 4, col: 4, variant: 'function', primary: { insert: 'cos(', label: 'cos' }, shift: { insert: 'acos(', label: 'cos⁻¹' }, alpha: L('J') },
  { id: 'TAN', row: 4, col: 5, variant: 'function', primary: { insert: 'tan(', label: 'tan' }, shift: { insert: 'atan(', label: 'tan⁻¹' }, alpha: L('K') },
  { id: 'STO', row: 4, col: 6, variant: 'function', primary: { insert: '→', label: '→' }, alpha: L('L') },

  { id: 'SEVEN', row: 5, col: 1, variant: 'number', primary: L('7'), alpha: L('M'), physicalKeys: ['7'] },
  { id: 'EIGHT', row: 5, col: 2, variant: 'number', primary: L('8'), alpha: L('N'), physicalKeys: ['8'] },
  { id: 'NINE', row: 5, col: 3, variant: 'number', primary: L('9'), alpha: L('O'), physicalKeys: ['9'] },
  { id: 'DEL', row: 5, col: 4, variant: 'control', primary: { action: 'BACKSPACE', label: '⌫' }, physicalKeys: ['Backspace', 'Delete'] },
  { id: 'PI', row: 5, col: 5, variant: 'function', primary: L('π'), shift: L('e') },
  { id: 'ABS', row: 5, col: 6, variant: 'function', primary: { insert: 'abs(', label: 'Abs' } },

  { id: 'FOUR', row: 6, col: 1, variant: 'number', primary: L('4'), alpha: L('P'), physicalKeys: ['4'] },
  { id: 'FIVE', row: 6, col: 2, variant: 'number', primary: L('5'), alpha: L('Q'), physicalKeys: ['5'] },
  { id: 'SIX', row: 6, col: 3, variant: 'number', primary: L('6'), alpha: L('R'), physicalKeys: ['6'] },
  { id: 'MULTIPLY', row: 6, col: 4, variant: 'operator', primary: { insert: '*', label: '×' }, alpha: L('S'), physicalKeys: ['*'] },
  { id: 'DIVIDE', row: 6, col: 5, variant: 'operator', primary: { insert: '/', label: '÷' }, alpha: L('T'), physicalKeys: ['/'] },
  { id: 'INV', row: 6, col: 6, variant: 'function', primary: { insert: '⁻¹', label: 'x⁻¹' }, shift: { insert: '!', label: 'x!' } },

  { id: 'ONE', row: 7, col: 1, variant: 'number', primary: L('1'), alpha: L('U'), physicalKeys: ['1'] },
  { id: 'TWO', row: 7, col: 2, variant: 'number', primary: L('2'), alpha: L('V'), physicalKeys: ['2'] },
  { id: 'THREE', row: 7, col: 3, variant: 'number', primary: L('3'), alpha: L('W'), physicalKeys: ['3'] },
  { id: 'PLUS', row: 7, col: 4, variant: 'operator', primary: L('+'), alpha: L('X'), physicalKeys: ['+'] },
  { id: 'MINUS', row: 7, col: 5, variant: 'operator', primary: { insert: '-', label: '−' }, alpha: L('Y'), physicalKeys: ['-'] },
  { id: 'ANS', row: 7, col: 6, variant: 'number', primary: { insert: 'Ans', label: 'Ans' } },

  { id: 'ZERO', row: 8, col: 1, variant: 'number', primary: L('0'), alpha: L('Z'), physicalKeys: ['0'] },
  { id: 'DOT', row: 8, col: 2, variant: 'number', primary: L('.'), physicalKeys: ['.'] },
  { id: 'EXP', row: 8, col: 3, variant: 'number', primary: { insert: 'E', label: '×10ˣ' } },
  { id: 'NEGATE', row: 8, col: 4, variant: 'number', primary: { insert: '-', label: '(−)' } },
  { id: 'EXE', row: 8, col: 5, colSpan: 2, variant: 'control', primary: { action: 'ENTER', label: 'EXE' }, physicalKeys: ['Enter', '='] },
]

export const cg100KeyboardLayout: KeyboardLayout = { id: 'cg100-standard', name: 'fx-CG100 family', columns: 6, rows: 8, keys }
