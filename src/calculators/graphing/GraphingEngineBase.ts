import { BaseCalculatorEngine } from '../core/CalculatorEngine'
import type { CalculatorState, MenuItem } from '../core/CalculatorState'
import { closedMenu } from '../core/CalculatorState'
import type { CalculatorEvent } from '../core/CalculatorEvent'
import type { CalculatorDisplayState, DisplayIndicator, ScreenContent, ScreenLine, ScreenProfile, Viewport } from '../core/CalculatorDisplay'
import type { KeyAction, KeyboardLayout } from '../core/CalculatorKeyboard'
import { resolveKeyAction } from '../core/CalculatorKeyboard'
import { openMenu, navigateMenu, selectMenuItem, menuBack, closeMenu, renderMenuLines } from '../core/Menu'
import { createHistoryEntry } from '../core/CalculatorMemory'
import type { CalculatorModelConfig } from '../../models/types'
import { evaluate, createContext } from '../../math/parser/evaluator'
import { MathError, fromInt, fromDecimal, Decimal, toNumber, type CalcValue } from '../../math/arithmetic/value'
import { formatCalcValue, formatReal } from '../shared/formatNumber'
import { type FormNode, type FormState, type FormSpecForm, initialFormState, stepForm, renderForm, type AppletInput } from '../shared/FormApplet'
import { equationMode, matrixMode } from '../shared/scientificModes'
import * as S from '../../math/statistics/statistics'
import { sampleCurve, zoom, pan, autoY, rootsIn, extremum, STANDARD_VIEWPORT, type RealFn } from './plot'
import { parseProgram, runProgram, ProgramError, SAMPLE_PROGRAMS, type VMEvent } from './program/ProgramVM'
import type { AngleMode } from '../../math/trigonometry/trig'

export type AppKind = 'run' | 'stat' | 'graph' | 'table' | 'equa' | 'prgm' | 'matrix'

export interface GraphingAppDef {
  id: string
  label: string
  icon: string
  color: string
  kind: AppKind | null
  /** Not implemented yet: shown disabled with "coming soon". */
  planned?: boolean
}

export interface GraphingProfile {
  screen: ScreenProfile
  apps: GraphingAppDef[]
  menuTitle: string
  menuColumns: number
  /** 'fkeys': commands on F1–F6; 'tools': commands via a TOOLS pop-up menu (no F-keys). */
  softkeyMode: 'fkeys' | 'tools'
  curveColors: string[]
  errorText(code: string, message: string): string
  /** Character rows available for content (excluding status/soft-key bars). */
  rows: number
}

interface Fn {
  expr: string
  on: boolean
}

interface ProgramStore {
  programs: Array<{ name: string; source: string }>
  sel: number
  view: 'list' | 'edit' | 'run'
  output: string[]
  awaiting: { prompt: string; name: string } | null
}

interface StatStore {
  lists: number[][]
  row: number
  col: number
  editing: string | null
  result: string[] | null
  scroll: number
  plot: boolean
}

export interface GState {
  app: string
  menuIndex: number
  run: Array<{ input: string; output: string; error?: boolean }>
  fns: Fn[]
  fnSel: number
  fnEditing: string | null
  view: 'list' | 'plot' | 'table' | 'vwin' | 'tableset'
  sub: 'zoom' | 'gsolv' | 'calc' | null
  viewport: Viewport
  trace: { fn: number; x: number } | null
  info: string[] | null
  grid: boolean
  axes: boolean
  table: { start: number; end: number; step: number; row: number }
  stat: StatStore
  equa: FormState
  matrix: FormState
  settingsForm: FormState
  prgm: ProgramStore
}

type Command = { id: string; label: string }

const FN_COUNT = 6

/**
 * Shared infrastructure for menu-driven graphing calculators: app switcher,
 * RUN calculation history, function list + plotter (trace, zoom, pan,
 * G-Solve), tables, list-based statistics, equation/matrix solvers and the
 * sandboxed program VM. Concrete engines (Graph9860, CG50, CG100) provide
 * their own app catalog, screen profile, keyboard and command surface
 * (F-keys vs a TOOLS menu); nothing here is model-specific.
 */
export abstract class GraphingEngineBase extends BaseCalculatorEngine<CalculatorState> {
  protected readonly config: CalculatorModelConfig
  private vm: Generator<VMEvent, void, number | undefined> | null = null

  constructor(config: CalculatorModelConfig, layout: KeyboardLayout) {
    super(config.id, layout)
    this.config = config
  }

  protected abstract get profile(): GraphingProfile

  initialize(): CalculatorState {
    const g: GState = {
      app: 'MENU',
      menuIndex: 0,
      run: [],
      fns: Array.from({ length: FN_COUNT }, (_, i) => ({ expr: i === 0 ? 'X²-2' : i === 1 ? 'sin(X)' : '', on: i < 2 })),
      fnSel: 0,
      fnEditing: null,
      view: 'list',
      sub: null,
      viewport: { ...STANDARD_VIEWPORT },
      trace: null,
      info: null,
      grid: false,
      axes: true,
      table: { start: -3, end: 3, step: 1, row: 0 },
      stat: { lists: Array.from({ length: 6 }, () => []), row: 0, col: 0, editing: null, result: null, scroll: 0, plot: false },
      equa: initialFormState(),
      matrix: initialFormState(),
      settingsForm: initialFormState(),
      prgm: { programs: SAMPLE_PROGRAMS.map((p) => ({ ...p })), sel: 0, view: 'list', output: [], awaiting: null },
    }
    return {
      modelId: this.modelId,
      mode: 'MENU',
      expression: '',
      result: null,
      cursorPos: 0,
      shift: false,
      alpha: false,
      memory: { variables: {}, ans: fromInt(0), independentMemory: fromInt(0), history: [] },
      menu: closedMenu(),
      settings: { angleMode: 'RAD', displayDigits: 10, fractionDisplay: 'mixed', numberFormat: { kind: 'norm' } },
      error: null,
      graphState: g as unknown as Record<string, unknown>,
    }
  }

  protected get g(): GState {
    return this.state.graphState as unknown as GState
  }

  protected set g(next: GState) {
    this.state = { ...this.state, graphState: next as unknown as Record<string, unknown>, mode: next.app }
  }

  protected patch(p: Partial<GState>): void {
    this.g = { ...this.g, ...p }
  }

  private fail(err: unknown): void {
    const e = err instanceof MathError ? err : err instanceof ProgramError ? new MathError('SyntaxError', err.message) : new MathError('MathError', 'Error')
    this.state = { ...this.state, error: { code: e.code, message: e.message } }
  }

