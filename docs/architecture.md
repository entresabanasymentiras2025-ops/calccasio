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
  execute(event: CalculatorEvent): void   // KEY_PRESS, ENTER, NAV_*, MODE, TOUCH, TEXT_INPUT, RESET, ...
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

No engine file imports React. `src/ui/hooks/useCalculatorEngine.ts` is the only bridge (via
`useSyncExternalStore`); every engine test presses keys and asserts on `getState()` / `getDisplay()` without
rendering anything.

`BaseCalculatorEngine` supplies subscriptions, persistence (with schema-tolerant `loadState` that rejects another
model's state) and generic event routing: semantic events such as `ENTER`, `CLEAR`, `NAV_UP`, `MODE` are mapped to
whichever key of the current layout performs that action, so callers never need model-specific key ids.

## Layers

```
src/math/                       Pure math, no calculator concepts
  parser/                       tokenizer → recursive-descent parser → AST → evaluator (no eval())
  arithmetic/                   CalcValue: exact BigInt rationals, Decimal fallback; logs/exp
  trigonometry/ statistics/ matrices/ vectors/ complex/ baseN/ probability/ numerical/ calculus/
  finance/                      TVM, amortization, cash flow (NPV/IRR/PBP), dates, depreciation, bonds, break-even
  symbolic/                     CAS: expression tree, simplifier, polynomial algebra, calculus, command front end
src/calculators/
  core/                         Engine contract, state, events, memory, keyboard, display models, Menu system
  shared/                       FormApplet (declarative wizard state machine), number formatting, mode specs
  scientific/                   ScientificEngineBase + mode catalog (shared by ClassWiz, ES PLUS, MS, Financial)
  classwiz/ esplus/ ms/         Family engines + keyboards
  graphing/                     GraphingEngineBase, plot utilities, program VM, F-key keyboard
  graph9860/ cg50/ cg100/       Graphing family engines (profiles, app catalogues, keyboards)
  classpad/                     Touch-document CAS engine
  financial/                    Financial engine + mode specs
  engineRegistry.ts             registerEngine() with lazy loaders (one chunk per family)
  registry.ts                   registerCalculator / registerKeyboardLayout / registerDisplayProfile
src/models/                     calculatorCatalog.ts (single source of truth), types.ts
src/ui/                         React pages/components; only talk to the engine interface
src/storage/                    localStorage helpers, favourites and preferences (Zustand)
src/utils/logger.ts             Leveled logger (debug off in production; ring buffer for the inspector)
```

## Engines and what they share

| Engine | Base | Display model | What is family-specific |
| --- | --- | --- | --- |
| `ClassWizEngine` (CW + EX) | `ScientificEngineBase` | `text` | CW/EX key naming (HOME/TOOLS/FORMAT vs MENU/OPTN/S⇔D), mode order, planned modes |
| `ESPlusEngine` | `ScientificEngineBase` | `text` | Numbered MODE list, SHIFT+MODE setup, CALC/SOLVE, fraction key, hyp/RCL, error wording, EQN ≤ 3 |
| `MSEngine` | `ScientificEngineBase` | `text` | Paged MODE screens, decimal-first + a⌟b⌟c results, SD/REG with DT entry and S-SUM/S-VAR, CLR menu |
| `FinancialEngine` | `ScientificEngineBase` | `text` | One key per financial mode, SOLVE on the highlighted variable, `features`-gated DEPR/BOND/BEVN |
| `Graph9860Engine` | `GraphingEngineBase` | `screen` 128×64 mono | App catalogue, F-keys |
| `CG50Engine` | `GraphingEngineBase` | `screen` 384×216 colour | Colour profile, per-function colours, app catalogue |
| `CG100Engine` | `GraphingEngineBase` | `screen` 384×216 colour | No F-keys (TOOLS menu), HOME/BACK/OK keys, Graph&Table app |
| `ClassPadEngine` | `BaseCalculatorEngine` | `document` | Touch-first: TOUCH/TEXT_INPUT events, CAS work area, graph app, soft keyboard |

ScientificEngineBase owns the expression editor, SHIFT/ALPHA, STO/RCL, memory and variables, history replay,
SETUP and OPTN menus, SOLVE/ENG/S⇔D, and dispatch into per-mode applets. A family overrides only what differs
(`profile`, `openModeMenu`, `onModeKeyInMenu`, `dispatch`, `formatResult`, `preprocess`). The MS engine, for
example, replaces the mode menu, result formatting and statistics entry entirely. CG100 deliberately shares only
the generic graphing infrastructure with CG50; its command surface and app catalogue are its own.

## Capability-driven configuration

Every model in `calculatorCatalog.ts` declares `family`, `engine`, `displayProfile`, `keyboardProfile`,
`regionVariant`, `languageProfile`, `capabilities` and optional `features`. Nothing branches on a model id:

- Scientific engines filter their mode list by capability flags (fx-82CW never offers MATRIX).
- The financial engine enables DEPR/BOND/BEVN from `features` (FC-200V) — not from `if (id === ...)`.
- `ENGINE_SUPPORT` records which capabilities each engine really implements; `implementationStatus` is
  **derived** (`full` / `partial`), and the UI labels every unimplemented declared capability "coming soon".
  A test asserts the two never disagree, so the catalog cannot advertise a fake feature.

## Mode applets and menus

`core/Menu.ts` is the single menu implementation (navigation, numbered shortcuts, submenus, back/cancel, grid
navigation for icon menus, text rendering). `shared/FormApplet.ts` is a declarative "choose → fill values →
results" state machine used by EQUATION, MATRIX, VECTOR, STAT, TABLE, RATIO, DISTRIBUTION, the graphing EQUA /
MATRIX apps, V-Window/Table settings, and every financial worksheet (with field-level SOLVE). Its state is plain
JSON inside `CalculatorState.modeState`, so mode inputs persist across reloads.

## Display models

- `text`: character LCD lines, cursor, inverted highlight line, indicators, title, error text.
- `screen`: dot-matrix content (`lines`, `icons`, `table`, `graph`) with a `ScreenProfile`; the canvas renderer
  draws at native dot coordinates on a supersampled backing store. Graph curves are sampled by the engine
  (one sample per screen column, split at discontinuities), so the renderer contains no maths.
- `document`: ClassPad-style app tabs, toolbar, entries, editable input line and an engine-defined soft keyboard.

## Programs (graphing) — sandbox

`graphing/program/ProgramVM.ts` interprets an original BASIC-style teaching language (assignment, `IF/ELSE/END`,
`FOR/NEXT`, `WHILE/WEND`, `PRINT`, `INPUT`, `STOP`). It is parsed to a tree and executed by a generator with a
100 000-step budget. Expressions go through the shared math evaluator, so a program can only read/write
single-letter numeric variables, print text and request numbers: no DOM, network, storage, `eval` or
`Function`. See `decisions/005-program-vm-sandbox.md`.

## CAS

`math/symbolic/` separates Parser/AST (shared parser with `allowEquations`), the expression tree, the simplifier
(`simplify`, `expand`), polynomial algebra (`toQPoly`, `factor`, `solve`), calculus (`diff`, `integrate`,
`definiteIntegral` with numeric fallback) and numeric evaluation (`approx`). See `decisions/004-cas-design.md`.

## Persistence

Each model persists its full `CalculatorState` under `casio-emulator-hub:calculator-state:<id>` on every change,
plus an optional manual snapshot (`snapshot:<id>`). BigInt values are serialized with a reviver. Models never
share memory. UI preferences (theme, LCD palette) and favourites are separate Zustand stores.

## Performance and offline

Routes and engine families are lazy chunks (`React.lazy` + `registerEngine(id, loader, true)`), so opening the
home page does not download any calculator engine. A build plugin emits `precache-manifest.json`; the service
worker (`public/sw.js`) precaches every asset at install, making all engines available offline after the first
visit. Heavy work is bounded rather than off-loaded (see `decisions/006-no-web-worker-yet.md`).

## Adding things

See the in-app `/docs` page (sections “Add a calculator”, “Create a math function”, “Create a keyboard”,
“Create a display”, “Create a model”) — the same steps apply here.
