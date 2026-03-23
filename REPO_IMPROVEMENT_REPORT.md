# Melodio Repo Improvement Report

## Highlights

| Area | Older state | New state |
| --- | --- | --- |
| Package manager | npm-first repo | Bun-first repo with Bun declared in `packageManager` and `engines` |
| Install flow | install and setup were more mixed | install, start, and seed responsibilities are clearer |
| Lockfile | npm lockfile story | `bun.lock` is the main dependency contract |
| Backend dev loop | `nodemon --delay 2500ms --exec tsx` | `bun --watch` |
| Backend build | `tsc` output then Node runtime | `bun build` output then Bun runtime |
| Backend tests | older `ts-jest` style path | Jest with `@swc/jest` and focused behavior-test matching |
| Frontend tests | older Jest-first path | dedicated Vitest path |
| Task test runs | broader and less split | backend and frontend task suites can run together |
| Quality checks | more noisy dependency signal | better signal from Knip, lint, and typecheck |
| Dependency upgrades | older package versions across the stack | upgraded core tooling and app dependencies |
| Dependency lock | npm lockfile style story | Bun-first lockfile story with `bun.lock` |

## Benchmark Snapshot

Method: cold install and cold build below use the VM measurements. Task timings are warm timings after one warm-up run.

| Metric | Optimised Solution | Actual Solution |
| --- | ---: | ---: |
| Cold install | `17s` | `41s` |
| Cold build | `5s` | `12s` |
| Backend task benchmark, task 4 (`1` suite / `10` tests) | `5.5s` | `12s` |
| Frontend task benchmark, task 2 (`1` suite / `21` tests) | `5s` | `7.5s` |
| Backend dev refresh | `251ms` | `3135ms` |
| Frontend HMR | `106ms` | `250ms` |

## Measured Averages

This section compares `Optimised Solution` and `Actual Solution`.

### 1. Installer

```text
Optimised Solution    17 s | ███████████
Actual Solution       41 s | ██████████████████████████
```

What this means in simple words:

- The cold install path is much faster in `Optimised Solution`.
- `Actual Solution` is slower on install because it still pays the older npm install cost.

### 2. Cold Build

```text
Optimised Solution     5 s | ██████████
Actual Solution       12 s | ████████████████████████
```

What this means in simple words:

- The cold build path is also clearly faster in `Optimised Solution`.
- `Actual Solution` takes more time to get to a fresh build output.

### 3. Backend Task Benchmark: Task 4 (`1` suite / `10` tests)

```text
Optimised Solution   5.5 s | ███████████
Actual Solution      12 s  | ████████████████████████
```

What this means:

- This comparison uses the backend task 4 suite from the VM run.
- `Optimised Solution` is faster than `Actual Solution` on this backend task path.

### 4. Frontend Task Benchmark: Task 2 (`1` suite / `21` tests)

```text
Optimised Solution   5 s   | ███████████
Actual Solution      7.5 s | ████████████████
```

What this means:

- This comparison uses the frontend task 2 suite from the VM run.
- `Optimised Solution` is faster than `Actual Solution` on this frontend task path.

### 5. Backend HMR / Refresh Time

This is really restart-on-save, not true backend HMR.

```text
Optimised Solution   251 ms | ███
Actual Solution     3135 ms | ███████████████████████████████
```

What this means:

- The big backend speed win is real.
- Moving away from `nodemon --delay 2500ms --exec tsx` removed most of the waiting after each save.
- `Optimised Solution` is dramatically faster than `Actual Solution` for backend save-and-refresh.

### 6. Frontend HMR

```text
Optimised Solution  106 ms | █████
Actual Solution     250 ms | ███████████
```

What this means:

- Frontend HMR is fast in both compared setups, but the VM reference for `Actual Solution` is higher than the local Bun/Vite number.

## Before vs Now

