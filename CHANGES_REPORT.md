# Melodio — Changes Report

What changed, why, and how to keep quality checks passing. Optimized for **speed**, **DX**, and **maintainability**.

**Prerequisites:** Bun ≥ 1.0 (required). Node.js ≥ 20 optional. Install Bun: <https://bun.sh/docs/installation>

**Commands (from repo root):** `bun install` · `bun start` · `bun run build` · `bun run test` · `bun run check:quality` (lint + Knip + typecheck) · `bun run typecheck` · `bun run lint` · `bun run unused:check`

---

## 1. Overview

- **Bun** — Installer, script runner, production backend; workspaces at root.
- **Vite** — Frontend bundler; **Vitest** — frontend tests.
- **Jest + SWC** — Backend tests (faster transpilation).
- **Knip** — Unused files, exports, deps; candidate contracts as entry files.
- **Typecheck / Lint** — Contract-aware; candidate contract files filtered so candidate code doesn’t block CI.

---

## 2. Benchmarks

| Category | Older / baseline | Newer / current |
|----------|------------------|-----------------|
| Installer | npm — 44s | bun — 5s |
| Build (frontend) | npm run build — 11s | bun run build — 5s |
| Backend tests | Jest — 4.2s | Jest + SWC — 1.9s |
| Frontend tests | Jest — 4.2s | Vitest — 4.1s |

- **Build:** The frontend bundler is **Vite** (`tsc && vite build`). The 11s vs 5s compares **script runner** (npm vs bun), not the bundler.
- **Backend tests:** Improvement from 4.2s to 1.9s is from using **SWC** as the Jest transpiler.

---

## 3. Optimization strategies

| Strategy | How it’s done |
|----------|----------------|
| Workspace at root | `workspaces: ["frontend", "backend"]`; single `bun.lock`; run from root. |
| Bun as installer | `bun install`; `packageManager: "bun@1.1.0"`; `engines.bun`. |
| Vite as bundler | Frontend: `vite`, `@vitejs/plugin-react`; dev + build. |
| Vitest (frontend tests) | `frontend/__tests__/**/*.behavior.test.tsx`; `vitest.config.frontend.ts`. |
| Jest + SWC (backend tests) | `@swc/jest` in `backend/jest.config.cjs`; `backend/__tests__/**/*.behavior.test.ts`. |
| Knip | `bun run unused:check`; entry files = contract files; optional `bunx depcheck`. |

---

## 4. NPM vs Bun

| | NPM | Bun |
|---|-----|-----|
| **Speed** | Sequential | Parallel + cache |
| **Runtime** | Node.js | Bun (Zig) |
| **Lockfile** | `package-lock.json` | `bun.lock` (binary) |

**Why Bun:** Faster install/build, one lockfile, backend runs as `bun dist/server.js`.

---

## 5. Upgradation of libraries

Libraries **added or upgraded** as part of this optimization.

| Area | Library | Version | Change |
|------|---------|---------|--------|
| **Root** | Bun | `bun@1.1.0`, `engines.bun: ">=1.0.0"` | Replaced npm as installer and script runner; used as production backend runtime |
| **Root** | Knip | ^5.86.0 | **Added** — unused files, exports, dependencies (`bun run unused:check`) |
| **Frontend** | Vite | ^6.0.5 | **Added** — frontend bundler (replaced previous build setup) |
| **Frontend** | @vitejs/plugin-react | ^4.3.4 | **Added** — Vite React support (dev + build) |
| **Frontend** | Vitest | ^2.1.0 | **Added** — frontend test runner (replaced Jest on frontend) |
| **Frontend** | @vitest/coverage-v8 | ^2.1.0 | **Added** — frontend test coverage |
| **Frontend** | Tailwind CSS | ^4.2.1 | **Upgraded** — styling; `@tailwindcss/postcss` ^4.2.1 |
| **Frontend** | TypeScript | ^5.8.0 | **Upgraded** — type checking |
| **Backend** | Express | ^5.0.0 | **Upgraded** — HTTP server; `@types/express` ^5.0.0 |
| **Backend** | TypeScript | ^5.8.0 | **Upgraded** — type checking |
| **Backend** | @swc/jest | ^0.2.29 | **Added** — Jest transpiler for faster backend tests (Jest was already used) |

