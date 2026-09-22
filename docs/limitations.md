# Known limitations

This project follows a strict "no fake features" rule (see `/docs/architecture.md`): anything listed as
unsupported below is genuinely unsupported in the UI, not silently approximated behind the scenes.

## Scope (MVP)

- Only **`classwiz`** has a working engine right now. The other 8 declared engines (`classwiz-ex` shares
  `classwiz`'s implementation; `esplus`, `ms`, `graph9860`, `cg50`, `cg100`, `classpad`, `financial` do not yet
  have implementations) show an explicit "Coming soon" panel on their calculator pages instead of a fake
  calculator. See `/docs/roadmap.md` for build order.
- Within `ClassWizEngine`, only **COMP** (Calculate) mode is implemented. STAT, TABLE, EQUATION, MATRIX, VECTOR,
  COMPLEX, BASE-N, RATIO and DISTRIBUTION modes are listed in the MODE menu (a real, navigable menu) but
  selecting one surfaces a `ModeError` explaining it isn't implemented yet, rather than pretending to switch
  modes.

## Math engine

- **Percent (`%`) is a simple postfix `x / 100`.** Real CASIO hardware applies context-sensitive percent
  behavior in some expressions (e.g. `100 + 10% ⇒ 110`, i.e. "10% of 100" added to 100). Implementing that
  requires the evaluator to see the surrounding binary operator at parse time, which is a bigger structural
  change than the MVP's percent support needs. Documented here rather than silently guessed at.
- **Transcendental functions (trig, log, exp, hyperbolic) compute at IEEE-754 double precision**, then get
  wrapped back into the project's `Decimal` type. Exact rational arithmetic (fractions, integer powers,
  perfect-square/cube roots) stays exact via BigInt numerator/denominator; only irrational operations lose
  precision beyond ~15-16 significant digits. See `/docs/decisions/001-precision-model.md`.
- **No arbitrary-precision transcendental functions.** A from-scratch arbitrary-precision `sin`/`ln`/etc. was
  out of scope for the MVP; `decimal.js` itself doesn't ship these, and pulling in a heavier CAS-grade math
  library was judged not worth the dependency weight for a scientific (non-CAS) calculator tier.
- **Natural (2D "textbook") display rendering is not implemented.** Fractions render as `a/b` inline text (or a
  stacked "whole numerator/denominator" for mixed numbers), not as a true 2D typeset fraction with a horizontal
  bar; matrices, when implemented, will similarly start as bracketed inline text before any stacked/tabular
  rendering is attempted.

## Memory & variables

- Independent memory (`M`) and variables (`A`–`F`, `X`, `Y`) are implemented and persist with the rest of
  calculator state. There is no separate "memory bank" per mode — all COMP-mode variables share one namespace,
  matching the real hardware's single register file.

## Persistence

- State is saved to `localStorage`, scoped per calculator model id. It is **not** synced across devices or
  browsers — there is no backend. Clearing site data / private browsing will lose saved sessions.
- `BigInt` values inside `CalcValue` are serialized through a custom JSON replacer/reviver
  (`src/calculators/core/serialization.ts`) since `JSON.stringify` can't handle `BigInt` natively.

## Accessibility

- Keyboard and screen-reader labeling (`aria-label`, `role="status"` on the display, `role="group"` on the
  keypad) is in place for the implemented ClassWiz engine. Full WCAG-level audit (contrast ratios across both
  themes, comprehensive screen-reader walkthrough) has not been performed yet.

## Testing

- Unit/integration tests (Vitest) and end-to-end tests (Playwright) cover the math engine and the fx-991CW
  vertical slice thoroughly. Other planned models have no dedicated tests yet since they have no implementation
  to test — this is intentional per the MVP scope, not an oversight.