| Topic | Older state | Optimised Question | Result |
| --- | --- | --- | --- |
| Package manager | npm-first | Bun-first | clearer install and run contract |
| Lockfile | `package-lock.json` style flow | `bun.lock` is the main lockfile | dependency resolution is more predictable |
| Install flow | mixed install/setup behavior | Bun install flow with clearer ownership | less surprise during setup |
| Start flow | heavier, more setup mixed in | lighter startup path | faster normal app startup |
| Backend dev | `nodemon --delay 2500ms --exec tsx` | `bun --watch` | much faster save-and-refresh loop |
| Backend build | `tsc` then Node runtime | `bun build` then Bun runtime | simpler backend toolchain |
| Frontend tests | older Jest path | dedicated Vitest path | cleaner frontend test ownership |
| Backend tests | `ts-jest` style transform | Jest with `@swc/jest` | leaner backend transform path |
| Task tests | more monolithic | backend and frontend task suites can run together | faster task-level feedback |
| Unused dependency checks | more noisy | cleaner Knip output | better tooling signal |
| Dependency upgrades | older versions across tooling and app packages | upgraded package set | better alignment with the current stack |

## What Changed

### Installer, Startup, and Seed Flow

The repo used to blur setup work and normal app startup more heavily.

What changed exactly:

- old root start path: `prestart` ran `bash setup.sh`
- old `setup.sh` always did all of this together:
  - Mongo check/start
  - copy both `.env.example` files over the real `.env` files
  - `npm install`
  - `npm run seed`
- old root `start` then launched frontend and backend through npm workspace scripts

The new flow splits those responsibilities:

- Bun is the declared package manager
- `bun.lock` is the dependency source of truth
- `postinstall` runs `bash setup.sh --ensure-seeded`
- `prestart` runs `bash setup.sh --start`
- `setup.sh --start` only does Mongo and env-file checks
- `setup.sh --ensure-seeded` only seeds when needed
- `setup.sh --seed` is the force-seed path
- build-related checks use `bun install --frozen-lockfile --ignore-scripts`
- root `start` launches frontend and backend through Bun scripts instead of npm workspace calls

This makes install and run behavior more predictable.

### Backend Tooling

Backend changes were some of the most important improvements.

- Dev refresh moved from `nodemon + tsx` to Bun watch mode
- Backend build moved from `tsc` output to `bun build`
- Backend runtime also stayed aligned with Bun

The practical result is simple:

- much faster save-and-refresh time
- fewer moving parts in backend local development
- a simpler backend toolchain overall

### Frontend Tooling

Frontend work was mostly about keeping the modern Vite path while cleaning up the supporting stack.

- frontend tests were split into a dedicated Vitest path
- Vite-based frontend tooling stayed in place
- Tailwind moved to v4
- the original Melodio theme colors were restored

Frontend HMR was already fast. The bigger frontend story was test tooling and style consistency.

### Backend Test Changes

The backend test setup changed in meaningful ways.

- backend tests still use Jest
- the transform moved from `ts-jest` to `@swc/jest`
- tests run with `NODE_ENV=test`
- backend behavior test matching became more focused
- worker count is controlled with `maxWorkers: 1`
- task-level test runs can now be launched in parallel with the frontend side

In easy words: backend tests became more targeted, simpler to run, and easier to combine with the frontend task runner.

### Frontend Test Changes

Frontend testing was separated cleanly from backend testing.

- frontend package tests use Vitest
- task-level runs can launch the frontend side together with the backend side
- this removed the older feeling of one large shared test path

One honest note:

- the current branch is not yet the fastest frontend test variant
- `solution-checker` is still the better frontend speed reference today

### Lint, Typecheck, and Unused Dependency Checks

Quality checks are clearer now.

- lint flow is more explicit
- typecheck flow is more explicit
- Knip signal improved after cleanup
- duplicate package declarations were removed
- stale ignore rules were reduced

This matters because it improves trust in the tooling output. A clean report now means more than it did earlier.

There is also one important branch difference here:

| Check | Optimised Question | Optimised Solution |
| --- | --- | --- |
| Lint | runs through `lint-solution-diff.mjs`, which is solution-aware | runs direct `eslint . --ext .ts,.tsx` |
| Typecheck | runs through `typecheck-solution-diff.mjs`, which is solution-aware | runs direct frontend and backend `tsc --noEmit` |
| Unused dependency check | runs through `knip-solution-baseline.mjs`, which is solution-aware | runs direct `knip` |

In easy words:

- `Optimised Question` uses wrapper scripts so the quality checks can stay aware of the expected question-vs-solution baseline.
- `Optimised Solution` uses the stricter direct tool commands.
- This is why the two branches are similar in intent, but not identical in how lint, typecheck, and Knip are executed.

## Dependency Lock Story

This part is important because it affects every install.

Older state:

- npm-driven install story
- `package-lock.json` was the normal lockfile shape
- package manager choice was less explicit

Current state:

- Bun is declared in `packageManager`
- Bun is also declared in `engines`
- `bun.lock` is committed and used as the main lockfile
- build-related flows check lockfile consistency

Practical result:

- installs are more repeatable
- package manager expectations are clearer
- dependency resolution is easier to reason about

## Dependency Upgrades

### Root-Level Tooling

| Package / Tool | Older state | Optimised Question |
| --- | --- | --- |
| package manager contract | npm-based | Bun-based |
| root frontend test tooling | older Jest style | Vitest added |
| lint tooling | lighter structure | ESLint + `typescript-eslint` + `globals` |
| unused dependency tooling | not part of old baseline | Knip added |
| lockfile | npm-style | `bun.lock` |

### Backend Packages

| Package | Older version | Optimised Question version |
| --- | --- | --- |
| `express` | `^4.21.2` | `5.2.1` |
| `mongoose` | `^8.9.4` | `8.23.0` |
| `dotenv` | `^16.4.7` | `16.6.1` |
| `express-validator` | `^7.2.1` | `7.3.1` |
| `jsonwebtoken` | `^9.0.2` | `9.0.3` |
| `morgan` | `^1.10.0` | `1.10.1` |
| `tsx` | `^4.19.2` | `4.21.0` |
| `typescript` | `^5.7.2` | `5.9.3` |

Backend dependency cleanup also included:

- `nodemon` removed from the active dev path
- `ts-jest` removed from the backend test transform path
- `@swc/jest` added

### Frontend Packages

| Package | Older version | Optimised Question version |
| --- | --- | --- |
| `tailwindcss` | `^3.4.17` | `4.2.1` |
| `@tailwindcss/postcss` | not in old setup | `4.2.1` |
| `vite` | `^6.0.5` | `6.4.1` |
| `@vitejs/plugin-react` | `^4.3.4` | `4.7.0` |
| `typescript` | `^5.7.2` | `5.9.3` |
| `react` | `^19.0.0` | `19.2.4` |
| `react-dom` | `^19.0.0` | `19.2.4` |
| `react-router` | `^7.1.1` | `7.13.1` |
| `react-router-dom` | `^7.10.1` | `7.13.1` |
| frontend test runner | Jest | Vitest |

### Dependency Cleanup

Not all dependency work was about upgrades. Some of it was cleanup.

- duplicate root package declarations were removed
- frontend-owned and backend-owned packages were kept in the right workspace
- Knip ignore rules were cleaned up
- the repo now has a more honest unused-dependency signal

## Styling and Library Upgrade Work

The frontend styling stack was brought back into a healthier state.

- Tailwind was upgraded to v4
- the Melodio color palette was restored
- the theme setup was aligned with what the app expects

This was important because it fixed the gap between the intended design system and the actual generated classes.

## Small Code-Side Cleanup

Along with the tooling work, a small amount of code-side cleanup was also done.

- script entry points were simplified so install, start, seed, build, and test responsibilities are easier to follow
- redundant dependency declarations at the root were removed so workspace ownership is clearer
- stale Knip ignore rules were cleaned up so unused dependency reporting is more honest
- test/config entry points were aligned so frontend and backend test flows are easier to target
- a few unnecessary typed wrappers and config-only noise points were reduced where they were only adding maintenance overhead

## Final Summary

Compared with `Actual Solution`, `Optimised Solution` is clearly ahead on the main tooling and workflow benchmarks in this report.

- cold install is much faster
- cold build is faster
- the representative backend task test is faster
- the representative frontend task test is faster
- backend save-and-refresh time is dramatically faster
- frontend HMR is also faster on the measured comparison

At the repo level, the important result is that install, lockfile handling, backend dev, backend build, test targeting, and dependency hygiene are all in a cleaner state than the older npm-first setup. The repo is easier to reason about, faster in the day-to-day loops that matter, and has better signal from quality checks.
