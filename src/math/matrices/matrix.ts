import { MathError } from '../arithmetic/value'

export type Matrix = number[][]

export function rows(m: Matrix): number {
  return m.length
}
export function cols(m: Matrix): number {
  return m[0]?.length ?? 0
}

function assertSameShape(a: Matrix, b: Matrix): void {
  if (rows(a) !== rows(b) || cols(a) !== cols(b)) {
    throw new MathError('DimensionError', 'Matrices must have the same dimensions')
  }
}

export function add(a: Matrix, b: Matrix): Matrix {
  assertSameShape(a, b)
  return a.map((row, i) => row.map((v, j) => v + b[i][j]))
}

export function subtract(a: Matrix, b: Matrix): Matrix {
  assertSameShape(a, b)
  return a.map((row, i) => row.map((v, j) => v - b[i][j]))
}

export function multiply(a: Matrix, b: Matrix): Matrix {
  if (cols(a) !== rows(b)) {
    throw new MathError('DimensionError', `Cannot multiply a ${rows(a)}x${cols(a)} matrix by a ${rows(b)}x${cols(b)} matrix`)
  }
  const result: Matrix = []
  for (let i = 0; i < rows(a); i++) {
    const row: number[] = []
    for (let j = 0; j < cols(b); j++) {
      let sum = 0
      for (let k = 0; k < cols(a); k++) sum += a[i][k] * b[k][j]
      row.push(sum)
    }
    result.push(row)
  }
  return result
}

export function transpose(a: Matrix): Matrix {
  const result: Matrix = []
  for (let j = 0; j < cols(a); j++) {
    const row: number[] = []
    for (let i = 0; i < rows(a); i++) row.push(a[i][j])
    result.push(row)
  }
  return result
}

export function determinant(a: Matrix): number {
  if (rows(a) !== cols(a)) throw new MathError('DimensionError', 'Determinant requires a square matrix')
  const n = rows(a)
  if (n === 1) return a[0][0]
  if (n === 2) return a[0][0] * a[1][1] - a[0][1] * a[1][0]
  let det = 0
  for (let col = 0; col < n; col++) {
    const minor = a.slice(1).map((row) => row.filter((_, j) => j !== col))
    det += (col % 2 === 0 ? 1 : -1) * a[0][col] * determinant(minor)
  }
  return det
}

export function inverse(a: Matrix): Matrix {
  const n = rows(a)
  if (n !== cols(a)) throw new MathError('DimensionError', 'Inverse requires a square matrix')
  const det = determinant(a)
  if (Math.abs(det) < 1e-12) throw new MathError('MathError', 'Matrix is singular (determinant is zero)')
  if (n === 1) return [[1 / a[0][0]]]
  const cofactors: Matrix = a.map((row, i) =>
    row.map((_, j) => {
      const minor = a.filter((_, ri) => ri !== i).map((r) => r.filter((_, ci) => ci !== j))
      return ((i + j) % 2 === 0 ? 1 : -1) * determinant(minor)
    }),
  )
  const adjugate = transpose(cofactors)
  return adjugate.map((row) => row.map((v) => v / det))
}
