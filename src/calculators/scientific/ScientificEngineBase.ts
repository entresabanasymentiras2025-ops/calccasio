import { BaseCalculatorEngine } from '../core/CalculatorEngine'
import type { CalculatorState, MenuItem } from '../core/CalculatorState'
import { closedMenu } from '../core/CalculatorState'
import type { CalculatorDisplayState, DisplayIndicator } from '../core/CalculatorDisplay'
import { createHistoryEntry } from '../core/CalculatorMemory'
import type { KeyAction, KeyboardLayout } from '../core/CalculatorKeyboard'
import { resolveKeyAction } from '../core/CalculatorKeyboard'
import { openMenu, navigateMenu, selectMenuItem, menuBack, closeMenu, renderMenuLines } from '../core/Menu'
import { evaluate, createContext, type EvalContext } from '../../math/parser/evaluator'
import { fromInt, add, sub, MathError, fromDecimal, Decimal, toNumber, type CalcValue } from '../../math/arithmetic/value'
import { evaluateComplex, formatComplex } from '../../math/complex/complexEvaluator'
import type { Complex } from '../../math/complex/complex'
import { evaluateBaseN, formatBaseN, type Radix } from '../../math/baseN/baseN'
import type { AngleMode } from '../../math/trigonometry/trig'
import type { CalculatorCapabilities, CalculatorModelConfig } from '../../models/types'
import { type FormNode, type FormEnv, type FormState, type AppletInput, initialFormState, stepForm, renderForm } from '../shared/FormApplet'
import { formatCalcValue, formatReal } from '../shared/formatNumber'
import { logger } from '../../utils/logger'

export type ScientificModeKind = 'expression' | 'complex' | 'baseN' | 'form' | 'custom'

export interface ScientificModeDef {
  id: string
  label: string
  /** Capability flag the model must declare for this mode to be offered at all. */
  capability: keyof CalculatorCapabilities | null
  kind: ScientificModeKind
  form?: () => FormNode
}

export interface ScientificProfile {
  /** Title of the mode-selection menu ("HOME", "MENU", "MODE"). */
  modeMenuTitle: string
  /** Numbered menus (1:COMP 2:CMPLX ...) as on ES PLUS / MS, or pointer lists. */
  numberedMenus: boolean
  displayRows: number
  /** Formats an internal error code for this family's LCD. */
  errorText(code: string, message: string): string
  modes: ScientificModeDef[]
}

interface SciModeState extends Record<string, unknown> {
  form?: FormState
  radix?: Radix
  complexAns?: Complex
  sdToggle?: boolean
}

const VARIABLE_LETTERS = new Set(['A', 'B', 'C', 'D', 'E', 'F', 'X', 'Y', 'M'])

/**
 * Shared infrastructure for character-display scientific calculators.
 * It owns the expression editor, SHIFT/ALPHA handling, memory/variables,
 * history, SETUP, OPTN and dispatch into per-mode applets. Families
 * (ClassWiz, ES PLUS, MS) subclass it with their own profile, keyboard
 * layout and family-specific overrides (e.g. MS's SD data entry), so the
 * families share math and plumbing but not their interaction details.
 */
export abstract class ScientificEngineBase extends BaseCalculatorEngine<CalculatorState> {
  protected readonly config: CalculatorModelConfig
  protected pendingStore = false
  private historyIndex: number | null = null

  constructor(config: CalculatorModelConfig, layout: KeyboardLayout) {
    super(config.id, layout)
    this.config = config
  }

  protected abstract get profile(): ScientificProfile

  /** Modes this model actually supports (capability-filtered). */
  availableModes(): ScientificModeDef[] {
    return this.profile.modes.filter((m) => m.capability === null || this.config.capabilities[m.capability])
  }

  initialize(): CalculatorState {
    return {
      modelId: this.modelId,
      mode: 'COMP',
      expression: '',
      result: null,
      cursorPos: 0,
      shift: false,
      alpha: false,
      memory: { variables: {}, ans: fromInt(0), independentMemory: fromInt(0), history: [] },
      menu: closedMenu(),
      settings: { angleMode: 'DEG', displayDigits: 10, fractionDisplay: 'mixed', numberFormat: { kind: 'norm' }, complexFormat: 'rect' },
      error: null,
      modeState: {},
    }
  }

