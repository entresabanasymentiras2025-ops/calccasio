import type { FormEnv, FormNode, FormSpecForm, FieldSpec } from './FormApplet'
import { parseList } from './FormApplet'
import { MathError } from '../../math/arithmetic/value'
import * as M from '../../math/matrices/matrix'
import * as V from '../../math/vectors/vector'
import * as S from '../../math/statistics/statistics'
import * as D from '../../math/probability/distributions'
import { solveLinearSystem, polynomialRoots } from '../../math/numerical/equations'
import type { Complex } from '../../math/complex/complex'

/**
 * Declarative specs for the "form" style scientific modes. They are shared
 * by ClassWiz, ES PLUS and MS engines; each engine decides which of them a
 * model gets from its capability flags and how the mode menu is presented.
 */

function matrixFields(name: string, r: number, c: number): FieldSpec[] {
  const out: FieldSpec[] = []
  for (let i = 1; i <= r; i++) for (let j = 1; j <= c; j++) out.push({ id: `${name}${i}${j}`, label: `${name}${i}${j}`, default: '0' })
  return out
}

function readMatrix(name: string, r: number, c: number, v: Record<string, string>, env: FormEnv): M.Matrix {
  return Array.from({ length: r }, (_, i) => Array.from({ length: c }, (_, j) => env.num(v[`${name}${i + 1}${j + 1}`] || '0')))
}

function matrixLines(label: string, m: M.Matrix, env: FormEnv): string[] {
  return [`${label}=`, ...m.map((row) => `[ ${row.map((x) => env.fmt(x)).join('  ')} ]`)]
}

function complexText(z: Complex, env: FormEnv): string {
  if (z.im === 0) return env.fmt(z.re)
  const re = z.re === 0 ? '' : env.fmt(z.re)
  const im = Math.abs(z.im) === 1 ? 'i' : `${env.fmt(Math.abs(z.im))}i`
  return `${re}${z.im < 0 ? '-' : re ? '+' : ''}${im}`
}

export function matrixMode(): FormNode {
  const dims: Array<[number, number]> = [
    [2, 2],
    [3, 3],
    [2, 3],
    [3, 2],
  ]
  const binary = (label: string, op: (a: M.Matrix, b: M.Matrix) => M.Matrix, square = false): FormNode => ({
    kind: 'choice',
    title: `${label}: size`,
    options: dims
      .filter(([r, c]) => !square || r === c)
      .map(([r, c]) => ({
        label: `${r}×${c}`,
        node: {
          kind: 'form',
          title: `${label} ${r}×${c}`,
          fields: [...matrixFields('A', r, c), ...matrixFields('B', r, c)],
          compute: (v, env) => {
            const res = op(readMatrix('A', r, c, v, env), readMatrix('B', r, c, v, env))
            return { lines: matrixLines('MatAns', res, env) }
          },
        },
      })),
  })
  const unary = (label: string, fn: (a: M.Matrix, env: FormEnv) => string[], squareOnly = true): FormNode => ({
    kind: 'choice',
    title: `${label}: size`,
    options: dims
      .filter(([r, c]) => !squareOnly || r === c)
      .map(([r, c]) => ({
        label: `${r}×${c}`,
        node: {
          kind: 'form',
          title: `${label} ${r}×${c}`,
          fields: matrixFields('A', r, c),
          compute: (v, env) => ({ lines: fn(readMatrix('A', r, c, v, env), env) }),
        },
      })),
  })
  return {
    kind: 'choice',
    title: 'Matrix',
    options: [
      { label: 'MatA+MatB', node: binary('A+B', M.add) },
      { label: 'MatA−MatB', node: binary('A−B', M.subtract) },
      { label: 'MatA×MatB', node: binary('A×B', M.multiply, true) },
      {
        label: 'det(MatA)',
        node: unary('det', (a, env) => {
          const d = M.determinant(a)
          return [`det(MatA)=`, env.fmt(d)]
        }),
      },
      { label: 'MatA⁻¹', node: unary('A⁻¹', (a, env) => matrixLines('MatA⁻¹', M.inverse(a), env)) },
      { label: 'Trn(MatA)', node: unary('Trn', (a, env) => matrixLines('Trn(MatA)', M.transpose(a), env), false) },
      { label: 'MatA²', node: unary('A²', (a, env) => matrixLines('MatA²', M.multiply(a, a), env)) },
    ],
  }
}

