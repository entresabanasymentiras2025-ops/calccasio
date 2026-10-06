# 005 — Program VM sandbox

**Problem.** Graphing calculators run user programs; executing user code in a browser is a security risk.

**Solution.** An interpreter over our own parse tree (no `eval`, no `new Function`, no dynamic import). The only
operations are numeric expressions through the math evaluator, single-letter variables, `PRINT` and `INPUT`.
Identifiers that are not variables are errors, so names like `window` or `constructor` resolve to nothing. A step
budget (100 000) stops infinite loops; `INPUT` suspends a generator, so the UI never blocks.

**Trade-off.** The language is intentionally small and not compatible with hardware programs.
