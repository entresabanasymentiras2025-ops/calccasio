import { BaseCalculatorEngine } from '../core/CalculatorEngine'
import type { CalculatorState } from '../core/CalculatorState'
import { closedMenu } from '../core/CalculatorState'
import type { CalculatorEvent } from '../core/CalculatorEvent'
import type { CalculatorDisplayState, Viewport } from '../core/CalculatorDisplay'
import { createHistoryEntry } from '../core/CalculatorMemory'
import { classPadKeyboardLayout } from './ClassPadKeyboard'
import { layoutFor, registerKeyboardLayout } from '../registry'
import type { CalculatorModelConfig } from '../../models/types'
import { MathError, fromInt } from '../../math/arithmetic/value'
import { evaluateCas, toSym, type CasContext } from '../../math/symbolic/cas'
import { type Sym, approx } from '../../math/symbolic/expr'
import { simplify } from '../../math/symbolic/simplify'
import { parse } from '../../math/parser/parser'
import { sampleCurve, zoom, pan, STANDARD_VIEWPORT } from '../graphing/plot'

registerKeyboardLayout(classPadKeyboardLayout)

type App = 'main' | 'graph'

interface Doc {
  app: App
  entries: Array<{ input: string; output: string; error?: boolean }>
  editing: string
  cursor: number
  kbTab: string
  vars: Record<string, Sym>
  ans: Sym | null
  fns: string[]
  viewport: Viewport
}

const SOFT_KEYS: Record<string, Array<[string, string]>> = {
  math: [
    ['√', '√('],
    ['^2', '^2'],
    ['x', 'x'],
    ['π', 'π'],
    ['e', 'e'],
    ['ln', 'ln('],
    ['log', 'log('],
    ['=', '='],
    ['(', '('],
    [')', ')'],
    [',', ','],
    ['ans', 'Ans'],
  ],
  trig: [
    ['sin', 'sin('],
    ['cos', 'cos('],
    ['tan', 'tan('],
    ['sin⁻¹', 'asin('],
    ['cos⁻¹', 'acos('],
    ['tan⁻¹', 'atan('],
    ['sinh', 'sinh('],
    ['cosh', 'cosh('],
    ['tanh', 'tanh('],
    ['|x|', 'abs('],
    ['!', '!'],
    ['exp', 'exp('],
  ],
  calc: [
    ['simplify(', 'simplify('],
    ['expand(', 'expand('],
    ['factor(', 'factor('],
    ['solve(', 'solve('],
    ['diff(', 'diff('],
    ['∫(', 'integrate('],
    ['approx(', 'approx('],
    ['subst(', 'subst('],
    [':=', ':='],
    ['x', 'x'],
    [',', ','],
    [')', ')'],
  ],
  abc: [...'abcdefghijklmnopqrstuvwxyz'].map((c) => [c, c] as [string, string]),
}
const TABS = [
  { id: 'math', label: 'Math' },
  { id: 'trig', label: 'Trig' },
  { id: 'calc', label: 'Action' },
  { id: 'abc', label: 'abc' },
]

/**
 * ClassPad engine (fx-CP400 / fx-CG500): a touch-first document model
 * rather than a key-driven state machine. The Main app is a CAS work area
 * (input → exact symbolic output) backed by src/math/symbolic; the Graph
 * app plots functions with touch pan/zoom. Interaction arrives mostly as
 * TOUCH events (toolbar, soft keyboard, history taps) and TEXT_INPUT from
 * the editable input line, plus the hardware keys below the screen.
 */
export class ClassPadEngine extends BaseCalculatorEngine<CalculatorState> {
  protected readonly config: CalculatorModelConfig

  constructor(config: CalculatorModelConfig) {
    super(config.id, layoutFor(config, classPadKeyboardLayout))
    this.config = config
  }

  initialize(): CalculatorState {
    const doc: Doc = { app: 'main', entries: [], editing: '', cursor: 0, kbTab: 'math', vars: {}, ans: null, fns: ['x^2-2', 'sin(x)'], viewport: { ...STANDARD_VIEWPORT } }
    return {
      modelId: this.modelId,
      mode: 'main',
      expression: '',
      result: null,
      cursorPos: 0,
      shift: false,
      alpha: false,
      memory: { variables: {}, ans: fromInt(0), independentMemory: fromInt(0), history: [] },
      menu: closedMenu(),
      settings: { angleMode: 'RAD', displayDigits: 10, fractionDisplay: 'mixed' },
      error: null,
      documentState: doc as unknown as Record<string, unknown>,
    }
  }