  protected get modeState(): SciModeState {
    return (this.state.modeState ?? {}) as SciModeState
  }

  protected setModeState(patch: Partial<SciModeState>): void {
    this.state = { ...this.state, modeState: { ...this.modeState, ...patch } }
  }

  protected currentMode(): ScientificModeDef {
    return this.availableModes().find((m) => m.id === this.state.mode) ?? this.availableModes()[0]
  }

  // ---------------------------------------------------------------- keys

  protected handleKeyId(keyId: string): void {
    const key = this.keyboardLayout.keys.find((k) => k.id === keyId)
    if (!key) return
    const action = resolveKeyAction(key, this.state.shift, this.state.alpha)
    logger.debug('key', keyId, action)
    const isModifierToggle = action.action === 'SHIFT' || action.action === 'ALPHA'

    if (this.state.menu.open && !isModifierToggle) {
      this.handleMenuKey(action, keyId)
      this.clearModifiers()
      return
    }

    if (this.pendingStore && !isModifierToggle) {
      this.pendingStore = false
      if (action.insert && VARIABLE_LETTERS.has(action.insert)) {
        this.storeToVariable(action.insert)
        this.clearModifiers()
        return
      }
    }

    if (action.action === 'SHIFT') {
      this.state = { ...this.state, shift: !this.state.shift, alpha: false }
      return
    }
    if (action.action === 'ALPHA') {
      this.state = { ...this.state, alpha: !this.state.alpha, shift: false }
      return
    }

    this.dispatch(action)
    this.clearModifiers()
  }

  private clearModifiers(): void {
    if (this.state.shift || this.state.alpha) this.state = { ...this.state, shift: false, alpha: false }
  }

  /** Routes a resolved key action. Subclasses may intercept family-specific actions first. */
  protected dispatch(action: KeyAction): void {
    if (action.action && this.handleGlobalAction(action.action)) return
    const mode = this.currentMode()
    if (mode.kind === 'form' && mode.form) {
      this.dispatchForm(mode.form(), action)
      return
    }
    if (action.action) this.handleExpressionAction(action.action)
    else if (action.insert !== undefined) this.handleInsert(action.insert)
  }

  /** Actions that behave the same in every mode. Returns true when handled. */
  protected handleGlobalAction(action: string): boolean {
    switch (action) {
      case 'MODE':
        this.openModeMenu()
        return true
      case 'SETUP':
        this.state = { ...this.state, menu: openMenu(this.setupMenu(), 'SETUP') }
        return true
      case 'OPTN':
        this.state = { ...this.state, menu: openMenu(this.optionsMenu(), 'OPTN') }
        return true
      case 'MEMORY_CLEAR':
        this.state = { ...this.state, memory: { ...this.state.memory, independentMemory: fromInt(0) } }
        return true
      case 'STO':
        this.pendingStore = true
        return true
    }
    return false
  }

  // ---------------------------------------------------------------- menus

  protected openModeMenu(): void {
    const items: MenuItem[] = this.availableModes().map((m) => ({ id: m.id, label: m.label, action: `mode:${m.id}` }))
    const menu = openMenu(items, this.profile.modeMenuTitle)
    const current = items.findIndex((i) => i.id === this.state.mode)
    this.state = { ...this.state, menu: { ...menu, selectedIndex: Math.max(0, current) } }
  }