  // ------------------------------------------------------------------ events

  execute(event: CalculatorEvent): void {
    if (event.type === 'TEXT_INPUT' && typeof event.payload === 'string') {
      this.textInput(event.payload)
      this.notify()
      return
    }
    super.execute(event)
  }

  private textInput(text: string): void {
    const p = this.g.prgm
    if (this.g.app !== 'PRGM' || p.view !== 'edit') return
    const source = text.slice(0, 8000)
    const programs = p.programs.map((pr, i) => (i === p.sel ? { ...pr, source } : pr))
    this.patch({ prgm: { ...p, programs } })
  }

  protected handleKeyId(keyId: string): void {
    const key = this.keyboardLayout.keys.find((k) => k.id === keyId)
    if (!key) return
    const action = resolveKeyAction(key, this.state.shift, this.state.alpha)
    if (action.action === 'SHIFT') {
      this.state = { ...this.state, shift: !this.state.shift, alpha: false }
      return
    }
    if (action.action === 'ALPHA') {
      this.state = { ...this.state, alpha: !this.state.alpha, shift: false }
      return
    }
    this.state = { ...this.state, shift: false, alpha: false }

    if (this.state.error) {
      // Any key acknowledges the error message box.
      this.state = { ...this.state, error: null }
      return
    }
    if (this.state.menu.open) {
      this.handleMenu(action)
      return
    }
    const a = action.action
    if (a === 'MENU') {
      this.patch({ app: 'MENU', sub: null })
      return
    }
    if (a === 'SETUP') {
      this.state = { ...this.state, menu: openMenu(this.setupMenu(), 'SETUP') }
      return
    }
    if (a === 'TOOLS') {
      const cmds = this.commands().filter((c) => c.label)
      if (cmds.length) this.state = { ...this.state, menu: openMenu(cmds.map((c) => ({ id: c.id, label: c.label, action: `cmd:${c.id}` })), 'TOOLS') }
      return
    }
    if (a && /^F[1-6]$/.test(a)) {
      const cmd = this.commands()[Number(a.slice(1)) - 1]
      if (cmd && cmd.label) this.runCommand(cmd.id)
      return
    }
    try {
      this.routeToApp(action)
    } catch (err) {
      this.fail(err)
    }
  }

  private handleMenu(action: KeyAction): void {
    const a = action.action
    if (a === 'NAV_UP' || a === 'NAV_DOWN' || a === 'NAV_LEFT' || a === 'NAV_RIGHT') {
      this.state = { ...this.state, menu: navigateMenu(this.state.menu, a.slice(4).toLowerCase() as 'up') }
      return
    }
    if (a === 'EXIT' || a === 'CLEAR' || a === 'BACKSPACE') {
      this.state = { ...this.state, menu: menuBack(this.state.menu) }
      return
    }
    const shortcut = action.insert && /^[1-9]$/.test(action.insert) ? Number(action.insert) : undefined
    if (a !== 'ENTER' && shortcut === undefined) return
    const sel = selectMenuItem(this.state.menu, shortcut)
    if (!sel.action) {
      this.state = { ...this.state, menu: sel.state }
      return
    }
    this.state = { ...this.state, menu: closeMenu(sel.state) }
    const [kind, arg] = sel.action.split(':')
    if (kind === 'cmd') this.runCommand(arg)
    if (kind === 'angle') this.state = { ...this.state, settings: { ...this.state.settings, angleMode: arg as AngleMode } }
    if (kind === 'grid') this.patch({ grid: arg === 'on' })
    if (kind === 'axes') this.patch({ axes: arg === 'on' })
    if (kind === 'frac') this.state = { ...this.state, settings: { ...this.state.settings, fractionDisplay: arg as 'mixed' | 'decimal' } }
  }

  private setupMenu(): MenuItem[] {
    return [
      { id: 'angle', label: 'Angle', children: ['DEG', 'RAD', 'GRAD'].map((m) => ({ id: m, label: m, action: `angle:${m}` })) },
      { id: 'frac', label: 'Frac Result', children: [{ id: 'fr', label: 'a b/c', action: 'frac:mixed' }, { id: 'dec', label: 'Decimal', action: 'frac:decimal' }] },
      { id: 'grid', label: 'Grid', children: [{ id: 'on', label: 'On', action: 'grid:on' }, { id: 'off', label: 'Off', action: 'grid:off' }] },
      { id: 'axes', label: 'Axes', children: [{ id: 'on', label: 'On', action: 'axes:on' }, { id: 'off', label: 'Off', action: 'axes:off' }] },
    ]
  }

  private appDef(): GraphingAppDef | undefined {
    return this.profile.apps.find((a) => a.id === this.g.app)
  }

  private routeToApp(action: KeyAction): void {
    if (this.g.app === 'MENU') return this.menuKey(action)
    const kind = this.appDef()?.kind
    switch (kind) {
      case 'run':
        return this.runKey(action)
      case 'graph':
      case 'table':
        return this.graphKey(action, kind)
      case 'stat':
        return this.statKey(action)
      case 'equa':
        return this.formKey(action, 'equa', () => equationMode(4, 4))
      case 'matrix':
        return this.formKey(action, 'matrix', matrixMode)
      case 'prgm':
        return this.prgmKey(action)
    }
  }

  // ------------------------------------------------------------------ main menu

  private menuKey(action: KeyAction): void {
    const apps = this.profile.apps
    const cols = this.profile.menuColumns
    const i = this.g.menuIndex
    const a = action.action
    if (a === 'NAV_LEFT') this.patch({ menuIndex: (i - 1 + apps.length) % apps.length })
    else if (a === 'NAV_RIGHT') this.patch({ menuIndex: (i + 1) % apps.length })
    else if (a === 'NAV_UP') this.patch({ menuIndex: i - cols >= 0 ? i - cols : i })
    else if (a === 'NAV_DOWN') this.patch({ menuIndex: i + cols < apps.length ? i + cols : i })
    else if (a === 'ENTER') this.openApp(i)
    else if (action.insert && /^[1-9]$/.test(action.insert)) this.openApp(Number(action.insert) - 1)
  }

  private openApp(index: number): void {
    const app = this.profile.apps[index]
    if (!app) return
    if (app.planned || !app.kind) {
      this.patch({ menuIndex: index })
      this.state = { ...this.state, error: { code: 'ModeError', message: `${app.label}: coming soon` } }
      return
    }
    this.patch({ app: app.id, menuIndex: index, view: 'list', sub: null, trace: null, info: null })
    this.state = { ...this.state, expression: '', cursorPos: 0, result: null }
  }

