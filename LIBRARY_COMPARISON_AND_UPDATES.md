# Library Comparison & Major Updates

This document compares the libraries used in the Melodio project with **latest/modern alternatives** and notes **major updates** available for existing dependencies. It includes **package size**, **weekly npm downloads**, and **tradeoffs** where relevant. No code changes are recommended here—use this as a reference for future upgrades or stack decisions.

*Package sizes below are from [Bundlephobia](https://bundlephobia.com) (min + gzip where applicable). Downloads are npm weekly downloads (last-week).*

---

## 1. Backend

### 1.1 Web framework: Express → Modern alternatives

| Library | Version | Bundle size | Weekly downloads | Notes |
|---------|---------|-------------|------------------|--------|
| **express** (current) | ^4.21.2 | **600 KB** (242 KB gzip), 28 deps | **~71.6M** | Dominant ecosystem; often considered legacy for new projects. |
| **Fastify** | — | **316 KB** (85 KB gzip), 15 deps | **~4.8M** | 2–3x faster, built-in validation, Node.js–focused. |
| **Hono** | — | **18 KB** (7.4 KB gzip), 0 deps | **~23.8M** | Edge-first, multi-runtime, minimal footprint. |
| **Elysia** | — | **182 KB** (50 KB gzip), 4 deps | **~337K** | Bun-optimized, TypeBox, highest throughput. |

**Alternatives (2024–2025):**

- **Fastify** – 2–3x faster than Express, built-in JSON schema validation, strong TypeScript support, Node.js–focused. ~50,000 req/s. Best when you want a drop-in mental model with better performance and validation.
- **Hono** – Edge-first, runs on Cloudflare Workers, Deno, Bun, Node.js. Very small bundle (~18 KB), ~70,000 req/s. Best for edge/serverless or multi-runtime.
- **Elysia** – Optimized for Bun, end-to-end type safety with TypeBox, very high throughput. Best for Bun-first backends.

**Tradeoffs:**

| Choice | Pros | Cons |
|--------|------|------|
| **Stay on Express** | Largest ecosystem, most tutorials, team familiarity, 71.6M downloads/week. | Heavier bundle (600 KB), slower than alternatives, weaker built-in TypeScript/validation. |
| **Fastify** | Much smaller than Express (316 KB), faster, built-in validation, mature Node ecosystem. | Smaller community than Express; migration effort. |
| **Hono** | Smallest bundle (18 KB), zero deps, multi-runtime, growing adoption (23.8M/week). | Different API; edge-first design may be more than you need for a classic Node server. |
| **Elysia** | Best performance on Bun, type-safe. | Bun-only focus; lower downloads (~337K); less suited if you stay on Node. |

**When to stay on Express:** Existing codebases, maximum middleware compatibility, or team expertise only in Express.

---

### 1.2 Major update: Express 5

- **Current:** Express ^4.21.2  
- **Available:** **Express 5.0** (released October 2024).

**Express 5 highlights:**

- Requires Node.js 18+.
- Breaking changes: deprecated method signatures removed, body parser changes, promise support, path/regex matching changes, `res.status()` only 100–999, `res.redirect('back')` removed, `res.clearCookie()` behavior changes.
- Initially on the `next` dist-tag; check npm for when it becomes `latest`.

---

### 1.3 Password hashing: bcryptjs → Modern alternative

| Library | Version | Bundle size | Weekly downloads | Notes |
|---------|---------|-------------|------------------|--------|
| **bcryptjs** (current) | ^2.4.3 | **20 KB** (9.2 KB gzip), 0 deps | **~6.3M** | Pure JS; no native deps; 72-byte password limit. |
| **argon2** (e.g. `argon2`) | — | **7.9 KB** (3.1 KB gzip), 4 deps | **~736K** | Native addon; OWASP/NIST recommended. |

**Argon2:**

- Winner of the Password Hashing Competition; resistant to GPU/ASIC attacks.
- Configurable memory, time, and parallelism.
- **bcrypt** / **bcryptjs** remain acceptable for existing systems; for new code, Argon2id is the recommended default.

**Tradeoffs:**

| Choice | Pros | Cons |
|--------|------|------|
| **bcryptjs** | No native compilation, high adoption (6.3M/week), battle-tested. | Slower than native bcrypt; 72-byte limit; fixed 4KB memory. |
| **argon2** | Stronger security, memory-hard, configurable; smaller bundle (7.9 KB). | Native build (node-gyp) can be painful on some environments; lower downloads (~736K). |

---

### 1.4 Database / ODM: Mongoose → Alternatives

| Library | Version | Bundle size | Weekly downloads | Notes |
|---------|---------|-------------|------------------|--------|
| **mongoose** (current) | ^8.9.4 | **1.85 MB** (342 KB gzip), 6 deps | **~3.8M** | Full ODM; middleware, plugins, document model. |
| **prisma** | — | N/A (dev/build-time) | **~7.8M** | Type-safe client; schema-first; MongoDB connector. |
| **drizzle-orm** | — | N/A (runtime client) | **~4.9M** | Lightweight; SQL-like; MongoDB support varies. |

- **Prisma** – Type-safe client, schema-first; has MongoDB support; different mental model (no ODM documents). Highest downloads of the three.
- **Drizzle** – Lightweight, SQL-like API; MongoDB support varies; check current docs. Growing quickly (4.9M/week).
- **Mongoose** – No major “replacement” required; v8 is current. Stay if you rely on schema middleware, plugins, and the document model.

**Tradeoffs:**

| Choice | Pros | Cons |
|--------|------|------|
| **Mongoose** | Rich ODM features, middleware, plugins, 3.8M/week. | Large bundle (1.85 MB); callback-heavy legacy API unless you use promises. |
| **Prisma** | Type-safe, great DX, 7.8M/week; MongoDB supported. | Different mental model; no document middleware; migration from Mongoose is non-trivial. |
| **Drizzle** | Lightweight, 4.9M/week; flexible. | MongoDB story less mature; more SQL-oriented. |

---

### 1.5 Validation: express-validator → Modern alternative

| Library | Version | Bundle size | Weekly downloads | Notes |
|---------|---------|-------------|------------------|--------|
| **express-validator** (current) | ^7.2.1 | **152 KB** (46 KB gzip), 2 deps | **~1.3M** | Express middleware; uses `validator` under the hood. |
| **zod** | — | **268 KB** (58 KB gzip), 0 deps | **~91.1M** | TypeScript-first schemas; inference; huge adoption. |

- **Zod** – Type-safe schemas, inference, composable; can be used in API routes with a small adapter layer. Common choice in modern Node/TS stacks; 91.1M downloads/week.
- **express-validator** – Still valid; use Zod if you want a single schema language across frontend and API.

**Tradeoffs:**

| Choice | Pros | Cons |
|--------|------|------|
| **express-validator** | Designed for Express, 1.3M/week; familiar middleware pattern. | Heavier (152 KB); less type inference; separate from frontend validation. |
| **zod** | Huge adoption (91.1M/week), full type inference, share schemas with frontend; zero deps. | Slightly larger (268 KB); need a small adapter for Express. |

---

### 1.6 Testing: Jest (backend) → Vitest

| Library | Version | Weekly downloads | Notes |
|---------|---------|------------------|--------|
| **jest** (current, backend) | ^29.7.0 | **~37.1M** | Dominant test runner; ESM support improved in Jest 30. |
| **vitest** (frontend already) | ^2.1.0 | **~34.4M** | Native ESM/TS, Vite integration, Jest-compatible API. |

**Vitest vs Jest (2024–2025):**

- Vitest: native ESM/TypeScript, fast watch (e.g. 28x faster in some setups), Vite integration, Jest-like API (~95% compatible: `jest.fn()` → `vi.fn()`, etc.).
- Jest 30 (2025) improved ESM support; migration to Vitest is optional but often worthwhile for monorepos already using Vite/Vitest on the frontend.

**Tradeoffs:**

| Choice | Pros | Cons |
|--------|------|------|
| **Jest (backend only)** | Highest downloads (37.1M/week), mature, many examples. | Slower watch, more config for ESM/TS; two test runners in repo. |
| **Unify on Vitest** | Single runner, 34.4M/week, faster feedback, same API as frontend. | Backend migration effort; some Jest-only features may need workarounds. |

---

### 1.7 Other backend libraries

| Library | Version | Weekly downloads | Notes |
|---------|---------|------------------|--------|
| **jsonwebtoken** | ^9.0.2 | **~31.4M** | No major alternative needed; still standard for JWT. |
| **cors** | ^2.8.5 | — | Standard; no replacement needed. |
| **morgan** | ^1.10.0 | — | Standard logging middleware; optional: structured logging (e.g. Pino) if you adopt Fastify. |
| **nodemon** | ^3.1.14 | **~9.7M** | Dev only; with **Bun**, `bun --watch` can replace. |
| **tsx** | ^4.19.2 | **~26.5M** | Run TS directly; high adoption; Bun can replace for run. |

**Tradeoff (nodemon + tsx):** Both are dev-only and well adopted. If you standardize on Bun, you can use `bun --watch` and run TypeScript without tsx, reducing dependencies.

---

## 2. Frontend

### 2.1 Build & tooling

| Library | Version | Weekly downloads | Status / alternative | Notes |
|---------|---------|------------------|----------------------|--------|
| **vite** | ^6.0.5 | **~64.2M** | **Current** | Vite 6 (Nov 2024) is the major release; you are on the latest major. |
| **@vitejs/plugin-react** | ^4.3.4 | — | Current | Matches Vite 6. |
| **typescript** | ^5.7.2 | **~123.7M** | **5.8 available** | See “Major updates” below. |

---

### 2.2 Styling: Tailwind CSS → Tailwind v4

| Library | Version | Weekly downloads | Update | Notes |
|---------|---------|------------------|--------|--------|
| **tailwindcss** (current) | ^3.4.17 | **~49.7M** | **Tailwind CSS v4** (Jan 2025) | Major rewrite; same package, v4 is latest major. |

**Tailwind v4 highlights:**

- Much faster (e.g. full builds up to 5x, incremental 100x+).
- **CSS-first config:** `@theme` instead of `tailwind.config.js`; single `@import "tailwindcss"`.
- New utilities: 3D transforms, container queries, expanded gradients, `@starting-style`, `not-*` variant, P3 colors, etc.
- First-party Vite plugin; PostCSS optional.
- Migration: `npx @tailwindcss/upgrade` for v3 → v4.

**Tradeoffs (v3 vs v4):**

| Choice | Pros | Cons |
|--------|------|------|
| **Stay on v3** | Stable, 49.7M/week, no migration. | Slower builds; no new utilities or CSS-first config. |
| **Upgrade to v4** | Much faster builds, modern config, new utilities. | One-time migration; config and some class names change. |

---

### 2.3 UI components & utilities

| Library | Version | Bundle size | Weekly downloads | Status | Notes |
|---------|---------|-------------|------------------|--------|--------|
| **@radix-ui/react-dialog** (representative) | 1.x | **31 KB** (10.8 KB gzip) | — | **Modern** | Unstyled, accessible primitives; base for shadcn/ui. |
| **class-variance-authority** | ^0.7.1 | **1.3 KB** (0.66 KB gzip) | **~15.0M** | **Modern** | Type-safe variants with Tailwind; pairs with `clsx` + `tailwind-merge`. |
| **clsx** | ^2.1.1 | **0.56 KB** (0.35 KB gzip) | **~49.6M** | **Modern** | Conditional class names; minimal footprint. |
| **tailwind-merge** | ^2.6.0 | **27.7 KB** (0.5 KB gzip) | **~27.4M** | **Modern** | Resolves Tailwind class conflicts. |
| **lucide-react** | ^0.468.0 | **611 KB** (154 KB gzip)* | **~33.4M** | **Modern** | Tree-shakeable icons; *size depends on icons used. |

---

### 2.4 Drag-and-drop & carousel

| Library | Version | Bundle size | Weekly downloads | Status | Notes |
|---------|---------|-------------|------------------|--------|--------|
| **@dnd-kit/core** | 6.x | **44 KB** (14 KB gzip) | **~8.6M** | **Modern** | Preferred over deprecated react-beautiful-dnd; accessible. |
| **embla-carousel-react** | ^8.6.0 | **18 KB** (7.3 KB gzip) | **~6.8M** | **Modern** | Lightweight, accessible carousel; no mainstream replacement needed. |

---

### 2.5 Color & assets

| Library | Version | Bundle size | Weekly downloads | Alternative | Notes |
|---------|---------|-------------|------------------|-------------|--------|
| **colorthief** (current) | ^2.6.0 | **27 KB** (8.8 KB gzip) | **~329K** | vibrant.js, fast-average-color, Canvas API | Fine for dominant color; alternatives exist for speed/size. |

---

### 2.6 Routing

| Library | Version | Bundle size | Weekly downloads | Status | Notes |
|---------|---------|-------------|------------------|--------|--------|
| **react-router-dom** | ^7.10.1 | **190 KB** (60 KB gzip) | **~24.0M** | **Current** | React Router 7 is the current major; modern version. |

---

### 2.7 React

| Library | Version | Bundle size | Weekly downloads | Status | Notes |
|---------|---------|-------------|------------------|--------|--------|
| **react** | ^19.0.0 | **7.6 KB** (2.9 KB gzip) | **~78.9M** | **Current** | React 19 is the current major; you are already on a modern stack. |

---

## 3. Shared / root (tooling & testing)

### 3.1 Testing (frontend / Vitest)

| Library | Version | Weekly downloads | Status | Notes |
|---------|---------|------------------|--------|--------|
| **vitest** | ^2.1.0 | **~34.4M** | **Current** | Vitest 2 is current; Vitest 4 adds stable Browser Mode when needed. |
| **@testing-library/react**, **dom**, **jest-dom**, **user-event** | 16.x / 10.x / 6.x / 14.x | — | **Modern** | Standard stack for React testing; keep. |

---

### 3.2 Linting & code quality

| Library | Version | Weekly downloads | Status | Notes |
|---------|---------|------------------|--------|--------|
| **eslint** | ^10.0.3 | **~85.0M** | **Current** | ESLint 9+ uses flat config; v10 is current. |
| **typescript-eslint** | ^8.57.0 | — | **Modern** | Standard for TypeScript + ESLint. |
| **knip** | ^5.86.0 | — | **Modern** | Unused code/exports; keep. |

---

### 3.3 Major update: TypeScript 5.8

- **Current:** TypeScript ^5.7.2  
- **Available:** **TypeScript 5.8**

**TypeScript 5.8 highlights:**

- Stricter checks on return branches (conditional expressions in `return`).
- `require()` of ESM under `module: "nodenext"` (Node 22+).
- Experimental: direct execution in Node 23.6+ with `--erasableSyntaxOnly`.
- Performance improvements (e.g. 10–15% in some large projects).

**TypeScript 5.7:** Better detection of never-initialized variables; `--rewriteRelativeImportExtensions` for path rewriting.

---

## 4. Summary table

| Category | Current | Size / downloads (current) | Modern / alternative | Major update available |
|----------|---------|----------------------------|----------------------|-------------------------|
| Backend framework | Express 4 | 600 KB, ~71.6M/week | Fastify (316 KB, 4.8M), Hono (18 KB, 23.8M), Elysia (182 KB, 337K) | **Express 5** |
| Password hashing | bcryptjs | 20 KB, ~6.3M/week | Argon2 (7.9 KB, 736K) | — |
| ODM | Mongoose 8 | 1.85 MB, ~3.8M/week | Prisma (7.8M), Drizzle (4.9M) | — |
| Validation | express-validator | 152 KB, ~1.3M/week | Zod (268 KB, ~91.1M/week) | — |
| Backend testing | Jest 29 | ~37.1M/week | Vitest (~34.4M/week) | Jest 30 |
| CSS framework | Tailwind 3 | ~49.7M/week | — | **Tailwind v4** |
| TypeScript | 5.7.x | ~123.7M/week | — | **TypeScript 5.8** |
| Build | Vite 6 | ~64.2M/week | — | Already on latest major |
| React | 19 | 7.6 KB, ~78.9M/week | — | Already current |
| React Router | 7 | 190 KB, ~24M/week | — | Already current |

---

## 5. Suggested priority (no code changes in this repo)

1. **Consider Tailwind v4** when ready to invest in migration (use `npx @tailwindcss/upgrade`).
2. **Consider TypeScript 5.8** for stricter checks and performance.
3. **Consider Express 5** after reading breaking changes and when moving off Node <18 is acceptable.
4. **Consider Argon2** for new auth or password flows; leave bcryptjs in place for existing code unless you have a security requirement to migrate.
5. **Consider unifying on Vitest** for backend tests if you want one test runner and faster feedback.
6. **Consider Fastify/Hono/Elysia** only for new services or a deliberate backend rewrite; not required for maintaining this stack.

---

## 6. Conclusion

**Overall stack health:** The Melodio stack is already modern on the frontend (React 19, Vite 6, React Router 7, Radix, dnd-kit, Vitest) and uses well-adopted, stable libraries. No urgent replacements are required.

**Where size and adoption matter most:**

- **Backend:** Express has the largest footprint (600 KB, 71.6M/week) and the widest ecosystem. If you ever rewrite the API, **Hono** (18 KB, 23.8M/week) offers the best size/adoption tradeoff for a modern, multi-runtime option; **Fastify** (316 KB, 4.8M/week) is the natural step-up from Express with better performance and validation without leaving Node.
- **Validation:** **Zod** (268 KB, 91.1M/week) has higher adoption than express-validator (152 KB, 1.3M/week) and gives type-safe, shareable schemas across frontend and API—worth considering for new endpoints or a gradual migration.
- **Password hashing:** **Argon2** is the security best practice for new code; **bcryptjs** (6.3M/week) remains acceptable and avoids native build issues. Switch only if you have a clear security or compliance reason.
- **Testing:** **Vitest** (34.4M/week) is close to Jest (37.1M/week) in adoption and is already used on the frontend; unifying the backend on Vitest reduces tooling and improves feedback speed, at the cost of a one-time migration.
- **Styling:** **Tailwind v4** is the only major version jump that materially improves build performance and DX; plan the upgrade when you can run the automated migration and regression-test styles.

**Recommendation:** Prioritize **Tailwind v4** and **TypeScript 5.8** as low-risk, high-value upgrades. Treat **Express 5**, **Argon2**, **Zod**, and **Vitest for backend** as optional improvements to schedule when you touch those areas. Keep the current frontend stack as-is; it is already aligned with current best practice.

This file is for reference only; no code changes have been made.
