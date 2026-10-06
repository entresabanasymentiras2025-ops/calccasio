import { MathError } from '../../math/arithmetic/value'

/**
 * A small declarative "wizard" state machine shared by every mode that
 * works as choose → fill in values → see results: EQUATION, MATRIX,
 * VECTOR, STAT, TABLE, RATIO, DISTRIBUTION on scientific engines and every
 * financial mode on the FC series. Specs are plain data + compute
 * functions; the applet handles navigation, editing, validation, errors
 * and result scrolling identically everywhere, and its state is plain JSON
 * so it persists with the rest of CalculatorState.
 */
export interface FieldSpec {
  id: string
  label: string
  /** number: evaluated on commit; expr: kept as an expression in X; list: comma separated numbers; text: raw (dates). */
  kind?: 'number' | 'expr' | 'list' | 'text' | 'toggle'
  default?: string
  /** For toggles: the allowed values cycled with ◀/▶ or =. */
  options?: string[]
}

export interface FormEnv {
  /** Evaluates a numeric expression (variables, Ans, functions all allowed). */
  num(text: string): number
  /** Builds f(x) from an expression in X. */
  fn(text: string): (x: number) => number
  /** Formats a number for this calculator's display. */
  fmt(x: number): string
}

export type FormValues = Record<string, string>

export interface FormResult {
  lines: string[]
  /** Value that becomes Ans when the result is shown. */
  ans?: number
}

export interface FormSpecForm {
  kind: 'form'
  title: string
  fields: FieldSpec[]
  compute?: (v: FormValues, env: FormEnv) => FormResult
  /** Solve-for-field (financial SOLVE key): returns the new value of `fieldId` (number, or text for dates). */
  solve?: (fieldId: string, v: FormValues, env: FormEnv) => number | string
}

export interface FormSpecChoice {
  kind: 'choice'
  title: string
  options: Array<{ label: string; node: FormNode }>
}

export type FormNode = FormSpecChoice | FormSpecForm

export interface FormState {
  path: number[]
  choiceIndex: number
  fieldIndex: number
  /** Values per form, keyed by the form title so revisiting a form keeps its inputs. */
  values: Record<string, FormValues>
  editing: string | null
  cursor: number
  result: string[] | null
  resultScroll: number
  error: { code: string; message: string } | null
}

export type AppletInput =
  | { type: 'insert'; text: string }
  | { type: 'action'; action: 'ENTER' | 'CLEAR' | 'BACKSPACE' | 'DELETE' | 'NAV_UP' | 'NAV_DOWN' | 'NAV_LEFT' | 'NAV_RIGHT' | 'SOLVE' }

export interface AppletOutcome {
  state: FormState
  /** Set when a computation produced a value that should become Ans. */
  ans?: number
  /** Set when AC was pressed at the root (engine may exit the mode). */
  exit?: boolean
}

export function initialFormState(): FormState {
  return { path: [], choiceIndex: 0, fieldIndex: 0, values: {}, editing: null, cursor: 0, result: null, resultScroll: 0, error: null }
}

export function currentNode(root: FormNode, path: number[]): FormNode {
  let node = root
  for (const idx of path) {
    if (node.kind !== 'choice' || !node.options[idx]) break
    node = node.options[idx].node
  }
  return node
}

function formValues(state: FormState, form: FormSpecForm): FormValues {
  const saved = state.values[form.title] ?? {}
  const out: FormValues = {}
  for (const f of form.fields) out[f.id] = saved[f.id] ?? f.default ?? ''
  return out
}

function withValues(state: FormState, form: FormSpecForm, values: FormValues): FormState {
  return { ...state, values: { ...state.values, [form.title]: values } }
}

function toError(err: unknown): { code: string; message: string } {
  if (err instanceof MathError) return { code: err.code, message: err.message }
  return { code: 'MathError', message: err instanceof Error ? err.message : 'Error' }
}

export function parseList(text: string, env: FormEnv): number[] {
  const parts = text.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
  return parts.map((p) => env.num(p))
}

function validateField(field: FieldSpec, text: string, env: FormEnv): void {
  const kind = field.kind ?? 'number'
  if (text.trim() === '') return
  if (kind === 'number') env.num(text)
  else if (kind === 'list') parseList(text, env)
  else if (kind === 'expr') env.fn(text)(0)
}