---

## 6. What changed (and why)

### 6.1 Root

- **package.json** — Workspaces, Bun scripts; `test` = Jest then Vitest; `test:task1` … `test:task13` per task; `check:quality` = lint + `unused:check` (Knip) + typecheck; `install:ci` = `bun install --frozen-lockfile`.

### 6.2 Backend

| File | Change |
|------|--------|
| **package.json** | Jest + SWC; start = `bun dist/server.js`. |
| **jest.config.cjs** | SWC transform; roots = `__tests__`; `.js` module mapping. |
| **app.ts** | `getPublicDir()` for Node/Bun; route order; `/api/payment` + `/api/payments`. |

Candidate-facing backend code (e.g. tracks.service.ts) is not modified; symbols are listed in the contract (§6.5).

### 6.3 Frontend

| Item | Note |
|------|------|
| **package.json** | Vite, Vitest, build = tsc + vite build. |

### 6.4 Tooling

| Item | Purpose |
|------|--------|
| **knip.json** | Entry = tests + contract files; **ignoreFiles** = scaffold only (no task files); ignoreDependencies / ignoreBinaries for test/build. |
| **vitest.workspace.ts**, **vitest.config.frontend.ts** | Vitest workspace; frontend project with jsdom, aliases, coverage. |
| **Lint** | `bun run lint` runs `scripts/quality/lint-noncandidate.mjs` (ESLint). |
| **Typecheck** | `typecheck` = `scripts/quality/typecheck-noncandidate.mjs` (contract files filtered for CI); `typecheck:strict` = full. |

### 6.5 Candidate contracts

**Files:** `candidate-contracts/candidate-frontend-contract.ts`, `candidate-contracts/candidate-backend-contract.ts`

**Rules**

1. **Don’t change task code for tooling** — Add the symbol to the contract (re-export) so Knip/typecheck treat it as used.
2. **Don’t skip a whole file** — Only list **specific symbols** (exports, types, functions) in the contract.
3. **ignoreFiles** — Scaffold only (e.g. placeholders). Never entire task-related files.
4. **Typecheck** — Only contract **files** are filtered; source files are still typechecked.

**Adding a symbol:** Re-export from the right contract file → run `bun run unused:check`. Don’t change the implementation file.

---

## 7. Knip — Do’s and don’ts

| Do | Don’t |
|----|--------|
| Add flagged symbols to the contract | Modify candidate/task code for Knip |
| List specific symbols in the contract | Skip a complete file for task code |
| Use ignoreFiles only for scaffold | Put task files in ignoreFiles |
| Run `bun run unused:check` before merge | Overuse ignores |

---

## 8. Typecheck — Do’s and don’ts

| Do | Don’t |
|----|--------|
| Match shared interfaces (e.g. `TrackWithPopulated`, DTOs) | Use object shapes that don’t match shared types |
| Include ambient types (e.g. `vite/client`) in tsconfig | Assume browser globals without tsconfig |
| Use typed wrappers for third-party APIs | Rely on JS lib constructors without typings |
| Keep frontend types in sync with backend/UI | Pass extra payload fields not in API types |

---

## 9. Summary table

| Area | Change | Reason |
|------|--------|--------|
| Package manager | Bun | Speed; single lockfile; Bun backend |
| Workspaces | frontend + backend at root | One install |
| Frontend bundler | Vite | Fast dev/build |
| Frontend tests | Vitest | Fast; aligns with Vite |
| Backend tests | Jest + SWC | Faster runs |
| Unused check | Knip | Files, exports, deps; contract = entry |
| Backend app | getPublicDir, routes | Node/Bun; route compatibility |
| Candidate code | Not modified | Symbols in contract (§6.5); do not change for tooling |

---

## Verification

Run from repo root:

| Check | Command | Status |
|-------|---------|--------|
| Typecheck | `bun run typecheck` | ✓ Pass |
| Lint | `bun run lint` | ✓ Pass |
| Knip | `bun run unused:check` | ✓ Pass |

*Update this report when you add optimizations or change structure.*