  // ------------------------------------------------------------------ RUN

  private ctx() {
    return createContext({ angleMode: this.state.settings.angleMode, variables: this.state.memory.variables, ans: this.state.memory.ans })
  }

  private fmt(v: CalcValue): string {
    return formatCalcValue(v, this.state.settings)
  }

  private editExpression(action: KeyAction, onEnter: () => void, onExit?: () => void): void {
    const { expression, cursorPos } = this.state
    switch (action.action) {
      case 'ENTER':
        return onEnter()
      case 'EXIT':
        return onExit?.()
      case 'CLEAR':
        this.state = { ...this.state, expression: '', cursorPos: 0 }
        return
      case 'BACKSPACE':
        if (cursorPos > 0) this.state = { ...this.state, expression: expression.slice(0, cursorPos - 1) + expression.slice(cursorPos), cursorPos: cursorPos - 1 }
        return
      case 'NAV_LEFT':
        this.state = { ...this.state, cursorPos: Math.max(0, cursorPos - 1) }
        return
      case 'NAV_RIGHT':
        this.state = { ...this.state, cursorPos: Math.min(expression.length, cursorPos + 1) }
        return
    }
    if (action.insert !== undefined) {
      let expr = expression
      let pos = cursorPos
      if (expr === '' && ['+', '-', '*', '/', '^', '²', '⁻¹'].includes(action.insert) && this.g.app === this.appIdOf('run') && this.g.run.length) {
        expr = 'Ans'
        pos = 3
      }
      if (expr.length >= 255) throw new MathError('MemoryError', 'Input too long')
      this.state = { ...this.state, expression: expr.slice(0, pos) + action.insert + expr.slice(pos), cursorPos: pos + action.insert.length }
    }
  }

  private appIdOf(kind: AppKind): string | undefined {
    return this.profile.apps.find((a) => a.kind === kind)?.id
  }

  private runKey(action: KeyAction): void {
    if (action.action === 'NAV_UP' && this.g.run.length) {
      const last = this.g.run[this.g.run.length - 1]
      this.state = { ...this.state, expression: last.input, cursorPos: last.input.length }
      return
    }
    if (action.action === 'CLEAR' && this.state.expression === '') {
      this.patch({ run: [] })
      return
    }
    this.editExpression(
      action,
      () => {
        const raw = this.state.expression.trim()
        if (!raw) return
        const store = /^(.*)→([A-Z])$/.exec(raw)
        try {
          const value = evaluate(store ? store[1] : raw, this.ctx())
          const out = this.fmt(value)
          const variables = store ? { ...this.state.memory.variables, [store[2]]: value } : this.state.memory.variables
          this.state = {
            ...this.state,
            expression: '',
            cursorPos: 0,
            memory: { ...this.state.memory, ans: value, variables, history: [...this.state.memory.history, { ...createHistoryEntry(raw, out), mode: 'RUN' }].slice(-100) },
          }
          this.patch({ run: [...this.g.run, { input: raw, output: out }].slice(-30) })
        } catch (err) {
          this.fail(err)
        }
      },
      () => this.patch({ app: 'MENU' }),
    )
  }

  // ------------------------------------------------------------------ GRAPH & TABLE

  protected fnOf(expr: string): RealFn {
    const base = this.ctx()
    return (x: number) => toNumber(evaluate(expr, { ...base, variables: { ...base.variables, X: fromDecimal(new Decimal(x)) } }))
  }

  private activeFns(): Array<{ index: number; f: RealFn; expr: string }> {
    return this.g.fns.map((fn, index) => ({ index, fn })).filter(({ fn }) => fn.on && fn.expr.trim()).map(({ index, fn }) => ({ index, f: this.fnOf(fn.expr), expr: fn.expr }))
  }

  /** Commands for the current screen (rendered as F-key labels or a TOOLS menu). */
  protected commands(): Command[] {
    const g = this.g
    const kind = this.appDef()?.kind
    const blank = { id: '', label: '' }
    if (kind === 'graph' || kind === 'table') {
      if (g.view === 'plot') {
        if (g.sub === 'zoom') return [{ id: 'zin', label: 'IN' }, { id: 'zout', label: 'OUT' }, { id: 'zauto', label: 'AUTO' }, { id: 'zstd', label: 'STD' }, blank, { id: 'back', label: '◀' }]
        if (g.sub === 'gsolv') return [{ id: 'root', label: 'ROOT' }, { id: 'max', label: 'MAX' }, { id: 'min', label: 'MIN' }, { id: 'yicpt', label: 'Y-ICPT' }, { id: 'isct', label: 'ISCT' }, { id: 'back', label: '◀' }]
        return [{ id: 'trace', label: 'TRACE' }, { id: 'zoom', label: 'ZOOM' }, { id: 'vwin', label: 'V-WIN' }, blank, { id: 'gsolv', label: 'G-SOLV' }, { id: 'list', label: 'LIST' }]
      }
      if (g.view === 'table') return [blank, blank, blank, blank, blank, { id: 'list', label: 'LIST' }]
      if (g.view === 'vwin' || g.view === 'tableset') return [blank, blank, { id: 'stdwin', label: g.view === 'vwin' ? 'STD' : '' }, blank, blank, { id: 'applyform', label: 'OK' }]
      return [
        { id: 'select', label: 'SELECT' },
        { id: 'delete', label: 'DELETE' },
        { id: 'vwin', label: 'V-WIN' },
        blank,
        { id: 'tableset', label: 'SET' },
        kind === 'table' ? { id: 'table', label: 'TABLE' } : { id: 'draw', label: 'DRAW' },
      ].concat([])
    }
    if (kind === 'stat') {
      if (g.stat.result) return [blank, blank, blank, blank, blank, { id: 'statback', label: '◀' }]
      if (g.sub === 'calc') return [{ id: '1var', label: '1-VAR' }, { id: '2var', label: '2-VAR' }, { id: 'reglin', label: 'REG' }, { id: 'regquad', label: 'QUAD' }, blank, { id: 'back', label: '◀' }]
      return [{ id: 'statgraph', label: 'GRAPH' }, { id: 'calc', label: 'CALC' }, blank, { id: 'delrow', label: 'DEL' }, { id: 'dellist', label: 'DEL-A' }, blank]
    }
    if (kind === 'prgm') {
      if (g.prgm.view === 'list') return [{ id: 'pexe', label: 'EXE' }, { id: 'pedit', label: 'EDIT' }, { id: 'pnew', label: 'NEW' }, { id: 'pdel', label: 'DEL' }, blank, blank]
      return [blank, blank, blank, blank, blank, { id: 'plist', label: 'LIST' }]
    }
    return []
  }

