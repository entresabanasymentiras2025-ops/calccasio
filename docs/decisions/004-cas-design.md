# 004 — A small, exact CAS instead of a third-party library

**Problem.** The ClassPad engine needs symbolic results ("CAS that only computes numbers" is forbidden).

**Options.** Pull in a large CAS library, or build a focused one.

**Solution.** `src/math/symbolic`: a tree with exact BigInt rationals, a canonicalising simplifier (like-term
collection, power merging, radical simplification, exact trig values), expansion, polynomial algebra over ℚ
(rational-root factoring, exact quadratic solving), symbolic differentiation and rule-based integration with a
numeric fallback for definite integrals (cross-checked numerically to avoid sign errors across singularities).

**Trade-off.** Narrower than a full CAS (see limitations.md), but zero dependencies, auditable, and testable with
golden files.
