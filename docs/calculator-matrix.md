# Calculator compatibility matrix

<!-- Generated from src/models/calculatorCatalog.ts by scripts/calculator-matrix.test.ts (npm run docs:matrix). Do not edit by hand. -->

Capability flags describe what the **real model** offers according to public product information (see [`sources.md`](./sources.md)).
The status column is derived automatically: `full` when the family engine implements every declared capability,
`partial` when some declared capabilities are still "coming soon" (listed), `planned` when no engine exists.

## Families and engines

| Family | Engine | Models | Engine implements | Notes |
| --- | --- | --- | --- | --- |
| ClassWiz CW | `classwiz` | 28 | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution | Natural display, HOME menu, TOOLS/SETTINGS/FORMAT keys. Shares the ClassWiz engine with EX. |
| ClassWiz EX | `classwiz` | 24 | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution | Natural display, MENU/OPTN/S⇔D keys and its own mode order. Same engine as CW. |
| ES PLUS | `esplus` | 19 | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN | Own engine: numbered MODE list, SHIFT+MODE setup, CALC→SOLVE, fraction key, hyp/RCL. |
| MS | `ms` | 6 | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, baseN | Own engine: paged MODE screens, decimal-first results with a⌟b⌟c, SD/REG with DT entry and S-SUM/S-VAR. |
| Graphing (9750/9860) | `graph9860` | 3 | arithmetic, fractions, matrices, statistics, calculus, equation, table, graphing, programming | Monochrome 128×64, icon main menu, F-keys. |
| fx-CG50 | `cg50` | 3 | arithmetic, fractions, matrices, statistics, calculus, equation, table, graphing, programming | Colour 384×216, icon main menu, F-keys, per-function colours. |
| fx-CG100 | `cg100` | 3 | arithmetic, fractions, matrices, statistics, calculus, equation, table, graphing, programming | Colour 384×216, HOME screen, no F-keys (TOOLS menu), Graph&Table app. Kept separate from CG50. |
| ClassPad / CAS | `classpad` | 2 | arithmetic, fractions, calculus, equation, graphing, cas | Touch document UI with CAS work area and graph app. |
| Financial | `financial` | 2 | arithmetic, finance, statistics | Financial worksheets with SOLVE; FC-200V adds DEPR/BOND/BEVN via the features list. |

## ClassWiz CW (`classwiz-cw`)

| Model | URL | Region | Capabilities | Status | Coming soon |
| --- | --- | --- | --- | --- | --- |
| fx-82CW | `/calculator/fx-82cw` | Global | arithmetic, fractions, statistics, table, ratio | full | — |
| fx-85CW | `/calculator/fx-85cw` | Global | arithmetic, fractions, statistics, table, ratio | full | — |
| fx-350CW | `/calculator/fx-350cw` | Global | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | full | — |
| fx-570CW | `/calculator/fx-570cw` | Global | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | full | — |
| fx-991CW | `/calculator/fx-991cw` | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | partial | spreadsheet |
| fx-8200AU | `/calculator/fx-8200au` | AU | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | partial | spreadsheet |
| fx-880BTG | `/calculator/fx-880btg` | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | partial | spreadsheet |
| fx-82DE CW | `/calculator/fx-82de-cw` | DE | arithmetic, fractions, statistics, table, ratio | full | — |
| fx-85DE CW | `/calculator/fx-85de-cw` | DE | arithmetic, fractions, statistics, table, ratio | full | — |
| fx-87DE CW | `/calculator/fx-87de-cw` | DE | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | full | — |
| fx-810DE CW | `/calculator/fx-810de-cw` | DE | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | full | — |
| fx-991DE CW | `/calculator/fx-991de-cw` | DE | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | partial | spreadsheet |
| fx-83GT CW | `/calculator/fx-83gt-cw` | GB | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | full | — |
| fx-85GT CW | `/calculator/fx-85gt-cw` | GB | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | full | — |
| fx-82LA CW | `/calculator/fx-82la-cw` | LATAM | arithmetic, fractions, statistics, table, ratio | full | — |
| fx-570LA CW | `/calculator/fx-570la-cw` | LATAM | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | full | — |
| fx-991LA CW | `/calculator/fx-991la-cw` | LATAM | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | partial | spreadsheet |
| fx-82NL | `/calculator/fx-82nl` | NL | arithmetic, fractions, statistics, table, ratio | full | — |
| fx-92 Collège | `/calculator/fx-92-college` | FR | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | full | — |
| fx-92B Secondaire | `/calculator/fx-92b-secondaire` | FR | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | full | — |
| fx-82SP CW | `/calculator/fx-82sp-cw` | ES | arithmetic, fractions, statistics, table, ratio | full | — |
| fx-85SP CW | `/calculator/fx-85sp-cw` | ES | arithmetic, fractions, statistics, table, ratio | full | — |
| fx-570SP CW | `/calculator/fx-570sp-cw` | ES | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | full | — |
| fx-991SP CW | `/calculator/fx-991sp-cw` | ES | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | partial | spreadsheet |
| fx-JP500CW | `/calculator/fx-jp500cw` | JP | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | full | — |
| fx-JP700CW | `/calculator/fx-jp700cw` | JP | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | partial | spreadsheet |
| fx-JP900CW | `/calculator/fx-jp900cw` | JP | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | partial | spreadsheet |
| fx-550AZ | `/calculator/fx-550az` | Global | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | full | — |