  protected runCommand(id: string): void {
    try {
      this.command(id)
    } catch (err) {
      this.fail(err)
    }
  }

  private command(id: string): void {
    const g = this.g
    const vp = g.viewport
    const fns = this.activeFns()
    switch (id) {
      case 'select': {
        const fns2 = g.fns.map((f, i) => (i === g.fnSel ? { ...f, on: !f.on } : f))
        return this.patch({ fns: fns2 })
      }
      case 'delete':
        return this.patch({ fns: g.fns.map((f, i) => (i === g.fnSel ? { expr: '', on: false } : f)), fnEditing: null })
      case 'draw':
        if (fns.length === 0) throw new MathError('InputError', 'No function selected')
        return this.patch({ view: 'plot', sub: null, trace: null, info: null })
      case 'table':
        if (fns.length === 0) throw new MathError('InputError', 'No function selected')
        return this.patch({ view: 'table', table: { ...g.table, row: 0 } })
      case 'list':
        return this.patch({ view: 'list', sub: null, trace: null, info: null })
      case 'vwin':
        return this.patch({ view: 'vwin', settingsForm: { ...initialFormState(), values: { 'V-Window': this.vwinValues() } } })
      case 'tableset':
        return this.patch({ view: 'tableset', settingsForm: { ...initialFormState(), values: { 'Table Setting': { start: String(g.table.start), end: String(g.table.end), step: String(g.table.step) } } } })
      case 'stdwin':
        return this.patch({ viewport: { ...STANDARD_VIEWPORT }, view: 'list' })
      case 'applyform':
        return this.applySettingsForm()
      case 'trace': {
        const first = fns[0]
        if (!first) throw new MathError('InputError', 'No function selected')
        return this.patch({ trace: { fn: first.index, x: (vp.xmin + vp.xmax) / 2 }, sub: null })
      }
      case 'zoom':
      case 'gsolv':
        return this.patch({ sub: id, trace: null })
      case 'back':
        return this.patch({ sub: null })
      case 'zin':
        return this.patch({ viewport: zoom(vp, 0.5), sub: null })
      case 'zout':
        return this.patch({ viewport: zoom(vp, 2), sub: null })
      case 'zauto':
        return this.patch({ viewport: autoY(vp, fns.map((f) => f.f)), sub: null })
      case 'zstd':
        return this.patch({ viewport: { ...STANDARD_VIEWPORT }, sub: null })
      case 'root':
      case 'max':
      case 'min':
      case 'yicpt':
      case 'isct':
        return this.gsolve(id, fns)
      case 'calc':
        return this.patch({ sub: 'calc' })
      case '1var':
      case '2var':
      case 'reglin':
      case 'regquad':
        return this.statCalc(id)
      case 'statgraph':
        return this.patch({ stat: { ...g.stat, plot: true } })
      case 'statback':
        return this.patch({ stat: { ...g.stat, result: null, plot: false }, sub: null })
      case 'delrow': {
        const lists = g.stat.lists.map((l, j) => (j === g.stat.col ? l.filter((_, r) => r !== g.stat.row) : l))
        return this.patch({ stat: { ...g.stat, lists, row: Math.max(0, Math.min(g.stat.row, lists[g.stat.col].length)) } })
      }
      case 'dellist': {
        const lists = g.stat.lists.map((l, j) => (j === g.stat.col ? [] : l))
        return this.patch({ stat: { ...g.stat, lists, row: 0 } })
      }
      case 'pexe':
        return this.startProgram()
      case 'pedit':
        return this.patch({ prgm: { ...g.prgm, view: 'edit' } })
      case 'pnew': {
        const name = `PROG${g.prgm.programs.length + 1}`
        const programs = [...g.prgm.programs, { name, source: 'PRINT "HELLO"' }]
        return this.patch({ prgm: { ...g.prgm, programs, sel: programs.length - 1, view: 'edit' } })
      }
      case 'pdel': {
        const programs = g.prgm.programs.filter((_, i) => i !== g.prgm.sel)
        return this.patch({ prgm: { ...g.prgm, programs, sel: Math.max(0, Math.min(g.prgm.sel, programs.length - 1)) } })
      }
      case 'plist':
        this.vm = null
        return this.patch({ prgm: { ...g.prgm, view: 'list', awaiting: null } })
    }
  }

  private vwinValues(): Record<string, string> {
    const v = this.g.viewport
    return { xmin: String(v.xmin), xmax: String(v.xmax), xscl: String(v.xscl), ymin: String(v.ymin), ymax: String(v.ymax), yscl: String(v.yscl) }
  }

  private settingsFormNode(): FormSpecForm {
    if (this.g.view === 'vwin') {
      return { kind: 'form', title: 'V-Window', fields: ['xmin', 'xmax', 'xscl', 'ymin', 'ymax', 'yscl'].map((id) => ({ id, label: id })) }
    }
    return { kind: 'form', title: 'Table Setting', fields: ['start', 'end', 'step'].map((id) => ({ id, label: id })) }
  }

  private applySettingsForm(): void {
    const node = this.settingsFormNode()
    const values = this.g.settingsForm.values[node.title] ?? {}
    const num = (k: string) => toNumber(evaluate(values[k] ?? '0', this.ctx()))
    if (this.g.view === 'vwin') {
      const vp: Viewport = { xmin: num('xmin'), xmax: num('xmax'), xscl: num('xscl'), ymin: num('ymin'), ymax: num('ymax'), yscl: num('yscl') }
      if (!(vp.xmax > vp.xmin && vp.ymax > vp.ymin)) throw new MathError('MathError', 'V-Window: max must exceed min')
      if (vp.xscl < 0 || vp.yscl < 0) throw new MathError('MathError', 'V-Window: scale must be ≥ 0')
      this.patch({ viewport: vp, view: 'list' })
    } else {
      const t = { start: num('start'), end: num('end'), step: num('step'), row: 0 }
      if (t.step <= 0 || t.end < t.start) throw new MathError('MathError', 'Table range is invalid')
      if ((t.end - t.start) / t.step > 999) throw new MathError('MemoryError', 'Table limited to 1000 rows')
      this.patch({ table: t, view: 'list' })
    }
  }

