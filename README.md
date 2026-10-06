# CASIO Emulator Hub

An educational web platform with **independent, from-scratch emulations** of the interfaces and functional
behaviour of scientific, graphing, CAS and financial calculator families — in the browser. Real key presses,
real maths, real modes, real memory, real persistence.

> **Proyecto independiente y no afiliado, patrocinado ni respaldado por CASIO Computer Co., Ltd. CASIO y los
> nombres de sus productos son marcas de sus respectivos propietarios.** Model names are used only to identify
> which calculator's publicly documented behaviour is emulated. No ROMs, firmware, manuals, logos or official
> artwork are used. See [`docs/legal.md`](./docs/legal.md).

## What works today

| Family | Example URL | Highlights |
| --- | --- | --- |
| ClassWiz CW / EX (52 models) | `/calculator/fx-991cw`, `/calculator/fx-991ex` | COMP with exact fractions, STAT (1-var + 5 regressions), TABLE, EQUATION (systems up to 4, polynomials up to degree 4 incl. complex roots), MATRIX, VECTOR, COMPLEX, BASE-N, RATIO, DISTRIBUTION, ∫ / d/dx / Σ / Π, SETUP (angle, Fix/Sci, fraction style), S⇔D |
| ES PLUS (19) | `/calculator/fx-991es-plus` | Numbered MODE list, SHIFT+MODE setup, SOLVE, fraction key, RCL/STO, hyp, ENG |
| MS (6) | `/calculator/fx-991ms` | Paged MODE screens, a⌟b⌟c fractions, SD/REG with DT entry and S-SUM/S-VAR |
| fx-9860GIII family (3) | `/calculator/fx-9860giii` | RUN, GRAPH (trace, zoom, pan, V-Window, G-Solve root/max/min/y-icpt/intersection), TABLE, STAT lists, EQUA, MATRIX, PRGM (sandboxed VM) |
| fx-CG50 family (3) | `/calculator/fx-cg50` | Same apps on a 384×216 colour screen with per-function colours |
| fx-CG100 family (3) | `/calculator/fx-cg100` | Separate engine: HOME screen, TOOLS menu instead of F-keys, Graph&Table |
| ClassPad (2) | `/calculator/fx-cp400` | Touch document: simplify, expand, factor, solve, diff, integrate, approx, variables; Graph app |
| Financial (2) | `/calculator/fc-200v` | SMPL, CMPD (TVM with SOLVE), CASH (NPV/IRR/PBP/NFV), AMRT, CNVR, COST, DAYS, STAT, DEPR, BOND, BEVN (FC-200V) |

Each model's page shows which of its capabilities are implemented and which are "coming soon". The status is
derived from code, never hand-written (see [`docs/decisions/003-derived-implementation-status.md`](./docs/decisions/003-derived-implementation-status.md)).
Full per-model table: [`docs/calculator-matrix.md`](./docs/calculator-matrix.md).

Platform features: catalog with search and type/level/status filters, favourites, functional comparator,
per-model history (repeat/copy/delete/clear), save/restore snapshot, reset, fullscreen, physical keyboard
shortcuts, Light/Dark/Calculator-LCD themes with configurable LCD colours, installable offline PWA, per-page SEO
metadata, and a hidden developer inspector at `/dev/calculator-inspector` (dev builds, or `?dev=1`).

## Getting started

```sh
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production build (dist/)
npm run preview      # serve dist/ on http://localhost:4173
npm test             # Vitest: unit, integration, golden files
npm run test:e2e     # Playwright against the production build (run npm run build first)
npm run lint         # oxlint
npm run docs:matrix  # regenerate docs/calculator-matrix.md from the catalog
```

Deploy `dist/` to any static host; configure SPA fallback (all routes → `index.html`).

## Architecture

```
src/math/            Parser, exact arithmetic, trig, stats, matrices, vectors, complex, base-n,
                     probability, equations, finance, symbolic CAS — no eval(), no external API
src/calculators/
  core/              React-free CalculatorEngine contract, state, events, menu system, display/keyboard models
  shared/            FormApplet (declarative mode wizards), number formatting, mode specs
  scientific/        ScientificEngineBase (ClassWiz, ES PLUS, MS, Financial build on it)
  graphing/          GraphingEngineBase, plotting, program VM (Graph9860, CG50, CG100 build on it)
  classwiz/ esplus/ ms/ graph9860/ cg50/ cg100/ classpad/ financial/
  engineRegistry.ts  registerEngine() — lazily loaded engine chunks
  registry.ts        registerCalculator / registerKeyboardLayout / registerDisplayProfile
src/models/          calculatorCatalog.ts — the single source of truth for 90 models
src/ui/              React pages and components (render engine output, forward events)
tests/golden/        Expected input → output files for several families
e2e/                 Playwright specs
docs/                Matrix, architecture, limitations, legal, licenses, sources, roadmap, decisions
```

Details: [`docs/architecture.md`](./docs/architecture.md).

## Adding a calculator

1. **Same family**: add a `VariantSpec` to the family list in `src/models/calculatorCatalog.ts` with accurate
   capability flags (and `features` if needed). The engine derives its modes from them. Run `npm run docs:matrix`.
2. **New family**: implement `CalculatorEngine` (extend `BaseCalculatorEngine`, `ScientificEngineBase` or
   `GraphingEngineBase`), export a factory, `registerEngine('<id>', () => import(...), true)`, and add its
   supported capabilities to `ENGINE_SUPPORT`.
3. **New keyboard / screen**: describe it as data and call `registerKeyboardLayout` / `registerDisplayProfile`.

## Testing

- Unit/integration (Vitest + Testing Library): tokenizer, parser, evaluator, arithmetic, trig, matrices,
  vectors, complex, statistics, distributions, equations, base-n, finance, CAS, menu system, form applets,
  every engine's state machine, persistence, registry, React components, golden files.
- E2E (Playwright): the brief's scenarios (2+2=4 on fx-991CW, SHIFT functions, mode persistence across
  navigation) plus every MVP family, theme/fullscreen, PWA assets and the hidden inspector.

## Roadmap

See [`docs/roadmap.md`](./docs/roadmap.md) and [`docs/limitations.md`](./docs/limitations.md).

## License

Original source code: MIT ([`LICENSE`](./LICENSE)). The license does not cover third-party trademarks, software,
firmware or documentation. Dependency licenses: [`docs/licenses.md`](./docs/licenses.md) (all MIT / Apache-2.0).
