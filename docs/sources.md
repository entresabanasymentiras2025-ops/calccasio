# Sources

This document records what informed the functional capability data in
[`/docs/calculator-matrix.md`](./calculator-matrix.md) and the family descriptions used throughout the app.

## Priority order followed

1. CASIO's own publicly published product pages and specification sheets (region-agnostic feature lists: which
   modes, functions and display types a model line offers).
2. Publicly published user guides / quick-start guides (used only to confirm *functional* behavior — what a mode
   does, not to copy screenshots, icon art, or paragraph text).
3. Secondary sources (educational retailer spec comparisons, standards bodies' approved-calculator lists for
   exams) only where primary sources were ambiguous, and only for coarse-grained facts (e.g. "has a solar
   panel", "exam-approved in region X") never for implementation details.

## How this was used

- Family-level capability tiers (`SCI_BASIC`, `SCI_MID`, `SCI_FULL`, `MS_BASIC`, `MS_MID`, `GRAPHING`, `CAS`,
  `FINANCE` in `src/models/calculatorCatalog.ts`) are **approximations** built from the general pattern CASIO
  uses across its scientific calculator lineup: entry-level models (fx-82-class) ship arithmetic, fractions,
  basic statistics and tables; mid-tier models (fx-350/570-class) add complex numbers, equation solving and
  base-N; flagship models (fx-991-class and above) add matrices, vectors, calculus and (on the newest ClassWiz
  CW generation) a spreadsheet mode.
- Regional/language variants (DE, LA, SP, GT, AR, CE, VN, ZA, AU, JP, FR, NL, ID, US...) are recorded as
  `regionVariant`/`languageProfile` metadata because CASIO documents them as localized SKUs of the same
  underlying hardware/firmware generation, not functionally distinct calculators.
- Graphing (fx-9750/9860GIII, GRAPH35+E II), color graphing (fx-CG50, GRAPH90+E) and touchscreen graphing
  (fx-CG100, GRAPH MATH+) are treated as three distinct engines per the project brief, even though their
  public feature lists overlap significantly, because their display technology and input model (button-only
  vs. touchscreen) differ enough to warrant separate `CalculatorEngine` implementations later.
- ClassPad (fx-CP400, fx-CG500) and Financial (FC-100V, FC-200V) capability flags come from CASIO's own
  category descriptions ("CAS scientific calculator" and "financial consultant" respectively).

## Explicit disclaimer

**The capability matrix is a conservative, general-purpose approximation, not a verified per-SKU
specification.** Exact function availability can differ by hardware revision or regional firmware. Nothing in
this repository claims pixel- or menu-exact parity with any specific physical unit's manual. If you notice an
inaccuracy, please open an issue — capability flags are centralized in one file
(`src/models/calculatorCatalog.ts`) specifically so corrections are a small, localized change.

## What was deliberately not used

- No CASIO ROM, firmware, or emulator binaries were downloaded, inspected, or referenced.
- No manual PDFs were bulk-copied; only high-level *functional* facts (e.g. "supports 4x4 matrices") were
  extracted, in the implementer's own words.
- No CASIO icon, logo, or photographed product image was used as a reference asset for any UI graphic in this
  project.
