/** Numerical derivative via central difference. */
export function derivative(f: (x: number) => number, x: number, h = 1e-6): number {
  return (f(x + h) - f(x - h)) / (2 * h)
}

/** Numerical definite integral via composite Simpson's rule. */
export function integrate(f: (x: number) => number, a: number, b: number, steps = 1000): number {
  const n = steps % 2 === 0 ? steps : steps + 1
  const h = (b - a) / n
  let sum = f(a) + f(b)
  for (let i = 1; i < n; i++) {
    const x = a + i * h
    sum += (i % 2 === 0 ? 2 : 4) * f(x)
  }
  return (h / 3) * sum
}
