import type { FormEnv, FormNode, FormSpecForm, FormValues } from '../shared/FormApplet'
import { parseList } from '../shared/FormApplet'
import { MathError } from '../../math/arithmetic/value'
import { solveTvm, amortize, simpleInterest, nominalToEffective, effectiveToNominal, type TvmInput, type TvmVariable } from '../../math/finance/tvm'
import { npv, irr, nfv, paybackPeriod } from '../../math/finance/cashflow'
import * as F from '../../math/finance/misc'

/**
 * Financial modes as declarative forms (FinancialCalculator layer). The
 * formulas live in src/math/finance (FinancialFormulaEngine, CashFlow,
 * Date, Bond and Depreciation engines); this file only maps fields to them.
 */
const tvmFields = [
  { id: 'set', label: 'Set', kind: 'toggle' as const, options: ['End', 'Begin'], default: 'End' },
  { id: 'n', label: 'n', default: '0' },
  { id: 'i', label: 'I%', default: '0' },
  { id: 'pv', label: 'PV', default: '0' },
  { id: 'pmt', label: 'PMT', default: '0' },
  { id: 'fv', label: 'FV', default: '0' },
  { id: 'py', label: 'P/Y', default: '12' },
  { id: 'cy', label: 'C/Y', default: '12' },
]

function readTvm(v: FormValues, env: FormEnv): TvmInput {
  return {
    n: env.num(v.n || '0'),
    iPercent: env.num(v.i || '0'),
    pv: env.num(v.pv || '0'),
    pmt: env.num(v.pmt || '0'),
    fv: env.num(v.fv || '0'),
    py: env.num(v.py || '12'),
    cy: env.num(v.cy || '12'),
    begin: v.set === 'Begin',
  }
}

const TVM_IDS: Record<string, TvmVariable> = { n: 'n', i: 'iPercent', pv: 'pv', pmt: 'pmt', fv: 'fv' }

export function compoundInterest(): FormSpecForm {
  return {
    kind: 'form',
    title: 'CMPD',
    fields: tvmFields,
    solve: (id, v, env) => {
      const variable = TVM_IDS[id]
      if (!variable) throw new MathError('InputError', 'Select n, I%, PV, PMT or FV to SOLVE')
      return solveTvm(readTvm(v, env), variable)
    },
    compute: () => ({ lines: ['Select n, I%, PV,', 'PMT or FV and', 'press SOLVE'] }),
  }
}

export function simple(): FormSpecForm {
  return {
    kind: 'form',
    title: 'SMPL',
    fields: [
      { id: 'basis', label: 'Set', kind: 'toggle', options: ['365', '360'], default: '365' },
      { id: 'dys', label: 'Dys', default: '0' },
      { id: 'i', label: 'I%', default: '0' },
      { id: 'pv', label: 'PV', default: '0' },
    ],
    compute: (v, env) => {
      const r = simpleInterest(env.num(v.dys), env.num(v.i), env.num(v.pv), v.basis === '360' ? 360 : 365)
      return { lines: [`SI=${env.fmt(r.si)}`, `SFV=${env.fmt(r.sfv)}`], ans: r.sfv }
    },
  }
}

export function cashFlow(): FormSpecForm {
  return {
    kind: 'form',
    title: 'CASH',
    fields: [
      { id: 'i', label: 'I%', default: '0' },
      { id: 'cf', label: 'Csh', kind: 'list', default: '' },
    ],
    compute: (v, env) => {
      const flows = parseList(v.cf || '', env)
      if (flows.length < 2) throw new MathError('InputError', 'Enter CF0,CF1,... (at least 2)')
      const i = env.num(v.i)
      const pb = paybackPeriod(i, flows)
      let irrText: string
      try {
        irrText = env.fmt(irr(flows))
      } catch {
        irrText = 'no solution'
      }
      return { lines: [`NPV=${env.fmt(npv(i, flows))}`, `IRR=${irrText}`, `PBP=${pb === null ? 'none' : env.fmt(pb)}`, `NFV=${env.fmt(nfv(i, flows))}`], ans: npv(i, flows) }
    },
  }
}

export function amortization(): FormSpecForm {
  return {
    kind: 'form',
    title: 'AMRT',
    fields: [{ id: 'pm1', label: 'PM1', default: '1' }, { id: 'pm2', label: 'PM2', default: '12' }, ...tvmFields],
    compute: (v, env) => {
      const r = amortize(readTvm(v, env), env.num(v.pm1), env.num(v.pm2))
      return { lines: [`BAL=${env.fmt(r.bal)}`, `INT=${env.fmt(r.int)}`, `PRN=${env.fmt(r.prn)}`, `ΣINT=${env.fmt(r.sumInt)}`, `ΣPRN=${env.fmt(r.sumPrn)}`], ans: r.bal }
    },
  }
}

export function conversion(): FormSpecForm {
  return {
    kind: 'form',
    title: 'CNVR',
    fields: [
      { id: 'n', label: 'n', default: '12' },
      { id: 'apr', label: 'APR', default: '0' },
      { id: 'eff', label: 'EFF', default: '0' },
    ],
    solve: (id, v, env) => {
      if (id === 'eff') return nominalToEffective(env.num(v.apr), env.num(v.n))
      if (id === 'apr') return effectiveToNominal(env.num(v.eff), env.num(v.n))
      throw new MathError('InputError', 'SOLVE APR or EFF')
    },
    compute: (v, env) => {
      const eff = nominalToEffective(env.num(v.apr), env.num(v.n))
      return { lines: [`EFF=${env.fmt(eff)}`], ans: eff }
    },
  }
}