  private gsolve(id: string, fns: Array<{ index: number; f: RealFn }>): void {
    const vp = this.g.viewport
    const sel = fns.find((f) => f.index === this.g.trace?.fn) ?? fns[0]
    if (!sel) throw new MathError('InputError', 'No function selected')
    const label = `Y${sel.index + 1}`
    let info: string[]
    let cursor: { x: number; y: number }
    const f = (x: number) => this.fmtNum(x)
    if (id === 'root') {
      const roots = rootsIn(sel.f, vp.xmin, vp.xmax)
      if (!roots.length) throw new MathError('MathError', 'Not found')
      cursor = { x: roots[0], y: 0 }
      info = [`${label} ROOT`, `X=${f(roots[0])}`, ...(roots.length > 1 ? [`(+${roots.length - 1} more)`] : [])]
    } else if (id === 'max' || id === 'min') {
      const e = extremum(sel.f, vp.xmin, vp.xmax, id)
      cursor = e
      info = [`${label} ${id.toUpperCase()}`, `X=${f(e.x)}`, `Y=${f(e.y)}`]
    } else if (id === 'yicpt') {
      const y = sel.f(0)
      if (!Number.isFinite(y)) throw new MathError('MathError', 'Not found')
      cursor = { x: 0, y }
      info = [`${label} Y-ICPT`, `Y=${f(y)}`]
    } else {
      if (fns.length < 2) throw new MathError('InputError', 'Select two functions')
      const [a, b] = fns
      const xs = rootsIn((x) => a.f(x) - b.f(x), vp.xmin, vp.xmax)
      if (!xs.length) throw new MathError('MathError', 'Not found')
      cursor = { x: xs[0], y: a.f(xs[0]) }
      info = ['ISCT', `X=${f(cursor.x)}`, `Y=${f(cursor.y)}`]
    }
    this.state = { ...this.state, memory: { ...this.state.memory, ans: fromDecimal(new Decimal(cursor.x)) } }
    this.patch({ info, trace: { fn: sel.index, x: cursor.x }, sub: null })
  }

  private fmtNum(x: number): string {
    return formatReal(x, { ...this.state.settings, fractionDisplay: 'decimal' })
  }

  private graphKey(action: KeyAction, kind: 'graph' | 'table'): void {
    const g = this.g
    const a = action.action
    if (g.view === 'vwin' || g.view === 'tableset') {
      const node = this.settingsFormNode()
      if (a === 'EXIT') {
        this.applySettingsForm()
        return
      }
      const input = toAppletInput(action)
      if (!input) return
      const out = stepForm(node, g.settingsForm, input, {
        num: (t) => toNumber(evaluate(t, this.ctx())),
        fn: (t) => this.fnOf(t),
        fmt: (x) => this.fmtNum(x),
      })
      this.patch({ settingsForm: out.state })
      if (out.exit) this.applySettingsForm()
      return
    }
    if (g.view === 'plot') {
      if (a === 'EXIT') {
        if (g.sub) this.patch({ sub: null })
        else if (g.trace || g.info) this.patch({ trace: null, info: null })
        else this.patch({ view: 'list' })
        return
      }
      if (g.trace) {
        const fns = this.activeFns()
        const step = (g.viewport.xmax - g.viewport.xmin) / this.profile.screen.width
        if (a === 'NAV_LEFT' || a === 'NAV_RIGHT') {
          this.patch({ trace: { ...g.trace, x: g.trace.x + (a === 'NAV_LEFT' ? -step : step) }, info: null })
        } else if (a === 'NAV_UP' || a === 'NAV_DOWN') {
          const idx = fns.findIndex((f) => f.index === g.trace!.fn)
          const next = fns[(idx + (a === 'NAV_DOWN' ? 1 : fns.length - 1)) % fns.length]
          if (next) this.patch({ trace: { ...g.trace, fn: next.index }, info: null })
        } else if (action.insert && /[0-9.\-]/.test(action.insert)) {
          // Typing a number while tracing jumps the cursor to that X (like the hardware's X= prompt).
          const x = Number(action.insert)
          if (Number.isFinite(x)) this.patch({ trace: { ...g.trace, x } })
        }
        return
      }
      if (a === 'NAV_LEFT') this.patch({ viewport: pan(g.viewport, -0.1, 0) })
      else if (a === 'NAV_RIGHT') this.patch({ viewport: pan(g.viewport, 0.1, 0) })
      else if (a === 'NAV_UP') this.patch({ viewport: pan(g.viewport, 0, 0.1) })
      else if (a === 'NAV_DOWN') this.patch({ viewport: pan(g.viewport, 0, -0.1) })
      else if (a === 'ZOOM_IN' || action.insert === '+') this.patch({ viewport: zoom(g.viewport, 0.5) })
      else if (a === 'ZOOM_OUT' || action.insert === '-') this.patch({ viewport: zoom(g.viewport, 2) })
      return
    }
    if (g.view === 'table') {
      const rows = this.tableRows().length
      if (a === 'EXIT') this.patch({ view: 'list' })
      else if (a === 'NAV_DOWN') this.patch({ table: { ...g.table, row: Math.min(rows - 1, g.table.row + 1) } })
      else if (a === 'NAV_UP') this.patch({ table: { ...g.table, row: Math.max(0, g.table.row - 1) } })
      return
    }
    // Function list editor
    if (g.fnEditing !== null) {
      if (a === 'ENTER' || a === 'NAV_DOWN' || a === 'NAV_UP') {
        const expr = this.state.expression
        if (expr.trim()) this.fnOf(expr)(0.123) // surfaces syntax errors (domain errors at one point are fine)
        const fns = g.fns.map((f, i) => (i === g.fnSel ? { expr, on: expr.trim() ? true : f.on } : f))
        const delta = a === 'NAV_UP' ? -1 : 1
        this.patch({ fns, fnEditing: null, fnSel: (g.fnSel + delta + FN_COUNT) % FN_COUNT })
        this.state = { ...this.state, expression: '', cursorPos: 0 }
        return
      }
      if (a === 'EXIT') {
        this.patch({ fnEditing: null })
        this.state = { ...this.state, expression: '', cursorPos: 0 }
        return
      }
      this.editExpression(action, () => undefined)
      return
    }
    if (a === 'NAV_UP') this.patch({ fnSel: (g.fnSel - 1 + FN_COUNT) % FN_COUNT })
    else if (a === 'NAV_DOWN') this.patch({ fnSel: (g.fnSel + 1) % FN_COUNT })
    else if (a === 'EXIT') this.patch({ app: 'MENU' })
    else if (a === 'ENTER') this.command(kind === 'table' ? 'table' : 'draw')
    else if (action.insert !== undefined) {
      this.patch({ fnEditing: '' })
      this.state = { ...this.state, expression: '', cursorPos: 0 }
      this.editExpression(action, () => undefined)
    } else if (a === 'BACKSPACE' || a === 'CLEAR') this.command('delete')
  }