  protected setupMenu(): MenuItem[] {
    const fixDigits = Array.from({ length: 10 }, (_, d) => ({ id: `fix${d}`, label: `Fix ${d}`, action: `fmt:fix:${d}` }))
    const sciDigits = Array.from({ length: 10 }, (_, d) => ({ id: `sci${d + 1}`, label: `Sci ${d + 1}`, action: `fmt:sci:${d + 1}` }))
    const items: MenuItem[] = [
      {
        id: 'angle',
        label: 'Angle Unit',
        children: [
          { id: 'deg', label: 'Degree', action: 'angle:DEG' },
          { id: 'rad', label: 'Radian', action: 'angle:RAD' },
          { id: 'gra', label: 'Gradian', action: 'angle:GRAD' },
        ],
      },
      {
        id: 'numfmt',
        label: 'Number Format',
        children: [{ id: 'norm', label: 'Norm', action: 'fmt:norm' }, { id: 'fix', label: 'Fix', children: fixDigits }, { id: 'sci', label: 'Sci', children: sciDigits }],
      },
    ]
    if (this.config.capabilities.fractions) {
      items.push({
        id: 'frac',
        label: 'Fraction Result',
        children: [
          { id: 'mixed', label: 'ab/c', action: 'frac:mixed' },
          { id: 'improper', label: 'd/c', action: 'frac:improper' },
          { id: 'decimal', label: 'Decimal', action: 'frac:decimal' },
        ],
      })
    }
    if (this.config.capabilities.complex) {
      items.push({
        id: 'cplx',
        label: 'Complex Result',
        children: [
          { id: 'rect', label: 'a+bi', action: 'cplx:rect' },
          { id: 'polar', label: 'r∠θ', action: 'cplx:polar' },
        ],
      })
    }
    return items
  }

  protected optionsMenu(): MenuItem[] {
    const ins = (label: string, text: string): MenuItem => ({ id: label, label, action: `insert:${text}` })
    const mode = this.currentMode()
    if (mode.kind === 'baseN') {
      return [
        ins('DEC', '§DEC'),
        ins('HEX', '§HEX'),
        ins('BIN', '§BIN'),
        ins('OCT', '§OCT'),
        { id: 'logic', label: 'Logic', children: [ins('and', ' and '), ins('or', ' or '), ins('xor', ' xor '), ins('xnor', ' xnor '), ins('Not(', 'not '), ins('Neg(', 'neg ')] },
      ]
    }
    if (mode.kind === 'complex') {
      return [ins('Argument', 'arg('), ins('Conjugate', 'conj('), ins('Real Part', 're('), ins('Imag Part', 'im('), ins('Polar r∠θ', 'polar('), ins('i', 'i')]
    }
    const items: MenuItem[] = [
      {
        id: 'hyp',
        label: 'Hyperbolic',
        children: [ins('sinh', 'sinh('), ins('cosh', 'cosh('), ins('tanh', 'tanh('), ins('sinh⁻¹', 'asinh('), ins('cosh⁻¹', 'acosh('), ins('tanh⁻¹', 'atanh(')],
      },
      {
        id: 'num',
        label: 'Numeric Calc',
        children: [ins('Abs', 'abs('), ins('Int', 'int('), ins('Intg', 'intg('), ins('Rnd', 'rnd('), ins('GCD', 'gcd('), ins('LCM', 'lcm(')],
      },
      { id: 'prob', label: 'Probability', children: [ins('nPr', 'nPr('), ins('nCr', 'nCr('), ins('x!', '!')] },
    ]
    if (this.config.capabilities.calculus) {
      items.push({ id: 'calc', label: 'Calculus', children: [ins('d/dx', 'd/dx('), ins('∫dx', '∫('), ins('Σ', 'Σ('), ins('Π', 'Π(')] })
    }
    return items
  }

  private handleMenuKey(action: KeyAction, keyId: string): void {
    const menu = this.state.menu
    const nav = action.action
    if (nav === 'NAV_UP' || nav === 'NAV_DOWN' || nav === 'NAV_LEFT' || nav === 'NAV_RIGHT') {
      const dir = nav.slice(4).toLowerCase() as 'up' | 'down' | 'left' | 'right'
      this.state = { ...this.state, menu: navigateMenu(menu, dir) }
      return
    }
    if (nav === 'CLEAR' || nav === 'BACKSPACE' || keyId === 'ON') {
      this.state = { ...this.state, menu: menuBack(menu) }
      return
    }
    if (nav === 'MODE') {
      this.state = { ...this.state, menu: closeMenu(menu) }
      return
    }
    let shortcut: number | undefined
    if (action.insert && /^[1-9]$/.test(action.insert)) shortcut = Number(action.insert)
    if (nav !== 'ENTER' && shortcut === undefined) return
    const sel = selectMenuItem(menu, shortcut)
    if (!sel.action) {
      this.state = { ...this.state, menu: sel.state }
      return
    }
    this.state = { ...this.state, menu: closeMenu(sel.state) }
    this.performMenuAction(sel.action)
  }

