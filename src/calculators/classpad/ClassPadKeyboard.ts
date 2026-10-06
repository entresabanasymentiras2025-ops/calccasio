import type { KeyDefinition, KeyboardLayout } from '../core/CalculatorKeyboard'

/** Hardware keys below the touch screen (our own arrangement). Most input happens on the touch screen. */
const k = (id: string, row: number, col: number, label: string, insert?: string, action?: string, extra: Partial<KeyDefinition> = {}): KeyDefinition => ({
  id,
  row,
  col,
  variant: action ? 'control' : /^[0-9.]$/.test(label) ? 'number' : 'function',
  primary: action ? { action, label } : { insert: insert ?? label, label },
  ...extra,
})

const keys: KeyDefinition[] = [
  k('KEYBOARD', 1, 1, 'Keyboard', undefined, 'KEYBOARD', { tooltip: 'Cycle soft-keyboard tabs' }),
  k('NAV_UP', 1, 2, '▲', undefined, 'NAV_UP', { physicalKeys: ['ArrowUp'] }),
  k('NAV_DOWN', 1, 3, '▼', undefined, 'NAV_DOWN', { physicalKeys: ['ArrowDown'] }),
  k('NAV_LEFT', 1, 4, '◀', undefined, 'NAV_LEFT', { physicalKeys: ['ArrowLeft'] }),
  k('NAV_RIGHT', 1, 5, '▶', undefined, 'NAV_RIGHT', { physicalKeys: ['ArrowRight'] }),
  k('X', 2, 1, 'x', 'x'),
  k('Y', 2, 2, 'y', 'y'),
  k('Z', 2, 3, 'z', 'z'),
  k('POWER', 2, 4, '^', '^'),
  k('DIVIDE', 2, 5, '÷', '/'),
  k('LPAREN', 3, 1, '(', '('),
  k('RPAREN', 3, 2, ')', ')'),
  k('COMMA', 3, 3, ',', ','),
  k('NEGATE', 3, 4, '(−)', '-'),
  k('MULTIPLY', 3, 5, '×', '*'),
  k('SEVEN', 4, 1, '7'),
  k('EIGHT', 4, 2, '8'),
  k('NINE', 4, 3, '9'),
  k('DEL', 4, 4, '⌫', undefined, 'BACKSPACE'),
  k('MINUS', 4, 5, '−', '-'),
  k('FOUR', 5, 1, '4'),
  k('FIVE', 5, 2, '5'),
  k('SIX', 5, 3, '6'),
  k('CLEAR', 5, 4, 'Clear', undefined, 'CLEAR'),
  k('PLUS', 5, 5, '+', '+'),
  k('ONE', 6, 1, '1'),
  k('TWO', 6, 2, '2'),
  k('THREE', 6, 3, '3'),
  k('EQUALSIGN', 6, 4, '=', '='),
  k('EXE', 6, 5, 'EXE', undefined, 'ENTER'),
  k('ZERO', 7, 1, '0'),
  k('DOT', 7, 2, '.'),
  k('EXP', 7, 3, 'EXP', 'E'),
  k('ANS', 7, 4, 'ans', 'Ans'),
]

export const classPadKeyboardLayout: KeyboardLayout = { id: 'classpad-standard', name: 'ClassPad', columns: 5, rows: 7, keys }
