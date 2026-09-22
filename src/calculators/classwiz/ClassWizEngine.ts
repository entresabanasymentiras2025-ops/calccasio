import { BaseCalculatorEngine } from '../core/CalculatorEngine'
import type { CalculatorState, MenuItem } from '../core/CalculatorState'
import { closedMenu } from '../core/CalculatorState'
import type { CalculatorDisplayState, DisplayIndicator } from '../core/CalculatorDisplay'
import type { HistoryEntry } from '../core/CalculatorMemory'
import { createHistoryEntry } from '../core/CalculatorMemory'
import { classWizKeyboardLayout } from './ClassWizKeyboard'
import { resolveKeyAction } from '../core/CalculatorKeyboard'
import { evaluate, createContext } from '../../math/parser/evaluator'
import { formatValue, formattedToPlainText } from '../../math/numerical/format'
import { fromInt, add, sub, MathError, type CalcValue } from '../../math/arithmetic/value'
import type { AngleMode } from '../../math/trigonometry/trig'
import type { CalculatorModelConfig } from '../../models/types'

export type ClassWizState = CalculatorState

const IMPLEMENTED_MODES = new Set(['COMP'])

const ALL_MODES: MenuItem[] = [
  { id: 'COMP', label: 'Calculate' },
  { id: 'STAT', label: 'Statistics' },
  { id: 'TABLE', label: 'Table' },
  { id: 'EQUATION', label: 'Equation' },
  { id: 'MATRIX', label: 'Matrix' },
  { id: 'VECTOR', label: 'Vector' },
  { id: 'COMPLEX', label: 'Complex' },
  { id: 'BASE_N', label: 'Base-N' },
  { id: 'RATIO', label: 'Ratio' },
  { id: 'DISTRIBUTION', label: 'Distribution' },
]

const VARIABLE_LETTERS = new Set(['A', 'B', 'C', 'D', 'E', 'F', 'X', 'Y', 'M'])

export class ClassWizEngine extends BaseCalculatorEngine<ClassWizState> {
  private pendingStore = false
  private resultShown = false
  private historyIndex: number | null = null

  constructor(config: CalculatorModelConfig) {
    super(config.id, classWizKeyboardLayout)
  }

  initialize(): ClassWizState {
    return {
      modelId: this.modelId,
      mode: 'COMP',
      expression: '',
      result: null,
      cursorPos: 0,
      shift: false,
      alpha: false,
      memory: {
        variables: {},
        ans: fromInt(0),
        independentMemory: fromInt(0),
        history: [],
      },
      menu: closedMenu(),
      settings: { angleMode: 'DEG', displayDigits: 10, fractionDisplay: 'mixed' },
      error: null,
    }
  }

  private availableModes(): MenuItem[] {
    return ALL_MODES.map((m) => ({
      ...m,
      label: IMPLEMENTED_MODES.has(m.id) ? m.label : `${m.label} (coming soon)`,
    }))
  }

  protected handleKeyId(keyId: string): void {
    const key = this.keyboardLayout.keys.find((k) => k.id === keyId)
    if (!key) return

    if (this.state.menu.open) {
      this.handleMenuKey(keyId)
      return
    }

    const action = resolveKeyAction(key, this.state.shift, this.state.alpha)

    // STO arms a pending "store next variable" operation; it must survive
    // the SHIFT/ALPHA toggle presses that typically precede the letter key.
    const isModifierToggle = action.action === 'SHIFT' || action.action === 'ALPHA'
    const isVariableInsert = !!action.insert && VARIABLE_LETTERS.has(action.insert)
    if (this.pendingStore && !isModifierToggle) {
      if (isVariableInsert) {
        this.storeToVariable(action.insert!)
        this.pendingStore = false
        this.clearModifiers()
        return
      }
      this.pendingStore = false
    }

    if (action.action) {
      this.handleAction(action.action)
    } else if (action.insert) {
      this.handleInsert(action.insert)
    }

    if (!isModifierToggle) {
      this.clearModifiers()
    }
  }

  private clearModifiers(): void {
    this.state = { ...this.state, shift: false, alpha: false }
  }

