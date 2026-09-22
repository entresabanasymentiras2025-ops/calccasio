# Roadmap

Tracks the build order from the project brief. Status reflects this repository's current state, not intent.

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Core: `CalculatorEngine` contract, `CalculatorState`/`Event`/`Memory`/`Display`/`Keyboard`, math parser/evaluator, generic `KeyboardGrid`/`CalculatorDisplayPanel` | ✅ Done |
| 2 | ClassWiz engine + fx-991CW vertical slice (COMP mode, SHIFT/ALPHA, memory, history, mode menu, persistence), reused as-is for fx-991EX | ✅ Done |
| 3 | ES PLUS engine (`ESPlusEngine`, two-line non-natural display rules) | ⚪ Planned |
| 4 | MS engine (`MSEngine`, single-line display, its own interaction model) | ⚪ Planned |
| 5 | Graphing engine (`Graph9860Engine`): function plotting, viewport/zoom/pan, tables, basic programming VM | ⚪ Planned |
| 6 | fx-CG50 engine (`CG50Engine`): color display, same functional surface as phase 5 plus geometry | ⚪ Planned |
| 7 | fx-CG100 engine (`CG100Engine`): touchscreen input model, kept separate from CG50 per architecture notes | ⚪ Planned |
| 8 | ClassPad engine (`ClassPadEngine`): CAS (Parser → AST → Simplifier → SymbolicEvaluator → Differentiation/Integration/EquationSolver), document/page model, touch | ⚪ Planned |
| 9 | Financial engine (`FinancialEngine`): TVM, cash flow, amortization, bonds, depreciation, conversions | ⚪ Planned |
| 10 | Polish: PWA (installable, offline-capable), performance (lazy-loaded engines, Web Workers for heavy calculus/statistics), full accessibility audit, SEO metadata sweep across all model pages | ⚪ Planned |

## Near-term next steps (once phase 3 starts)

1. Confirm ES PLUS's two-line (non-natural) editing model differs enough from ClassWiz's natural display to
   need its own `CalculatorDisplayState` handling, or whether it can reuse `kind: 'text'` with different
   line-wrapping rules.
2. Extend `calculatorCatalog.ts`'s `esPlusVariants` entries' `implementationStatus` to `'full'` for fx-991ES
   PLUS once `ESPlusEngine` passes an equivalent test suite to `ClassWizEngine.test.ts`.
3. Add ES PLUS-specific Playwright specs mirroring `e2e/fx991cw.spec.ts`.

Each phase should ship with: engine unit tests, an updated `calculatorCatalog.ts` entry (`implementationStatus:
'full'`), and at least one Playwright spec proving the "press keys → real result" golden path, before the next
phase starts — per the project's "vertical slice first" rule.
