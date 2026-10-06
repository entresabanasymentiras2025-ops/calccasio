# 006 — Bounded computation instead of Web Workers (for now)

**Problem.** The brief asks for Web Workers for heavy calculations.

**Cause / analysis.** Every potentially heavy operation is bounded: graph sampling is one evaluation per screen
column per function (≤ 6 × 384), Σ/Π ranges are capped, factorial/expansion sizes are capped, program runs have a
step budget, and numeric root scans use fixed sample counts. Measured interactions stay well under a frame budget
on desktop.

**Decision.** Keep computation synchronous in the engine (simpler state machine, deterministic tests) and
document the limits. A worker becomes worthwhile when unbounded features arrive (e.g. large CAS expansions,
spreadsheet recalculation).

**Trade-off.** Worst-case inputs near the caps can cause a short jank instead of a background computation.