  private handleMenuKey(keyId: string): void {
    if (keyId === 'NAV_UP') {
      const n = this.state.menu.items.length
      this.state = { ...this.state, menu: { ...this.state.menu, selectedIndex: (this.state.menu.selectedIndex - 1 + n) % n } }
    } else if (keyId === 'NAV_DOWN') {
      const n = this.state.menu.items.length
      this.state = { ...this.state, menu: { ...this.state.menu, selectedIndex: (this.state.menu.selectedIndex + 1) % n } }
    } else if (keyId === 'EQUALS') {
      const item = this.state.menu.items[this.state.menu.selectedIndex]
      this.selectMode(item)
    } else if (keyId === 'ON') {
      this.state = { ...this.state, menu: closedMenu() }
    }
  }

  private selectMode(item: MenuItem): void {
    if (IMPLEMENTED_MODES.has(item.id)) {
      this.state = { ...this.state, mode: item.id, menu: closedMenu(), error: null }
    } else {
      this.state = {
        ...this.state,
        menu: closedMenu(),
        error: { code: 'ModeError', message: `${item.label.replace(' (coming soon)', '')} mode is not implemented yet in this build.` },
      }
    }
  }

  private handleAction(action: string): void {
    switch (action) {
      case 'SHIFT':
        this.state = { ...this.state, shift: !this.state.shift, alpha: false }
        return
      case 'ALPHA':
        this.state = { ...this.state, alpha: !this.state.alpha, shift: false }
        return
      case 'MODE':
        this.state = { ...this.state, menu: { open: true, path: ['MODE'], items: this.availableModes(), selectedIndex: 0 } }
        return
      case 'CLEAR':
        this.state = { ...this.state, expression: '', cursorPos: 0, result: null, error: null }
        this.resultShown = false
        this.historyIndex = null
        return
      case 'BACKSPACE':
        if (this.state.error) {
          this.state = { ...this.state, error: null }
          return
        }
        if (this.state.cursorPos > 0) {
          const expr = this.state.expression
          this.state = {
            ...this.state,
            expression: expr.slice(0, this.state.cursorPos - 1) + expr.slice(this.state.cursorPos),
            cursorPos: this.state.cursorPos - 1,
          }
        }
        return
      case 'DELETE':
        if (this.state.cursorPos < this.state.expression.length) {
          const expr = this.state.expression
          this.state = {
            ...this.state,
            expression: expr.slice(0, this.state.cursorPos) + expr.slice(this.state.cursorPos + 1),
          }
        }
        return
      case 'NAV_LEFT':
        this.state = { ...this.state, cursorPos: Math.max(0, this.state.cursorPos - 1) }
        return
      case 'NAV_RIGHT':
        this.state = { ...this.state, cursorPos: Math.min(this.state.expression.length, this.state.cursorPos + 1) }
        return
      case 'NAV_UP':
        this.browseHistory(-1)
        return
      case 'NAV_DOWN':
        this.browseHistory(1)
        return
      case 'ENTER':
        this.evaluateExpression()
        return
      case 'MEMORY_ADD':
        this.applyToMemory((mem, val) => add(mem, val))
        return
      case 'MEMORY_SUB':
        this.applyToMemory((mem, val) => sub(mem, val))
        return
      case 'MEMORY_RECALL':
        this.handleInsert('M')
        return
      case 'MEMORY_CLEAR':
        this.state = { ...this.state, memory: { ...this.state.memory, independentMemory: fromInt(0) } }
        return
      case 'STO':
        this.pendingStore = true
        return
    }
  }

  private handleInsert(text: string): void {
    if (this.state.error) {
      this.state = { ...this.state, expression: '', cursorPos: 0, error: null }
    }
    let expression = this.state.expression
    let cursorPos = this.state.cursorPos
    let result = this.state.result
    const wasResultShown = this.resultShown

    if (wasResultShown) {
      const isOperator = ['+', '-', '*', '/', '^'].includes(text)
      if (isOperator) {
        expression = 'Ans'
        cursorPos = expression.length
      } else {
        expression = ''
        cursorPos = 0
      }
      result = null
      this.resultShown = false
    }

    expression = expression.slice(0, cursorPos) + text + expression.slice(cursorPos)
    cursorPos += text.length
    this.state = { ...this.state, expression, cursorPos, result }
    this.historyIndex = null
  }

