# Static Code Analysis & Quality Check Libraries

This document lists libraries used or recommended for code quality and static analysis in this project.

---

## Currently Used

| Library | Purpose |
|--------|---------|
| **ESLint** | Main linter for `.ts` / `.tsx`; runs via `lint` and `lint:strict`. |
| **typescript-eslint** | TypeScript-aware ESLint config and rules. |
| **TypeScript (tsc)** | Static type checking via `typecheck`, `typecheck:frontend`, `typecheck:backend`. |
| **Knip** | Finds unused files, dependencies, and exports; runs as `unused:check` / `check:candidate-contract`. |
| **globals** | Supplies browser/node/jest globals to ESLint. |

**Quality script:** `check:quality` runs lint → Knip → typecheck.

---

## Recommended Additions

### Linting / bugs / security

| Library | Purpose |
|--------|---------|
| **eslint-plugin-sonarjs** | Bug detection, code smells, cognitive complexity. |
| **eslint-plugin-security** | Security-focused rules (e.g. eval, unsafe regex). |
| **eslint-plugin-import** | Import order, unused imports, dependency consistency. |

### React / frontend

| Library | Purpose |
|--------|---------|
| **eslint-plugin-react** | React-specific rules (e.g. prop-types, keys, component structure). |
| **eslint-plugin-react-hooks** | Enforces Rules of Hooks. |
| **eslint-plugin-jsx-a11y** | Accessibility rules for JSX. |

### Dependencies / architecture

| Library | Purpose |
|--------|---------|
| **dependency-cruiser** | Validates dependency graph (e.g. circular deps, layering). |

### Formatting

| Library | Purpose |
|--------|---------|
| **Prettier** | Code formatting; add as devDependency and format script (config already present). |

### Pre-commit

| Library | Purpose |
|--------|---------|
| **Husky** + **lint-staged** | Run lint/format/typecheck on staged files before commit. |

### Bundle / size

| Library | Purpose |
|--------|---------|
| **size-limit** or **bundlewatch** | Fail CI if bundle size exceeds a threshold. |

### Commits

| Library | Purpose |
|--------|---------|
| **commitlint** (+ **@commitlint/config-conventional**) | Enforce conventional commit messages. |

### Testing

| Library | Purpose |
|--------|---------|
| **eslint-plugin-testing-library** | Best-practice rules for Testing Library. |
| **eslint-plugin-jest** / **eslint-plugin-vitest** | Test-specific lint rules. |

---

## Quick picks

- **eslint-plugin-sonarjs** – More bug and smell detection.
- **eslint-plugin-import** – Cleaner imports and dependency rules.
- **eslint-plugin-react-hooks** – Safer React hooks usage.
- **dependency-cruiser** – Control dependency structure.
- **Prettier** – Consistent formatting in the pipeline.
- **Husky** + **lint-staged** – Quality checks on every commit.