## ClassWiz EX (`classwiz-ex`)

| Model | URL | Region | Capabilities | Status | Coming soon |
| --- | --- | --- | --- | --- | --- |
| fx-82EX | `/calculator/fx-82ex` | Global | arithmetic, fractions, statistics, table, ratio | full | — |
| fx-85EX | `/calculator/fx-85ex` | Global | arithmetic, fractions, statistics, table, ratio | full | — |
| fx-350EX | `/calculator/fx-350ex` | Global | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | full | — |
| fx-570EX | `/calculator/fx-570ex` | Global | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | full | — |
| fx-991EX | `/calculator/fx-991ex` | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | partial | spreadsheet |
| fx-82AR X | `/calculator/fx-82ar-x` | AR | arithmetic, fractions, statistics, table, ratio | full | — |
| fx-95AR X | `/calculator/fx-95ar-x` | AR | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | full | — |
| fx-570AR X | `/calculator/fx-570ar-x` | AR | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | full | — |
| fx-991AR X | `/calculator/fx-991ar-x` | AR | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | partial | spreadsheet |
| fx-82CE X | `/calculator/fx-82ce-x` | FR | arithmetic, fractions, statistics, table, ratio | full | — |
| fx-85CE X | `/calculator/fx-85ce-x` | FR | arithmetic, fractions, statistics, table, ratio | full | — |
| fx-350CE X | `/calculator/fx-350ce-x` | FR | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | full | — |
| fx-991CE X | `/calculator/fx-991ce-x` | FR | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | partial | spreadsheet |
| fx-580VN X | `/calculator/fx-580vn-x` | VN | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | partial | spreadsheet |
| fx-82DE X | `/calculator/fx-82de-x` | DE | arithmetic, fractions, statistics, table, ratio | full | — |
| fx-85DE X | `/calculator/fx-85de-x` | DE | arithmetic, fractions, statistics, table, ratio | full | — |
| fx-87DE X | `/calculator/fx-87de-x` | DE | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | full | — |
| fx-991DE X | `/calculator/fx-991de-x` | DE | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | partial | spreadsheet |
| fx-83GT X | `/calculator/fx-83gt-x` | GB | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | full | — |
| fx-85GT X | `/calculator/fx-85gt-x` | GB | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | full | — |
| fx-82LA X | `/calculator/fx-82la-x` | LATAM | arithmetic, fractions, statistics, table, ratio | full | — |
| fx-350LA X | `/calculator/fx-350la-x` | LATAM | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | full | — |
| fx-570LA X | `/calculator/fx-570la-x` | LATAM | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | full | — |
| fx-991LA X | `/calculator/fx-991la-x` | LATAM | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | partial | spreadsheet |

## ES PLUS (`esplus`)

| Model | URL | Region | Capabilities | Status | Coming soon |
| --- | --- | --- | --- | --- | --- |
| fx-82ES PLUS | `/calculator/fx-82es-plus` | Global | arithmetic, fractions, statistics, table | full | — |
| fx-85ES PLUS | `/calculator/fx-85es-plus` | Global | arithmetic, fractions, statistics, table | full | — |
| fx-350ES PLUS | `/calculator/fx-350es-plus` | Global | arithmetic, fractions, complex, statistics, calculus, equation, table, baseN | full | — |
| fx-570ES PLUS | `/calculator/fx-570es-plus` | Global | arithmetic, fractions, complex, statistics, calculus, equation, table, baseN | full | — |
| fx-991ES PLUS | `/calculator/fx-991es-plus` | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN | full | — |
| fx-300ES PLUS | `/calculator/fx-300es-plus` | US | arithmetic, fractions, statistics, table | full | — |
| fx-115ES PLUS | `/calculator/fx-115es-plus` | US | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN | full | — |
| fx-991ES PLUS C | `/calculator/fx-991es-plus-c` | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN | full | — |
| fx-991ID PLUS | `/calculator/fx-991id-plus` | ID | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN | full | — |
| fx-82LA PLUS | `/calculator/fx-82la-plus` | LATAM | arithmetic, fractions, statistics, table | full | — |
| fx-350LA PLUS | `/calculator/fx-350la-plus` | LATAM | arithmetic, fractions, complex, statistics, calculus, equation, table, baseN | full | — |
| fx-570LA PLUS | `/calculator/fx-570la-plus` | LATAM | arithmetic, fractions, complex, statistics, calculus, equation, table, baseN | full | — |
| fx-991LA PLUS | `/calculator/fx-991la-plus` | LATAM | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN | full | — |
| fx-87DE PLUS | `/calculator/fx-87de-plus` | DE | arithmetic, fractions, complex, statistics, calculus, equation, table, baseN | full | — |
| fx-570VN PLUS | `/calculator/fx-570vn-plus` | VN | arithmetic, fractions, complex, statistics, calculus, equation, table, baseN | full | — |
| fx-82AU PLUS II | `/calculator/fx-82au-plus-ii` | AU | arithmetic, fractions, statistics, table | full | — |
| fx-100AU PLUS | `/calculator/fx-100au-plus` | AU | arithmetic, fractions, complex, statistics, calculus, equation, table, baseN | full | — |
| fx-82ZA PLUS II | `/calculator/fx-82za-plus-ii` | ZA | arithmetic, fractions, statistics, table | full | — |
| fx-991ZA PLUS II | `/calculator/fx-991za-plus-ii` | ZA | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN | full | — |