export function vectorMode(): FormNode {
  const vf = (name: string, n: number): FieldSpec[] =>
    Array.from({ length: n }, (_, i) => ({ id: `${name}${i + 1}`, label: `Vct${name}${i + 1}`, default: '0' }))
  const read = (name: string, n: number, v: Record<string, string>, env: FormEnv) =>
    Array.from({ length: n }, (_, i) => env.num(v[`${name}${i + 1}`] || '0'))
  const vecText = (x: number[], env: FormEnv) => `[ ${x.map((c) => env.fmt(c)).join('  ')} ]`
  type Op = { label: string; two: boolean; only3?: boolean; run: (a: number[], b: number[], env: FormEnv) => string[] }
  const ops: Op[] = [
    { label: 'VctA+VctB', two: true, run: (a, b, env) => ['VctAns=', vecText(V.add(a, b), env)] },
    { label: 'VctA−VctB', two: true, run: (a, b, env) => ['VctAns=', vecText(V.subtract(a, b), env)] },
    { label: 'VctA•VctB', two: true, run: (a, b, env) => ['VctA•VctB=', env.fmt(V.dot(a, b))] },
    { label: 'VctA×VctB', two: true, only3: true, run: (a, b, env) => ['VctA×VctB=', vecText(V.cross(a, b), env)] },
    { label: 'Abs(VctA)', two: false, run: (a, _b, env) => ['|VctA|=', env.fmt(V.norm(a))] },
    { label: 'Angle(A,B)', two: true, run: (a, b, env) => ['Angle (deg)=', env.fmt((V.angleBetween(a, b) * 180) / Math.PI)] },
    { label: 'UnitV(VctA)', two: false, run: (a, _b, env) => ['UnitV(VctA)=', vecText(V.unit(a), env)] },
  ]
  return {
    kind: 'choice',
    title: 'Vector',
    options: ops.map((op) => ({
      label: op.label,
      node: {
        kind: 'choice',
        title: `${op.label}: dimension`,
        options: (op.only3 ? [3] : [2, 3]).map((n) => ({
          label: `${n}D`,
          node: {
            kind: 'form',
            title: `${op.label} ${n}D`,
            fields: [...vf('A', n), ...(op.two ? vf('B', n) : [])],
            compute: (v, env) => ({ lines: op.run(read('A', n, v, env), op.two ? read('B', n, v, env) : [], env) }),
          } satisfies FormSpecForm,
        })),
      },
    })),
  }
}

