# 007 — Vite web SPA rather than an Expo (React Native) app

**Problem.** The request mentioned using the Expo connector, while the technical brief specifies React +
TypeScript + Vite + Tailwind, Vitest/Playwright, a browser SPA, PWA and SEO-friendly URLs.

**Analysis.** Expo targets React Native apps (and its web output uses React Native for Web). Its connector tools
operate on EAS projects (cloud builds/sandboxes, billable) that this repository does not have. Rewriting on Expo
would contradict the explicit stack, the Tailwind/DOM-based keyboard, Playwright E2E and the PWA requirements.

**Decision.** Keep the specified Vite web stack. Engines are React-free TypeScript, so a future Expo/React Native
shell can reuse `src/math` and `src/calculators` unchanged and only provide native views for the three display
models and the keyboard grid.

**Trade-off.** No native store builds yet; the PWA covers install-to-home-screen and offline use.
