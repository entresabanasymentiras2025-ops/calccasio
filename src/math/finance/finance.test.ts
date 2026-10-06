import { describe, it, expect } from 'vitest'
import { solveTvm, amortize, simpleInterest, nominalToEffective, effectiveToNominal, type TvmInput } from './tvm'
import { npv, irr, nfv, paybackPeriod } from './cashflow'
import { sellFromCost, costFromSell, marginFrom, daysBetween, addDays, depreciate, bondPrice, bondYield, breakEvenQuantity } from './misc'

const mortgage: TvmInput = { n: 360, iPercent: 6, pv: 200000, pmt: 0, fv: 0, py: 12, cy: 12, begin: false }

describe('TVM (compound interest)', () => {
  it('solves the monthly payment of a 30y mortgage', () => {
    expect(solveTvm(mortgage, 'pmt')).toBeCloseTo(-1199.1010503, 5)
  })
  it('round-trips PV from PMT', () => {
    expect(solveTvm({ ...mortgage, pmt: -1199.1010503 }, 'pv')).toBeCloseTo(200000, 2)
  })
  it('solves FV of a lump sum', () => {
    expect(solveTvm({ n: 10, iPercent: 5, pv: -1000, pmt: 0, fv: 0, py: 1, cy: 1, begin: false }, 'fv')).toBeCloseTo(1628.894627, 5)
  })
  it('solves n', () => {
    expect(solveTvm({ ...mortgage, pmt: -1199.1010503 }, 'n')).toBeCloseTo(360, 4)
  })
  it('solves the interest rate', () => {
    expect(solveTvm({ ...mortgage, pmt: -1199.1010503 }, 'iPercent')).toBeCloseTo(6, 6)
  })
  it('handles annuity due (Begin)', () => {
    const pmt = solveTvm({ n: 12, iPercent: 12, pv: 1000, pmt: 0, fv: 0, py: 12, cy: 12, begin: true }, 'pmt')
    expect(pmt).toBeCloseTo(-87.9691, 3)
  })
  it('handles zero interest', () => {
    expect(solveTvm({ n: 10, iPercent: 0, pv: 1000, pmt: 0, fv: 0, py: 12, cy: 12, begin: false }, 'pmt')).toBeCloseTo(-100)
  })
})

describe('amortization', () => {
  it('first payment splits into interest and principal', () => {
    const row = amortize({ ...mortgage, pmt: -1199.1010503 }, 1, 1)
    expect(row.int).toBeCloseTo(-1000, 4)
    expect(row.prn).toBeCloseTo(-199.1010503, 4)
    expect(row.bal).toBeCloseTo(199800.8989, 3)
  })
  it('balance reaches zero at the end', () => {
    expect(amortize({ ...mortgage, pmt: -1199.1010503 }, 1, 360).bal).toBeCloseTo(0, 2)
  })
})

describe('simple interest & conversion', () => {
  it('computes simple interest on a 365-day basis', () => {
    const r = simpleInterest(120, 7, -1000)
    expect(r.si).toBeCloseTo(23.0137, 4)
    expect(r.sfv).toBeCloseTo(976.9863, 4)
  })
  it('converts nominal ↔ effective', () => {
    expect(nominalToEffective(12, 12)).toBeCloseTo(12.6825, 4)
    expect(effectiveToNominal(12.682503, 12)).toBeCloseTo(12, 5)
  })
})

describe('cash flow', () => {
  it('npv / irr / nfv', () => {
    expect(npv(10, [-100, 60, 60])).toBeCloseTo(4.1322, 4)
    expect(irr([-100, 60, 60])).toBeCloseTo(13.0662, 3)
    expect(nfv(10, [-100, 60, 60])).toBeCloseTo(5, 4)
  })
  it('payback period', () => {
    expect(paybackPeriod(0, [-100, 50, 50, 50])).toBeCloseTo(2)
    expect(paybackPeriod(0, [-100, 10])).toBeNull()
  })
})

describe('cost/sell/margin, days, depreciation, bonds, break-even', () => {
  it('margin relations', () => {
    expect(sellFromCost(80, 20)).toBeCloseTo(100)
    expect(costFromSell(100, 20)).toBeCloseTo(80)
    expect(marginFrom(80, 100)).toBeCloseTo(20)
  })
  it('days between dates and date arithmetic', () => {
    expect(daysBetween('2024-01-01', '2024-12-31')).toBe(365)
    expect(daysBetween('2023-01-01', '2023-12-31')).toBe(364)
    expect(addDays('2024-02-28', 2)).toBe('2024-03-01')
    expect(() => daysBetween('2023-02-30', '2023-03-01')).toThrow()
  })
  it('depreciation', () => {
    expect(depreciate('SL', 5, 0, 10000, 0, 1).depreciation).toBeCloseTo(2000)
    expect(depreciate('SYD', 5, 0, 15000, 0, 1).depreciation).toBeCloseTo(5000)
    expect(depreciate('FP', 5, 20, 10000, 0, 2).depreciation).toBeCloseTo(1600)
    expect(depreciate('DB', 5, 200, 10000, 0, 1).depreciation).toBeCloseTo(4000)
  })
  it('bond price ↔ yield', () => {
    expect(bondPrice(10, 100, 5, 5, 2)).toBeCloseTo(100, 8)
    const p = bondPrice(20, 100, 6, 8, 2)
    expect(p).toBeCloseTo(86.4097, 3)
    expect(bondYield(20, 100, 6, p, 2)).toBeCloseTo(8, 6)
  })
  it('break-even', () => {
    expect(breakEvenQuantity(10, 6, 2000)).toBe(500)
    expect(breakEvenQuantity(10, 6, 2000, 400)).toBe(600)
  })
})