  private browseHistory(direction: 1 | -1): void {
    const history = this.state.memory.history
    if (history.length === 0) return
    if (this.historyIndex === null) {
      this.historyIndex = direction === -1 ? history.length - 1 : null
    } else {
      this.historyIndex += direction
    }
    if (this.historyIndex === null || this.historyIndex < 0) {
      this.historyIndex = 0
    }
    if (this.historyIndex >= history.length) {
      this.state = { ...this.state, expression: '', cursorPos: 0 }
      this.historyIndex = null
      return
    }
    const entry = history[this.historyIndex]
    this.state = { ...this.state, expression: entry.input, cursorPos: entry.input.length, result: null }
  }

  private buildContext() {
    return createContext({
      angleMode: this.state.settings.angleMode,
      variables: { ...this.state.memory.variables, M: this.state.memory.independentMemory },
      ans: this.state.memory.ans,
    })
  }

  private evaluateExpression(): void {
    if (!this.state.expression.trim()) return
    try {
      const value = evaluate(this.state.expression, this.buildContext())
      const formatted = formattedToPlainText(formatValue(value, { preferFraction: this.state.settings.fractionDisplay === 'mixed' }))
      const entry: HistoryEntry = createHistoryEntry(this.state.expression, formatted)
      this.state = {
        ...this.state,
        result: formatted,
        error: null,
        memory: {
          ...this.state.memory,
          ans: value,
          history: [...this.state.memory.history, entry].slice(-50),
        },
      }
      this.resultShown = true
      this.historyIndex = null
    } catch (err) {
      if (err instanceof MathError) {
        this.state = { ...this.state, error: { code: err.code, message: err.message }, result: null }
      } else {
        this.state = { ...this.state, error: { code: 'MathError', message: 'Unexpected error' }, result: null }
      }
    }
  }

  private applyToMemory(combine: (mem: CalcValue, val: CalcValue) => CalcValue): void {
    let value: CalcValue
    try {
      value = this.resultShown && this.state.result !== null ? this.state.memory.ans : evaluate(this.state.expression || '0', this.buildContext())
    } catch {
      return
    }
    this.state = {
      ...this.state,
      memory: { ...this.state.memory, independentMemory: combine(this.state.memory.independentMemory, value) },
    }
  }

  private storeToVariable(letter: string): void {
    const value = this.resultShown ? this.state.memory.ans : (() => {
      try {
        return evaluate(this.state.expression || '0', this.buildContext())
      } catch {
        return this.state.memory.ans
      }
    })()
    if (letter === 'M') {
      this.state = { ...this.state, memory: { ...this.state.memory, independentMemory: value } }
    } else {
      this.state = { ...this.state, memory: { ...this.state.memory, variables: { ...this.state.memory.variables, [letter]: value } } }
    }
  }

  setAngleMode(mode: AngleMode): void {
    this.state = { ...this.state, settings: { ...this.state.settings, angleMode: mode } }
    this.notify()
  }

  getDisplay(): CalculatorDisplayState {
    if (this.state.menu.open) {
      return {
        kind: 'text',
        lines: this.state.menu.items.map((item, i) => `${i === this.state.menu.selectedIndex ? '▸' : ' '} ${item.label}`),
        cursorLine: null,
        cursorCol: null,
        indicators: this.indicators(),
        errorMessage: null,
      }
    }
    const lines = [this.state.expression || '0']
    if (this.state.result !== null) lines.push(`= ${this.state.result}`)
    return {
      kind: 'text',
      lines,
      cursorLine: this.state.result === null ? 0 : null,
      cursorCol: this.state.result === null ? this.state.cursorPos : null,
      indicators: this.indicators(),
      errorMessage: this.state.error ? `${this.state.error.code}: ${this.state.error.message}` : null,
    }
  }

  private indicators(): DisplayIndicator[] {
    const mem = this.state.memory.independentMemory
    const memoryActive = mem.kind === 'rational' ? mem.num !== 0n : !mem.value.isZero()
    return [
      { id: 'SHIFT', label: 'S', active: this.state.shift },
      { id: 'ALPHA', label: 'A', active: this.state.alpha },
      { id: 'STO', label: 'STO', active: this.pendingStore },
      { id: 'M', label: 'M', active: memoryActive },
      { id: 'DEG', label: 'D', active: this.state.settings.angleMode === 'DEG' },
      { id: 'RAD', label: 'R', active: this.state.settings.angleMode === 'RAD' },
      { id: 'GRAD', label: 'G', active: this.state.settings.angleMode === 'GRAD' },
    ]
  }
}
