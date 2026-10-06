# 002 — One scientific core, separate family engines

**Problem.** ClassWiz, ES PLUS, MS and the financial calculators all need an expression editor, SHIFT/ALPHA,
memory, variables, history, SETUP and form-style modes. Writing each from scratch would duplicate thousands of
lines; forcing them into one engine with `if (family === 'ms')` branches would violate "MS must not behave like CW".

**Cause.** The families share mechanics but differ in interaction details (menus, result formatting, statistics entry).

**Solution.** `ScientificEngineBase` holds the mechanics; each family is its own class with a profile and
overrides (MS replaces the mode menu, formatting and SD/REG entry; ES PLUS has numbered menus and its own
errors). Form-style modes are declarative specs run by `FormApplet`.

**Trade-off.** A change in the base affects four engines — mitigated by per-family test suites and golden files.
