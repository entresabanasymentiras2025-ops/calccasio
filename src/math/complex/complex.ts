export interface Complex {
  re: number
  im: number
}

export function complex(re: number, im = 0): Complex {
  return { re, im }
}

export function add(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im }
}

export function subtract(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im }
}

export function multiply(a: Complex, b: Complex): Complex {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }
}

export function divide(a: Complex, b: Complex): Complex {
  const denom = b.re * b.re + b.im * b.im
  if (denom === 0) throw new Error('Division by zero')
  return { re: (a.re * b.re + a.im * b.im) / denom, im: (a.im * b.re - a.re * b.im) / denom }
}

export function modulus(a: Complex): number {
  return Math.hypot(a.re, a.im)
}

export function argument(a: Complex): number {
  return Math.atan2(a.im, a.re)
}

export function conjugate(a: Complex): Complex {
  return { re: a.re, im: -a.im }
}

export function fromPolar(r: number, theta: number): Complex {
  return { re: r * Math.cos(theta), im: r * Math.sin(theta) }
}

export function toPolar(a: Complex): { r: number; theta: number } {
  return { r: modulus(a), theta: argument(a) }
}