  private tableRows(): number[] {
    const t = this.g.table
    const n = Math.floor((t.end - t.start) / t.step + 1e-9) + 1
    return Array.from({ length: Math.max(0, Math.min(n, 1000)) }, (_, i) => t.start + i * t.step)
  }

  // ------------------------------------------------------------------ STAT

  private statKey(action: KeyAction): void {
    const st = this.g.stat
    const a = action.action
    if (st.result || st.plot) {
      if (a === 'EXIT' || a === 'ENTER' || a === 'CLEAR') this.patch({ stat: { ...st, result: null, plot: false }, sub: null })
      else if (a === 'NAV_DOWN' && st.result) this.patch({ stat: { ...st, scroll: Math.min(st.result.length - 1, st.scroll + 1) } })
      else if (a === 'NAV_UP' && st.result) this.patch({ stat: { ...st, scroll: Math.max(0, st.scroll - 1) } })
      return
    }
    if (st.editing !== null) {
      if (a === 'ENTER' || a === 'NAV_DOWN') {
        if (st.editing.trim()) {
          const v = toNumber(evaluate(st.editing, this.ctx()))
          const lists = st.lists.map((l, j) => {
            if (j !== st.col) return l
            const copy = [...l]
            copy[st.row] = v
            return copy
          })
          this.patch({ stat: { ...st, lists, editing: null, row: st.row + 1 } })
        } else this.patch({ stat: { ...st, editing: null } })
        return
      }
      if (a === 'EXIT' || a === 'CLEAR') return this.patch({ stat: { ...st, editing: null } })
      if (a === 'BACKSPACE') return this.patch({ stat: { ...st, editing: st.editing.slice(0, -1) } })
      if (action.insert !== undefined) this.patch({ stat: { ...st, editing: st.editing + action.insert } })
      return
    }
    const len = st.lists[st.col].length
    if (a === 'NAV_DOWN') this.patch({ stat: { ...st, row: Math.min(len, st.row + 1) } })
    else if (a === 'NAV_UP') this.patch({ stat: { ...st, row: Math.max(0, st.row - 1) } })
    else if (a === 'NAV_LEFT') this.patch({ stat: { ...st, col: Math.max(0, st.col - 1), row: Math.min(st.row, st.lists[Math.max(0, st.col - 1)].length) } })
    else if (a === 'NAV_RIGHT') this.patch({ stat: { ...st, col: Math.min(5, st.col + 1), row: Math.min(st.row, st.lists[Math.min(5, st.col + 1)].length) } })
    else if (a === 'EXIT') this.g.sub ? this.patch({ sub: null }) : this.patch({ app: 'MENU' })
    else if (action.insert !== undefined) this.patch({ stat: { ...st, editing: action.insert } })
  }

  private statCalc(id: string): void {
    const [l1, l2] = this.g.stat.lists
    const f = (x: number) => this.fmtNum(x)
    let lines: string[]
    if (id === '1var') {
      if (!l1.length) throw new MathError('InputError', 'List 1 is empty')
      const s = S.summarize(l1)
      const q = S.quartiles(l1)
      lines = [`x̄=${f(s.mean)}`, `Σx=${f(s.sum)}`, `σx=${f(s.populationStdDev)}`, `sx=${f(s.sampleStdDev)}`, `n=${s.n}`, `minX=${f(s.min)}`, `Q1=${f(q.q1)}`, `Med=${f(S.median(l1))}`, `Q3=${f(q.q3)}`, `maxX=${f(s.max)}`]
    } else {
      if (!l1.length || l1.length !== l2.length) throw new MathError('DimensionError', 'List 1 and List 2 must have the same length')
      if (id === '2var') {
        const p = S.pairedSums(l1, l2)
        lines = [`x̄=${f(p.sumX / p.n)}`, `ȳ=${f(p.sumY / p.n)}`, `Σx=${f(p.sumX)}`, `Σy=${f(p.sumY)}`, `Σxy=${f(p.sumXY)}`, `n=${p.n}`]
      } else if (id === 'reglin') {
        const r = S.linearRegression(l1, l2)
        lines = ['y=ax+b', `a=${f(r.slope)}`, `b=${f(r.intercept)}`, `r=${f(r.r)}`, `r²=${f(r.r * r.r)}`]
      } else {
        const q = S.quadraticRegression(l1, l2)
        lines = ['y=ax²+bx+c', `a=${f(q.c)}`, `b=${f(q.b)}`, `c=${f(q.a)}`]
      }
    }
    this.patch({ stat: { ...this.g.stat, result: lines, scroll: 0 }, sub: null })
  }

  // ------------------------------------------------------------------ EQUA / MATRIX (form applets)

  private formKey(action: KeyAction, key: 'equa' | 'matrix', root: () => FormNode): void {
    if (action.action === 'EXIT') action = { action: 'CLEAR', label: 'EXIT' }
    const input = toAppletInput(action)
    if (!input) return
    const out = stepForm(root(), this.g[key], input, {
      num: (t) => toNumber(evaluate(t, this.ctx())),
      fn: (t) => this.fnOf(t),
      fmt: (x) => formatReal(x, this.state.settings),
    })
    this.patch({ [key]: out.state } as Partial<GState>)
    if (out.ans !== undefined && Number.isFinite(out.ans)) this.state = { ...this.state, memory: { ...this.state.memory, ans: fromDecimal(new Decimal(out.ans)) } }
    if (out.exit) this.patch({ app: 'MENU' })
  }

  // ------------------------------------------------------------------ PRGM

