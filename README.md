# Melodio

Music Player App — MERN Stack Monorepo (React, Node, MongoDB).

## Prerequisites

- **Node.js** ≥ 20 (runtime for the app; `engines.node` in root `package.json`)
- **Bun** ≥ 1.0 (package manager and script runner; `engines.bun` in root `package.json`)

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

## Running scripts

From the repo root:

- **Start dev (frontend + backend):** `bun start` (runs `setup.sh` then dev servers)
- **Dev per workspace:**  
  `bun run dev:frontend` or `bun run dev:backend`
- **Build all:** `bun run build`
- **Seed DB:** `bun run seed`
- **Tests:** `bun run test:task1` … `bun run test:task13` (see root `package.json`)

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

## Contributing

Use **Bun** for all installs and scripts: `bun install`, `bun run <script>`, `bunx` for one-off tools. Do not commit `package-lock.json`; the lockfile for this repo is `bun.lock`.