export function stepForm(root: FormNode, state: FormState, input: AppletInput, env: FormEnv): AppletOutcome {
  const node = currentNode(root, state.path)

  // Any key dismisses an error first (like the hardware's error screen).
  if (state.error) {
    return { state: { ...state, error: null } }
  }

  if (node.kind === 'choice') {
    if (input.type === 'insert' && /^[1-9]$/.test(input.text)) {
      const idx = Number(input.text) - 1
      if (idx < node.options.length) return { state: { ...state, path: [...state.path, idx], choiceIndex: 0, fieldIndex: 0, result: null } }
      return { state }
    }
    if (input.type !== 'action') return { state }
    const n = node.options.length
    switch (input.action) {
      case 'NAV_UP':
        return { state: { ...state, choiceIndex: (state.choiceIndex - 1 + n) % n } }
      case 'NAV_DOWN':
        return { state: { ...state, choiceIndex: (state.choiceIndex + 1) % n } }
      case 'ENTER':
        return { state: { ...state, path: [...state.path, state.choiceIndex], choiceIndex: 0, fieldIndex: 0, result: null } }
      case 'CLEAR':
        if (state.path.length === 0) return { state, exit: true }
        return { state: { ...state, choiceIndex: state.path[state.path.length - 1], path: state.path.slice(0, -1) } }
      default:
        return { state }
    }
  }

  const form = node
  const values = formValues(state, form)
  const field = form.fields[state.fieldIndex]

  if (state.result) {
    if (input.type === 'action' && (input.action === 'NAV_DOWN' || input.action === 'NAV_UP')) {
      const delta = input.action === 'NAV_DOWN' ? 1 : -1
      const max = Math.max(0, state.result.length - 1)
      return { state: { ...state, resultScroll: Math.max(0, Math.min(max, state.resultScroll + delta)) } }
    }
    if (input.type === 'action' && (input.action === 'ENTER' || input.action === 'CLEAR')) {
      return { state: { ...state, result: null, resultScroll: 0 } }
    }
    if (input.type === 'insert') {
      // Typing on the result screen goes back to editing the first field.
      const s = { ...state, result: null, resultScroll: 0, fieldIndex: 0 }
      return stepForm(root, s, input, env)
    }
    return { state }
  }

  type Committed = { ok: true; state: FormState } | { ok: false; error: { code: string; message: string } }
  const commit = (s: FormState): Committed => {
    if (s.editing === null || !field) return { ok: true, state: s }
    try {
      validateField(field, s.editing, env)
    } catch (err) {
      return { ok: false, error: toError(err) }
    }
    return { ok: true, state: { ...withValues(s, form, { ...values, [field.id]: s.editing }), editing: null, cursor: 0 } }
  }

  const compute = (s: FormState): AppletOutcome => {
    if (!form.compute) return { state: s }
    try {
      const res = form.compute(formValues(s, form), env)
      return { state: { ...s, result: res.lines, resultScroll: 0 }, ans: res.ans }
    } catch (err) {
      return { state: { ...s, error: toError(err) } }
    }
  }

  if (input.type === 'insert') {
    if (field?.kind === 'toggle') return { state }
    const base = state.editing ?? ''
    const cursor = state.editing === null ? 0 : state.cursor
    const editing = base.slice(0, cursor) + input.text + base.slice(cursor)
    return { state: { ...state, editing, cursor: cursor + input.text.length } }
  }

  const nFields = form.fields.length
  switch (input.action) {
    case 'NAV_LEFT':
    case 'NAV_RIGHT': {
      if (field?.kind === 'toggle' && field.options) {
        const opts = field.options
        const cur = Math.max(0, opts.indexOf(values[field.id]))
        const next = opts[(cur + (input.action === 'NAV_RIGHT' ? 1 : opts.length - 1)) % opts.length]
        return { state: withValues(state, form, { ...values, [field.id]: next }) }
      }
      if (state.editing === null) return { state }
      const cursor = input.action === 'NAV_LEFT' ? Math.max(0, state.cursor - 1) : Math.min(state.editing.length, state.cursor + 1)
      return { state: { ...state, cursor } }
    }
    case 'NAV_UP':
    case 'NAV_DOWN': {
      const c = commit(state)
      if (!c.ok) return { state: { ...state, error: c.error } }
      const delta = input.action === 'NAV_DOWN' ? 1 : -1
      return { state: { ...c.state, fieldIndex: (c.state.fieldIndex + delta + nFields) % nFields } }
    }
    case 'BACKSPACE': {
      if (state.editing === null) {
        if (field && field.kind !== 'toggle') return { state: withValues(state, form, { ...values, [field.id]: '' }) }
        return { state }
      }
      if (state.cursor === 0) return { state }
      const editing = state.editing.slice(0, state.cursor - 1) + state.editing.slice(state.cursor)
      return { state: { ...state, editing, cursor: state.cursor - 1 } }
    }
    case 'DELETE':
      if (state.editing === null) return { state }
      return { state: { ...state, editing: state.editing.slice(0, state.cursor) + state.editing.slice(state.cursor + 1) } }
    case 'CLEAR':
      if (state.editing !== null) return { state: { ...state, editing: null, cursor: 0 } }
      if (state.path.length === 0) return { state, exit: true }
      return { state: { ...state, fieldIndex: 0, choiceIndex: state.path[state.path.length - 1], path: state.path.slice(0, -1) } }
    case 'SOLVE': {
      if (!form.solve || !field) return { state }
      const c = commit(state)
      if (!c.ok) return { state: { ...state, error: c.error } }
      const committed = c.state
      try {
        const v = form.solve(field.id, formValues(committed, form), env)
        const text = typeof v === 'number' ? env.fmt(v) : v
        return { state: withValues(committed, form, { ...formValues(committed, form), [field.id]: text }), ans: typeof v === 'number' ? v : undefined }
      } catch (err) {
        return { state: { ...committed, error: toError(err) } }
      }
    }
    case 'ENTER': {
      if (field?.kind === 'toggle' && state.editing === null && field.options) {
        const opts = field.options
        const cur = Math.max(0, opts.indexOf(values[field.id]))
        return { state: withValues(state, form, { ...values, [field.id]: opts[(cur + 1) % opts.length] }) }
      }
      if (state.editing === null) return compute(state)
      const c = commit(state)
      if (!c.ok) return { state: { ...state, error: c.error } }
      const committed = c.state
      if (state.fieldIndex < nFields - 1) return { state: { ...committed, fieldIndex: state.fieldIndex + 1 } }
      return compute(committed)
    }
  }
  return { state }
}

