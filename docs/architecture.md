# Architecture

## Guiding rule: engines never know about React

`src/calculators/core/CalculatorEngine.ts` defines the contract every calculator implements:

```ts
interface CalculatorEngine<TState extends CalculatorState = CalculatorState> {
  readonly modelId: string
  readonly keyboardLayout: KeyboardLayout
  initialize(): TState
  pressKey(keyId: string): void
  releaseKey(keyId: string): void
  execute(event: CalculatorEvent): void
  reset(): void
  getState(): TState
  setState(state: TState): void
  getDisplay(): CalculatorDisplayState
  getMemory(): CalculatorMemory
  saveState(): string
  loadState(serialized: string): void
  subscribe(listener: () => void): () => void
}
```

No engine file imports `react`. `src/ui/hooks/useCalculatorEngine.ts` is the *only* place a React hook talks to
an engine, via `useSyncExternalStore` — this is what makes `ClassWizEngine.test.ts` able to press 18 different
key sequences and assert on `engine.getState()` without ever mounting a component. Math correctness and state
machine correctness are provable independently of rendering.

`src/calculators/core/BaseCalculatorEngine` supplies the plumbing every engine needs (subscription list, generic
KEY_PRESS routing, save/load via `serializeState`/`deserializeState`) so a new family only has to implement
`initialize()`, `handleKeyId()` and `getDisplay()`.

## Layered structure

```
src/math/          Pure math, zero calculator-specific concepts. Tokenizer → Parser → AST → Evaluator.
                    Sub-modules per topic (arithmetic, trigonometry, statistics, matrices, complex, calculus).
src/calculators/
  core/             CalculatorEngine contract + CalculatorState/Event/Memory/Display/Keyboard types.
  classwiz/         ClassWizEngine: COMP mode, SHIFT/ALPHA, memory, history, mode menu.
  engineRegistry.ts Maps a model's declared `engine` id to a concrete engine factory (registerEngine()).
src/models/
  types.ts               CalculatorModelConfig, CalculatorCapabilities.
  calculatorCatalog.ts    Every model the platform knows about — the single source of truth.
src/ui/
  hooks/useCalculatorEngine.ts   Bridges an engine into React (subscribe + persist).
  components/                    KeyboardGrid, CalculatorDisplayPanel, CalculatorView, HistoryPanel, ...
  pages/                         Home, Catalog, Calculator, Favorites, Compare, Docs.
src/storage/        localStorage helpers + Zustand favorites store.
```

## Capability-driven configuration

Nothing in the UI branches on a model id. `CalculatorCard`, `CatalogPage`, `ComparePage` and `CalculatorPage`
all read `CalculatorModelConfig.capabilities` / `.implementationStatus` / `.engine` from
`calculatorCatalog.ts`. Adding fx-82CW's real engine later is a matter of implementing `esplus`/`classwiz`
variance if needed and calling `registerEngine()` — no existing call site changes.

```ts
// engineRegistry.ts
const registry = new Map<EngineId, EngineFactory>([
  ['classwiz', (config) => new ClassWizEngine(config)],
])
export function registerEngine(id: EngineId, factory: EngineFactory) { registry.set(id, factory) }
```

## Adding a calculator

1. Add an entry to `src/models/calculatorCatalog.ts` (or a new `VariantSpec` in an existing family array) with
   accurate `capabilities`.
2. If it's a new engine family, implement `CalculatorEngine` in `src/calculators/<family>/`, following the
   pattern in `ClassWizEngine.ts` (extend `BaseCalculatorEngine`, implement `initialize()`/`handleKeyId()`/
   `getDisplay()`), and call `registerEngine('<family>', (config) => new YourEngine(config))`.
3. If the model needs its own key layout, define a `KeyboardLayout` next to the engine (see
   `ClassWizKeyboard.ts`) — `KeyboardGrid` renders any layout generically from row/col + variant metadata.
4. Nothing else changes: the catalog, calculator page routing (`/calculator/:id`), compare page and favorites
   all pick up the new entry automatically.

## Why ClassWiz CW and EX share one engine, but MS doesn't

CW and EX are the same interaction model (natural textbook display, SHIFT/ALPHA, same menu structure) at two
firmware generations — CASIO's own materials describe EX as the prior generation of the same design language CW
continues. Their `CalculatorModelConfig.engine` is `'classwiz'` for both.

MS is a genuinely different interaction model: single-line non-natural display, different SHIFT/ALPHA
conventions, no Spreadsheet/CAS-adjacent modes. Rather than special-casing MS behavior inside `ClassWizEngine`
with `if (isMSModel)` branches, MS gets `engine: 'ms'` and (once implemented) its own `MSEngine`. This mirrors
the project brief's explicit instruction: "No intentes hacer que MS se comporte exactamente como CW."

## The math engine

`src/math/parser` implements a hand-written recursive-descent parser (no `eval()`, ever):

```
expression := term (('+' | '-') term)*
term       := unary (('*' | '/' | implicit) unary)*
unary      := ('-' | '+') unary | power
power      := postfix ('^' unary)?      // right-associative
postfix    := primary ('!' | '%')*
primary    := NUMBER | IDENT ('(' args ')')? | '(' expression ')'
```

Implicit multiplication (`2π`, `2(3+4)`, `3sin(30)`) is handled in `parseTerm` by checking whether the next
token can start a new factor. `-2^2` evaluates to `-4` (unary minus binds looser than `^`), matching standard
calculator convention; `2^-3` still works because `^`'s right-hand side is itself a `unary`.

`CalcValue` (`src/math/arithmetic/value.ts`) keeps numbers as exact BigInt rationals for as long as every
operation involved stays rational (so `1/3 * 3` is exactly `1`, and fraction results display as `a/b`), and
only falls back to `Decimal` (32-digit fixed precision via `decimal.js`) once an irrational operation (a
non-perfect-square root, trig, log, `exp`) is applied. See "Precision" in `/docs/decisions/001-precision-model.md`
for the tradeoffs.

## Display and keyboard are declarative, not hardcoded

`CalculatorDisplayState` (`kind: 'text'`, `lines`, `cursorLine/Col`, `indicators`, `errorMessage`) is produced
by each engine's `getDisplay()` and rendered by one shared `CalculatorDisplayPanel` component. Graphing/CAS
engines will extend this with a `kind: 'canvas'` variant later without breaking the text-display contract that
scientific calculators use today.

`KeyboardLayout`/`KeyDefinition` (`src/calculators/core/CalculatorKeyboard.ts`) describe every key's grid
position, primary/shift/alpha actions and physical-keyboard bindings as data. `KeyboardGrid.tsx` renders any
layout from that data and dispatches `engine.pressKey(keyId)` — no component hardcodes "if key is 7, insert 7".

## No fake features

Per the project brief's explicit rule, a feature that isn't implemented is never simulated. Concretely:

- `ClassWizEngine`'s MODE menu lists every mode the model capability-declares (STAT, MATRIX, ...), but selecting
  one that isn't implemented sets a `ModeError` ("... is not implemented yet in this build") instead of silently
  switching to a non-functional mode.
- `CalculatorPage` renders a "Coming soon" panel — not a decorative fake calculator — for any model whose
  `engine` has no registered factory or whose `implementationStatus` isn't `'full'`.
- Memory (`M+`/`M-`/`MR`/`MC`, `STO`+letter) and history are real, persisted state, not cosmetic UI.
