# Decision: hybrid rational/decimal numeric precision

## Problem

A calculator emulator needs to decide, per the project brief, between `BigInt` and a decimal library for
numeric precision, and explain the tradeoff. A naive choice of plain JS `number` (IEEE-754 double) would show
floating-point artifacts (`0.1 + 0.2 !== 0.3`-style errors) unlike real calculator hardware, which real CASIO
units famously avoid for simple decimal arithmetic.

## Cause

- Pure `number` arithmetic: fast and simple, but exposes binary floating-point rounding error for ordinary
  decimal input, which a calculator emulator must not do (`0.1 + 0.2` must display `0.3`, not
  `0.30000000000000004`).
- Pure arbitrary-precision `Decimal` (via `decimal.js`) for everything: fixes the above, but loses exactness for
  fractions (`1/3` becomes a long repeating decimal instead of staying `1/3`), and real ClassWiz-class
  calculators *do* keep fraction results exact until an irrational operation forces a decimal.
- Pure `BigInt` rationals for everything: exact for rational arithmetic, but has no way to represent `sin(30°)`
  or `√2` — those are fundamentally not rational numbers.

## Solution

`CalcValue` (`src/math/arithmetic/value.ts`) is a tagged union: `{ kind: 'rational', num: bigint, den: bigint }`
or `{ kind: 'decimal', value: Decimal }`. Every arithmetic operator (`add`, `sub`, `mul`, `div`, integer `pow`,
perfect-square `sqrt`, perfect-cube `cbrt`, `factorial`) stays in the `rational` branch when both operands are
rational and the result is exactly representable; the moment an operation is inherently irrational (a
non-perfect root, `pow` with non-integer exponent, or any transcendental function), the value is promoted to
`decimal` (32 significant digits via `decimal.js`) and stays there. Transcendental functions themselves
(`sin`/`cos`/`ln`/`exp`/...) compute at native IEEE-754 double precision (there is no free arbitrary-precision
trig in `decimal.js`) and get wrapped back into `Decimal` afterward — see `/docs/limitations.md` for what this
means in practice (~15-16 significant digits of accuracy on transcendental results, matching what physical
calculator hardware typically delivers anyway).

## Trade-off

- **Gained:** exact fraction display and exact integer arithmetic (matching real calculator behavior), simple
  mental model (rational until proven irrational), no extra heavyweight arbitrary-precision-transcendental
  dependency.
- **Given up:** transcendental results are bounded by double precision rather than being arbitrary-precision;
  a `BigInt`-based value can't be serialized by plain `JSON.stringify` (solved with a custom replacer/reviver
  in `src/calculators/core/serialization.ts`, at the cost of that extra module).
