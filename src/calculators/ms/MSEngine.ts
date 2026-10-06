import { ScientificEngineBase, type ScientificModeDef, type ScientificProfile } from '../scientific/ScientificEngineBase'
import * as Modes from '../scientific/modeCatalog'
import { msKeyboardLayout } from './MSKeyboard'
import type { CalculatorModelConfig } from '../../models/types'
import type { KeyAction } from '../core/CalculatorKeyboard'
import type { MenuItem } from '../core/CalculatorState'
import { openMenu } from '../core/Menu'
import { evaluate } from '../../math/parser/evaluator'
import { MathError, toNumber, fromDecimal, Decimal, type CalcValue } from '../../math/arithmetic/value'
import { formatCalcValue, formatReal } from '../shared/formatNumber'
import * as S from '../../math/statistics/statistics'

type RegType = 'Lin' | 'Log' | 'Exp' | 'Pwr' | 'Inv' | 'Quad'

interface MSModeState extends Record<string, unknown> {
  sd?: Array<[number, number]>
  reg?: Array<[number, number, number]>
  regType?: RegType
  menuPage?: number
}

const SD_MODE: ScientificModeDef = { id: 'SD', label: 'SD', capability: 'statistics', kind: 'custom' }
const REG_MODE: ScientificModeDef = { id: 'REG', label: 'REG', capability: 'statistics', kind: 'custom' }

export function msErrorText(code: string, message: string): string {
  const head: Record<string, string> = { SyntaxError: 'Syntax ERROR', DimensionError: 'Dim ERROR', MemoryError: 'Stack ERROR' }
  return `${head[code] ?? 'Math ERROR'}\n${message}`
}

/**
 * MS-family engine with its own interaction model (not a re-skinned
 * ClassWiz): MODE pages through numbered screens (pressing MODE again shows
 * the next page), results default to decimal unless the input used the
 * a⌟b⌟c fraction key, and SD/REG statistics use DT data entry with
 * S-SUM / S-VAR recall instead of a list editor.
 */
export class MSEngine extends ScientificEngineBase {
  private readonly msProfile: ScientificProfile = {
    modeMenuTitle: 'MODE',
    numberedMenus: true,
    displayRows: 2,
    errorText: msErrorText,
    modes: [Modes.COMP('COMP'), Modes.COMPLEX('CMPLX'), SD_MODE, REG_MODE, Modes.BASE_N('BASE'), Modes.EQUATION('EQN', 3, 3), Modes.MATRIX('MAT'), Modes.VECTOR('VCT')],
  }

  constructor(config: CalculatorModelConfig) {
    super(config, msKeyboardLayout)
  }

  protected get profile(): ScientificProfile {
    return this.msProfile
  }

  initialize() {
    const s = super.initialize()
    return { ...s, settings: { ...s.settings, fractionDisplay: 'mixed' as const } }
  }

  private get ms(): MSModeState {
    return (this.state.modeState ?? {}) as MSModeState
  }

  // ------------------------------------------------------------ MODE pages

  private modePages(): MenuItem[][] {
    const has = new Set(this.availableModes().map((m) => m.id))
    const mk = (ids: Array<[string, string]>) => ids.filter(([id]) => has.has(id)).map(([id, label]) => ({ id, label, action: `mode:${id}` }))
    const pages: MenuItem[][] = [
      mk([
        ['COMP', 'COMP'],
        ['COMPLEX', 'CMPLX'],
      ]),
      mk([
        ['SD', 'SD'],
        ['REG', 'REG'],
        ['BASE_N', 'BASE'],
      ]),
      mk([
        ['EQUATION', 'EQN'],
        ['MATRIX', 'MAT'],
        ['VECTOR', 'VCT'],
      ]),
      [
        { id: 'deg', label: 'Deg', action: 'angle:DEG' },
        { id: 'rad', label: 'Rad', action: 'angle:RAD' },
        { id: 'gra', label: 'Gra', action: 'angle:GRAD' },
      ],
      [
        { id: 'fix', label: 'Fix', children: Array.from({ length: 10 }, (_, d) => ({ id: `f${d}`, label: `Fix ${d}`, action: `fmt:fix:${d}` })) },
        { id: 'sci', label: 'Sci', children: Array.from({ length: 10 }, (_, d) => ({ id: `s${d + 1}`, label: `Sci ${d + 1}`, action: `fmt:sci:${d + 1}` })) },
        { id: 'norm', label: 'Norm', action: 'fmt:norm' },
      ],
      [
        { id: 'abc', label: 'ab/c', action: 'frac:mixed' },
        { id: 'dc', label: 'd/c', action: 'frac:improper' },
      ],
    ]
    return pages.filter((p) => p.length > 0)
  }

  protected openModeMenu(): void {
    this.openPage(0)
  }