export interface RenderedForm {
  title: string
  lines: string[]
  highlightLine: number | null
  cursorLine: number | null
  cursorCol: number | null
  error: { code: string; message: string } | null
}

/** Renders the applet to plain text lines, windowed to `maxLines` around the focus. */
export function renderForm(root: FormNode, state: FormState, maxLines = 6): RenderedForm {
  const node = currentNode(root, state.path)
  const window = (all: string[], focus: number) => {
    const start = Math.max(0, Math.min(focus - Math.floor(maxLines / 2), all.length - maxLines))
    return { lines: all.slice(start, start + maxLines), focus: focus - start }
  }
  if (node.kind === 'choice') {
    const all = node.options.map((o, i) => `${i + 1}:${o.label}`)
    const w = window(all, state.choiceIndex)
    return { title: node.title, lines: w.lines, highlightLine: w.focus, cursorLine: null, cursorCol: null, error: state.error }
  }
  if (state.result) {
    const all = state.result
    const start = Math.min(state.resultScroll, Math.max(0, all.length - maxLines))
    return { title: node.title, lines: all.slice(start, start + maxLines), highlightLine: null, cursorLine: null, cursorCol: null, error: state.error }
  }
  const values = formValues(state, node)
  const all = node.fields.map((f, i) => {
    const raw = i === state.fieldIndex && state.editing !== null ? state.editing : values[f.id]
    const shown = f.kind === 'toggle' ? `◂ ${raw} ▸` : raw === '' ? '—' : raw
    return `${f.label}=${shown}`
  })
  const w = window(all, state.fieldIndex)
  const editingField = node.fields[state.fieldIndex]
  return {
    title: node.title,
    lines: w.lines,
    highlightLine: w.focus,
    cursorLine: state.editing !== null ? w.focus : null,
    cursorCol: state.editing !== null ? editingField.label.length + 1 + state.cursor : null,
    error: state.error,
  }
}
