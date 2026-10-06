# Known limitations

Nothing listed here is simulated in the UI: unbuilt features are either absent or labelled "coming soon".

## Per family

- **ClassWiz CW/EX**: Spreadsheet and Inequality modes are listed as "(coming soon)" and raise a `ModeError`.
  Input is linear text (e.g. `1/3`, `√(2)`), not 2-D textbook templates; results show `a b/c` inline. STAT data is
  entered as comma-separated lists rather than a cell editor. Variable verification (VERIFY), QR codes, the
  Math Box, CALC prompts and language/regional menu translations are not implemented.
- **ES PLUS**: no CALC (variable prompt) function; SOLVE is available. No STAT "distribution" functions (P(, Q(, R().
- **MS**: SD/REG accept `x,freq` / `x,y,freq` with the comma key (hardware uses `;`). `Inv` and `Quad` regressions
  implemented; `r` is not provided for `Quad`.
- **Graphing (9860/CG50/CG100)**: RUN does not do complex numbers, lists-as-values, or matrix arithmetic in
  expressions (matrices are in the MATRIX app). Graph types other than `Y=` (polar, parametric, inequalities),
  CONICS, DYNA, RECUR, E-CON, Picture Plot, Geometry, 3D Graph and Python are "coming soon". The program language
  is an original teaching dialect, not a reproduction of the hardware language. Stat graphs are scatter + linear fit.
- **ClassPad**: CAS covers simplification, expansion, factoring over ℚ (rational roots + irreducible remainder),
  solving polynomials exactly up to degree 2 after removing rational roots (numeric beyond), derivatives and
  integrals of elementary functions with linear inner arguments. No complex mode, matrices, geometry,
  spreadsheet, eActivity documents or multi-page files yet. Trig is in radians.
- **Financial**: BOND uses Term mode (on a coupon date); the date-based accrued-interest mode is not implemented.
  Depreciation assumes a full first year (no YR1 proration). Day counts use the actual calendar (365-day basis).

## Math engine

- Transcendental functions use IEEE-754 doubles wrapped into `Decimal` (~15 significant digits); exact
  rationals stay exact. See `decisions/001-precision-model.md`.
- Percent is postfix `x/100`, not the context-sensitive `a + b%` behaviour of some hardware.
- `log(a,b)` follows the calculator convention log base a of b.
- Numerical calculus: `∫` uses composite Simpson (2000 intervals) and `d/dx` a central difference; results are
  rounded to 12 significant digits to hide method noise.

## Platform

- Persistence is per browser (localStorage); there is no account/sync backend.
- Physical-keyboard Shift/Ctrl act as calculator SHIFT/ALPHA only when tapped on their own.
- No Web Workers yet: every computation is bounded (see `decisions/006-no-web-worker-yet.md`).
- Accessibility: buttons are labelled, displays expose text transcripts (`role=status`), focus is visible and
  reduced motion is honoured; a full WCAG audit with screen-reader users has not been done.
