import { describe, it, expect } from 'vitest'
import { parseProgram, runProgram, ProgramError, SAMPLE_PROGRAMS, evalCondition } from './ProgramVM'
import { toNumber, fromInt } from '../../../math/arithmetic/value'

function run(src: string, inputs: number[] = []) {
  const env = { angleMode: 'DEG' as const, variables: {} as Record<string, ReturnType<typeof fromInt>> }
  const out: string[] = []
  const gen = runProgram(parseProgram(src), env)
  let next = gen.next()
  while (!next.done) {
    if (next.value.type === 'print') {
      out.push(next.value.text)
      next = gen.next()
    } else next = gen.next(inputs.shift())
  }
  return { out, env }
}

describe('ProgramVM', () => {
  it('assigns and prints', () => {
    expect(run('A=2\n3→B\nPRINT "A+B=", A+B').out).toEqual(['A+B= 5'])
  })
  it('IF / ELSE', () => {
    expect(run('A=5\nIF A>3 THEN\nPRINT "big"\nELSE\nPRINT "small"\nEND').out).toEqual(['big'])
  })
  it('FOR with STEP', () => {
    expect(run('S=0\nFOR I=10 TO 1 STEP -3\nS=S+I\nNEXT\nPRINT S').out).toEqual(['22'])
  })
  it('WHILE and INPUT', () => {
    const { out } = run(SAMPLE_PROGRAMS[1].source, [6])
    expect(out).toEqual(['STEPS 8'])
  })
  it('sample SUMSQ', () => {
    expect(run(SAMPLE_PROGRAMS[0].source, [3]).out).toEqual(['SUM= 14'])
  })
  it('STOP ends execution', () => {
    expect(run('PRINT 1\nSTOP\nPRINT 2').out).toEqual(['1'])
  })
  it('stops runaway loops', () => {
    expect(() => run('WHILE 1=1\nA=A+1\nWEND'.replace('A=A+1', 'B=1'))).toThrow(ProgramError)
  })
  it('reports syntax errors with line numbers', () => {
    expect(() => parseProgram('A=1\nGOTO 10')).toThrow(/Line 2/)
    expect(() => parseProgram('FOR I=1 TO 3\nPRINT I')).toThrow(/Missing NEXT/)
  })
  it('has no access to anything but variables (unknown identifiers are errors)', () => {
    expect(() => run('PRINT window')).toThrow(ProgramError)
    expect(() => run('PRINT constructor')).toThrow(ProgramError)
  })
  it('conditions with AND / OR / NOT', () => {
    const env = { angleMode: 'DEG' as const, variables: { A: fromInt(2) } }
    expect(evalCondition('A>1 AND A<3', env, 1)).toBe(true)
    expect(evalCondition('A>5 OR NOT A=2', env, 1)).toBe(false)
  })
  it('keeps variables after running', () => {
    expect(toNumber(run('Z=7').env.variables.Z)).toBe(7)
  })
})