  protected performMenuAction(action: string): void {
    const [kind, ...rest] = action.split(':')
    const arg = rest.join(':')
    switch (kind) {
      case 'mode':
        this.switchMode(arg)
        return
      case 'angle':
        this.setAngleMode(arg as AngleMode)
        return
      case 'frac':
        this.state = { ...this.state, settings: { ...this.state.settings, fractionDisplay: arg as 'mixed' | 'improper' | 'decimal' } }
        this.refreshResult()
        return
      case 'cplx':
        this.state = { ...this.state, settings: { ...this.state.settings, complexFormat: arg as 'rect' | 'polar' } }
        return
      case 'fmt': {
        const [f, d] = arg.split(':')
        const numberFormat = f === 'norm' ? { kind: 'norm' as const } : { kind: f as 'fix' | 'sci', digits: Number(d) }
        this.state = { ...this.state, settings: { ...this.state.settings, numberFormat } }
        this.refreshResult()
        return
      }
      case 'insert':
        if (arg.startsWith('§')) {
          this.setModeState({ radix: arg.slice(1) as Radix })
          this.refreshBaseNResult()
          return
        }
        this.handleInsert(arg)
        return
    }
  }

  protected switchMode(id: string): void {
    const mode = this.availableModes().find((m) => m.id === id)
    if (!mode) {
      this.state = { ...this.state, error: { code: 'ModeError', message: `${id} is not available on ${this.config.name}` } }
      return
    }
    this.historyIndex = null
    this.state = {
      ...this.state,
      mode: id,
      expression: '',
      cursorPos: 0,
      result: null,
      error: null,
      modeState: { ...this.modeState, form: initialFormState(), radix: this.modeState.radix ?? 'DEC' },
    }
  }

  // ---------------------------------------------------------------- forms

  protected formEnv(): FormEnv {
    return {
      num: (text) => {
        const v = evaluate(text, this.buildContext())
        return toNumber(v)
      },
      fn: (text) => {
        // Validate once so syntax errors surface on commit, not per-sample.
        const ctx = this.buildContext()
        return (x: number) => toNumber(evaluate(text, { ...ctx, variables: { ...ctx.variables, X: fromDecimal(new Decimal(x)) } }))
      },
      fmt: (x) => formatReal(x, this.state.settings),
    }
  }

  protected toAppletInput(action: KeyAction): AppletInput | null {
    if (action.action) {
      const a = action.action
      if (['ENTER', 'CLEAR', 'BACKSPACE', 'DELETE', 'NAV_UP', 'NAV_DOWN', 'NAV_LEFT', 'NAV_RIGHT', 'SOLVE'].includes(a)) {
        return { type: 'action', action: a as Extract<AppletInput, { type: 'action' }>['action'] }
      }
      return null
    }
    if (action.insert !== undefined) return { type: 'insert', text: action.insert }
    return null
  }

  protected dispatchForm(root: FormNode, action: KeyAction): void {
    if (action.action === 'MEMORY_RECALL') action = { insert: 'M', label: 'M' }
    const input = this.toAppletInput(action)
    if (!input) return
    const outcome = stepForm(root, this.modeState.form ?? initialFormState(), input, this.formEnv())
    this.setModeState({ form: outcome.state })
    if (outcome.ans !== undefined && Number.isFinite(outcome.ans)) {
      this.state = { ...this.state, memory: { ...this.state.memory, ans: fromDecimal(new Decimal(outcome.ans)) } }
    }
  }

  // ---------------------------------------------------------------- expression editing

