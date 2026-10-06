import type { KeyDefinition, KeyboardLayout } from '../core/CalculatorKeyboard'

/**
 * Original key layout for the ClassWiz-family engine. This is our own
 * design (grid position, iconography and legends), not a reproduction of
 * any CASIO keyboard artwork. The CW and EX generations differ in how
 * some keys are named (HOME/SETTINGS/TOOLS/FORMAT on CW versus
 * MENU/SETUP/OPTN/S⇔D on EX), so the layout is built per variant.
 */
export type ClassWizVariant = 'cw' | 'ex'

function keys(variant: ClassWizVariant): KeyDefinition[] {
  const cw = variant === 'cw'
  return [
    // Row 1 — modifiers, mode menu, navigation
    { id: 'SHIFT', row: 1, col: 1, variant: 'modifier', primary: { action: 'SHIFT', label: 'SHIFT' }, tooltip: 'Secondary (yellow) functions', physicalKeys: ['Shift'] },
    { id: 'ALPHA', row: 1, col: 2, variant: 'modifier', primary: { action: 'ALPHA', label: 'ALPHA' }, tooltip: 'Variables A–F, X, Y, M and constants', physicalKeys: ['Tab', 'Control'] },
    {
      id: 'MODE',
      row: 1,
      col: 3,
      variant: 'control',
      primary: { action: 'MODE', label: cw ? 'HOME' : 'MENU' },
      shift: cw ? undefined : { action: 'SETUP', label: 'SETUP' },
      tooltip: 'Choose a calculation mode',
      physicalKeys: ['F2'],
    },
    { id: 'NAV_UP', row: 1, col: 4, variant: 'control', primary: { action: 'NAV_UP', label: '▲' }, physicalKeys: ['ArrowUp'] },
    {
      id: 'OPTN',
      row: 1,
      col: 5,
      variant: 'control',
      primary: { action: 'OPTN', label: cw ? 'TOOLS' : 'OPTN' },
      shift: cw ? { action: 'SETUP', label: 'SETTINGS' } : undefined,
      tooltip: 'Mode-specific functions',
      physicalKeys: ['F3'],
    },

    // Row 2
    { id: 'LOG', row: 2, col: 1, variant: 'function', primary: { insert: 'log(', label: 'log' }, shift: { insert: '10^(', label: '10ˣ' }, physicalKeys: ['l'] },
    { id: 'LN', row: 2, col: 2, variant: 'function', primary: { insert: 'ln(', label: 'ln' }, shift: { insert: 'exp(', label: 'eˣ' }, physicalKeys: ['n'] },
    { id: 'NAV_LEFT', row: 2, col: 3, variant: 'control', primary: { action: 'NAV_LEFT', label: '◀' }, physicalKeys: ['ArrowLeft'] },
    { id: 'SD', row: 2, col: 4, variant: 'control', primary: { action: 'SD', label: cw ? 'FORMAT' : 'S⇔D' }, tooltip: 'Toggle fraction / decimal result' },
    { id: 'NAV_RIGHT', row: 2, col: 5, variant: 'control', primary: { action: 'NAV_RIGHT', label: '▶' }, physicalKeys: ['ArrowRight'] },

    // Row 3
    { id: 'INV', row: 3, col: 1, variant: 'function', primary: { insert: '⁻¹', label: 'x⁻¹' }, shift: { insert: '!', label: 'x!' }, physicalKeys: ['!'] },
    { id: 'SQUARE', row: 3, col: 2, variant: 'function', primary: { insert: '²', label: 'x²' }, shift: { insert: '³', label: 'x³' } },
    { id: 'INTEGRAL', row: 3, col: 3, variant: 'function', primary: { insert: '∫(', label: '∫' }, shift: { insert: 'd/dx(', label: 'd/dx' }, tooltip: '∫(f(X), a, b) · d/dx(f(X), a)' },
    { id: 'NAV_DOWN', row: 3, col: 4, variant: 'control', primary: { action: 'NAV_DOWN', label: '▼' }, physicalKeys: ['ArrowDown'] },
    { id: 'SIGMA', row: 3, col: 5, variant: 'function', primary: { insert: 'Σ(', label: 'Σ' }, shift: { insert: 'Π(', label: 'Π' }, tooltip: 'Σ(f(X), a, b)' },

    // Row 4
    { id: 'SQRT', row: 4, col: 1, variant: 'function', primary: { insert: '√(', label: '√' }, shift: { insert: '∛(', label: '∛' }, physicalKeys: ['r'] },
    { id: 'POWER', row: 4, col: 2, variant: 'function', primary: { insert: '^', label: 'xʸ' }, physicalKeys: ['^'] },
    { id: 'LPAREN', row: 4, col: 3, variant: 'function', primary: { insert: '(', label: '(' }, alpha: { insert: 'X', label: 'X' }, physicalKeys: ['('] },
    { id: 'RPAREN', row: 4, col: 4, variant: 'function', primary: { insert: ')', label: ')' }, alpha: { insert: 'Y', label: 'Y' }, physicalKeys: [')'] },
    { id: 'COMMA', row: 4, col: 5, variant: 'function', primary: { insert: ',', label: ',' }, shift: { insert: '%', label: '%' }, physicalKeys: [',', '%'] },

    // Row 5 — trig & friends
    { id: 'SIN', row: 5, col: 1, variant: 'function', primary: { insert: 'sin(', label: 'sin' }, shift: { insert: 'asin(', label: 'sin⁻¹' }, physicalKeys: ['s'] },
    { id: 'COS', row: 5, col: 2, variant: 'function', primary: { insert: 'cos(', label: 'cos' }, shift: { insert: 'acos(', label: 'cos⁻¹' }, physicalKeys: ['c'] },
    { id: 'TAN', row: 5, col: 3, variant: 'function', primary: { insert: 'tan(', label: 'tan' }, shift: { insert: 'atan(', label: 'tan⁻¹' }, physicalKeys: ['t'] },
    { id: 'NCR', row: 5, col: 4, variant: 'function', primary: { insert: 'nCr(', label: 'nCr' }, shift: { insert: 'nPr(', label: 'nPr' } },
    { id: 'IMAG', row: 5, col: 5, variant: 'function', primary: { insert: 'i', label: 'i' }, shift: { insert: 'polar(', label: '∠' }, tooltip: 'Imaginary unit (Complex mode)', physicalKeys: ['i'] },

    // Row 6 — memory
    { id: 'STO', row: 6, col: 1, variant: 'function', primary: { action: 'STO', label: 'STO' }, tooltip: 'Store into a variable: STO, then ALPHA + letter' },
    { id: 'MPLUS', row: 6, col: 2, variant: 'function', primary: { action: 'MEMORY_ADD', label: 'M+' }, shift: { action: 'MEMORY_SUB', label: 'M−' } },
    { id: 'MR', row: 6, col: 3, variant: 'function', primary: { action: 'MEMORY_RECALL', label: 'MR' }, shift: { action: 'MEMORY_CLEAR', label: 'MC' } },
    { id: 'NEGATE', row: 6, col: 4, variant: 'function', primary: { insert: '-', label: '(−)' } },
    { id: 'ABS', row: 6, col: 5, variant: 'function', primary: { insert: 'abs(', label: 'Abs' } },

    // Rows 7–10 — numeric keypad
    { id: 'SEVEN', row: 7, col: 1, variant: 'number', primary: { insert: '7', label: '7' }, alpha: { insert: 'D', label: 'D' }, physicalKeys: ['7'] },
    { id: 'EIGHT', row: 7, col: 2, variant: 'number', primary: { insert: '8', label: '8' }, alpha: { insert: 'E', label: 'E' }, physicalKeys: ['8'] },
    { id: 'NINE', row: 7, col: 3, variant: 'number', primary: { insert: '9', label: '9' }, alpha: { insert: 'F', label: 'F' }, physicalKeys: ['9'] },
    { id: 'DEL', row: 7, col: 4, variant: 'control', primary: { action: 'BACKSPACE', label: 'DEL' }, shift: { action: 'DELETE', label: 'INS' }, physicalKeys: ['Backspace', 'Delete'] },
    { id: 'ON', row: 7, col: 5, variant: 'control', primary: { action: 'CLEAR', label: 'AC' }, tooltip: 'All clear (memory is kept)', physicalKeys: ['Escape'] },

    { id: 'FOUR', row: 8, col: 1, variant: 'number', primary: { insert: '4', label: '4' }, alpha: { insert: 'A', label: 'A' }, physicalKeys: ['4'] },
    { id: 'FIVE', row: 8, col: 2, variant: 'number', primary: { insert: '5', label: '5' }, alpha: { insert: 'B', label: 'B' }, physicalKeys: ['5'] },
    { id: 'SIX', row: 8, col: 3, variant: 'number', primary: { insert: '6', label: '6' }, alpha: { insert: 'C', label: 'C' }, physicalKeys: ['6'] },
    { id: 'MULTIPLY', row: 8, col: 4, variant: 'operator', primary: { insert: '*', label: '×' }, alpha: { insert: 'π', label: 'π' }, physicalKeys: ['*', 'x'] },
    { id: 'DIVIDE', row: 8, col: 5, variant: 'operator', primary: { insert: '/', label: '÷' }, alpha: { insert: 'e', label: 'e' }, physicalKeys: ['/'] },

    { id: 'ONE', row: 9, col: 1, variant: 'number', primary: { insert: '1', label: '1' }, physicalKeys: ['1'] },
    { id: 'TWO', row: 9, col: 2, variant: 'number', primary: { insert: '2', label: '2' }, physicalKeys: ['2'] },
    { id: 'THREE', row: 9, col: 3, variant: 'number', primary: { insert: '3', label: '3' }, physicalKeys: ['3'] },
    { id: 'PLUS', row: 9, col: 4, variant: 'operator', primary: { insert: '+', label: '+' }, physicalKeys: ['+'] },
    { id: 'MINUS', row: 9, col: 5, variant: 'operator', primary: { insert: '-', label: '−' }, physicalKeys: ['-'] },

    { id: 'ZERO', row: 10, col: 1, variant: 'number', primary: { insert: '0', label: '0' }, alpha: { insert: 'M', label: 'M' }, physicalKeys: ['0'] },
    { id: 'DOT', row: 10, col: 2, variant: 'number', primary: { insert: '.', label: '.' }, physicalKeys: ['.'] },
    { id: 'EXP', row: 10, col: 3, variant: 'number', primary: { insert: 'E', label: '×10ˣ' }, shift: { insert: 'π', label: 'π' }, physicalKeys: ['E'] },
    { id: 'ANS', row: 10, col: 4, variant: 'number', primary: { insert: 'Ans', label: 'Ans' }, physicalKeys: ['a'] },
    { id: 'EQUALS', row: 10, col: 5, variant: 'control', primary: { action: 'ENTER', label: '=' }, physicalKeys: ['Enter', '='] },
  ]
}

export function classWizKeyboard(variant: ClassWizVariant): KeyboardLayout {
  return {
    id: variant === 'cw' ? 'classwiz-cw' : 'classwiz-ex',
    name: variant === 'cw' ? 'ClassWiz CW' : 'ClassWiz EX',
    columns: 5,
    rows: 10,
    keys: keys(variant),
  }
}

/** Kept for backwards compatibility with earlier imports. */
export const classWizKeyboardLayout = classWizKeyboard('cw')