  private prgmKey(action: KeyAction): void {
    const p = this.g.prgm
    const a = action.action
    if (p.view === 'list') {
      if (a === 'NAV_DOWN') this.patch({ prgm: { ...p, sel: Math.min(p.programs.length - 1, p.sel + 1) } })
      else if (a === 'NAV_UP') this.patch({ prgm: { ...p, sel: Math.max(0, p.sel - 1) } })
      else if (a === 'ENTER') this.startProgram()
      else if (a === 'EXIT') this.patch({ app: 'MENU' })
      return
    }
    if (p.view === 'edit') {
      if (a === 'EXIT') this.patch({ prgm: { ...p, view: 'list' } })
      return
    }
    // run view
    if (p.awaiting) {
      if (a === 'ENTER') {
        const v = toNumber(evaluate(this.state.expression || '0', this.ctx()))
        this.state = { ...this.state, expression: '', cursorPos: 0 }
        this.patch({ prgm: { ...p, output: [...p.output, `${p.awaiting.prompt} ${this.fmtNum(v)}`], awaiting: null } })
        this.pump(v)
        return
      }
      if (a === 'EXIT') {
        this.vm = null
        this.patch({ prgm: { ...p, view: 'list', awaiting: null } })
        return
      }
      this.editExpression(action, () => undefined)
      return
    }
    if (a === 'EXIT' || a === 'ENTER') this.patch({ prgm: { ...p, view: 'list' } })
  }

  private startProgram(): void {
    const p = this.g.prgm
    const prog = p.programs[p.sel]
    if (!prog) return
    const stmts = parseProgram(prog.source)
    const env = { angleMode: this.state.settings.angleMode, variables: { ...this.state.memory.variables } }
    this.vmEnv = env
    this.vm = runProgram(stmts, env)
    this.patch({ prgm: { ...p, view: 'run', output: [], awaiting: null } })
    this.pump(undefined)
  }

  private vmEnv: { angleMode: AngleMode; variables: Record<string, CalcValue> } | null = null

  private pump(input: number | undefined): void {
    if (!this.vm) return
    const out: string[] = []
    let next = input
    try {
      for (;;) {
        const r = this.vm.next(next)
        next = undefined
        if (r.done) {
          out.push('- Done -')
          this.vm = null
          break
        }
        if (r.value.type === 'print') out.push(r.value.text)
        else {
          const p = this.g.prgm
          this.patch({ prgm: { ...p, output: [...p.output, ...out].slice(-200), awaiting: { prompt: r.value.prompt, name: r.value.name } } })
          this.syncVmVariables()
          return
        }
      }
    } catch (err) {
      this.vm = null
      out.push(err instanceof Error ? err.message : 'Error')
    }
    const p = this.g.prgm
    this.patch({ prgm: { ...p, output: [...p.output, ...out].slice(-200), awaiting: null } })
    this.syncVmVariables()
  }

  private syncVmVariables(): void {
    if (this.vmEnv) this.state = { ...this.state, memory: { ...this.state.memory, variables: { ...this.vmEnv.variables } } }
  }

  // ------------------------------------------------------------------ display

  protected statusBar(): string {
    const app = this.appDef()
    const angle = this.state.settings.angleMode === 'DEG' ? 'Deg' : this.state.settings.angleMode === 'RAD' ? 'Rad' : 'Gra'
    return `${app ? app.label : this.profile.menuTitle}  ${angle}${this.state.shift ? ' ⇧' : ''}${this.state.alpha ? ' A' : ''}`
  }

  private indicators(): DisplayIndicator[] {
    return [
      { id: 'SHIFT', label: 'S', active: this.state.shift },
      { id: 'ALPHA', label: 'A', active: this.state.alpha },
      { id: 'ANGLE', label: this.state.settings.angleMode, active: true },
    ]
  }

  getDisplay(): CalculatorDisplayState {
    const softkeys = this.profile.softkeyMode === 'fkeys' ? this.commands().map((c) => c.label) : undefined
    const base = {
      kind: 'screen' as const,
      profile: this.profile.screen,
      statusBar: this.statusBar(),
      indicators: this.indicators(),
      errorMessage: this.state.error ? this.profile.errorText(this.state.error.code, this.state.error.message) : null,
    }
    if (this.state.menu.open) {
      const r = renderMenuLines(this.state.menu, { numbered: true, maxLines: this.profile.rows })
      return { ...base, content: { type: 'lines', lines: [{ text: this.state.menu.path.join(' › '), align: 'center' }, ...r.lines.map((t, i) => ({ text: t, inverted: i === r.selectedLine }))] } }
    }
    const content = this.content()
    const g = this.g
    const textEntry = g.app !== 'MENU' && this.appDef()?.kind === 'prgm' && g.prgm.view === 'edit' ? { label: `Program ${g.prgm.programs[g.prgm.sel]?.name ?? ''}`, value: g.prgm.programs[g.prgm.sel]?.source ?? '' } : undefined
    return { ...base, content, softkeys: softkeys && softkeys.some(Boolean) ? softkeys : undefined, textEntry }
  }

