# npm → Bun migration

This repo uses **Bun** as the single package manager and script runner. This document summarizes the migration, risks, and how to roll back to npm if needed.

## Migration summary

- **Lockfile:** `bun.lock` is the source of truth. `package-lock.json` is no longer used and is in `.gitignore`. If it was previously committed, run `git rm --cached package-lock.json` before committing so it is removed from version control.
- **Scripts:** All root scripts use `bun run` and `bun run --cwd <workspace>` instead of `npm run` and `npm run --workspace=...`.
- **Setup:** `setup.sh` uses `bun install` and `bun run seed` (and instructs users to run `bun start`).
- **IDE / config:** `.vscode/launch.json` and `hackerrank.yml` invoke `bun` instead of `npm`.
- **Engines:** Root `package.json` has `engines.bun: ">=1.0.0"` and `packageManager: "bun@1.1.0"`; `engines.npm` was removed.
- **Backend production:** Backend `start` script runs `bun dist/server.js` (Bun runtime for production build).
- **Clear script:** Root `clear` script removes `node_modules` (and build artifacts); it no longer removes `package-lock.json` and does not remove `bun.lock`.
- **Git:** `package-lock.json` is untracked (run `git rm --cached package-lock.json` if it was previously committed).

## Risks and gotchas

1. **Bun version:** Lockfile was generated with Bun 1.x. Use Bun ≥ 1.0 for consistent installs; document or pin (e.g. in CI) if you need a specific minor.
2. **Native deps:** Backend uses `bcryptjs` (pure JS). If you add packages with native addons (e.g. `sharp`, `node-gyp`), test with Bun; some may need Node for build or runtime.
3. **Tooling that reads package-lock.json:** Any script or scanner that expects `package-lock.json` will need to be updated or pointed at `bun.lock` (Bun lockfile format is different).
4. **Workspace semantics:** We use `bun run <script> --cwd <dir>` for workspace scripts instead of `npm run --workspace=...`. Root `build` runs `frontend` then `backend` explicitly.
5. **prestart:** `bun start` still runs `prestart` (which runs `setup.sh`). No change to lifecycle behavior.

6. **Jest / tests:** Root tests (e.g. `bun run test:task1`) run Jest from the root. If you see "Cannot find module 'react/jsx-runtime'" or similar, it may be due to Bun’s workspace hoisting. Running tests from the `frontend` directory (`cd frontend && bun run test`) or ensuring Jest’s `moduleDirectories` / `roots` include the right workspace can help. The app and scripts do not assume npm; only the test runner’s resolution might need tuning.

## Rollback to npm

To switch back to npm as package manager and script runner:

1. **Restore lockfile and stop ignoring it**
   - Restore `package-lock.json` from git history, e.g.:
     ```bash
     git show HEAD:package-lock.json > package-lock.json
     ```
     (Use the commit from before the migration if you already removed it.)
   - Remove the `package-lock.json` entry from `.gitignore`.

2. **Remove Bun lockfile**
   ```bash
   rm bun.lock
   ```

3. **Revert script and config changes**
   - In root `package.json`: remove `packageManager`; restore `engines.npm`, replace `engines.bun`; change `bun run` / `bun run --cwd ...` back to `npm run` / `npm run --workspace=...`; restore `clear` to remove `package-lock.json` if desired.
   - In `backend/package.json`: change `"start": "bun dist/server.js"` back to `"start": "node dist/server.js"`.
   - In `setup.sh`: replace `bun install` with `npm install`, `bun run seed` with `npm run seed`, and `bun start` with `npm start`.
   - In `hackerrank.yml`: replace `bun start` / `bun run prestart` with `npm start` / `npm run prestart`.
   - In `.vscode/launch.json`: set `runtimeExecutable` back to `npm` and `runtimeArgs` to `["run", "start"]`.

4. **Reinstall with npm**
   ```bash
   rm -rf node_modules frontend/node_modules backend/node_modules
   npm install
   ```

After that, use `npm install`, `npm run <script>`, and `npx` as before.

## Verification commands (post-migration)

1. **Clean install**
   ```bash
   bun run clear
   bun install
   ```

2. **Root scripts**
   ```bash
   bun run build
   bun run test:task1
   ```

3. **Workspace scripts**
   ```bash
   bun run dev:frontend   # or: cd frontend && bun run dev
   bun run dev:backend    # or: cd backend && bun run dev
   bun run seed
   ```

Note: `bun run build` may fail due to existing TypeScript errors in the codebase (unrelated to Bun). Root-level Jest tests may hit module resolution with Bun’s node_modules layout; running tests from the workspace (`cd frontend && bun run test`) is a workaround if needed.
