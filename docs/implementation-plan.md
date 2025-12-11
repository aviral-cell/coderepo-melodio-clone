# MERN Stack Implementation Plan

## Overview

This document outlines the step-by-step implementation plan for migrating the music streaming application from MENN (MongoDB + Express via NestJS + Next.js) to MERN (MongoDB + Express + React + Node.js) stack.

**Target Ports:**
- Frontend (React + Vite): `4000`
- Backend (Express + Node.js): `6000`

**Agent Delegation:**
| Agent | Responsibility |
|-------|----------------|
| `arch--MERN-stack` | Architecture planning, project setup, orchestration |
| `be--nodejs-mongo-dev` | Express routes, controllers, services, middleware, Mongoose models |
| `fe--react-dev` | React components, hooks, contexts, routing (React Router v7) |
| `be--ts-unit-test-scripter` | Backend unit tests (Jest + Supertest) |
| `fe--unit-test-scripter` | Frontend unit tests (Jest + React Testing Library) |

---

## TDD Workflow

**Test-Driven Development is mandatory.** For each feature implementation:

1. **Test Agent writes tests FIRST** based on scenarios in TDD-SCENARIOS.md
2. **Tests should fail initially** (no implementation yet)
3. **Dev Agent implements feature** to make tests pass
4. **Dev Agent identifies edge cases** not covered in MENN codebase and adds them
5. **Run tests** to verify 100% pass rate
6. **Refactor if needed** while keeping tests green

**TDD Sequence per Feature:**
```
Test Agent → Write failing tests → Dev Agent → Implement → Tests pass → Edge cases → Done
```

---

## Test Folder Structure

```
spotify-mern-app/
├── __tests__/                    # Task-specific tests (HackerRank graded)
│   ├── task1/                    # Playlist operations (frontend)
│   │   └── usePlaylistOperations.test.ts
│   ├── task2/                    # Player controls (frontend)
│   │   └── playerReducer.test.ts
│   └── task3/                    # Search (frontend + backend)
│       ├── useSearch.test.ts     # Frontend search hook
│       └── search.service.test.ts # Backend search API
├── backend/
│   └── __tests__/
│       └── others/               # Non-task backend tests
│           ├── auth.service.test.ts
│           ├── tracks.service.test.ts
│           ├── albums.service.test.ts
│           ├── artists.service.test.ts
│           └── playlists.service.test.ts
├── frontend/
│   └── __tests__/
│       └── others/               # Non-task frontend tests
│           ├── auth.context.test.ts
│           ├── useDebounce.test.ts
│           ├── useRecentlyPlayed.test.ts
│           └── formatters.test.ts
```

**Test Commands:**
```bash
npm run test:task1    # Runs __tests__/task1/**
npm run test:task2    # Runs __tests__/task2/**
npm run test:task3    # Runs __tests__/task3/**
npm run test          # Runs all tests (tasks + others)
```

---

## Phase 1: Project Scaffolding

### 1.0 Full Project Architecture Setup

**Agent:** `arch--MERN-stack`

**Purpose:** Initialize the complete MERN monorepo structure with feature-based architecture, shared configurations, and cross-cutting concerns.