  private get doc(): Doc {
    return this.state.documentState as unknown as Doc
  }

  private set doc(d: Doc) {
    this.state = { ...this.state, documentState: d as unknown as Record<string, unknown>, mode: d.app, expression: d.editing, cursorPos: d.cursor }
  }

  private patch(p: Partial<Doc>): void {
    this.doc = { ...this.doc, ...p }
  }

  execute(event: CalculatorEvent): void {
    if (event.type === 'TEXT_INPUT' && typeof event.payload === 'string') {
      const text = event.payload.slice(0, 500)
      this.patch({ editing: text, cursor: text.length })
      this.state = { ...this.state, error: null }
      this.notify()
      return
    }
    if (event.type === 'TOUCH' && event.payload && typeof (event.payload as { target?: unknown }).target === 'string') {
      this.touch((event.payload as { target: string }).target)
      this.notify()
      return
    }
    super.execute(event)
  }

  protected handleKeyId(keyId: string): void {
    const key = this.keyboardLayout.keys.find((k) => k.id === keyId)
    if (!key) return
    const a = key.primary.action
    if (a) this.action(a)
    else if (key.primary.insert !== undefined) this.insert(key.primary.insert)
  }

  private action(a: string): void {
    const d = this.doc
    switch (a) {
      case 'ENTER':
        return this.run()
      case 'BACKSPACE':
        if (d.cursor > 0) this.patch({ editing: d.editing.slice(0, d.cursor - 1) + d.editing.slice(d.cursor), cursor: d.cursor - 1 })
        return
      case 'CLEAR':
        if (d.editing) this.patch({ editing: '', cursor: 0 })
        else if (d.app === 'main') this.patch({ entries: [] })
        this.state = { ...this.state, error: null }
        return
      case 'NAV_LEFT':
        if (d.app === 'graph' && !d.editing) return this.touch('graph:left')
        return this.patch({ cursor: Math.max(0, d.cursor - 1) })
      case 'NAV_RIGHT':
        if (d.app === 'graph' && !d.editing) return this.touch('graph:right')
        return this.patch({ cursor: Math.min(d.editing.length, d.cursor + 1) })
      case 'NAV_UP': {
        if (d.app === 'graph' && !d.editing) return this.touch('graph:up')
        const last = [...d.entries].reverse().find((e) => !e.error)
        if (last) this.patch({ editing: last.input, cursor: last.input.length })
        return
      }
      case 'NAV_DOWN':
        if (d.app === 'graph' && !d.editing) return this.touch('graph:down')
        return
      case 'KEYBOARD': {
        const i = TABS.findIndex((t) => t.id === d.kbTab)
        return this.patch({ kbTab: TABS[(i + 1) % TABS.length].id })
      }
    }
  }

  private insert(text: string): void {
    const d = this.doc
    const editing = d.editing.slice(0, d.cursor) + text + d.editing.slice(d.cursor)
    if (editing.length > 500) return
    this.state = { ...this.state, error: null }
    this.patch({ editing, cursor: d.cursor + text.length })
  }

  private touch(target: string): void {
    const [kind, ...rest] = target.split(':')
    const arg = rest.join(':')
    const d = this.doc
    switch (kind) {
      case 'app':
        if (arg === 'main' || arg === 'graph') this.patch({ app: arg })
        return
      case 'tab':
        if (TABS.some((t) => t.id === arg)) this.patch({ kbTab: arg })
        return
      case 'insert':
        return this.insert(arg)
      case 'key':
        return this.action(arg)
      case 'entry': {
        const e = d.entries[Number(arg)]
        if (e && !e.error) this.insert(e.output.replace(/\s*\(numeric\)$/, ''))
        return
      }
      case 'tool': {
        // Interactive-style: wrap the current input (or the last result) in a command and run it.
        const source = d.editing.trim() || (d.ans ? 'Ans' : '')
        if (!source) return
        const wrapped = arg === 'solve' || arg === 'diff' || arg === 'integrate' ? `${arg}(${source},x)` : `${arg}(${source})`
        this.patch({ editing: wrapped, cursor: wrapped.length })
        return this.run()
      }
      case 'graph': {
        const vp = d.viewport
        const map: Record<string, Viewport> = {
          zin: zoom(vp, 0.5),
          zout: zoom(vp, 2),
          std: { ...STANDARD_VIEWPORT },
          left: pan(vp, -0.15, 0),
          right: pan(vp, 0.15, 0),
          up: pan(vp, 0, 0.15),
          down: pan(vp, 0, -0.15),
        }
        if (arg === 'clear') return this.patch({ fns: [] })
        if (arg.startsWith('del')) return this.patch({ fns: d.fns.filter((_, i) => i !== Number(arg.slice(3))) })
        if (map[arg]) this.patch({ viewport: map[arg] })
        return
      }
    }
  }

