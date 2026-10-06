# Sources

What informed the functional data (capability flags, family behaviour) in this project.

## Priority followed

1. CASIO's own public product pages and specification sheets.
2. Public user guides — used only to confirm what a mode does, summarised in our own words.
3. Secondary sources only for coarse facts when primary sources were ambiguous.

## Primary sources consulted

| Topic | Source |
| --- | --- |
| fx-CG100: 384×216 (216×384 dots) colour display, cursor/OK/Home/Backspace keys, 3D graph and Python features | CASIO product page FX-CG100 — https://www.casio.com/intl/scientific-calculators/product.FX-CG100/ |
| FC-200V / FC-100V function list (SMPL, CMPD, CASH, AMRT, CNVR, COST, DAYS, DEPR, BOND, BEVN) | CASIO product page FC-200V — https://www.casio.com/intl/scientific-calculators/product.fc-200v-2/ ; CASIO education comparison — https://edu.casio.com/products/financial/comparison.html |
| ClassWiz CW / EX, ES PLUS, MS, fx-9860GIII, fx-CG50, ClassPad mode lists | CASIO public product pages for each model line (casio.com / edu.casio.com) |

## How the data was used

- Capability tiers in `calculatorCatalog.ts` (`SCI_*`, `ES_*`, `MS_*`, `GRAPHING`, `CAS`, `FINANCE`) are
  conservative family-level approximations; regional SKUs reuse their family tier.
- Screen sizes in `registry.ts` come from the published specifications; colours, layouts, icons and key
  arrangements are our own designs.
- Mode names (COMP, STAT, EQN, SD, REG, CMPD, ...) are used as functional identifiers only.

## Disclaimer

The matrix is not a verified per-SKU specification; regional firmware can differ. Corrections are a one-line
change in `src/models/calculatorCatalog.ts` (then `npm run docs:matrix`).

## Not used

No ROMs, firmware, emulator binaries, manual text, screenshots, icons, logos or product photos.
