# Hackify - Hackify Clone (HackerRank Challenge)

## Overview

A full-stack music streaming application built with the MNN Stack (MongoDB + Next.js + NestJS). This project serves as a HackerRank debugging challenge where candidates fix intentional bugs in the codebase.

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Next.js | 15.1+ |
| Frontend | React | 19.0 |
| Frontend | Tailwind CSS | 3.4+ |
| Backend | NestJS | 10.x |
| Database | MongoDB | - |
| ODM | Mongoose | 8.x |
| Auth | JWT (Passport) | - |

## Project Structure

```
hackify-mern-app/
├── backend/                  # NestJS API (see backend/CLAUDE.md)
│   ├── src/
│   │   ├── features/         # Feature modules
│   │   └── shared/           # Shared utilities
│   └── package.json
│
├── frontend/                 # Next.js App (see frontend/CLAUDE.md)
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   └── shared/           # Components, contexts, hooks, services
│   └── package.json
│
├── docs/                     # Documentation
│   ├── hackify-clone-prd.md
│   ├── hackify-clone-features-summary.md
│   └── implementation-plan.md
│
├── scripts/
│   └── merge-junit.js        # Merges test results for HackerRank
│
├── hackerrank.yml            # HackerRank configuration
├── setup.sh                  # Environment setup script
└── package.json              # Root package (npm workspaces)
```

## Monorepo Setup

This project uses npm workspaces to manage frontend and backend packages:

```json
{
  "workspaces": ["frontend", "backend"]
}
```

## Commands

### Root Level
```bash
# Install all dependencies
npm install

# Start both frontend and backend
npm start

# Build all
npm run build

# Run all tests (backend + frontend + merge results)
npm test

# Individual workspace tests
npm run test:backend
npm run test:frontend

# Linting and formatting
npm run lint
npm run format
```

### Backend (from /backend)
```bash
npm run dev          # Dev server with watch
npm run seed         # Seed database
npm test             # Run tests
```

### Frontend (from /frontend)
```bash
npm run dev          # Dev server (port 3000)
npm test             # Run tests
```

## Environment Setup

1. **Backend** (`backend/.env`):
```env
NODE_ENV=development
APP_PORT=5000
MONGODB_URI=mongodb://root:Root123@localhost:27017/hackify_clone?authSource=admin
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d
```

2. **Frontend** (`frontend/.env`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## HackerRank Configuration

The `hackerrank.yml` defines:
- **Scoring**: `npm test` runs all tests
- **Output**: `junit.xml` (merged from both workspaces)
- **Readonly paths**: Test files that candidates cannot modify

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Pages     │  │   Contexts  │  │     Services        │  │
│  │  (App Router)│  │ Auth/Player │  │  (API calls)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP/REST
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend (NestJS)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Controllers │  │  Services   │  │    Mongoose Models  │  │
│  │  (Routes)   │  │  (Logic)    │  │    (Schemas)        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                        MongoDB                               │
│   Collections: users, tracks, artists, albums, playlists    │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

| Feature | Location | Description |
|---------|----------|-------------|
| Music Player | `frontend/src/shared/contexts/PlayerContext.tsx` | Simulated playback with queue, shuffle, repeat |
| Search | `frontend/src/app/search/page.tsx` | Debounced search across tracks/albums/artists |
| Playlists | `backend/src/features/playlists/` | CRUD operations, track reordering |
| Authentication | `backend/src/features/auth/` | JWT-based login/register |

## Testing

### Test Structure
- Backend: `.spec.ts` files in `__tests__/` folders
- Frontend: `.test.ts` and `.test.tsx` files in `__tests__/` folders

### Running Tests
```bash
# All tests with merged results
npm test

# Single test file
npx jest frontend/src/shared/hooks/__tests__/useDebounce.test.ts
npx jest backend/src/features/auth/__tests__/auth.service.spec.ts
```

## Forbidden Technologies

Per project constraints, do NOT use:
- Prisma/TypeORM (use Mongoose)
- Axios (use native fetch)
- Redux/Zustand (use React Context)

## URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Swagger Docs | http://localhost:5000/api/docs |

## For Detailed Documentation

- Backend details: See `backend/CLAUDE.md`
- Frontend details: See `frontend/CLAUDE.md`
- Product Requirements: See `docs/hackify-clone-prd.md`
- Feature Summary: See `docs/hackify-clone-features-summary.md`