export function equationMode(maxUnknowns = 4, maxDegree = 4): FormNode {
  const letters = ['x', 'y', 'z', 't']
  const coeffNames = ['a', 'b', 'c', 'd', 'e']
  const simul = (n: number): FormSpecForm => {
    const fields: FieldSpec[] = []
    for (let r = 1; r <= n; r++) {
      for (let c = 0; c <= n; c++) fields.push({ id: `${coeffNames[c]}${r}`, label: `${coeffNames[c]}${r}`, default: '0' })
    }
    return {
      kind: 'form',
      title: `Simul Equation ${n}`,
      fields,
      compute: (v, env) => {
        const a: number[][] = []
        const b: number[] = []
        for (let r = 1; r <= n; r++) {
          a.push(Array.from({ length: n }, (_, c) => env.num(v[`${coeffNames[c]}${r}`] || '0')))
          b.push(env.num(v[`${coeffNames[n]}${r}`] || '0'))
        }
        const sol = solveLinearSystem(a, b)
        return { lines: sol.map((x, i) => `${letters[i]}=${env.fmt(x)}`), ans: sol[0] }
      },
    }
  }
  const poly = (deg: number): FormSpecForm => ({
    kind: 'form',
    title: `Polynomial degree ${deg}`,
    fields: coeffNames.slice(0, deg + 1).map((c, i) => ({ id: c, label: c, default: i === 0 ? '1' : '0' })),
    compute: (v, env) => {
      const coeffs = coeffNames.slice(0, deg + 1).map((c) => env.num(v[c] || '0'))
      if (coeffs[0] === 0) throw new MathError('MathError', 'Leading coefficient must be non-zero')
      const roots = polynomialRoots(coeffs)
      const lines = roots.map((z, i) => `x${i + 1}=${complexText(z, env)}`)
      if (deg === 2) {
        const [a, b, c] = coeffs
        const xv = -b / (2 * a)
        lines.push(`x-Value ${a > 0 ? 'Min' : 'Max'}=${env.fmt(xv)}`, `y-Value ${a > 0 ? 'Min' : 'Max'}=${env.fmt(c - (b * b) / (4 * a))}`)
      }
      return { lines, ans: roots[0].im === 0 ? roots[0].re : undefined }
    },
  })
  return {
    kind: 'choice',
    title: 'Equation',
    options: [
      { label: 'Simul Equation', node: { kind: 'choice', title: 'Number of unknowns', options: [2, 3, 4].filter((n) => n <= maxUnknowns).map((n) => ({ label: `${n} Unknowns`, node: simul(n) })) } },
      { label: 'Polynomial', node: { kind: 'choice', title: 'Degree', options: [2, 3, 4].filter((d) => d <= maxDegree).map((d) => ({ label: `aX^${d}+…`, node: poly(d) })) } },
    ],
  }
}

function oneVarLines(xs: number[], env: FormEnv): string[] {
  const s = S.summarize(xs)
  const { q1, q3 } = S.quartiles(xs)
  return [
    `x̄=${env.fmt(s.mean)}`,
    `Σx=${env.fmt(s.sum)}`,
    `Σx²=${env.fmt(xs.reduce((a, x) => a + x * x, 0))}`,
    `σ²x=${env.fmt(s.variance)}`,
    `σx=${env.fmt(s.populationStdDev)}`,
    `s²x=${env.fmt(s.sampleStdDev ** 2)}`,
    `sx=${env.fmt(s.sampleStdDev)}`,
    `n=${s.n}`,
    `min(x)=${env.fmt(s.min)}`,
    `Q1=${env.fmt(q1)}`,
    `Med=${env.fmt(S.median(xs))}`,
    `Q3=${env.fmt(q3)}`,
    `max(x)=${env.fmt(s.max)}`,
  ]
}

function readXY(v: Record<string, string>, env: FormEnv): { xs: number[]; ys: number[] } {
  const xs = parseList(v.x || '', env)
  const ys = parseList(v.y || '', env)
  const freq = v.freq ? parseList(v.freq, env) : null
  if (xs.length === 0) throw new MathError('InputError', 'Enter x data (comma separated)')
  if (xs.length !== ys.length) throw new MathError('DimensionError', 'x and y lists must have the same length')
  if (!freq) return { xs, ys }
  if (freq.length !== xs.length) throw new MathError('DimensionError', 'Freq list must match x list')
  const ex = S.expandFrequencies(xs.map((_, i) => i), freq)
  return { xs: ex.map((i) => xs[i]), ys: ex.map((i) => ys[i]) }
}