**Tasks:**
1. Initialize monorepo structure:
   ```
   spotify-mern-app/
   ├── __tests__/                # Task-specific tests (HackerRank graded)
   │   ├── task1/                # Playlist operations (frontend)
   │   ├── task2/                # Player controls (frontend)
   │   └── task3/                # Search (frontend + backend)
   ├── backend/
   │   ├── src/
   │   │   ├── features/         # Feature modules (auth, tracks, albums, etc.)
   │   │   ├── shared/           # Shared utilities, middleware, types
   │   │   ├── scripts/          # Seed scripts
   │   │   ├── app.ts            # Express app configuration
   │   │   └── server.ts         # Server entry point
   │   ├── __tests__/
   │   │   └── others/           # Non-task backend tests
   │   ├── .env.example
   │   ├── jest.config.js
   │   ├── tsconfig.json
   │   └── package.json
   ├── frontend/
   │   ├── src/
   │   │   ├── app/              # App shell, routes
   │   │   ├── pages/            # Page components
   │   │   ├── shared/           # Shared code
   │   │   │   ├── components/   # Reusable components
   │   │   │   ├── contexts/     # React contexts
   │   │   │   ├── hooks/        # Custom hooks
   │   │   │   ├── services/     # API services
   │   │   │   ├── types/        # TypeScript types
   │   │   │   └── utils/        # Utilities
   │   │   ├── lib/              # Third-party config
   │   │   └── main.tsx          # Entry point
   │   ├── __tests__/
   │   │   └── others/           # Non-task frontend tests
   │   ├── public/               # Static assets (local images)
   │   ├── index.html
   │   ├── vite.config.ts
   │   ├── tailwind.config.ts
   │   ├── jest.config.js
   │   ├── tsconfig.json
   │   └── package.json
   ├── output/                   # Test output XML files
   │   └── .gitkeep
   ├── hackerrank.yml            # HackerRank configuration
   ├── package.json              # Root package.json (workspaces)
   ├── jest.config.js            # Root Jest config (for task tests)
   └── setup.sh                  # Setup script
   ```

2. Configure root `package.json` with workspace scripts:
   - `npm run dev` - Start both backend and frontend
   - `npm run dev:backend` - Start backend only (port 6000)
   - `npm run dev:frontend` - Start frontend only (port 4000)
   - `npm run seed` - Seed database
   - `npm run test` - Run all tests
   - `npm run test:task1` - Run task1 tests
   - `npm run test:task2` - Run task2 tests
   - `npm run test:task3` - Run task3 tests

3. Configure `hackerrank.yml`:
   - `readonly_paths` for test files
   - Task-specific test commands
   - Output directory configuration

4. Setup shared TypeScript types (can be referenced by both backend/frontend)