  protected handleExpressionAction(action: string): void {
    switch (action) {
      case 'CLEAR':
        this.state = { ...this.state, expression: '', cursorPos: 0, result: null, error: null }
        this.historyIndex = null
        return
      case 'BACKSPACE':
        if (this.state.error) {
          this.state = { ...this.state, error: null }
          return
        }
        if (this.state.result !== null) {
          this.state = { ...this.state, result: null }
          return
        }
        if (this.state.cursorPos > 0) {
          const expr = this.state.expression
          const cut = this.tokenLengthBefore(expr, this.state.cursorPos)
          this.state = {
            ...this.state,
            expression: expr.slice(0, this.state.cursorPos - cut) + expr.slice(this.state.cursorPos),
            cursorPos: this.state.cursorPos - cut,
          }
        }
        return
      case 'DELETE':
        if (this.state.cursorPos < this.state.expression.length) {
          const expr = this.state.expression
          this.state = { ...this.state, expression: expr.slice(0, this.state.cursorPos) + expr.slice(this.state.cursorPos + 1) }
        }
        return
      case 'NAV_LEFT':
        if (this.state.error) {
          this.state = { ...this.state, error: null }
          return
        }
        if (this.state.result !== null) {
          // Replay: edit the previous expression from its end.
          this.state = { ...this.state, result: null, cursorPos: this.state.expression.length }
          return
        }
        this.state = { ...this.state, cursorPos: Math.max(0, this.state.cursorPos - 1) }
        return
      case 'NAV_RIGHT':
        if (this.state.error) {
          this.state = { ...this.state, error: null }
          return
        }
        if (this.state.result !== null) {
          this.state = { ...this.state, result: null, cursorPos: 0 }
          return
        }
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
        this.applyToMemory((m, v) => add(m, v))
        return
      case 'MEMORY_SUB':
        this.applyToMemory((m, v) => sub(m, v))
        return
      case 'MEMORY_RECALL':
        this.handleInsert('M')
        return
      case 'SD':
        this.toggleSD()
        return
    }
  }

