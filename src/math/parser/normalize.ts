/**
 * Converts calculator-native symbols (as they appear on the LCD) into the
 * plain-ASCII grammar the tokenizer understands. Keeping this separate from
 * the tokenizer lets the display layer keep using authentic glyphs (√, ², ⁻¹)
 * while the parser only has to know one canonical syntax.
 */
export function normalizeExpression(input: string): string {
  return input
    .replace(/√/g, 'sqrt')
    .replace(/∛/g, 'cbrt')
    .replace(/⁻¹/g, '^(-1)')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
}
