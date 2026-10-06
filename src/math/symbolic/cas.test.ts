import { describe, it, expect } from 'vitest'
import { evaluateCas, type CasContext } from './cas'

const run = (s: string, ctx: CasContext = { variables: {}, ans: null }) => evaluateCas(s, ctx).output

describe('CAS simplification', () => {
  it('collects like terms', () => expect(run('x+x+2x')).toBe('4x'))
  it('keeps exact fractions', () => expect(run('1/3+1/6')).toBe('1/2'))
  it('combines powers', () => expect(run('x^2*x^3')).toBe('x^5'))
  it('cancels', () => expect(run('x*x^-1')).toBe('1'))
  it('simplifies radicals', () => {
    expect(run('sqrt(8)')).toBe('2√(2)')
    expect(run('sqrt(1/4)')).toBe('1/2')
  })
  it('exact trig values', () => {
    expect(run('sin(pi/6)')).toBe('1/2')
    expect(run('cos(pi)')).toBe('-1')
    expect(run('cos(pi/6)')).toBe('√(3)/2')
  })
  it('logs and exponentials', () => {
    expect(run('ln(e)')).toBe('1')
    expect(run('exp(ln(x))')).toBe('x')
  })
})

describe('CAS expand / factor', () => {
  it('expands a binomial square', () => expect(run('expand((x+1)^2)')).toBe('x^2+2x+1'))
  it('expands a product', () => expect(run('expand((x-2)(x+3))')).toBe('x^2+x-6'))
  it('factors a quadratic', () => expect(run('factor(x^2-5x+6)')).toBe('(x-2)(x-3)'))
  it('factors with a leading coefficient', () => expect(run('factor(2x^2-2)')).toBe('2(x-1)(x+1)'))
  it('factors a cubic with an irreducible part', () => expect(run('factor(x^3-x^2+x-1)')).toBe('(x-1)(x^2+1)'))
  it('factors repeated roots', () => expect(run('factor(x^2+2x+1)')).toBe('(x+1)^2'))
})

describe('CAS solve', () => {
  it('linear', () => expect(run('solve(2x+3=7,x)')).toBe('{x=2}'))
  it('quadratic with rational roots', () => expect(run('solve(x^2-4=0,x)')).toBe('{x=-2, x=2}'))
  it('quadratic with irrational roots', () => expect(run('solve(x^2-2=0,x)')).toBe('{x=-√(2), x=√(2)}'))
  it('no real roots', () => expect(run('solve(x^2+1=0,x)')).toMatch(/No solution|Complex/))
  it('cubic', () => expect(run('solve(x^3-6x^2+11x-6=0,x)')).toBe('{x=1, x=2, x=3}'))
  it('non-polynomial numerically', () => expect(run('solve(cos(x)=x,x)')).toMatch(/x=0\.739085133/))
})

describe('CAS calculus', () => {
  it('derivative of a polynomial', () => expect(run('diff(x^3+2x,x)')).toBe('3x^2+2'))
  it('product and chain rule', () => expect(run('diff(x*sin(x),x)')).toBe('x*cos(x)+sin(x)'))
  it('chain rule', () => expect(run('diff(sin(2x),x)')).toBe('2cos(2x)'))
  it('second derivative', () => expect(run('diff(x^4,x,2)')).toBe('12x^2'))
  it('ln derivative', () => expect(run('diff(ln(x),x)')).toBe('1/x'))
  it('integrates polynomials', () => expect(run('integrate(3x^2+1,x)')).toBe('x^3+x'))
  it('integrates 1/x', () => expect(run('integrate(1/x,x)')).toBe('ln(|x|)'))
  it('integrates sin(2x)', () => expect(run('integrate(sin(2x),x)')).toBe('-cos(2x)/2'))
  it('integrates e^(3x)', () => expect(run('integrate(exp(3x),x)')).toBe('e^(3x)/3'))
  it('definite integral exact', () => expect(run('integrate(x^2,x,0,3)')).toBe('9'))
  it('definite integral numeric fallback', () => expect(run('integrate(exp(-x^2),x,0,1)')).toMatch(/^0\.746824132\d* \(numeric\)$/))
})

describe('CAS variables and errors', () => {
  it('assignment and substitution', () => {
    const ctx: CasContext = { variables: {}, ans: null }
    expect(run('a:=3', ctx)).toBe('a := 3')
    expect(run('a*x+a', ctx)).toBe('3x+3')
  })
  it('approx', () => expect(run('approx(sqrt(2))')).toBe('1.414213562'))
  it('syntax errors throw', () => expect(() => run('2+*3')).toThrow())
})