export function costSellMargin(): FormSpecForm {
  return {
    kind: 'form',
    title: 'COST',
    fields: [
      { id: 'cst', label: 'CST', default: '0' },
      { id: 'sel', label: 'SEL', default: '0' },
      { id: 'mrg', label: 'MRG', default: '0' },
    ],
    solve: (id, v, env) => {
      if (id === 'cst') return F.costFromSell(env.num(v.sel), env.num(v.mrg))
      if (id === 'sel') return F.sellFromCost(env.num(v.cst), env.num(v.mrg))
      return F.marginFrom(env.num(v.cst), env.num(v.sel))
    },
  }
}

export function days(): FormSpecForm {
  return {
    kind: 'form',
    title: 'DAYS',
    fields: [
      { id: 'd1', label: 'd1', kind: 'text', default: '2025-01-01' },
      { id: 'd2', label: 'd2', kind: 'text', default: '2025-12-31' },
      { id: 'dys', label: 'Dys', default: '0' },
    ],
    solve: (id, v, env) => {
      if (id === 'dys') return F.daysBetween(v.d1, v.d2)
      if (id === 'd2') return F.addDays(v.d1, Math.round(env.num(v.dys)))
      return F.addDays(v.d2, -Math.round(env.num(v.dys)))
    },
    compute: (v) => {
      const n = F.daysBetween(v.d1, v.d2)
      return { lines: [`Dys=${n}`], ans: n }
    },
  }
}

export function depreciation(): FormNode {
  const methods: Array<[F.DepreciationMethod, string]> = [
    ['SL', 'SL (straight line)'],
    ['FP', 'FP (fixed %)'],
    ['SYD', 'SYD (sum of years)'],
    ['DB', 'DB (declining bal.)'],
  ]
  return {
    kind: 'choice',
    title: 'DEPR',
    options: methods.map(([m, label]) => ({
      label,
      node: {
        kind: 'form',
        title: `DEPR ${m}`,
        fields: [
          { id: 'n', label: 'n', default: '5' },
          { id: 'i', label: 'I%', default: m === 'DB' ? '200' : '0' },
          { id: 'pv', label: 'PV', default: '0' },
          { id: 'fv', label: 'FV', default: '0' },
          { id: 'j', label: 'j', default: '1' },
        ],
        compute: (v, env) => {
          const r = F.depreciate(m, env.num(v.n), env.num(v.i), env.num(v.pv), env.num(v.fv), env.num(v.j))
          return { lines: [`${m}=${env.fmt(r.depreciation)}`, `RDV=${env.fmt(r.residual)}`], ans: r.depreciation }
        },
      },
    })),
  }
}

export function bond(): FormSpecForm {
  return {
    kind: 'form',
    title: 'BOND (Term)',
    fields: [
      { id: 'freq', label: 'Set', kind: 'toggle', options: ['Semi', 'Annual'], default: 'Semi' },
      { id: 'n', label: 'n', default: '10' },
      { id: 'rdv', label: 'RDV', default: '100' },
      { id: 'cpn', label: 'CPN', default: '0' },
      { id: 'prc', label: 'PRC', default: '0' },
      { id: 'yld', label: 'YLD', default: '0' },
    ],
    solve: (id, v, env) => {
      const freq = v.freq === 'Annual' ? 1 : 2
      if (id === 'prc') return F.bondPrice(env.num(v.n), env.num(v.rdv), env.num(v.cpn), env.num(v.yld), freq)
      if (id === 'yld') return F.bondYield(env.num(v.n), env.num(v.rdv), env.num(v.cpn), env.num(v.prc), freq)
      throw new MathError('InputError', 'SOLVE PRC or YLD')
    },
  }
}

export function breakEven(): FormNode {
  return {
    kind: 'choice',
    title: 'BEVN',
    options: [
      {
        label: 'Break-even',
        node: {
          kind: 'form',
          title: 'BEV',
          fields: [
            { id: 'prc', label: 'PRC', default: '0' },
            { id: 'vcu', label: 'VCU', default: '0' },
            { id: 'fc', label: 'FC', default: '0' },
            { id: 'prf', label: 'PRF', default: '0' },
          ],
          compute: (v, env) => {
            const q = F.breakEvenQuantity(env.num(v.prc), env.num(v.vcu), env.num(v.fc), env.num(v.prf))
            return { lines: [`QBE=${env.fmt(q)}`, `SBE=${env.fmt(q * env.num(v.prc))}`], ans: q }
          },
        },
      },
      {
        label: 'Margin of safety',
        node: {
          kind: 'form',
          title: 'MOS',
          fields: [
            { id: 'sal', label: 'SAL', default: '0' },
            { id: 'sbe', label: 'SBE', default: '0' },
          ],
          compute: (v, env) => {
            const m = F.marginOfSafety(env.num(v.sal), env.num(v.sbe))
            return { lines: [`MOS=${env.fmt(m)}`], ans: m }
          },
        },
      },
      {
        label: 'Operating leverage',
        node: {
          kind: 'form',
          title: 'DOL',
          fields: [
            { id: 'sal', label: 'SAL', default: '0' },
            { id: 'vc', label: 'VC', default: '0' },
            { id: 'fc', label: 'FC', default: '0' },
          ],
          compute: (v, env) => {
            const d = F.operatingLeverage(env.num(v.sal), env.num(v.vc), env.num(v.fc))
            return { lines: [`DOL=${env.fmt(d)}`], ans: d }
          },
        },
      },
    ],
  }
}