## MS (`ms`)

| Model | URL | Region | Capabilities | Status | Coming soon |
| --- | --- | --- | --- | --- | --- |
| fx-82MS | `/calculator/fx-82ms` | Global | arithmetic, fractions, statistics | full | — |
| fx-85MS | `/calculator/fx-85ms` | Global | arithmetic, fractions, statistics | full | — |
| fx-95MS | `/calculator/fx-95ms` | Global | arithmetic, fractions, statistics, equation, baseN | full | — |
| fx-100MS | `/calculator/fx-100ms` | Global | arithmetic, fractions, statistics, equation, baseN | full | — |
| fx-570MS | `/calculator/fx-570ms` | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, baseN | full | — |
| fx-991MS | `/calculator/fx-991ms` | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, baseN | full | — |

## Graphing (9750/9860) (`graphing-9860`)

| Model | URL | Region | Capabilities | Status | Coming soon |
| --- | --- | --- | --- | --- | --- |
| fx-9750GIII | `/calculator/fx-9750giii` | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet, graphing, programming | partial | complex, vectors, baseN, ratio, distribution, spreadsheet |
| fx-9860GIII | `/calculator/fx-9860giii` | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet, graphing, programming | partial | complex, vectors, baseN, ratio, distribution, spreadsheet |
| GRAPH35+ E II | `/calculator/graph35-plus-e-ii` | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet, graphing, programming | partial | complex, vectors, baseN, ratio, distribution, spreadsheet |

## fx-CG50 (`cg50`)

| Model | URL | Region | Capabilities | Status | Coming soon |
| --- | --- | --- | --- | --- | --- |
| fx-CG50 | `/calculator/fx-cg50` | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet, graphing, programming | partial | complex, vectors, baseN, ratio, distribution, spreadsheet |
| fx-CG50 AU | `/calculator/fx-cg50-au` | AU | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet, graphing, programming | partial | complex, vectors, baseN, ratio, distribution, spreadsheet |
| GRAPH90+ E | `/calculator/graph90-plus-e` | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet, graphing, programming | partial | complex, vectors, baseN, ratio, distribution, spreadsheet |

## fx-CG100 (`cg100`)

| Model | URL | Region | Capabilities | Status | Coming soon |
| --- | --- | --- | --- | --- | --- |
| fx-CG100 | `/calculator/fx-cg100` | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet, graphing, programming | partial | complex, vectors, baseN, ratio, distribution, spreadsheet |
| GRAPH MATH+ | `/calculator/graph-math-plus` | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet, graphing, programming | partial | complex, vectors, baseN, ratio, distribution, spreadsheet |
| fx-1AU GRAPH | `/calculator/fx-1au-graph` | AU | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet, graphing, programming | partial | complex, vectors, baseN, ratio, distribution, spreadsheet |

## ClassPad / CAS (`classpad`)

| Model | URL | Region | Capabilities | Status | Coming soon |
| --- | --- | --- | --- | --- | --- |
| fx-CP400 | `/calculator/fx-cp400` | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet, graphing, programming, cas | partial | complex, matrices, vectors, statistics, table, baseN, ratio, distribution, spreadsheet, programming |
| fx-CG500 | `/calculator/fx-cg500` | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet, graphing, programming, cas | partial | complex, matrices, vectors, statistics, table, baseN, ratio, distribution, spreadsheet, programming |

## Financial (`financial`)

| Model | URL | Region | Capabilities | Status | Coming soon |
| --- | --- | --- | --- | --- | --- |
| FC-100V | `/calculator/fc-100v` | Global | arithmetic, statistics, finance | full | — |
| FC-200V | `/calculator/fc-200v` | Global | arithmetic, statistics, finance (+depreciation, bond, breakEven) | full | — |