5. Backend base setup:
   - Express app with JSON parser, CORS, error handling
   - MongoDB connection module
   - JWT auth middleware skeleton
   - Landing page: "API server is running"
   - Dependencies: express, cors, helmet, morgan, mongoose, bcryptjs, jsonwebtoken, express-validator, dotenv
   - Dev deps: typescript, ts-node-dev, jest, supertest, @types/*

6. Frontend base setup:
   - Vite + React + TypeScript
   - React Router v7 with route structure
   - Tailwind CSS with dark theme (#1DB954 accent)
   - shadcn/ui component configuration
   - API service base with auth headers
   - Dependencies: react, react-dom, react-router-dom, tailwindcss, @radix-ui/*, lucide-react
   - Dev deps: jest, @testing-library/react, @types/*

7. Environment configuration:
   - Backend `.env.example`: MONGODB_URI, JWT_SECRET, JWT_EXPIRES_IN, PORT=6000
   - Frontend `.env.example`: VITE_API_URL=http://localhost:6000/api

8. MongoDB Connection:
   ```
   mongodb://root:Root123@localhost:27017/melodio_app?authSource=admin
   ```

**Acceptance Criteria:**
- `npm run dev` from root starts both servers (backend:6000, frontend:4000)
- Backend GET `/` returns "API server is running"
- Frontend loads with React Router working
- MongoDB connection ready
- TypeScript compiles without errors in both projects
- Test commands configured and ready
- `hackerrank.yml` properly configured

**⏸️ CHECKPOINT: Stop and await user review before proceeding to Phase 2.**

---

## Phase 2: Backend Feature Implementation

**TDD Workflow for EACH feature:**
1. `be--ts-unit-test-scripter` writes tests FIRST (tests fail)
2. `be--nodejs-mongo-dev` implements feature (tests pass)
3. Identify edge cases not in MENN codebase, add tests + implementation
4. Verify 100% pass rate

### 2.1 User Model & Auth Feature

**Test Location:** `backend/__tests__/others/auth.service.test.ts`
**Test Scenarios:** Section 1 (Authentication Service Tests)

**Step 1 - Write Tests:** `be--ts-unit-test-scripter`
- Write failing tests for all scenarios in Section 1
- Tests should cover: register, login, getMe, validation errors, edge cases

**Step 2 - Implement:** `be--nodejs-mongo-dev`
- Create User Mongoose schema
- Create auth routes: POST `/api/auth/register`, POST `/api/auth/login`, GET `/api/auth/me`
- Create auth middleware (JWT verification)
- Create auth service: register, login, getMe
- Create validation middleware for DTOs

**Step 3 - Verify:** Run tests, ensure 100% pass rate

**Files to Create:**
- `backend/src/features/users/user.model.ts`
- `backend/src/features/auth/auth.routes.ts`
- `backend/src/features/auth/auth.controller.ts`
- `backend/src/features/auth/auth.service.ts`
- `backend/src/shared/middleware/auth.middleware.ts`
- `backend/__tests__/others/auth.service.test.ts`

---

### 2.2 Artist Feature

**Test Location:** `backend/__tests__/others/artists.service.test.ts`
**Test Scenarios:** Section 4 (Artists Service Tests)

**Step 1 - Write Tests:** `be--ts-unit-test-scripter`
- Write failing tests for all scenarios in Section 4
- Tests should cover: findAll, findById, search, follower count operations

**Step 2 - Implement:** `be--nodejs-mongo-dev`
- Create Artist Mongoose schema with text index on name
- Create artist routes: GET `/api/artists`, GET `/api/artists/search`, GET `/api/artists/:id`
- Create artist service: findAll, findById, search, incrementFollowerCount, decrementFollowerCount

**Step 3 - Verify:** Run tests, ensure 100% pass rate

**Files to Create:**
- `backend/src/features/artists/artist.model.ts`
- `backend/src/features/artists/artist.routes.ts`
- `backend/src/features/artists/artist.controller.ts`
- `backend/src/features/artists/artist.service.ts`
- `backend/__tests__/others/artists.service.test.ts`

---

### 2.3 Album Feature

**Test Location:** `backend/__tests__/others/albums.service.test.ts`
**Test Scenarios:** Section 3 (Albums Service Tests)

**Step 1 - Write Tests:** `be--ts-unit-test-scripter`
- Write failing tests for all scenarios in Section 3
- Tests should cover: findAll, findById, search, findByArtistId, population

**Step 2 - Implement:** `be--nodejs-mongo-dev`
- Create Album Mongoose schema with text index on title
- Create album routes: GET `/api/albums`, GET `/api/albums/search`, GET `/api/albums/:id`
- Create album service: findAll, findById, search, findByArtistId

**Step 3 - Verify:** Run tests, ensure 100% pass rate

**Files to Create:**
- `backend/src/features/albums/album.model.ts`
- `backend/src/features/albums/album.routes.ts`
- `backend/src/features/albums/album.controller.ts`
- `backend/src/features/albums/album.service.ts`
- `backend/__tests__/others/albums.service.test.ts`

---

### 2.4 Track Feature

**Test Location:** `backend/__tests__/others/tracks.service.test.ts`
**Test Scenarios:** Section 2 (Tracks Service Tests)

**Step 1 - Write Tests:** `be--ts-unit-test-scripter`
- Write failing tests for all scenarios in Section 2
- Tests should cover: findAll, findById, search, incrementPlayCount, population

**Step 2 - Implement:** `be--nodejs-mongo-dev`
- Create Track Mongoose schema with indexes
- Create track routes: GET `/api/tracks`, GET `/api/tracks/search`, GET `/api/tracks/:id`, POST `/api/tracks/:id/play`
- Create track service: findAll, findById, search, incrementPlayCount

**Step 3 - Verify:** Run tests, ensure 100% pass rate

**Files to Create:**
- `backend/src/features/tracks/track.model.ts`
- `backend/src/features/tracks/track.routes.ts`
- `backend/src/features/tracks/track.controller.ts`
- `backend/src/features/tracks/track.service.ts`
- `backend/__tests__/others/tracks.service.test.ts`

---

### 2.5 Playlist Feature

**Test Location:** `backend/__tests__/others/playlists.service.test.ts`
**Test Scenarios:** Section 5 (Playlists Service Tests)

**Step 1 - Write Tests:** `be--ts-unit-test-scripter`
- Write failing tests for all scenarios in Section 5
- Tests should cover: CRUD, addTrack, removeTrack, reorderTracks, ownership checks

**Step 2 - Implement:** `be--nodejs-mongo-dev`
- Create Playlist Mongoose schema
- Create playlist routes: GET `/api/playlists`, GET `/api/playlists/:id`, POST `/api/playlists`, PATCH `/api/playlists/:id`, DELETE `/api/playlists/:id`, POST `/api/playlists/:id/tracks`, DELETE `/api/playlists/:id/tracks/:trackId`, PATCH `/api/playlists/:id/reorder`
- Create playlist service with ownership checks

**Step 3 - Verify:** Run tests, ensure 100% pass rate

**Files to Create:**
- `backend/src/features/playlists/playlist.model.ts`
- `backend/src/features/playlists/playlist.routes.ts`
- `backend/src/features/playlists/playlist.controller.ts`
- `backend/src/features/playlists/playlist.service.ts`
- `backend/__tests__/others/playlists.service.test.ts`

---

### 2.6 Search Feature

**Test Location:** `__tests__/task3/search.service.test.ts` (HackerRank graded)
**Test Scenarios:** Section 6 (Search Service Tests)

**Step 1 - Write Tests:** `be--ts-unit-test-scripter`
- Write failing tests for all scenarios in Section 6
- Tests should cover: tracks-only search, prefix matching, case-insensitive, limit 5

**Step 2 - Implement:** `be--nodejs-mongo-dev`
- Create search routes: GET `/api/search?q=query`
- Create search service: tracks-only, prefix-based, limit 5, case-insensitive

**Step 3 - Verify:** Run `npm run test:task3`, ensure 100% pass rate

**Files to Create:**
- `backend/src/features/search/search.routes.ts`
- `backend/src/features/search/search.controller.ts`
- `backend/src/features/search/search.service.ts`
- `__tests__/task3/search.service.test.ts`

---

### 2.7 Database Seeding

**Agent:** `be--nodejs-mongo-dev`

**Tasks:**
1. Migrate seed script from MENN codebase
2. Adapt to Express/Mongoose patterns
3. Create npm script: `npm run seed`

**Files to Create:**
- `backend/src/scripts/seed.ts`

**Seed Data:**
- 5 artists (rock, pop, jazz, electronic, hip-hop)
- 10 albums (2 per artist)
- 50 tracks (5 per album, unique image per track)
- 2 test users (alex.morgan@hackify.com, jordan.casey@hackify.com)
- 1 test playlist "Playlist 1" with 6 tracks

**⏸️ CHECKPOINT: Stop and await user review before proceeding to Phase 3.**

---

## Phase 3: Frontend Feature Implementation

**TDD Workflow for EACH feature:**
1. `fe--unit-test-scripter` writes tests FIRST (tests fail)
2. `fe--react-dev` implements feature (tests pass)
3. Identify edge cases not in MENN codebase, add tests + implementation
4. Verify 100% pass rate

### 3.1 Core Utilities & Types

**Test Location:** `frontend/__tests__/others/formatters.test.ts`
**Test Scenarios:** Section 12 (Utility Tests)

**Step 1 - Write Tests:** `fe--unit-test-scripter`
- Write failing tests for utility functions
- Tests should cover: formatDuration, formatDate, edge cases (0, negative, large numbers)

**Step 2 - Implement:** `fe--react-dev`
1. Create TypeScript types matching backend:
   - User, Artist, Album, Track, Playlist types
   - API response types
   - Player state types
2. Create utility functions:
   - `cn()` - classname merger
   - `formatDuration()` - seconds to mm:ss
   - `formatDate()` - date formatting
3. Create API service base class

**Step 3 - Verify:** Run tests, ensure 100% pass rate

**Files to Create:**
- `frontend/src/shared/types/*.ts`
- `frontend/src/shared/utils/formatters.ts`
- `frontend/src/lib/utils.ts`
- `frontend/src/shared/services/api.service.ts`
- `frontend/__tests__/others/formatters.test.ts`

---

### 3.2 Auth Context & Pages

**Test Location:** `frontend/__tests__/others/auth.context.test.ts`
**Test Scenarios:** Section 11 (Auth Context Tests)

**Step 1 - Write Tests:** `fe--unit-test-scripter`
- Write failing tests for AuthContext
- Tests should cover: login, logout, register, getMe, token persistence, auto-restore session

**Step 2 - Implement:** `fe--react-dev`
1. Create auth service (login, register, getMe)
2. Create AuthContext with:
   - User state
   - Token management (localStorage)
   - Login/logout/register methods
   - Auto-restore session on mount
3. Create Login page
4. Create Register page
5. Create protected route wrapper

**Step 3 - Verify:** Run tests, ensure 100% pass rate

**Files to Create:**
- `frontend/src/shared/services/auth.service.ts`
- `frontend/src/shared/contexts/AuthContext.tsx`
- `frontend/src/pages/auth/LoginPage.tsx`
- `frontend/src/pages/auth/RegisterPage.tsx`
- `frontend/src/shared/components/common/ProtectedRoute.tsx`
- `frontend/__tests__/others/auth.context.test.ts`

---

### 3.3 Player Context & Reducer

**Test Location:** `__tests__/task2/playerReducer.test.ts` (HackerRank graded)
**Test Scenarios:** Section 7 (Player Reducer Tests)

**Step 1 - Write Tests:** `fe--unit-test-scripter`
- Write failing tests for all scenarios in Section 7
- Tests should cover: PLAY_TRACK, PLAY_TRACKS, PAUSE, RESUME, NEXT, PREVIOUS, SEEK, queue operations, TOGGLE_SHUFFLE, TOGGLE_REPEAT, SET_VOLUME, TICK

**Step 2 - Implement:** `fe--react-dev`
1. Create player types (state, actions)
2. Create playerReducer with all actions:
   - PLAY_TRACK, PLAY_TRACKS
   - PAUSE, RESUME
   - NEXT, PREVIOUS
   - SEEK
   - ADD_TO_QUEUE, REMOVE_FROM_QUEUE, REORDER_QUEUE, CLEAR_QUEUE
   - TOGGLE_SHUFFLE, TOGGLE_REPEAT
   - SET_VOLUME
   - TICK
   - TOGGLE_QUEUE
3. Create PlayerContext with:
   - Reducer state
   - Action dispatchers
   - Timer management for TICK
4. Create playerUtils (shuffleArray)

**Step 3 - Verify:** Run `npm run test:task2`, ensure 100% pass rate

**Files to Create:**
- `frontend/src/shared/types/player.types.ts`
- `frontend/src/shared/contexts/playerReducer.ts`
- `frontend/src/shared/contexts/PlayerContext.tsx`
- `frontend/src/shared/utils/playerUtils.ts`
- `__tests__/task2/playerReducer.test.ts`

---

### 3.4 Custom Hooks

**Test Locations:**
- `__tests__/task1/usePlaylistOperations.test.ts` (HackerRank graded)
- `__tests__/task3/useSearch.test.ts` (HackerRank graded)
- `frontend/__tests__/others/useDebounce.test.ts`
- `frontend/__tests__/others/useRecentlyPlayed.test.ts`

**Test Scenarios:** Sections 8-11

**Step 1 - Write Tests:** `fe--unit-test-scripter`
- Write failing tests for all hook scenarios
- Task1: usePlaylistOperations (reorder, add, remove, optimistic updates)
- Task3: useSearch (debouncing, API calls, loading states)
- Others: useDebounce, useRecentlyPlayed (localStorage persistence)

**Step 2 - Implement:** `fe--react-dev`
1. Create useDebounce hook
2. Create useLocalStorage hook
3. Create useRecentlyPlayed hook
4. Create useSearch hook
5. Create usePlaylistOperations hook
6. Create useToast hook

**Step 3 - Verify:** Run `npm run test:task1`, `npm run test:task3`, and frontend tests, ensure 100% pass rate

**Files to Create:**
- `frontend/src/shared/hooks/useDebounce.ts`
- `frontend/src/shared/hooks/useLocalStorage.ts`
- `frontend/src/shared/hooks/useRecentlyPlayed.ts`
- `frontend/src/shared/hooks/useSearch.ts`
- `frontend/src/shared/hooks/usePlaylistOperations.ts`
- `frontend/src/shared/hooks/useToast.ts`
- `__tests__/task1/usePlaylistOperations.test.ts`
- `__tests__/task3/useSearch.test.ts`
- `frontend/__tests__/others/useDebounce.test.ts`
- `frontend/__tests__/others/useRecentlyPlayed.test.ts`

---

### 3.5 Layout Components

**Agent:** `fe--react-dev`

**Note:** Layout components are primarily visual/UI focused. TDD not required for pure presentational components, but integration testing recommended post-implementation.

**Tasks:**
1. Create MainLayout (app shell)
2. Create Sidebar (navigation + playlists)
   - Collapsible functionality
   - Toggle icon at bottom-right corner
   - Desktop: expanded by default, Mobile: collapsed by default
3. Create TopBar (search + user menu)
   - Display first word of displayName
4. Create PlayerBar (controls + progress)
   - Hide volume bar on mobile
5. Create QueuePanel (queue list with drag-drop)
6. Create SidebarContext

**Files to Create:**
- `frontend/src/shared/components/layout/MainLayout.tsx`
- `frontend/src/shared/components/layout/Sidebar.tsx`
- `frontend/src/shared/components/layout/TopBar.tsx`
- `frontend/src/shared/components/layout/PlayerBar.tsx`
- `frontend/src/shared/components/layout/QueuePanel.tsx`
- `frontend/src/shared/contexts/SidebarContext.tsx`

---

### 3.6 Common Components

**Agent:** `fe--react-dev`

**Note:** Common components are primarily visual/UI focused. TDD not required for pure presentational components, but integration testing recommended post-implementation.

**Tasks:**
1. Create TrackCard component
   - Play/pause button (plays track, no redirect)
   - Card click (redirects to detail page)
   - Unique image per track
2. Create AlbumCard component
3. Create PlaylistCard component
4. Create SearchDropdown component
   - Tracks-only results (max 5)
   - Keyboard interactions: Enter (immediate), Escape (close), Click outside (close)
5. Create AddToPlaylistModal component
6. Create CreatePlaylistDialog component
7. Create LoadingSpinner, ErrorMessage, EmptyState

**Files to Create:**
- `frontend/src/shared/components/common/TrackCard.tsx`
- `frontend/src/shared/components/common/AlbumCard.tsx`
- `frontend/src/shared/components/common/PlaylistCard.tsx`
- `frontend/src/shared/components/common/SearchDropdown.tsx`
- `frontend/src/shared/components/common/AddToPlaylistModal.tsx`
- `frontend/src/shared/components/common/CreatePlaylistDialog.tsx`
- `frontend/src/shared/components/common/LoadingSpinner.tsx`
- `frontend/src/shared/components/common/ErrorMessage.tsx`
- `frontend/src/shared/components/common/EmptyState.tsx`

---

### 3.7 API Services

**Agent:** `fe--react-dev`

**Note:** API services are thin wrappers around HTTP calls. TDD not strictly required, but ensure all services are used by tested hooks/components.

**Tasks:**
1. Create tracks service (list, getById, play)
2. Create albums service (list, getById, search)
3. Create artists service (list, getById, search)
4. Create playlists service (CRUD, addTrack, removeTrack, reorder)
5. Create search service (tracks-only, prefix-based)

**Files to Create:**
- `frontend/src/shared/services/tracks.service.ts`
- `frontend/src/shared/services/albums.service.ts`
- `frontend/src/shared/services/artists.service.ts`
- `frontend/src/shared/services/playlists.service.ts`
- `frontend/src/shared/services/search.service.ts`

---

### 3.8 Pages

**Agent:** `fe--react-dev`

**Note:** Pages integrate tested hooks and components. Visual verification via Playwright recommended post-implementation.

**Tasks:**
1. Create HomePage
   - Recommended tracks section
   - Browse albums section
   - Browse tracks section
   - User playlists section
   - 7 track cards per row (desktop)
2. Create GenrePage
   - Genre filter chips with images (not solid colors)
   - Filtered tracks grid
3. Create AlbumDetailPage
   - Gradient background
   - Album info with artist
   - Track list
4. Create TrackDetailPage
   - Gradient background
   - Track info
   - Play/queue actions
5. Create PlaylistDetailPage
   - Playlist info
   - Track list with drag-drop reorder
   - Add/remove track actions
   - Empty playlist placeholder message

**Files to Create:**
- `frontend/src/pages/HomePage.tsx`
- `frontend/src/pages/GenrePage.tsx`
- `frontend/src/pages/AlbumDetailPage.tsx`
- `frontend/src/pages/TrackDetailPage.tsx`
- `frontend/src/pages/PlaylistDetailPage.tsx`

---

### 3.9 UI Components (shadcn/ui)

**Agent:** `fe--react-dev`

**Note:** shadcn/ui components are pre-tested by the library. No additional tests required.

**Tasks:**
1. Setup shadcn/ui configuration
2. Add required components:
   - Button
   - Card
   - Dialog
   - DropdownMenu
   - Input
   - ScrollArea
   - Skeleton
   - Slider (volume control, progress bar)
   - Toast/Toaster

**Files to Create:**
- `frontend/src/shared/components/ui/*.tsx`
- `frontend/components.json`

**⏸️ CHECKPOINT: Stop and await user review before proceeding to Phase 4.**

---

## Phase 4: Integration & Testing

### 4.1 Backend Integration Tests

**Agent:** `be--ts-unit-test-scripter`

**Tasks:**
1. Write integration tests for all endpoints
2. Use supertest for HTTP testing
3. Setup test database (in-memory MongoDB or test DB)
4. Verify all scenarios from TDD-SCENARIOS.md pass

---

### 4.2 Frontend Integration Tests

**Agent:** `fe--unit-test-scripter`

**Tasks:**
1. Write component tests with React Testing Library
2. Write hook tests
3. Write context tests
4. Mock API services
5. Verify all scenarios from TDD-SCENARIOS.md pass

---

### 4.3 E2E Testing (Optional)

**Tool:** Playwright

**Flows to Test:**
1. User registration and login
2. Browse and play music
3. Create and manage playlists
4. Search functionality
5. Queue management

**⏸️ CHECKPOINT: Stop and await user review before proceeding to Phase 5.**

---

## Phase 5: Final Verification

### 5.1 Playwright Visual Verification

**Tasks:**
1. Login with test credentials
2. Verify home page layout matches MENN
3. Verify player controls work
4. Verify playlist operations work
5. Verify search functionality
6. Compare UI/UX with running MENN app

### 5.2 Checklist

- [ ] All backend endpoints return correct responses
- [ ] All frontend pages render correctly
- [ ] Authentication flow works end-to-end
- [ ] Player controls function as expected
- [ ] Playlist CRUD operations work
- [ ] Search returns correct results
- [ ] Mobile responsiveness (if applicable)
- [ ] All tests pass (100% pass rate)
- [ ] Test coverage >= 80%

---

## Execution Order Summary

| Step | Phase | Agent | Deliverable |
|------|-------|-------|-------------|
| 1 | 1.0 | `arch--MERN-stack` | Full project scaffolding (monorepo, backend, frontend, configs, hackerrank.yml) |
| 2 | 2.1 | `be--ts-unit-test-scripter` → `be--nodejs-mongo-dev` | Auth feature + tests |
| 3 | 2.2 | `be--ts-unit-test-scripter` → `be--nodejs-mongo-dev` | Artists feature + tests |
| 4 | 2.3 | `be--ts-unit-test-scripter` → `be--nodejs-mongo-dev` | Albums feature + tests |
| 5 | 2.4 | `be--ts-unit-test-scripter` → `be--nodejs-mongo-dev` | Tracks feature + tests |
| 6 | 2.5 | `be--ts-unit-test-scripter` → `be--nodejs-mongo-dev` | Playlists feature + tests |
| 7 | 2.6 | `be--ts-unit-test-scripter` → `be--nodejs-mongo-dev` | Search feature + tests |
| 8 | 2.7 | `be--nodejs-mongo-dev` | Database seeding |
| 9 | 3.1 | `fe--react-dev` | Core utilities & types |
| 10 | 3.2 | `fe--unit-test-scripter` → `fe--react-dev` | Auth context + pages + tests |
| 11 | 3.3 | `fe--unit-test-scripter` → `fe--react-dev` | Player context + tests |
| 12 | 3.4 | `fe--unit-test-scripter` → `fe--react-dev` | Custom hooks + tests |
| 13 | 3.5 | `fe--react-dev` | Layout components |
| 14 | 3.6 | `fe--react-dev` | Common components |
| 15 | 3.7 | `fe--react-dev` | API services |
| 16 | 3.8 | `fe--react-dev` | Pages |
| 17 | 3.9 | `fe--react-dev` | UI components (shadcn/ui) |
| 18 | 4.1-4.2 | Test agents | Integration tests |
| 19 | 5.1-5.2 | Manual/Playwright | Final verification |

---

## Code Quality Rules

### Comment Policy

| Location | Rule |
|----------|------|
| Business logic | **NO comments** |
| Inside functions | **NO comments** |
| Test files | High-level comments allowed (INTRO/SCENARIO/EXPECTATION) |
| Configuration | Minimal necessary comments only |

### Asset Management

- All images stored **locally** (no external URLs)
- Unique image per track
- Genre cards use images (not solid colors)
- Album images: American singer/band artwork

### Test Selectors

- Primary selector: `data-testid` attributes
- Avoid placeholder text selectors

---

## Verification Checklist

### Pre-Verification

```bash
# Kill any existing servers
npx kill-port 4000 && npx kill-port 6000

# Seed database
npm run seed
```

### Final Verification Steps

- [ ] All backend endpoints return correct responses
- [ ] All frontend pages render correctly
- [ ] Authentication flow works end-to-end
- [ ] Player controls function as expected
- [ ] Playlist CRUD operations work
- [ ] Search returns tracks only (prefix-matching)
- [ ] Mobile responsiveness (375px breakpoint)
- [ ] All tests pass (100% pass rate)
- [ ] Test coverage >= 80%

### Playwright UI Verification

1. Login with test credentials: `alex.morgan@hackify.com` / `password123`
2. Verify home page layout
3. Verify player controls (play, pause, next, previous, shuffle, repeat)
4. Verify playlist operations (create, add track, reorder, remove, delete)
5. Verify search functionality (tracks only, prefix matching)
6. Compare UI/UX with running MENN app

### Post-Verification

```bash
# Kill dev servers after completion
npx kill-port 4000 && npx kill-port 6000
```

---

## Notes

1. **TDD Approach:** For each feature, tests are written FIRST by the test agent, then implementation follows by the dev agent.

2. **Reference MENN Codebase:** Agents should reference the MENN codebase at `C:\Users\ArijitSaha\Projects\office\zysk-projects\hackerrank\spotify-app-menn\spotify-mern-app-solution` for exact business logic, API contracts, and component behavior.

3. **No Over-Engineering:** Stick to the documented features. Don't add extra functionality.

4. **Consistent Styling:** Match the MENN app's visual design exactly.

5. **Error Handling:** Implement proper error handling matching the MENN patterns.

6. **Test Coverage Target:** Minimum 80% coverage.

7. **Test Credentials:** Use `alex.morgan@hackify.com` / `password123` for Playwright verification.

8. **HackerRank Platform Constraints:**
   - Audio playback: NOT supported (simulated only)
   - WebSocket: NOT supported
   - File upload: NOT supported
   - Email sending: NOT supported
