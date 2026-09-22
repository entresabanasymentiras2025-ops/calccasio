# Legal considerations

## Independence notice

**CASIO Emulator Hub is an independent, educational project. It is not affiliated with, sponsored by, or
endorsed by CASIO Computer Co., Ltd.** CASIO and the names of its products (ClassWiz, fx-991, fx-CG50,
ClassPad, etc.) are trademarks of their respective owners. They are used in this project **solely to identify
which calculator's publicly documented functional behavior is being emulated** — a nominative, descriptive use,
not a claim of affiliation or license.

This notice is shown in the site footer on every page and repeated on the docs page.

## What this project does

- Implements calculator **behavior** (state machines, keyboards, displays, math) from scratch, in original
  TypeScript/React/CSS/SVG code.
- Uses model names only as labels, the same way a compatibility chart or a textbook does.
- Designs its own visual identity: original iconography, layout, and color palette — no CASIO logos, no CASIO
  packaging photography, no CASIO manual scans, no CASIO font files.
- References **publicly available** product literature (spec sheets, user guides that CASIO publishes for
  customers) to understand what a model's functions *do*, then re-implements that behavior independently. See
  [`/docs/sources.md`](./sources.md).

## What this project explicitly does not do

- Does **not** copy, extract, decompile, or reverse-engineer CASIO ROM or firmware.
- Does **not** embed or redistribute any CASIO software, calculator OS, or proprietary emulator code.
- Does **not** reproduce CASIO's exact keyboard artwork, icon set, LCD segment font, or physical case design —
  the keyboard layouts and display rendering in this project are original designs that are functionally
  analogous, not visually identical.
- Does **not** reproduce large verbatim excerpts of CASIO manuals; functional descriptions in
  [`/docs/calculator-matrix.md`](./calculator-matrix.md) are original summaries.
- Does **not** claim to be an "official CASIO emulator" anywhere in the UI, metadata, or marketing copy (see
  [`/docs/sources.md`](./sources.md) and the SEO rules followed on each calculator page).

## Trademark use

Model names (e.g. "fx-991CW") are used in page titles, catalog cards and URLs purely for identification, the
same way a comparison chart or a compatibility list would use them. If CASIO Computer Co., Ltd. or a trademark
holder believes any specific use in this repository goes beyond fair, nominative use, the maintainers will
review and adjust it promptly.

## Content the project owns vs. content it references

| Content | Status |
| --- | --- |
| TypeScript/React source code, CSS, original SVG icons | Original work by this project's contributors, MIT-licensed (see [`/docs/licenses.md`](./licenses.md)) |
| Calculator model names, family names | Third-party trademarks, used nominatively only |
| Functional capability summaries in the calculator matrix | Original summaries written from public spec sheets, not verbatim reproductions |
| Third-party npm dependencies | Each under its own open-source license — see [`/docs/licenses.md`](./licenses.md) |

## User-generated content

The app currently stores calculation history, favorites and calculator state **only in the user's own browser**
(`localStorage`/`IndexedDB`). Nothing is uploaded to a server, so there is no user data collection to disclose
beyond what the browser itself retains locally.