  /** Deletes whole function names ("sin(") at once, like the hardware does. */
  private tokenLengthBefore(expr: string, pos: number): number {
    const before = expr.slice(0, pos)
    const m = /(asinh\(|acosh\(|atanh\(|sinh\(|cosh\(|tanh\(|asin\(|acos\(|atan\(|sin\(|cos\(|tan\(|log\(|ln\(|exp\(|10\^\(|d\/dx\(|abs\(|arg\(|conj\(|polar\(|nCr\(|nPr\(|gcd\(|lcm\(|intg\(|int\(|rnd\(|Ans|re\(|im\( | and | or | xor | xnor |not |neg )$/.exec(before)
    return m ? m[0].length : 1
  }

  protected handleInsert(text: string): void {
    if (this.state.error) this.state = { ...this.state, expression: '', cursorPos: 0, error: null }
    let { expression, cursorPos } = this.state
    let result = this.state.result
    if (result !== null) {
      const continues = ['+', '-', '*', '/', '^', '²', '³', '⁻¹', '!', '%'].includes(text) || text.startsWith(' ')
      expression = continues ? 'Ans' : ''
      cursorPos = expression.length
      result = null
    }
    expression = expression.slice(0, cursorPos) + text + expression.slice(cursorPos)
    cursorPos += text.length
    if (expression.length > 199) {
      this.state = { ...this.state, error: { code: 'MemoryError', message: 'Input too long (max 199 characters)' } }
      return
    }
    this.state = { ...this.state, expression, cursorPos, result }
    this.historyIndex = null
  }

  private browseHistory(direction: 1 | -1): void {
    const history = this.state.memory.history.filter((h) => (h.mode ?? 'COMP') === this.state.mode)
    if (history.length === 0) return
    if (this.historyIndex === null) {
      if (direction === 1) return
      this.historyIndex = history.length - 1
    } else {
      this.historyIndex += direction
    }
    if (this.historyIndex < 0) this.historyIndex = 0
    if (this.historyIndex >= history.length) {
      this.historyIndex = null
      this.state = { ...this.state, expression: '', cursorPos: 0, result: null }
      return
    }
    const entry = history[this.historyIndex]
    this.state = { ...this.state, expression: entry.input, cursorPos: entry.input.length, result: entry.result }
  }

  protected buildContext(): EvalContext {
    return createContext({
      angleMode: this.state.settings.angleMode,
      variables: { ...this.state.memory.variables, M: this.state.memory.independentMemory },
      ans: this.state.memory.ans,
    })
  }

  /** Hook so families can pre-process their own input syntax (e.g. MS's a⌟b⌟c fractions). */
  protected preprocess(expression: string): string {
    return expression
  }

  protected formatResult(value: CalcValue): string {
    return formatCalcValue(value, this.state.settings)
  }

  protected evaluateExpression(): void {
    const raw = this.state.expression
    if (!raw.trim()) return
    const mode = this.currentMode()
    try {
      let formatted: string
      let ans: CalcValue = this.state.memory.ans
      if (mode.kind === 'complex') {
        const z = evaluateComplex(this.preprocess(raw), {
          angleMode: this.state.settings.angleMode,
          variables: { ...this.state.memory.variables, M: this.state.memory.independentMemory },
          ans: this.modeState.complexAns ?? { re: toNumber(this.state.memory.ans), im: 0 },
        })
        if (!Number.isFinite(z.re) || !Number.isFinite(z.im)) throw new MathError('MathError', 'Result out of range')
        formatted = formatComplex(z, this.state.settings.complexFormat ?? 'rect', this.state.settings.angleMode)
        this.setModeState({ complexAns: z })
        ans = fromDecimal(new Decimal(z.re))
      } else if (mode.kind === 'baseN') {
        const radix = this.modeState.radix ?? 'DEC'
        const v = evaluateBaseN(raw, radix)
        formatted = formatBaseN(v, radix)
        ans = fromInt(v)
      } else {
        const value = evaluate(this.preprocess(raw), this.buildContext())
        formatted = this.formatResult(value)
        ans = value
      }
      const entry = { ...createHistoryEntry(raw, formatted), mode: this.state.mode }
      this.state = {
        ...this.state,
        result: formatted,
        error: null,
        memory: { ...this.state.memory, ans, history: [...this.state.memory.history, entry].slice(-100) },
        modeState: { ...this.modeState, sdToggle: false },
      }
      this.historyIndex = null
    } catch (err) {
      const e = err instanceof MathError ? err : new MathError('MathError', 'Unexpected error')
      logger.info('evaluation error', e.code, e.message)
      this.state = { ...this.state, error: { code: e.code, message: e.message }, result: null }
    }
  }

  private refreshResult(): void {
    if (this.state.result === null || this.currentMode().kind !== 'expression') return
    this.state = { ...this.state, result: this.formatResult(this.state.memory.ans) }
  }

  private refreshBaseNResult(): void {
    if (this.state.result === null) return
    const v = this.state.memory.ans
    if (v.kind === 'rational' && v.den === 1n) this.state = { ...this.state, result: formatBaseN(v.num, this.modeState.radix ?? 'DEC') }
  }

  /** S⇔D: toggles the shown result between exact (fraction) and decimal form. */
  private toggleSD(): void {
    if (this.state.result === null || this.currentMode().kind !== 'expression') return
    const sd = !this.modeState.sdToggle
    const settings = { ...this.state.settings, fractionDisplay: sd ? ('decimal' as const) : this.state.settings.fractionDisplay === 'decimal' ? ('mixed' as const) : this.state.settings.fractionDisplay }
    this.state = { ...this.state, result: formatCalcValue(this.state.memory.ans, settings), modeState: { ...this.modeState, sdToggle: sd } }
  }

  private applyToMemory(combine: (mem: CalcValue, val: CalcValue) => CalcValue): void {
    let value: CalcValue
    try {
      if (this.state.result !== null) value = this.state.memory.ans
      else {
        value = evaluate(this.preprocess(this.state.expression || '0'), this.buildContext())
        this.state = { ...this.state, result: this.formatResult(value), memory: { ...this.state.memory, ans: value } }
      }
    } catch (err) {
      const e = err instanceof MathError ? err : new MathError('MathError', 'Unexpected error')
      this.state = { ...this.state, error: { code: e.code, message: e.message } }
      return
    }
    this.state = { ...this.state, memory: { ...this.state.memory, independentMemory: combine(this.state.memory.independentMemory, value) } }
  }

  private storeToVariable(letter: string): void {
    let value = this.state.memory.ans
    if (this.state.result === null && this.state.expression.trim()) {
      try {
        value = evaluate(this.preprocess(this.state.expression), this.buildContext())
        this.state = { ...this.state, result: this.formatResult(value), memory: { ...this.state.memory, ans: value } }
      } catch (err) {
        const e = err instanceof MathError ? err : new MathError('MathError', 'Unexpected error')
        this.state = { ...this.state, error: { code: e.code, message: e.message } }
        return
      }
    }
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

  // ---------------------------------------------------------------- display

  getDisplay(): CalculatorDisplayState {
    const rows = this.profile.displayRows
    const errorMessage = this.state.error ? this.profile.errorText(this.state.error.code, this.state.error.message) : null
    if (this.state.menu.open) {
      const r = renderMenuLines(this.state.menu, { numbered: this.profile.numberedMenus, maxLines: Math.max(rows, 4) })
      return {
        kind: 'text',
        title: this.state.menu.path.join(' › '),
        lines: r.lines,
        highlightLine: r.selectedLine,
        cursorLine: null,
        cursorCol: null,
        indicators: this.indicators(),
        errorMessage: null,
        align: 'left',
      }
    }
    const mode = this.currentMode()
    if (mode.kind === 'form' && mode.form) {
      const r = renderForm(mode.form(), this.modeState.form ?? initialFormState(), Math.max(rows, 4))
      return {
        kind: 'text',
        title: `${mode.label} · ${r.title}`,
        lines: r.lines,
        highlightLine: r.highlightLine,
        cursorLine: r.cursorLine,
        cursorCol: r.cursorCol,
        indicators: this.indicators(),
        errorMessage: r.error ? this.profile.errorText(r.error.code, r.error.message) : errorMessage,
        align: 'left',
      }
    }
    const lines = [this.state.expression || (this.state.result === null ? '0' : '')]
    if (this.state.result !== null) lines.push(`= ${this.state.result}`)
    const title = mode.kind === 'baseN' ? `${mode.label} · ${this.modeState.radix ?? 'DEC'}` : mode.id === 'COMP' ? undefined : mode.label
    return {
      kind: 'text',
      title,
      lines,
      cursorLine: this.state.result === null ? 0 : null,
      cursorCol: this.state.result === null ? this.state.cursorPos : null,
      indicators: this.indicators(),
      errorMessage,
      align: 'mixed',
    }
  }

  protected indicators(): DisplayIndicator[] {
    const mem = this.state.memory.independentMemory
    const memoryActive = mem.kind === 'rational' ? mem.num !== 0n : !mem.value.isZero()
    const nf = this.state.settings.numberFormat
    return [
      { id: 'SHIFT', label: 'S', active: this.state.shift },
      { id: 'ALPHA', label: 'A', active: this.state.alpha },
      { id: 'STO', label: 'STO', active: this.pendingStore },
      { id: 'M', label: 'M', active: memoryActive },
      { id: 'DEG', label: 'D', active: this.state.settings.angleMode === 'DEG' },
      { id: 'RAD', label: 'R', active: this.state.settings.angleMode === 'RAD' },
      { id: 'GRAD', label: 'G', active: this.state.settings.angleMode === 'GRAD' },
      { id: 'FIX', label: 'FIX', active: nf?.kind === 'fix' },
      { id: 'SCI', label: 'SCI', active: nf?.kind === 'sci' },
      { id: 'CMPLX', label: 'i', active: this.currentMode().kind === 'complex' },
    ]
  }
}
