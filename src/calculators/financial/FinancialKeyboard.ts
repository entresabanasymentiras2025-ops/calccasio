import type { KeyDefinition, KeyboardLayout } from '../core/CalculatorKeyboard'

/** Original financial keyboard: one key per financial mode, SOLVE, ESC and a standard keypad. */
const mode = (id: string, row: number, col: number, label: string, shift?: [string, string]): KeyDefinition => ({
  id: `M_${id}`,
  row,
  col,
  variant: 'function',
  primary: { action: `GOTO:${id}`, label },
  shift: shift ? { action: `GOTO:${shift[0]}`, label: shift[1] } : undefined,
})

const keys: KeyDefinition[] = [
  { id: 'SHIFT', row: 1, col: 1, variant: 'modifier', primary: { action: 'SHIFT', label: 'SHIFT' }, physicalKeys: ['Shift'] },
  { id: 'ALPHA', row: 1, col: 2, variant: 'modifier', primary: { action: 'ALPHA', label: 'ALPHA' }, physicalKeys: ['Tab', 'Control'] },
  { id: 'NAV_UP', row: 1, col: 3, variant: 'control', primary: { action: 'NAV_UP', label: '▲' }, physicalKeys: ['ArrowUp'] },
  { id: 'SETUP', row: 1, col: 4, variant: 'control', primary: { action: 'SETUP', label: 'SETUP' } },
  { id: 'ON', row: 1, col: 5, variant: 'control', primary: { action: 'CLEAR', label: 'ON' }, physicalKeys: ['Escape'] },

  { id: 'ESC', row: 2, col: 1, variant: 'control', primary: { action: 'CLEAR', label: 'ESC' }, tooltip: 'Back one level' },
  { id: 'NAV_LEFT', row: 2, col: 2, variant: 'control', primary: { action: 'NAV_LEFT', label: '◀' }, physicalKeys: ['ArrowLeft'] },
  { id: 'NAV_DOWN', row: 2, col: 3, variant: 'control', primary: { action: 'NAV_DOWN', label: '▼' }, physicalKeys: ['ArrowDown'] },
  { id: 'NAV_RIGHT', row: 2, col: 4, variant: 'control', primary: { action: 'NAV_RIGHT', label: '▶' }, physicalKeys: ['ArrowRight'] },
  { id: 'SOLVE', row: 2, col: 5, variant: 'control', primary: { action: 'SOLVE', label: 'SOLVE' }, tooltip: 'Solve the highlighted variable', physicalKeys: ['F4'] },

  mode('SMPL', 3, 1, 'SMPL', ['COMP', 'COMP']),
  // SHIFT+CMPD opens statistics (our own placement).
  mode('CMPD', 3, 2, 'CMPD', ['STAT', 'STAT']),
  mode('CASH', 3, 3, 'CASH'),
  mode('AMRT', 3, 4, 'AMRT'),
  mode('CNVR', 3, 5, 'CNVR'),
  mode('COST', 4, 1, 'COST'),
  mode('DAYS', 4, 2, 'DAYS'),
  mode('DEPR', 4, 3, 'DEPR'),
  mode('BOND', 4, 4, 'BOND'),
  mode('BEVN', 4, 5, 'BEVN'),

  { id: 'LPAREN', row: 5, col: 1, variant: 'function', primary: { insert: '(', label: '(' }, physicalKeys: ['('] },
  { id: 'RPAREN', row: 5, col: 2, variant: 'function', primary: { insert: ')', label: ')' }, physicalKeys: [')'] },
  { id: 'COMMA', row: 5, col: 3, variant: 'function', primary: { insert: ',', label: ',' }, physicalKeys: [','] },
  { id: 'POWER', row: 5, col: 4, variant: 'function', primary: { insert: '^', label: 'xʸ' }, shift: { insert: '√(', label: '√' }, physicalKeys: ['^'] },
  { id: 'PERCENT', row: 5, col: 5, variant: 'function', primary: { insert: '%', label: '%' }, shift: { insert: 'ln(', label: 'ln' }, physicalKeys: ['%'] },

  { id: 'SEVEN', row: 6, col: 1, variant: 'number', primary: { insert: '7', label: '7' }, physicalKeys: ['7'] },
  { id: 'EIGHT', row: 6, col: 2, variant: 'number', primary: { insert: '8', label: '8' }, physicalKeys: ['8'] },
  { id: 'NINE', row: 6, col: 3, variant: 'number', primary: { insert: '9', label: '9' }, physicalKeys: ['9'] },
  { id: 'DEL', row: 6, col: 4, variant: 'control', primary: { action: 'BACKSPACE', label: 'DEL' }, physicalKeys: ['Backspace', 'Delete'] },
  { id: 'AC', row: 6, col: 5, variant: 'control', primary: { action: 'CLEAR', label: 'AC' } },

  { id: 'FOUR', row: 7, col: 1, variant: 'number', primary: { insert: '4', label: '4' }, physicalKeys: ['4'] },
  { id: 'FIVE', row: 7, col: 2, variant: 'number', primary: { insert: '5', label: '5' }, physicalKeys: ['5'] },
  { id: 'SIX', row: 7, col: 3, variant: 'number', primary: { insert: '6', label: '6' }, physicalKeys: ['6'] },
  { id: 'MULTIPLY', row: 7, col: 4, variant: 'operator', primary: { insert: '*', label: '×' }, physicalKeys: ['*', 'x'] },
  { id: 'DIVIDE', row: 7, col: 5, variant: 'operator', primary: { insert: '/', label: '÷' }, physicalKeys: ['/'] },

  { id: 'ONE', row: 8, col: 1, variant: 'number', primary: { insert: '1', label: '1' }, physicalKeys: ['1'] },
  { id: 'TWO', row: 8, col: 2, variant: 'number', primary: { insert: '2', label: '2' }, physicalKeys: ['2'] },
  { id: 'THREE', row: 8, col: 3, variant: 'number', primary: { insert: '3', label: '3' }, physicalKeys: ['3'] },
  { id: 'PLUS', row: 8, col: 4, variant: 'operator', primary: { insert: '+', label: '+' }, physicalKeys: ['+'] },
  { id: 'MINUS', row: 8, col: 5, variant: 'operator', primary: { insert: '-', label: '−' }, physicalKeys: ['-'] },

  { id: 'ZERO', row: 9, col: 1, variant: 'number', primary: { insert: '0', label: '0' }, physicalKeys: ['0'] },
  { id: 'DOT', row: 9, col: 2, variant: 'number', primary: { insert: '.', label: '.' }, physicalKeys: ['.'] },
  { id: 'NEGATE', row: 9, col: 3, variant: 'number', primary: { insert: '-', label: '(−)' } },
  { id: 'DATESEP', row: 9, col: 4, variant: 'number', primary: { insert: '-', label: '−/date' }, tooltip: 'Date separator (YYYY-MM-DD)' },
  { id: 'EXE', row: 9, col: 5, variant: 'control', primary: { action: 'ENTER', label: 'EXE' }, physicalKeys: ['Enter', '='] },
]

export const financialKeyboardLayout: KeyboardLayout = { id: 'financial-standard', name: 'Financial', columns: 5, rows: 9, keys }
