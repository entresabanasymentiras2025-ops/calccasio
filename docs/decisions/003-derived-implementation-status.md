# 003 — Implementation status is derived, not hand-written

**Problem.** Hand-maintained "full/partial" labels drift and can advertise features that do not work.

**Solution.** `ENGINE_SUPPORT` lists the capabilities each engine implements. A model is `full` only when every
declared capability is supported; otherwise `partial`, and the UI labels each missing capability "coming soon".
A unit test asserts consistency for all models.

**Trade-off.** `ENGINE_SUPPORT` must be updated when an engine gains a feature; forgetting it under-reports (safe).
