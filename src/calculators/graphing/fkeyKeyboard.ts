import type { KeyDefinition, KeyboardLayout } from '../core/CalculatorKeyboard'

/**
 * Original 6-column keyboard for F-key driven graphing calculators
 * (fx-9860 / fx-CG50 families). F1–F6 run the soft-key commands shown at
 * the bottom of the screen; ALPHA letters A–Z are spread over the lower
 * keys as on many graphing calculators.
 */
export function fkeyGraphingKeyboard(id: string, name: string): KeyboardLayout {
  const L = (insert: string) => ({ insert, label: insert })
  const keys: KeyDefinition[] = [
    ...[1, 2, 3, 4, 5, 6].map((n) => ({ id: `F${n}`, row: 1, col: n, variant: 'control' as const, primary: { action: `F${n}`, label: `F${n}` }, physicalKeys: [`F${n + 4}`] })),
    { id: 'SHIFT', row: 2, col: 1, variant: 'modifier', primary: { action: 'SHIFT', label: 'SHIFT' }, physicalKeys: ['Shift'] },
    { id: 'OPTN', row: 2, col: 2, variant: 'control', primary: { action: 'TOOLS', label: 'OPTN' }, tooltip: 'Commands for this screen as a menu' },
    { id: 'MENU', row: 2, col: 3, variant: 'control', primary: { action: 'MENU', label: 'MENU' }, shift: { action: 'SETUP', label: 'SET UP' }, physicalKeys: ['Home'] },
    { id: 'EXIT', row: 2, col: 4, variant: 'control', primary: { action: 'EXIT', label: 'EXIT' }, physicalKeys: ['Escape'] },
    { id: 'NAV_UP', row: 2, col: 5, variant: 'control', primary: { action: 'NAV_UP', label: '▲' }, physicalKeys: ['ArrowUp'] },
    { id: 'ON', row: 2, col: 6, variant: 'control', primary: { action: 'CLEAR', label: 'AC' } },

    { id: 'ALPHA', row: 3, col: 1, variant: 'modifier', primary: { action: 'ALPHA', label: 'ALPHA' }, physicalKeys: ['Tab', 'Control'] },
    { id: 'SQUARE', row: 3, col: 2, variant: 'function', primary: { insert: '²', label: 'x²' }, shift: { insert: '√(', label: '√' } },
    { id: 'POWER', row: 3, col: 3, variant: 'function', primary: { insert: '^', label: '^' }, shift: { insert: '∛(', label: '∛' }, physicalKeys: ['^'] },
    { id: 'NAV_LEFT', row: 3, col: 4, variant: 'control', primary: { action: 'NAV_LEFT', label: '◀' }, physicalKeys: ['ArrowLeft'] },
    { id: 'NAV_DOWN', row: 3, col: 5, variant: 'control', primary: { action: 'NAV_DOWN', label: '▼' }, physicalKeys: ['ArrowDown'] },
    { id: 'NAV_RIGHT', row: 3, col: 6, variant: 'control', primary: { action: 'NAV_RIGHT', label: '▶' }, physicalKeys: ['ArrowRight'] },

    { id: 'XVAR', row: 4, col: 1, variant: 'function', primary: { insert: 'X', label: 'X,θ,T' }, alpha: L('A'), physicalKeys: ['x', 'X'] },
    { id: 'LOG', row: 4, col: 2, variant: 'function', primary: { insert: 'log(', label: 'log' }, shift: { insert: '10^(', label: '10ˣ' }, alpha: L('B') },
    { id: 'LN', row: 4, col: 3, variant: 'function', primary: { insert: 'ln(', label: 'ln' }, shift: { insert: 'exp(', label: 'eˣ' }, alpha: L('C') },
    { id: 'SIN', row: 4, col: 4, variant: 'function', primary: { insert: 'sin(', label: 'sin' }, shift: { insert: 'asin(', label: 'sin⁻¹' }, alpha: L('D') },
    { id: 'COS', row: 4, col: 5, variant: 'function', primary: { insert: 'cos(', label: 'cos' }, shift: { insert: 'acos(', label: 'cos⁻¹' }, alpha: L('E') },
    { id: 'TAN', row: 4, col: 6, variant: 'function', primary: { insert: 'tan(', label: 'tan' }, shift: { insert: 'atan(', label: 'tan⁻¹' }, alpha: L('F') },

    { id: 'INV', row: 5, col: 1, variant: 'function', primary: { insert: '⁻¹', label: 'x⁻¹' }, shift: { insert: '!', label: 'x!' }, alpha: L('G') },
    { id: 'ABS', row: 5, col: 2, variant: 'function', primary: { insert: 'abs(', label: 'Abs' }, alpha: L('H') },
    { id: 'LPAREN', row: 5, col: 3, variant: 'function', primary: { insert: '(', label: '(' }, alpha: L('I'), physicalKeys: ['('] },
    { id: 'RPAREN', row: 5, col: 4, variant: 'function', primary: { insert: ')', label: ')' }, alpha: L('J'), physicalKeys: [')'] },
    { id: 'COMMA', row: 5, col: 5, variant: 'function', primary: { insert: ',', label: ',' }, alpha: L('K'), physicalKeys: [','] },
    { id: 'STO', row: 5, col: 6, variant: 'function', primary: { insert: '→', label: '→' }, alpha: L('L'), tooltip: 'Store: 5→A' },

    { id: 'SEVEN', row: 6, col: 1, variant: 'number', primary: L('7'), alpha: L('M'), physicalKeys: ['7'] },
    { id: 'EIGHT', row: 6, col: 2, variant: 'number', primary: L('8'), alpha: L('N'), physicalKeys: ['8'] },
    { id: 'NINE', row: 6, col: 3, variant: 'number', primary: L('9'), alpha: L('O'), physicalKeys: ['9'] },
    { id: 'DEL', row: 6, col: 4, variant: 'control', primary: { action: 'BACKSPACE', label: 'DEL' }, physicalKeys: ['Backspace', 'Delete'] },
    { id: 'ZOOMIN', row: 6, col: 5, variant: 'function', primary: { action: 'ZOOM_IN', label: 'Zoom+' }, tooltip: 'Zoom in (graph screen)' },
    { id: 'ZOOMOUT', row: 6, col: 6, variant: 'function', primary: { action: 'ZOOM_OUT', label: 'Zoom−' }, tooltip: 'Zoom out (graph screen)' },

    { id: 'FOUR', row: 7, col: 1, variant: 'number', primary: L('4'), alpha: L('P'), physicalKeys: ['4'] },
    { id: 'FIVE', row: 7, col: 2, variant: 'number', primary: L('5'), alpha: L('Q'), physicalKeys: ['5'] },
    { id: 'SIX', row: 7, col: 3, variant: 'number', primary: L('6'), alpha: L('R'), physicalKeys: ['6'] },
    { id: 'MULTIPLY', row: 7, col: 4, variant: 'operator', primary: { insert: '*', label: '×' }, alpha: L('S'), physicalKeys: ['*'] },
    { id: 'DIVIDE', row: 7, col: 5, variant: 'operator', primary: { insert: '/', label: '÷' }, alpha: L('T'), physicalKeys: ['/'] },
    { id: 'PI', row: 7, col: 6, variant: 'function', primary: { insert: 'π', label: 'π' }, shift: { insert: 'e', label: 'e' } },

    { id: 'ONE', row: 8, col: 1, variant: 'number', primary: L('1'), alpha: L('U'), physicalKeys: ['1'] },
    { id: 'TWO', row: 8, col: 2, variant: 'number', primary: L('2'), alpha: L('V'), physicalKeys: ['2'] },
    { id: 'THREE', row: 8, col: 3, variant: 'number', primary: L('3'), alpha: L('W'), physicalKeys: ['3'] },
    { id: 'PLUS', row: 8, col: 4, variant: 'operator', primary: L('+'), alpha: L('X'), physicalKeys: ['+'] },
    { id: 'MINUS', row: 8, col: 5, variant: 'operator', primary: { insert: '-', label: '−' }, alpha: L('Y'), physicalKeys: ['-'] },
    { id: 'ANS', row: 8, col: 6, variant: 'number', primary: { insert: 'Ans', label: 'Ans' } },

    { id: 'ZERO', row: 9, col: 1, variant: 'number', primary: L('0'), alpha: L('Z'), physicalKeys: ['0'] },
    { id: 'DOT', row: 9, col: 2, variant: 'number', primary: L('.'), physicalKeys: ['.'] },
    { id: 'EXP', row: 9, col: 3, variant: 'number', primary: { insert: 'E', label: '×10ˣ' } },
    { id: 'NEGATE', row: 9, col: 4, variant: 'number', primary: { insert: '-', label: '(−)' } },
    { id: 'EXE', row: 9, col: 5, colSpan: 2, variant: 'control', primary: { action: 'ENTER', label: 'EXE' }, physicalKeys: ['Enter', '='] },
  ]
  return { id, name, columns: 6, rows: 9, keys }
}
