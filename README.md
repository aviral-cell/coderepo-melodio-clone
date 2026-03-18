# Melodio

Music Player App — MERN Stack Monorepo (React, Node, MongoDB).

## Prerequisites

- **Node.js** ≥ 20 (optional; `engines.node` in root `package.json`)
- **Bun** ≥ 1.0 (package manager, script runner, and **production backend runtime**; `engines.bun` in root `package.json`)

Install Bun: <https://bun.sh/docs/installation>

## Install

From the repo root:

```bash
bun install
```

This installs dependencies for the root and all workspace packages (`frontend`, `backend`).

For a reproducible install (e.g. CI):

```bash
bun install --frozen-lockfile
```

## Locked dependencies

Dependencies use **exact versions** (no `^` or `~`). The lockfile (`bun.lock`) is the source of truth.

- **Install new dependencies (intentional updates):** From the repo root, add the dependency so the lockfile is updated:
  ```bash
  bun add <pkg>              # root
  bun add <pkg> --cwd frontend
  bun add <pkg> --cwd backend
  bun add -d <pkg>           # dev at root
  ```
- **Frozen check before committing:** Ensure install/build/start use the lockfile without changing it:
  ```bash
  bun run deps:check
  ```
  This runs `bun install --frozen-lockfile` and fails if `package.json` or the lockfile would change. `bun run build` and `bun start` run this check automatically via `prebuild` and `prestart`.

## Running scripts

From the repo root:

- **Start dev (frontend + backend):** `bun start` (runs `setup.sh` then dev servers)
- **Dev per workspace:**  
  `bun run dev:frontend` or `bun run dev:backend`
- **Build all:** `bun run build`
- **Seed DB:** `bun run seed`
- **Tests:** `bun run test` (all), `bun run test:watch` (watch), `bun run test:coverage` (coverage), or `bun run test:task1` … `bun run test:task13` (per-task; see root `package.json`)

From a workspace directory (e.g. `frontend` or `backend`):

```bash
cd frontend && bun run dev
cd backend  && bun run dev
```

## One-off CLIs (bunx)

Use `bunx` instead of `npx`:

```bash
bunx some-cli-package
bunx -b tsx script.ts
```

## Workspace dependency commands

This repo uses npm-style **workspaces** (`frontend`, `backend`). Use Bun from the **repo root** so the lockfile stays in sync.

- **Add dependency to a workspace package**

  ```bash
  bun add <pkg> --cwd frontend
  bun add <pkg> --cwd backend
  ```

- **Add devDependency to a workspace package**

  ```bash
  bun add -d <pkg> --cwd frontend
  bun add -d <pkg> --cwd backend
  ```

- **Add devDependency to root (e.g. shared tooling)**

  ```bash
  bun add -d <pkg>
  ```

- **Remove a dependency**

  ```bash
  bun remove <pkg> --cwd frontend
  bun remove <pkg>
  ```

Always run `bun install` (or the add/remove commands above) from the **root** so `bun.lock` is updated for the whole monorepo.

## Clean and reinstall

```bash
bun run clear
bun install
```

`bun run clear` removes `node_modules`, build outputs, and env files; it does not remove `bun.lock`.

## Testing

- **Frontend:** **Vitest** (jsdom, React Testing Library). Tests: `frontend/__tests__/**/*.behavior.test.tsx`. From root: `bun run test:vitest`; from frontend: `cd frontend && bun run test`.
- **Backend:** **Jest + SWC** (Node, supertest). Tests: `backend/__tests__/**/*.behavior.test.ts` (task3, 4, 5, 6, 7, 12, 13). From root: `bun run test:backend`; from backend: `cd backend && bun run test`.

Commands (from root):

- `bun run test` — run backend Jest then frontend Vitest  
- `bun run test:backend` — backend only (Jest)  
- `bun run test:vitest` — frontend only (Vitest)  
- `bun run test:watch` — Vitest watch (frontend)  
- `bun run test:coverage` — backend Jest coverage then frontend Vitest coverage  
- `bun run test:task1` … `bun run test:task13` — run tests for a specific task; each command runs the frontend side, backend side, or both, depending on what exists for that task

Frontend uses `vi` (Vitest) for mocks; backend tests are integration-only (supertest). Setup: frontend uses `frontend/test/setup.ts` and `frontend/test/setup-dom.ts`; backend uses `backend/jest.setup.js`.

## Candidate Contract Surface

This repo keeps two root-level contract files for candidate-facing exports:

- `candidate-contracts/candidate-frontend-contract.ts`
- `candidate-contracts/candidate-backend-contract.ts`

These files exist for Knip reachability, so candidate-facing code is treated as intentionally used (not stale/dead).

### Adding a new candidate-visible export

1. **Frontend:** Add the new module/export to `candidate-contracts/candidate-frontend-contract.ts` (re-export from the real source).
2. **Backend:** Add the new module/export to `candidate-contracts/candidate-backend-contract.ts`.
3. Run `bun run unused:check` to verify no candidate-facing exports are flagged as stale.

## Unused code detection (Knip)

[Knip](https://knip.dev) finds unused files, exports, and dependencies. The two root contract files are configured as entry files so candidate-facing code is never reported as dead.

### How to run Knip

From the repo root:

```bash
bun run unused:check
```

Or call Knip directly:

```bash
bunx knip
```

- **Exit code 0** — no issues (or only ignored ones).
- **Exit code 1** — Knip reported unused files, exports, or dependencies; fix or add targeted ignores in `knip.json`.

### What’s configured

- **`knip.json`** (repo root):
  - **Root workspace** — entry: `vitest.config.frontend.ts` plus repo-level scripts.
  - **Frontend** — entry: candidate contract plus `frontend/__tests__` and `frontend/test/`. Project: `src/**/*.{ts,tsx}`, `__tests__/**/*.tsx`, and `test/**/*`.
  - **Backend** — entry: `src/app.ts`, candidate contract, and `backend/__tests__/**/*.behavior.test.ts`. Project: `src/**/*.ts` and `__tests__/**/*.ts`.
  - **ignoreDependencies** — test/build-only packages (Vitest, Testing Library, supertest, etc.) so they aren’t flagged as unused.
  - **ignoreBinaries** — `jest`, `vitest` (used via scripts).

Only add extra **entry** or **ignore** when needed (e.g. generated or dynamic-import-only code), and document the reason in `knip.json` or a comment.

**Scaffold / candidate-facing files:** Some files (e.g. `ErrorMessage.tsx`, `LoadingSpinner.tsx`, `useLocalStorage.ts`, `cache.service.ts`) are not imported by the app but are part of the **scaffold** that candidates may use or that must exist for the platform. They are listed in **ignoreFiles** in `knip.json` so Knip does not report them as "Unused files". They are intentionally kept; do not remove them.

### Optional: run in CI

Add a step so the main branch stays clean:

```yaml
- run: bun run unused:check
```

**Limitations:** Code loaded only via dynamic imports may need to be added to `entry` or `ignoreFiles` in `knip.json` if it should count as used.

## Contributing

Use **Bun** for all installs and scripts: `bun install`, `bun run <script>`, `bunx` for one-off tools. Do not commit `package-lock.json`; the lockfile for this repo is `bun.lock`. Write and run tests with Vitest (frontend) or Jest (backend). See **Candidate Contract Surface** for how to add or change candidate-visible exports; see **Unused code detection** for running the unused-code check.
