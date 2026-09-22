# Calculator compatibility matrix

This matrix is generated from the single source of truth for calculator metadata,
`src/models/calculatorCatalog.ts` — nothing here should ever drift from the code, since both are meant to
describe the same data. See [`/docs/sources.md`](./sources.md) for how the capability tiers were derived and
their accuracy caveats.

**Status legend:** `full` = engine implemented and playable now · `planned` = cataloged, capability-tagged, but
no engine wired up yet (see [`/docs/roadmap.md`](./roadmap.md)). This project never marks a model `full` unless
you can actually press its keys and get real results — see the "no fake features" rule in
[`/docs/architecture.md`](./architecture.md).

## Families and engines

| Family | Engine module | Shared with | Distinct because |
| --- | --- | --- | --- |
| ClassWiz CW | `classwiz` | ClassWiz EX (same engine) | Latest natural-display generation; adds Spreadsheet mode on flagship models |
| ClassWiz EX | `classwiz` | ClassWiz CW | Previous natural-display generation; same interaction model as CW, reused engine |
| ES PLUS | `esplus` | — | Two-line (non-natural) display generation; distinct display/editing rules |
| MS | `ms` | — | Single-line display, no natural textbook input, oldest interaction model |
| Graphing (9750/9860GIII) | `graph9860` | — | Monochrome graphing, button-only input |
| fx-CG50 | `cg50` | — | Full-color graphing, button-only input |
| fx-CG100 | `cg100` | — | Touchscreen full-color graphing |
| ClassPad / CAS | `classpad` | — | Symbolic algebra (CAS), fully touch-driven, document-based UI |
| Financial | `financial` | — | Finance-specific worksheets (TVM, cash flow, amortization, bonds) |

## Full model list by family

### ClassWiz CW (`classwiz-cw`)

| Model | Region | Capabilities summary | Status |
|---|---|---|---|
| fx-82CW | Global | arithmetic, fractions, statistics, table, ratio | planned |
| fx-85CW | Global | arithmetic, fractions, statistics, table, ratio | planned |
| fx-350CW | Global | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | planned |
| fx-570CW | Global | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | planned |
| fx-991CW | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | full |
| fx-8200AU | AU | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | planned |
| fx-880BTG | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | planned |
| fx-82DE CW | DE | arithmetic, fractions, statistics, table, ratio | planned |
| fx-85DE CW | DE | arithmetic, fractions, statistics, table, ratio | planned |
| fx-87DE CW | DE | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | planned |
| fx-810DE CW | DE | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | planned |
| fx-991DE CW | DE | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | planned |
| fx-83GT CW | GB | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | planned |
| fx-85GT CW | GB | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | planned |
| fx-82LA CW | LATAM | arithmetic, fractions, statistics, table, ratio | planned |
| fx-570LA CW | LATAM | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | planned |
| fx-991LA CW | LATAM | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | planned |
| fx-82NL | NL | arithmetic, fractions, statistics, table, ratio | planned |
| fx-92 Collège | FR | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | planned |
| fx-92B Secondaire | FR | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | planned |
| fx-82SP CW | ES | arithmetic, fractions, statistics, table, ratio | planned |
| fx-85SP CW | ES | arithmetic, fractions, statistics, table, ratio | planned |
| fx-570SP CW | ES | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | planned |
| fx-991SP CW | ES | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | planned |
| fx-JP500CW | JP | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | planned |
| fx-JP700CW | JP | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | planned |
| fx-JP900CW | JP | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | planned |
| fx-550AZ | Global | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | planned |

### ClassWiz EX (`classwiz-ex`)

| Model | Region | Capabilities summary | Status |
|---|---|---|---|
| fx-82EX | Global | arithmetic, fractions, statistics, table, ratio | planned |
| fx-85EX | Global | arithmetic, fractions, statistics, table, ratio | planned |
| fx-350EX | Global | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | planned |
| fx-570EX | Global | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | planned |
| fx-991EX | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | full |
| fx-82AR X | AR | arithmetic, fractions, statistics, table, ratio | planned |
| fx-95AR X | AR | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | planned |
| fx-570AR X | AR | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | planned |
| fx-991AR X | AR | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | planned |
| fx-82CE X | FR | arithmetic, fractions, statistics, table, ratio | planned |
| fx-85CE X | FR | arithmetic, fractions, statistics, table, ratio | planned |
| fx-350CE X | FR | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | planned |
| fx-991CE X | FR | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | planned |
| fx-580VN X | VN | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | planned |
| fx-82DE X | DE | arithmetic, fractions, statistics, table, ratio | planned |
| fx-85DE X | DE | arithmetic, fractions, statistics, table, ratio | planned |
| fx-87DE X | DE | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | planned |
| fx-991DE X | DE | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | planned |
| fx-83GT X | GB | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | planned |
| fx-85GT X | GB | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | planned |
| fx-82LA X | LATAM | arithmetic, fractions, statistics, table, ratio | planned |
| fx-350LA X | LATAM | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | planned |
| fx-570LA X | LATAM | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | planned |
| fx-991LA X | LATAM | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | planned |

