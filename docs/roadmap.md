# Roadmap

Status reflects the repository today.

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Core: engine contract, state/events/memory/display/keyboard, menu system, parser/evaluator | ✅ Done |
| 2 | ClassWiz (CW + EX): COMP, STAT, TABLE, EQUATION, MATRIX, VECTOR, COMPLEX, BASE-N, RATIO, DISTRIBUTION, SETUP, OPTN, S⇔D, calculus | ✅ Done (Spreadsheet, Inequality pending) |
| 3 | ES PLUS engine | ✅ Done (CALC prompts pending) |
| 4 | MS engine (paged modes, SD/REG with DT) | ✅ Done |
| 5 | Graph9860: RUN, GRAPH (trace/zoom/pan/G-Solve/V-Window), TABLE, STAT, EQUA, MATRIX, PRGM VM | ✅ Core done |
| 6 | CG50: colour profile on the shared graphing core | ✅ Core done (Geometry, Picture Plot, 3D, Python pending) |
| 7 | CG100: separate engine, TOOLS-menu interaction, Graph&Table | ✅ Core done (Python, Geometry, 3D pending) |
| 8 | ClassPad: CAS (simplify/expand/factor/solve/diff/integrate), touch document, graph app | 🟡 Partial |
| 9 | Financial: SMPL, CMPD, CASH, AMRT, CNVR, COST, DAYS, STAT, DEPR, BOND, BEVN | ✅ Done |
| 10 | PWA (installable, offline precache), lazy engines, accessibility pass, SEO metadata | ✅ Done (Web Workers deferred) |

## Next steps

1. ClassWiz Spreadsheet mode (FormApplet grid variant) and Inequality mode.
2. 2-D natural-display rendering (fractions, roots, powers) for ClassWiz/ES PLUS from a template AST.
3. Graphing: parametric/polar graphs, list arithmetic in RUN, CONICS.
4. CAS: complex mode, matrices, higher-degree exact solving, integration by parts/substitution.
5. Language profiles (es/de/fr menus) driven by `languageProfile`.