export function statMode(): FormNode {
  const twoVar = (label: string, fit: (xs: number[], ys: number[], env: FormEnv) => string[]): FormSpecForm => ({
    kind: 'form',
    title: label,
    fields: [
      { id: 'x', label: 'x', kind: 'list' },
      { id: 'y', label: 'y', kind: 'list' },
      { id: 'freq', label: 'Freq', kind: 'list' },
    ],
    compute: (v, env) => {
      const { xs, ys } = readXY(v, env)
      const sums = S.pairedSums(xs, ys)
      return {
        lines: [
          ...fit(xs, ys, env),
          `n=${sums.n}`,
          `x̄=${env.fmt(sums.sumX / sums.n)}`,
          `ȳ=${env.fmt(sums.sumY / sums.n)}`,
          `Σx=${env.fmt(sums.sumX)}`,
          `Σy=${env.fmt(sums.sumY)}`,
          `Σx²=${env.fmt(sums.sumX2)}`,
          `Σxy=${env.fmt(sums.sumXY)}`,
          `Σy²=${env.fmt(sums.sumY2)}`,
        ],
      }
    },
  })
  const linLike = (label: string, f: typeof S.linearRegression, aName = 'a', bName = 'b') =>
    twoVar(label, (xs, ys, env) => {
      const r = f(xs, ys)
      return [`${aName}=${env.fmt(r.intercept)}`, `${bName}=${env.fmt(r.slope)}`, `r=${env.fmt(r.r)}`]
    })
  return {
    kind: 'choice',
    title: 'Statistics',
    options: [
      {
        label: '1-Variable',
        node: {
          kind: 'form',
          title: '1-Variable',
          fields: [
            { id: 'x', label: 'x', kind: 'list' },
            { id: 'freq', label: 'Freq', kind: 'list' },
          ],
          compute: (v, env) => {
            const xs = parseList(v.x || '', env)
            if (xs.length === 0) throw new MathError('InputError', 'Enter x data (comma separated)')
            const data = v.freq ? S.expandFrequencies(xs, parseList(v.freq, env)) : xs
            return { lines: oneVarLines(data, env) }
          },
        },
      },
      { label: 'y=a+bx', node: linLike('y=a+bx', S.linearRegression) },
      {
        label: 'y=a+bx+cx²',
        node: twoVar('y=a+bx+cx²', (xs, ys, env) => {
          const q = S.quadraticRegression(xs, ys)
          return [`a=${env.fmt(q.a)}`, `b=${env.fmt(q.b)}`, `c=${env.fmt(q.c)}`]
        }),
      },
      { label: 'y=a+b·ln(x)', node: linLike('y=a+b·ln(x)', S.logarithmicRegression) },
      { label: 'y=a·e^(bx)', node: linLike('y=a·e^(bx)', S.exponentialRegression) },
      { label: 'y=a·x^b', node: linLike('y=a·x^b', S.powerRegression) },
    ],
  }
}

export function tableMode(maxRows = 45): FormNode {
  return {
    kind: 'form',
    title: 'Table',
    fields: [
      { id: 'f', label: 'f(x)', kind: 'expr', default: 'X²' },
      { id: 'g', label: 'g(x)', kind: 'expr' },
      { id: 'start', label: 'Start', default: '1' },
      { id: 'end', label: 'End', default: '5' },
      { id: 'step', label: 'Step', default: '1' },
    ],
    compute: (v, env) => {
      const start = env.num(v.start || '1')
      const end = env.num(v.end || '5')
      const step = env.num(v.step || '1')
      if (step <= 0) throw new MathError('MathError', 'Step must be > 0')
      if (end < start) throw new MathError('MathError', 'End must be ≥ Start')
      const count = Math.floor((end - start) / step + 1e-9) + 1
      if (count > maxRows) throw new MathError('MemoryError', `Table is limited to ${maxRows} rows`)
      const f = env.fn(v.f || 'X')
      const g = v.g ? env.fn(v.g) : null
      const lines = [g ? 'x | f(x) | g(x)' : 'x | f(x)']
      for (let k = 0; k < count; k++) {
        const x = start + k * step
        const cell = (fn: (x: number) => number) => {
          try {
            return env.fmt(fn(x))
          } catch {
            return 'ERROR'
          }
        }
        lines.push([env.fmt(x), cell(f), ...(g ? [cell(g)] : [])].join(' | '))
      }
      return { lines }
    },
  }
}