  private openPage(page: number): void {
    const pages = this.modePages()
    const p = page % pages.length
    this.state = { ...this.state, menu: openMenu(pages[p], `MODE ${p + 1}/${pages.length}`), modeState: { ...this.ms, menuPage: p } }
  }

  protected onModeKeyInMenu(): void {
    if (this.state.menu.path[0]?.startsWith('MODE')) this.openPage((this.ms.menuPage ?? 0) + 1)
    else super.onModeKeyInMenu()
  }

  protected performMenuAction(action: string): void {
    if (action === 'mode:REG') {
      this.switchMode('REG')
      const types: RegType[] = ['Lin', 'Log', 'Exp', 'Pwr', 'Inv', 'Quad']
      this.state = { ...this.state, menu: openMenu(types.map((t) => ({ id: t, label: t, action: `reg:${t}` })), 'REG type') }
      return
    }
    if (action.startsWith('reg:')) {
      this.state = { ...this.state, modeState: { ...this.ms, regType: action.slice(4) as RegType, reg: [] } }
      return
    }
    if (action.startsWith('clr:')) {
      this.clear(action.slice(4))
      return
    }
    if (action.startsWith('stat:')) {
      this.showStat(action.slice(5))
      return
    }
    super.performMenuAction(action)
  }

  // ------------------------------------------------------------ keys

  protected dispatch(action: KeyAction): void {
    if (action.action === 'SCL') {
      this.state = {
        ...this.state,
        menu: openMenu(
          [
            { id: 'scl', label: 'Scl', action: 'clr:scl' },
            { id: 'mode', label: 'Mode', action: 'clr:mode' },
            { id: 'all', label: 'All', action: 'clr:all' },
          ],
          'CLR',
        ),
      }
      return
    }
    const mode = this.state.mode
    if (mode === 'SD' || mode === 'REG') {
      if (action.action === 'MEMORY_ADD') {
        this.dataEntry()
        return
      }
      if (action.action === 'S_SUM' || action.action === 'S_VAR') {
        this.openStatMenu(action.action)
        return
      }
    }
    super.dispatch(action)
  }

  private clear(what: string): void {
    if (what === 'scl') {
      this.state = { ...this.state, modeState: { ...this.ms, sd: [], reg: [] }, result: null, expression: '' }
    } else if (what === 'mode') {
      const fresh = this.initialize()
      this.state = { ...this.state, mode: 'COMP', settings: fresh.settings, expression: '', result: null }
    } else {
      this.state = this.initialize()
    }
  }

  /** DT: evaluates the typed "x" / "x,freq" (SD) or "x,y" / "x,y,freq" (REG) and appends it. */
  private dataEntry(): void {
    const raw = this.state.expression.trim()
    if (!raw) return
    try {
      const parts = raw.split(',').map((p) => toNumber(evaluate(this.preprocess(p), this.buildContext())))
      if (this.state.mode === 'SD') {
        if (parts.length > 2) throw new MathError('SyntaxError', 'SD data is x or x,freq')
        const sd = [...(this.ms.sd ?? []), [parts[0], parts[1] ?? 1] as [number, number]]
        if (sd.length > 80) throw new MathError('MemoryError', 'Data memory full (80 entries)')
        this.state = { ...this.state, modeState: { ...this.ms, sd }, expression: '', cursorPos: 0, result: `n= ${sd.length}`, error: null }
      } else {
        if (parts.length < 2 || parts.length > 3) throw new MathError('SyntaxError', 'REG data is x,y or x,y,freq')
        const reg = [...(this.ms.reg ?? []), [parts[0], parts[1], parts[2] ?? 1] as [number, number, number]]
        if (reg.length > 80) throw new MathError('MemoryError', 'Data memory full (80 entries)')
        this.state = { ...this.state, modeState: { ...this.ms, reg }, expression: '', cursorPos: 0, result: `n= ${reg.length}`, error: null }
      }
    } catch (err) {
      const e = err instanceof MathError ? err : new MathError('MathError', 'Invalid data')
      this.state = { ...this.state, error: { code: e.code, message: e.message } }
    }
  }

  private openStatMenu(kind: 'S_SUM' | 'S_VAR'): void {
    const reg = this.state.mode === 'REG'
    const it = (id: string, label = id): MenuItem => ({ id, label, action: `stat:${id}` })
    let items: MenuItem[]
    if (kind === 'S_SUM') items = reg ? [it('Σx²'), it('Σx'), it('n'), it('Σy²'), it('Σy'), it('Σxy')] : [it('Σx²'), it('Σx'), it('n')]
    else items = reg ? [it('x̄'), it('xσn'), it('xσn-1'), it('ȳ'), it('yσn'), it('yσn-1'), it('A'), it('B'), ...(this.ms.regType === 'Quad' ? [it('C')] : []), it('r')] : [it('x̄'), it('xσn'), it('xσn-1')]
    this.state = { ...this.state, menu: openMenu(items, kind === 'S_SUM' ? 'S-SUM' : 'S-VAR') }
  }

