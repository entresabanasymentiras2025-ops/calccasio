import { GraphingEngineBase, type GraphingProfile } from '../graphing/GraphingEngineBase'
import { cg100KeyboardLayout } from './CG100Keyboard'
import { getDisplayProfile, layoutFor, registerKeyboardLayout } from '../registry'
import type { CalculatorModelConfig } from '../../models/types'

registerKeyboardLayout(cg100KeyboardLayout)

/**
 * fx-CG100 family (fx-CG100 / GRAPH MATH+ / fx-1AU GRAPH). Deliberately
 * not a re-skinned CG50: it has no F-keys (commands are reached through a
 * TOOLS pop-up), a HOME screen with its own app catalogue where Graph and
 * Table are one app, and OK/BACK navigation. Only generic graphing
 * infrastructure (plotting, solvers, VM) is shared.
 */
export class CG100Engine extends GraphingEngineBase {
  private readonly p: GraphingProfile = {
    screen: getDisplayProfile('cg100')!,
    menuTitle: 'HOME',
    menuColumns: 3,
    softkeyMode: 'tools',
    rows: 7,
    curveColors: ['#2563eb', '#e11d48', '#059669', '#9333ea', '#ea580c', '#0f172a'],
    errorText: (code, message) => `${code.replace('Error', ' Error')}\n${message}`,
    apps: [
      { id: 'CALC', label: 'Calculate', icon: '±', color: '#dbeafe', kind: 'run' },
      { id: 'STAT', label: 'Statistics', icon: '▥', color: '#dcfce7', kind: 'stat' },
      { id: 'GRAPH', label: 'Graph&Table', icon: '∿', color: '#ffe4e6', kind: 'graph' },
      { id: 'EQUA', label: 'Equation', icon: 'x=', color: '#ede9fe', kind: 'equa' },
      { id: 'MAT', label: 'Matrix', icon: '[ ]', color: '#ffedd5', kind: 'matrix' },
      { id: 'PRGM', label: 'Program', icon: '{ }', color: '#e0f2fe', kind: 'prgm' },
      { id: 'PYTHON', label: 'Python', icon: 'Py', color: '#f1f5f9', kind: null, planned: true },
      { id: 'GEOM', label: 'Geometry', icon: '△', color: '#f1f5f9', kind: null, planned: true },
      { id: '3D', label: '3D Graph', icon: '⬡', color: '#f1f5f9', kind: null, planned: true },
    ],
  }

  constructor(config: CalculatorModelConfig) {
    super(config, layoutFor(config, cg100KeyboardLayout))
  }

  protected get profile(): GraphingProfile {
    return this.p
  }

  /** Graph&Table merges both apps: the TOOLS menu offers DRAW and TABLE from the function list. */
  protected commands() {
    const cmds = super.commands()
    if (this.g.app === 'GRAPH' && this.g.view === 'list') {
      const rest = cmds.filter((c) => c.label && c.id !== 'draw')
      return [{ id: 'draw', label: 'DRAW' }, { id: 'table', label: 'TABLE' }, ...rest]
    }
    return cmds.filter((c) => c.label)
  }

  protected statusBar(): string {
    const s = super.statusBar()
    return s.replace('HOME', 'Home')
  }
}

export const createCG100Engine = (config: CalculatorModelConfig) => new CG100Engine(config)