### ES PLUS (`esplus`)

| Model | Region | Capabilities summary | Status |
|---|---|---|---|
| fx-82ES PLUS | Global | arithmetic, fractions, statistics, table, ratio | planned |
| fx-85ES PLUS | Global | arithmetic, fractions, statistics, table, ratio | planned |
| fx-350ES PLUS | Global | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | planned |
| fx-570ES PLUS | Global | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | planned |
| fx-991ES PLUS | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | planned |
| fx-300ES PLUS | US | arithmetic, fractions, statistics, table, ratio | planned |
| fx-115ES PLUS | US | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | planned |
| fx-991ES PLUS C | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | planned |
| fx-991ID PLUS | ID | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | planned |
| fx-82LA PLUS | LATAM | arithmetic, fractions, statistics, table, ratio | planned |
| fx-350LA PLUS | LATAM | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | planned |
| fx-570LA PLUS | LATAM | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | planned |
| fx-991LA PLUS | LATAM | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | planned |
| fx-87DE PLUS | DE | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | planned |
| fx-570VN PLUS | VN | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | planned |
| fx-82AU PLUS II | AU | arithmetic, fractions, statistics, table, ratio | planned |
| fx-100AU PLUS | AU | arithmetic, fractions, complex, statistics, equation, table, baseN, ratio, distribution | planned |
| fx-82ZA PLUS II | ZA | arithmetic, fractions, statistics, table, ratio | planned |
| fx-991ZA PLUS II | ZA | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet | planned |

### MS (`ms`)

| Model | Region | Capabilities summary | Status |
|---|---|---|---|
| fx-82MS | Global | arithmetic, fractions, statistics, table | planned |
| fx-85MS | Global | arithmetic, fractions, statistics, table | planned |
| fx-95MS | Global | arithmetic, fractions, statistics, equation, table, baseN | planned |
| fx-100MS | Global | arithmetic, fractions, statistics, equation, table, baseN | planned |
| fx-570MS | Global | arithmetic, fractions, complex, statistics, equation, table, baseN | planned |
| fx-991MS | Global | arithmetic, fractions, complex, statistics, equation, table, baseN | planned |

### Graphing (9750/9860) (`graphing-9860`)

| Model | Region | Capabilities summary | Status |
|---|---|---|---|
| fx-9750GIII | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet, graphing, programming | planned |
| fx-9860GIII | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet, graphing, programming | planned |
| GRAPH35+ E II | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet, graphing, programming | planned |

### fx-CG50 (`cg50`)

| Model | Region | Capabilities summary | Status |
|---|---|---|---|
| fx-CG50 | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet, graphing, programming | planned |
| fx-CG50 AU | AU | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet, graphing, programming | planned |
| GRAPH90+ E | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet, graphing, programming | planned |

### fx-CG100 (`cg100`)

| Model | Region | Capabilities summary | Status |
|---|---|---|---|
| fx-CG100 | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet, graphing, programming | planned |
| GRAPH MATH+ | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet, graphing, programming | planned |
| fx-1AU GRAPH | AU | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet, graphing, programming | planned |

### ClassPad / CAS (`classpad`)

| Model | Region | Capabilities summary | Status |
|---|---|---|---|
| fx-CP400 | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet, graphing, programming, cas | planned |
| fx-CG500 | Global | arithmetic, fractions, complex, matrices, vectors, statistics, calculus, equation, table, baseN, ratio, distribution, spreadsheet, graphing, programming, cas | planned |

### Financial (`financial`)

| Model | Region | Capabilities summary | Status |
|---|---|---|---|
| FC-100V | Global | arithmetic, fractions, table, finance | planned |
| FC-200V | Global | arithmetic, fractions, table, finance | planned |