export function ratioMode(): FormNode {
  return {
    kind: 'choice',
    title: 'Ratio',
    options: [
      {
        label: 'A:B=X:D',
        node: {
          kind: 'form',
          title: 'A:B=X:D',
          fields: ['A', 'B', 'D'].map((id) => ({ id, label: id, default: '1' })),
          compute: (v, env) => {
            const b = env.num(v.B)
            if (b === 0) throw new MathError('MathError', 'B must be non-zero')
            const x = (env.num(v.A) * env.num(v.D)) / b
            return { lines: [`X=${env.fmt(x)}`], ans: x }
          },
        },
      },
      {
        label: 'A:B=C:X',
        node: {
          kind: 'form',
          title: 'A:B=C:X',
          fields: ['A', 'B', 'C'].map((id) => ({ id, label: id, default: '1' })),
          compute: (v, env) => {
            const a = env.num(v.A)
            if (a === 0) throw new MathError('MathError', 'A must be non-zero')
            const x = (env.num(v.B) * env.num(v.C)) / a
            return { lines: [`X=${env.fmt(x)}`], ans: x }
          },
        },
      },
    ],
  }
}

export function distributionMode(): FormNode {
  const f = (title: string, fields: FieldSpec[], run: (v: Record<string, string>, env: FormEnv) => number, label = 'p'): FormNode => ({
    kind: 'form',
    title,
    fields,
    compute: (v, env) => {
      const r = run(v, env)
      return { lines: [`${label}=${env.fmt(r)}`], ans: r }
    },
  })
  const mu: FieldSpec = { id: 'mu', label: 'μ', default: '0' }
  const sigma: FieldSpec = { id: 'sigma', label: 'σ', default: '1' }
  return {
    kind: 'choice',
    title: 'Distribution',
    options: [
      { label: 'Normal PD', node: f('Normal PD', [{ id: 'x', label: 'x', default: '0' }, sigma, mu], (v, e) => D.normalPdf(e.num(v.x), e.num(v.mu), e.num(v.sigma))) },
      {
        label: 'Normal CD',
        node: f('Normal CD', [{ id: 'lower', label: 'Lower', default: '-1' }, { id: 'upper', label: 'Upper', default: '1' }, sigma, mu], (v, e) =>
          D.normalCdf(e.num(v.lower), e.num(v.upper), e.num(v.mu), e.num(v.sigma)),
        ),
      },
      {
        label: 'Inverse Normal',
        node: f('Inverse Normal', [{ id: 'area', label: 'Area', default: '0.5' }, sigma, mu], (v, e) => D.inverseNormal(e.num(v.area), e.num(v.mu), e.num(v.sigma)), 'xInv'),
      },
      {
        label: 'Binomial PD',
        node: f('Binomial PD', [{ id: 'x', label: 'x', default: '0' }, { id: 'n', label: 'N', default: '10' }, { id: 'p', label: 'p', default: '0.5' }], (v, e) =>
          D.binomialPd(e.num(v.x), e.num(v.n), e.num(v.p)),
        ),
      },
      {
        label: 'Binomial CD',
        node: f('Binomial CD', [{ id: 'x', label: 'x', default: '0' }, { id: 'n', label: 'N', default: '10' }, { id: 'p', label: 'p', default: '0.5' }], (v, e) =>
          D.binomialCd(e.num(v.x), e.num(v.n), e.num(v.p)),
        ),
      },
      { label: 'Poisson PD', node: f('Poisson PD', [{ id: 'x', label: 'x', default: '0' }, { id: 'l', label: 'λ', default: '1' }], (v, e) => D.poissonPd(e.num(v.x), e.num(v.l))) },
      { label: 'Poisson CD', node: f('Poisson CD', [{ id: 'x', label: 'x', default: '0' }, { id: 'l', label: 'λ', default: '1' }], (v, e) => D.poissonCd(e.num(v.x), e.num(v.l))) },
    ],
  }
}
