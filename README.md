# CASIO Emulator Hub

A web platform for using **independent, from-scratch emulations** of the interfaces and functional behavior of
different families of scientific, graphing, CAS and financial calculators — right in your browser. Real key
presses, real math, real memory, real persistence.

> **Independent project, not affiliated with, sponsored by, or endorsed by CASIO Computer Co., Ltd.** CASIO and
> its product names are trademarks of their respective owners, used here solely to identify which calculator's
> publicly documented behavior is being emulated. See [`/docs/legal.md`](./docs/legal.md).

## What this is (and isn't)

- ✅ A fully functional calculator you can type on, get real results from, switch modes on, and come back to
  later with your session intact.
- ✅ Original code: state machines, math engine, keyboard, and LCD-style display all implemented from scratch.
- ❌ Not a CASIO product, not a ROM/firmware emulator, not a mockup with fake buttons.

## Quick start

```sh
npm install
npm run dev        # http://localhost:5173
```

```sh
npm run build       # type-checks + production build
npm run preview      # serve the production build locally
npm test              # Vitest unit/integration suite
npm run test:e2e       # Playwright end-to-end suite (builds + serves + runs)
npm run lint             # oxlint
```

## What's implemented right now

The MVP vertical slice is the **ClassWiz engine**, in COMP (Calculate) mode, serving both **fx-991CW** and
**fx-991EX** (the CW and EX generations share one interaction model — see
[`/docs/architecture.md`](./docs/architecture.md)):

- Full expression parsing/evaluation (arithmetic, trig, logs, powers/roots, factorial, percent, scientific
  notation) with an original recursive-descent parser — no `eval()`.
- Exact-fraction arithmetic that falls back to high-precision decimal only when the math is genuinely
  irrational (see [`/docs/decisions/001-precision-model.md`](./docs/decisions/001-precision-model.md)).
- SHIFT / ALPHA secondary functions, independent memory (`M+`/`M-`/`MR`/`MC`), `STO`-to-variable, `Ans`,
  calculation history, a real (non-decorative) MODE menu.
- DEG/RAD/GRAD angle modes, structured error codes (`SyntaxError`, `MathError`, `DomainError`, ...).
- Physical keyboard support, session persistence via `localStorage`, fullscreen mode, catalog search/filter,
  favorites, and a functional (non-subjective) side-by-side comparator across all 90 cataloged models.

The other 88 cataloged models — every ClassWiz CW/EX regional variant besides the two flagships, and all of ES
PLUS, MS, graphing, CG50, CG100, ClassPad and Financial — are real metadata in the catalog (family, capabilities,
tagline) with an honest "Coming soon" state on their calculator page, never a fake or partially-wired UI. See
[`/docs/roadmap.md`](./docs/roadmap.md) for build order and [`/docs/calculator-matrix.md`](./docs/calculator-matrix.md)
for the full list.

## Architecture

```
src/math/            Dependency-light math engine: tokenizer → parser → AST → evaluator, plus
                      per-topic modules (trigonometry, statistics, matrices, complex, calculus).
src/calculators/
  core/               React-agnostic CalculatorEngine contract (state, events, memory, display, keyboard).
  classwiz/           ClassWizEngine — the only implemented engine today.
  engineRegistry.ts   Maps a model's `engine` id to a concrete engine (registerEngine()).
src/models/           calculatorCatalog.ts — single source of truth for every calculator model.
src/ui/               React hooks/components/pages. Only ever talks to CalculatorEngine.
src/storage/          localStorage helpers + Zustand favorites store.
```

Full details, including "why ClassWiz CW/EX share an engine but MS doesn't" and "how to add a calculator", are
in [`/docs/architecture.md`](./docs/architecture.md).

## Adding a calculator

1. Add an entry to `src/models/calculatorCatalog.ts` with accurate `capabilities`.
2. New family? Implement `CalculatorEngine` in `src/calculators/<family>/` and register it via
   `registerEngine()` in `src/calculators/engineRegistry.ts`.
3. New keyboard? Add a `KeyboardLayout` next to the engine — the UI renders any layout generically.
4. Nothing else changes — catalog, routing, compare and favorites pick it up automatically.

See [`/docs/architecture.md`](./docs/architecture.md) for the walkthrough with code references.

## Testing

- **Unit/integration** (`npm test`, Vitest + React Testing Library): the math engine (tokenizer, parser,
  evaluator, arithmetic/trig/log/matrix/statistics/complex modules), the `ClassWizEngine` state machine (key
  presses, SHIFT/ALPHA, memory, modes, errors, persistence), and React component integration (real clicks →
  real display updates).
- **End-to-end** (`npm run test:e2e`, Playwright against a production build): opening fx-991CW and computing
  `2+2=4`, SHIFT secondary functions, physical-keyboard input, memory round-trips, the MODE menu's honest
  "not implemented" message, session persistence across reload, and catalog/favorites/compare navigation.

## Documentation

| Doc | Contents |
| --- | --- |
| [`/docs/calculator-matrix.md`](./docs/calculator-matrix.md) | Every cataloged model, its capabilities, and implementation status |
| [`/docs/architecture.md`](./docs/architecture.md) | Engine contract, layering, how to add a calculator |
| [`/docs/limitations.md`](./docs/limitations.md) | What's genuinely not implemented yet, and why |
| [`/docs/legal.md`](./docs/legal.md) | Independence notice and trademark usage |
| [`/docs/roadmap.md`](./docs/roadmap.md) | Phase-by-phase build order |
| [`/docs/licenses.md`](./docs/licenses.md) | Third-party dependency licenses |
| [`/docs/sources.md`](./docs/sources.md) | What informed the capability matrix, and its accuracy caveats |
| [`/docs/decisions/`](./docs/decisions/) | Problem/cause/solution/trade-off write-ups for notable engineering decisions |

## License

Original source code is MIT-licensed — see [`LICENSE`](./LICENSE). This does not extend to third-party
trademarks or software; see [`/docs/legal.md`](./docs/legal.md) and [`/docs/licenses.md`](./docs/licenses.md).