  private content(): ScreenContent {
    const g = this.g
    const rows = this.profile.rows
    if (g.app === 'MENU') {
      return {
        type: 'icons',
        columns: this.profile.menuColumns,
        selected: g.menuIndex,
        items: this.profile.apps.map((a, i) => ({ label: `${i < 9 ? `${i + 1} ` : ''}${a.label}${a.planned ? '*' : ''}`, icon: a.icon, color: a.color, disabled: a.planned })),
      }
    }
    const kind = this.appDef()?.kind
    const lines = (ls: ScreenLine[], cursor?: { line: number; col: number } | null): ScreenContent => ({ type: 'lines', lines: ls, cursor: cursor ?? null })
    if (kind === 'run') {
      const hist: ScreenLine[] = g.run.flatMap((r) => [{ text: r.input }, { text: r.output, align: 'right' as const }])
      const edit: ScreenLine = { text: this.state.expression }
      const all = [...hist, edit]
      const visible = all.slice(-rows)
      return lines(visible, { line: visible.length - 1, col: this.state.cursorPos })
    }
    if (kind === 'graph' || kind === 'table') {
      if (g.view === 'vwin' || g.view === 'tableset') {
        const r = renderForm(this.settingsFormNode(), g.settingsForm, rows - 1)
        if (r.error) return lines(this.profile.errorText(r.error.code, r.error.message).split('\n').map((t) => ({ text: t })))
        return lines([{ text: r.title, align: 'center' }, ...r.lines.map((t, i) => ({ text: t, inverted: i === r.highlightLine }))], r.cursorLine !== null ? { line: r.cursorLine + 1, col: r.cursorCol ?? 0 } : null)
      }
      if (g.view === 'plot') return this.plotContent()
      if (g.view === 'table') {
        const fns = this.activeFns()
        const xs = this.tableRows()
        return {
          type: 'table',
          headers: ['X', ...fns.map((f) => `Y${f.index + 1}`)],
          rows: xs.map((x) =>
            [this.fmtNum(x)].concat(
              fns.map((f) => {
                try {
                  const y = f.f(x)
                  return Number.isFinite(y) ? this.fmtNum(y) : 'ERROR'
                } catch {
                  return 'ERROR'
                }
              }),
            ),
          ),
          selectedRow: g.table.row,
        }
      }
      const ls: ScreenLine[] = g.fns.map((f, i) => {
        const editing = i === g.fnSel && g.fnEditing !== null
        const text = `${f.on && f.expr ? '■' : '□'}Y${i + 1}=${editing ? this.state.expression : f.expr}`
        return { text, inverted: i === g.fnSel && !editing, color: this.profile.screen.color ? this.profile.curveColors[i % this.profile.curveColors.length] : undefined }
      })
      return lines(ls.slice(0, rows), g.fnEditing !== null ? { line: g.fnSel, col: `□Y${g.fnSel + 1}=`.length + this.state.cursorPos } : null)
    }
    if (kind === 'stat') return this.statContent()
    if (kind === 'equa' || kind === 'matrix') {
      const r = renderForm(kind === 'equa' ? equationMode(4, 4) : matrixMode(), g[kind === 'equa' ? 'equa' : 'matrix'], rows - 1)
      if (r.error) return lines(this.profile.errorText(r.error.code, r.error.message).split('\n').map((t) => ({ text: t })).concat([{ text: '[EXIT]/[AC] to return' }]))
      return lines(
        [{ text: r.title, align: 'center' }, ...r.lines.map((t, i) => ({ text: t, inverted: i === r.highlightLine }))],
        r.cursorLine !== null ? { line: r.cursorLine + 1, col: r.cursorCol ?? 0 } : null,
      )
    }
    if (kind === 'prgm') {
      const p = g.prgm
      if (p.view === 'list') {
        const start = Math.max(0, p.sel - rows + 2)
        return lines([{ text: 'Program List', align: 'center' }, ...p.programs.slice(start, start + rows - 1).map((pr, i) => ({ text: pr.name, inverted: start + i === p.sel }))])
      }
      if (p.view === 'edit') {
        const src = p.programs[p.sel]?.source ?? ''
        return lines([{ text: `=${p.programs[p.sel]?.name ?? ''}=` }, ...src.split('\n').slice(0, rows - 1).map((t) => ({ text: t }))])
      }
      const out: ScreenLine[] = p.output.map((t) => ({ text: t }))
      if (p.awaiting) out.push({ text: `${p.awaiting.prompt} ${this.state.expression}` })
      const vis = out.slice(-rows)
      return lines(vis, p.awaiting ? { line: vis.length - 1, col: `${p.awaiting.prompt} `.length + this.state.cursorPos } : null)
    }
    return lines([{ text: 'Coming soon' }])
  }

  private plotContent(): ScreenContent {
    const g = this.g
    const fns = this.activeFns()
    const curves = fns.map((f) => sampleCurve(f.f, g.viewport, this.profile.screen.width, `Y${f.index + 1}`, this.profile.curveColors[f.index % this.profile.curveColors.length]))
    let cursor: { x: number; y: number } | null = null
    let info = g.info ?? undefined
    if (g.trace) {
      const f = fns.find((x) => x.index === g.trace!.fn)
      if (f) {
        let y = NaN
        try {
          y = f.f(g.trace.x)
        } catch {
          y = NaN
        }
        cursor = { x: g.trace.x, y: Number.isFinite(y) ? y : 0 }
        if (!g.info) info = [`Y${f.index + 1}=${f.expr}`, `X=${this.fmtNum(g.trace.x)}  Y=${Number.isFinite(y) ? this.fmtNum(y) : 'ERROR'}`]
      }
    }
    return { type: 'graph', viewport: g.viewport, axes: g.axes, grid: g.grid, curves, cursor, info }
  }

  private statContent(): ScreenContent {
    const st = this.g.stat
    if (st.result) {
      return { type: 'lines', lines: st.result.slice(st.scroll, st.scroll + this.profile.rows).map((t) => ({ text: t })) }
    }
    if (st.plot) {
      const [l1, l2] = st.lists
      const n = Math.min(l1.length, l2.length)
      const pts = Array.from({ length: n }, (_, i) => ({ x: l1[i], y: l2[i], color: this.profile.curveColors[0] }))
      if (!pts.length) return { type: 'lines', lines: [{ text: 'No paired data in List 1/2' }] }
      const xs = pts.map((p) => p.x)
      const ys = pts.map((p) => p.y)
      const pad = (lo: number, hi: number) => (hi - lo || 1) * 0.1
      const vp: Viewport = {
        xmin: Math.min(...xs) - pad(Math.min(...xs), Math.max(...xs)),
        xmax: Math.max(...xs) + pad(Math.min(...xs), Math.max(...xs)),
        ymin: Math.min(...ys) - pad(Math.min(...ys), Math.max(...ys)),
        ymax: Math.max(...ys) + pad(Math.min(...ys), Math.max(...ys)),
        xscl: 0,
        yscl: 0,
      }
      let curves: ReturnType<typeof sampleCurve>[] = []
      if (n >= 2) {
        try {
          const r = S.linearRegression(l1.slice(0, n), l2.slice(0, n))
          curves = [sampleCurve((x) => r.slope * x + r.intercept, vp, 64, 'Reg', this.profile.curveColors[1])]
        } catch {
          curves = []
        }
      }
      return { type: 'graph', viewport: vp, axes: true, grid: false, curves, points: pts }
    }
    const maxLen = Math.max(...st.lists.map((l) => l.length))
    const rowsCount = Math.max(maxLen + 1, st.row + 1)
    const rows = Array.from({ length: rowsCount }, (_, r) =>
      [String(r + 1)].concat(st.lists.slice(0, 4).map((l, j) => (st.editing !== null && j === st.col && r === st.row ? st.editing : l[r] !== undefined ? this.fmtNum(l[r]) : ''))),
    )
    return { type: 'table', headers: ['', 'List1', 'List2', 'List3', 'List4'], rows, selectedRow: st.row, selectedCol: st.col + 1, footer: st.col > 3 ? `List${st.col + 1} (cols 5–6 hidden)` : undefined }
  }
}

function toAppletInput(action: KeyAction): AppletInput | null {
  const a = action.action
  if (a) {
    if (a === 'EXIT') return { type: 'action', action: 'CLEAR' }
    if (['ENTER', 'CLEAR', 'BACKSPACE', 'DELETE', 'NAV_UP', 'NAV_DOWN', 'NAV_LEFT', 'NAV_RIGHT'].includes(a)) return { type: 'action', action: a as 'ENTER' }
    return null
  }
  return action.insert !== undefined ? { type: 'insert', text: action.insert } : null
}