  private casContext(): CasContext {
    // Copy so a failed evaluation never leaves half-applied assignments.
    return { variables: { ...this.doc.vars }, ans: this.doc.ans }
  }

  private run(): void {
    const d = this.doc
    const input = d.editing.trim()
    if (!input) return
    if (d.app === 'graph') {
      try {
        const sym = simplify(toSym(parse(input), { variables: this.doc.vars, ans: this.doc.ans }))
        approx(sym, { x: 0.37 })
        if (d.fns.length >= 6) throw new MathError('MemoryError', 'At most 6 functions')
        this.patch({ fns: [...d.fns, input], editing: '', cursor: 0 })
      } catch (err) {
        this.fail(err)
      }
      return
    }
    const ctx = this.casContext()
    try {
      const r = evaluateCas(input, ctx)
      this.patch({ entries: [...d.entries, { input, output: r.output }].slice(-60), editing: '', cursor: 0, ans: r.value ?? d.ans, vars: ctx.variables })
      this.state = {
        ...this.state,
        error: null,
        memory: { ...this.state.memory, history: [...this.state.memory.history, { ...createHistoryEntry(input, r.output), mode: 'main' }].slice(-100) },
      }
    } catch (err) {
      const e = err instanceof MathError ? err : new MathError('MathError', err instanceof Error ? err.message : 'Error')
      this.patch({ entries: [...d.entries, { input, output: `${e.code}: ${e.message}`, error: true }].slice(-60) })
    }
  }

  private fail(err: unknown): void {
    const e = err instanceof MathError ? err : new MathError('MathError', 'Error')
    this.state = { ...this.state, error: { code: e.code, message: e.message } }
  }

  getDisplay(): CalculatorDisplayState {
    const d = this.doc
    const colors = ['#1d4ed8', '#dc2626', '#16a34a', '#9333ea', '#ea580c', '#0f172a']
    const toolbar =
      d.app === 'main'
        ? [
            { id: 'tool:simplify', label: 'simplify' },
            { id: 'tool:expand', label: 'expand' },
            { id: 'tool:factor', label: 'factor' },
            { id: 'tool:solve', label: 'solve' },
            { id: 'tool:diff', label: 'd/dx' },
            { id: 'tool:integrate', label: '∫dx' },
            { id: 'tool:approx', label: '≈' },
          ]
        : [
            { id: 'graph:zin', label: 'Zoom +' },
            { id: 'graph:zout', label: 'Zoom −' },
            { id: 'graph:std', label: 'Std' },
            { id: 'graph:left', label: '←' },
            { id: 'graph:right', label: '→' },
            { id: 'graph:up', label: '↑' },
            { id: 'graph:down', label: '↓' },
            { id: 'graph:clear', label: 'Clear all' },
          ]
    let graph: Extract<CalculatorDisplayState, { kind: 'document' }>['graph']
    if (d.app === 'graph') {
      const curves = d.fns.flatMap((src, i) => {
        try {
          const s = simplify(toSym(parse(src), { variables: d.vars, ans: d.ans }))
          return [sampleCurve((x) => approx(s, { x }), d.viewport, 320, `y${i + 1}`, colors[i % colors.length])]
        } catch {
          return []
        }
      })
      graph = { type: 'graph', viewport: d.viewport, axes: true, grid: true, curves }
    }
    return {
      kind: 'document',
      app: d.app,
      apps: [
        { id: 'main', label: 'Main' },
        { id: 'graph', label: 'Graph' },
      ],
      toolbar,
      entries: d.app === 'main' ? d.entries : d.fns.map((f, i) => ({ input: `y${i + 1}=${f}`, output: '' })),
      editing: d.editing,
      cursorCol: d.cursor,
      graph,
      indicators: [{ id: 'RAD', label: 'Rad', active: true }],
      status: d.app === 'main' ? 'Alg  Standard  Real  Rad' : 'Graph  Rad',
      errorMessage: this.state.error ? `${this.state.error.code}: ${this.state.error.message}` : null,
      softKeyboard: { tabs: TABS, active: d.kbTab, keys: (SOFT_KEYS[d.kbTab] ?? []).map(([label, ins]) => ({ label, target: `insert:${ins}` })) },
    }
  }
}

export const createClassPadEngine = (config: CalculatorModelConfig) => new ClassPadEngine(config)