  private statData(): { xs: number[]; ys: number[] } {
    if (this.state.mode === 'SD') {
      const xs = (this.ms.sd ?? []).flatMap(([x, f]) => Array(Math.max(0, Math.round(f))).fill(x) as number[])
      return { xs, ys: [] }
    }
    const rows = (this.ms.reg ?? []).flatMap(([x, y, f]) => Array(Math.max(0, Math.round(f))).fill([x, y]) as Array<[number, number]>)
    return { xs: rows.map((r) => r[0]), ys: rows.map((r) => r[1]) }
  }

  private showStat(id: string): void {
    try {
      const { xs, ys } = this.statData()
      if (xs.length === 0) throw new MathError('MathError', 'No statistical data')
      const sum = (a: number[]) => a.reduce((p, c) => p + c, 0)
      const sd = (a: number[], sample: boolean) => {
        const m = sum(a) / a.length
        const denom = sample ? a.length - 1 : a.length
        if (denom <= 0) throw new MathError('MathError', 'Not enough data')
        return Math.sqrt(sum(a.map((v) => (v - m) ** 2)) / denom)
      }
      const fit = () => {
        const t = this.ms.regType ?? 'Lin'
        if (t === 'Quad') return S.quadraticRegression(xs, ys)
        const f = { Lin: S.linearRegression, Log: S.logarithmicRegression, Exp: S.exponentialRegression, Pwr: S.powerRegression, Inv: (x: number[], y: number[]) => S.linearRegression(x.map((v) => 1 / v), y) }[t]
        const r = f(xs, ys)
        return { a: r.intercept, b: r.slope, r: r.r }
      }
      const values: Record<string, () => number> = {
        'Σx²': () => sum(xs.map((x) => x * x)),
        Σx: () => sum(xs),
        n: () => xs.length,
        'Σy²': () => sum(ys.map((y) => y * y)),
        Σy: () => sum(ys),
        Σxy: () => sum(xs.map((x, i) => x * ys[i])),
        'x̄': () => sum(xs) / xs.length,
        xσn: () => sd(xs, false),
        'xσn-1': () => sd(xs, true),
        'ȳ': () => sum(ys) / ys.length,
        yσn: () => sd(ys, false),
        'yσn-1': () => sd(ys, true),
        A: () => fit().a,
        B: () => fit().b,
        C: () => (fit() as { c?: number }).c ?? 0,
        r: () => {
          const f = fit() as { r?: number }
          if (f.r === undefined) throw new MathError('MathError', 'r is not defined for quadratic regression here')
          return f.r
        },
      }
      const v = values[id]()
      const value: CalcValue = fromDecimal(new Decimal(v))
      this.state = { ...this.state, expression: id, cursorPos: id.length, result: formatReal(v, { ...this.state.settings, fractionDisplay: 'decimal' }), memory: { ...this.state.memory, ans: value }, error: null }
    } catch (err) {
      const e = err instanceof MathError ? err : new MathError('MathError', 'Error')
      this.state = { ...this.state, error: { code: e.code, message: e.message } }
    }
  }

  // ------------------------------------------------------------ results

  /** MS shows decimals unless the calculation was entered with the fraction key. */
  protected formatResult(value: CalcValue): string {
    const usedFraction = this.state.expression.includes('⌟')
    if (!usedFraction || value.kind !== 'rational' || value.den === 1n) {
      return formatCalcValue(value, { ...this.state.settings, fractionDisplay: 'decimal' })
    }
    const neg = value.num < 0n
    const n = neg ? -value.num : value.num
    if (this.state.settings.fractionDisplay === 'improper' || n < value.den) return `${neg ? '-' : ''}${n}⌟${value.den}`
    return `${neg ? '-' : ''}${n / value.den}⌟${n % value.den}⌟${value.den}`
  }

  getDisplay() {
    const d = super.getDisplay()
    if (d.kind !== 'text' || this.state.menu.open) return d
    if (this.state.mode === 'SD' || this.state.mode === 'REG') {
      const n = this.state.mode === 'SD' ? (this.ms.sd ?? []).length : (this.ms.reg ?? []).length
      const title = this.state.mode === 'REG' ? `REG ${this.ms.regType ?? 'Lin'} · n=${n}` : `SD · n=${n}`
      return { ...d, title }
    }
    return d
  }

  protected indicators() {
    return [...super.indicators(), { id: 'SD', label: this.state.mode === 'REG' ? 'REG' : 'SD', active: this.state.mode === 'SD' || this.state.mode === 'REG' }]
  }
}

export const createMSEngine = (config: CalculatorModelConfig) => new MSEngine(config)
