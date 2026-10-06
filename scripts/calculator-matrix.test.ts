import { describe, it, expect } from 'vitest'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { calculatorCatalog, ENGINE_SUPPORT, missingCapabilities } from '../src/models/calculatorCatalog'
import type { CalculatorCapabilities } from '../src/models/types'

/**
 * Keeps /docs/calculator-matrix.md generated from calculatorCatalog.ts.
 * `npm run docs:matrix` rewrites it; `npm test` fails if it drifts.
 */
const FAMILY_NOTES: Record<string, string> = {
  'classwiz-cw': 'Natural display, HOME menu, TOOLS/SETTINGS/FORMAT keys. Shares the ClassWiz engine with EX.',
  'classwiz-ex': 'Natural display, MENU/OPTN/S⇔D keys and its own mode order. Same engine as CW.',
  esplus: 'Own engine: numbered MODE list, SHIFT+MODE setup, CALC→SOLVE, fraction key, hyp/RCL.',
  ms: 'Own engine: paged MODE screens, decimal-first results with a⌟b⌟c, SD/REG with DT entry and S-SUM/S-VAR.',
  'graphing-9860': 'Monochrome 128×64, icon main menu, F-keys.',
  cg50: 'Colour 384×216, icon main menu, F-keys, per-function colours.',
  cg100: 'Colour 384×216, HOME screen, no F-keys (TOOLS menu), Graph&Table app. Kept separate from CG50.',
  classpad: 'Touch document UI with CAS work area and graph app.',
  financial: 'Financial worksheets with SOLVE; FC-200V adds DEPR/BOND/BEVN via the features list.',
}

function generate(): string {
  const caps = (c: CalculatorCapabilities) => (Object.keys(c) as Array<keyof CalculatorCapabilities>).filter((k) => c[k])
  const families = [...new Set(calculatorCatalog.map((c) => c.family))]
  const out: string[] = [
    '# Calculator compatibility matrix',
    '',
    '<!-- Generated from src/models/calculatorCatalog.ts by scripts/calculator-matrix.test.ts (npm run docs:matrix). Do not edit by hand. -->',
    '',
    'Capability flags describe what the **real model** offers according to public product information (see [`sources.md`](./sources.md)).',
    'The status column is derived automatically: `full` when the family engine implements every declared capability,',
    '`partial` when some declared capabilities are still "coming soon" (listed), `planned` when no engine exists.',
    '',
    '## Families and engines',
    '',
    '| Family | Engine | Models | Engine implements | Notes |',
    '| --- | --- | --- | --- | --- |',
  ]
  for (const f of families) {
    const models = calculatorCatalog.filter((c) => c.family === f)
    const engine = models[0].engine
    out.push(`| ${models[0].familyLabel} | \`${engine}\` | ${models.length} | ${[...ENGINE_SUPPORT[engine]].join(', ')} | ${FAMILY_NOTES[f] ?? ''} |`)
  }
  for (const f of families) {
    const models = calculatorCatalog.filter((c) => c.family === f)
    out.push('', `## ${models[0].familyLabel} (\`${f}\`)`, '', '| Model | URL | Region | Capabilities | Status | Coming soon |', '| --- | --- | --- | --- | --- | --- |')
    for (const c of models) {
      const missing = missingCapabilities(c)
      out.push(`| ${c.name} | \`/calculator/${c.id}\` | ${c.regionVariant ?? 'Global'} | ${caps(c.capabilities).join(', ')}${c.features ? ` (+${c.features.join(', ')})` : ''} | ${c.implementationStatus} | ${missing.join(', ') || '—'} |`)
    }
  }
  return out.join('\n') + '\n'
}

describe('docs/calculator-matrix.md', () => {
  it('is in sync with the catalog', () => {
    const path = resolve(__dirname, '../docs/calculator-matrix.md')
    const content = generate()
    if (process.env.UPDATE_DOCS) writeFileSync(path, content)
    expect(readFileSync(path, 'utf8')).toBe(content)
  })
})
