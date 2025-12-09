# Hackify - Music Player State Management Challenge

A full-stack music streaming application inspired by Hackify, built with the MNN Stack (MongoDB + Next.js + NestJS). Built as a HackerRank assessment to evaluate React state management and debugging skills.

## Overview

This project implements a Hackify-like music player with queue management, shuffle, repeat, and search functionality. The application compiles and runs successfully, but contains **4 intentional bugs** in the frontend that you must identify and fix.

### Key Features

- **Music Player**: Simulated playback with queue management
- **Shuffle Mode**: Randomizes queue while preserving current track
- **Queue Management**: Add, remove, and reorder tracks
- **Search**: Debounced search across tracks, albums, and artists
- **React Context**: State management using useReducer pattern

## Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- npm

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs dependencies for both frontend and backend using npm workspaces.

### 2. Start the Application

```bash
npm start
```

This starts both servers concurrently:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Swagger Docs**: http://localhost:5000/api/docs

### 3. Run Tests

```bash
npm test                    # Run all tests (frontend + backend)
npm run test:frontend       # Run only frontend tests (24 tests)
npm run test:backend        # Run only backend tests (7 tests)
```

## Your Task

Find and fix all **4 bugs** in the frontend codebase. Each bug has dedicated tests that currently fail. Your goal is to make all **24 frontend tests pass**.

### Bug Summary

| Bug | Category | Location | Points |
|-----|----------|----------|--------|
| Bug B | Shuffle Toggle | PlayerContext.tsx | 30 |
| Bug F | Queue Index | PlayerContext.tsx | 25 |
| Bug G | Timer Cleanup | PlayerContext.tsx | 25 |
| Bug D | Search Debounce | search/page.tsx | 20 |

For detailed bug descriptions, see [PROBLEM_STATEMENT.md](./PROBLEM_STATEMENT.md).

### What's Working vs What's Broken

| Feature | Status | Details |
|---------|--------|---------|
| Playing tracks | Working | Tracks play correctly |
| Pausing/Resuming | Working | Playback controls work |
| Next/Previous | Working | Navigation works correctly |
| Shuffle toggle | **BROKEN** | Current track changes unexpectedly |
| Remove from queue | **BROKEN** | Player jumps to wrong track |
| Timer/Progress | **BROKEN** | Multiple timers or memory issues |
| Search | **BROKEN** | Searches on every keystroke |

## Project Structure

```
hackify-mern-app/
├── backend/                      # NestJS API
│   ├── src/
│   │   ├── shared/               # Config, guards, pipes
│   │   ├── features/             # Feature modules
│   │   │   ├── auth/
│   │   │   ├── tracks/
│   │   │   ├── albums/
│   │   │   ├── artists/
│   │   │   ├── playlists/
│   │   │   └── search/
│   │   └── seed/                 # Database seeding
│   └── package.json
│
├── frontend/                     # Next.js App
│   ├── src/
│   │   ├── app/                  # App Router pages
│   │   │   └── search/page.tsx   # Bug D: Debounce
│   │   └── shared/
│   │       ├── contexts/
│   │       │   ├── PlayerContext.tsx    # Bugs B, F, G
│   │       │   └── __tests__/
│   │       │       ├── playerReducer.test.ts
│   │       │       └── PlayerContext.test.tsx
│   │       └── hooks/
│   │           ├── useDebounce.ts
│   │           └── __tests__/
│   │               └── useDebounce.test.ts  # Bug D tests
│   └── package.json
│
├── PROBLEM_STATEMENT.md          # Detailed bug descriptions
├── ARCHITECTURE.md               # Architecture diagrams
├── hackerrank.yml                # HackerRank configuration
└── README.md
```

## Testing

### Frontend Tests (24 tests)

Located in `frontend/src/shared/`:

| Test File | Tests | Bug Coverage |
|-----------|-------|--------------|
| `playerReducer.test.ts` | 14 | Bugs B, F, G |
| `useDebounce.test.ts` | 3 | Bug D |
| `PlayerContext.test.tsx` | 4 | Bug G (interval) |
| `TrackCard.test.tsx` | 3 | Component tests |

### Running Specific Tests

```bash
# Run all frontend tests
npm run test:frontend

# Run specific test file
npx jest frontend/src/shared/contexts/__tests__/playerReducer.test.ts
npx jest frontend/src/shared/hooks/__tests__/useDebounce.test.ts
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Create account
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Current user

### Catalog
- `GET /api/v1/tracks` - List tracks
- `GET /api/v1/artists` - List artists
- `GET /api/v1/albums` - List albums
- `GET /api/v1/search?q=` - Unified search

### Playlists
- `GET /api/v1/playlists` - User playlists
- `POST /api/v1/playlists` - Create playlist
- `POST /api/v1/playlists/:id/tracks` - Add track

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.1+ | React framework with App Router |
| React | 19.0 | UI library |
| TypeScript | 5.7+ | Type safety |
| Tailwind CSS | 3.4+ | Styling |
| Shadcn UI | - | Component library |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| NestJS | 10+ | Node.js framework |
| MongoDB | - | Database |
| Mongoose | 8+ | ODM |
| Passport JWT | - | Authentication |

### Constraints (Do NOT Use)
- Redux, Zustand (use React Context only)
- Axios (use native Fetch)
- Prisma, TypeORM (use Mongoose)

## PlayerContext State Structure

```typescript
interface PlayerState {
  currentTrack: Track | null;     // Currently playing track
  queue: Track[];                 // List of tracks to play
  originalQueue: Track[];         // Original order before shuffle
  queueIndex: number;             // Index of current track in queue
  isPlaying: boolean;             // Whether playback is active
  elapsedSeconds: number;         // Current position in track
  shuffleEnabled: boolean;        // Whether shuffle is on
  repeatMode: 'off' | 'one' | 'all';  // Repeat setting
}
```

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
APP_PORT=5000
MONGODB_URI=mongodb://root:Root123@localhost:27017/hackify_clone?authSource=admin
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Success Criteria

1. **All 24 frontend tests must pass**
2. **Application must compile** - No TypeScript or build errors
3. **Application must run** - Both frontend and backend start without errors
4. **No new bugs introduced** - Fixes should be targeted, not rewrites

## Documentation

- [PROBLEM_STATEMENT.md](./PROBLEM_STATEMENT.md) - Detailed bug descriptions (start here!)
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture with diagrams

## HackerRank Integration

This project is configured for HackerRank assessment:

- `hackerrank.yml`: Defines test commands and scoring
- Jest JSON output format for test results
- Read-only test files to prevent tampering

### Scoring

| Bug | Points |
|-----|--------|
| Bug B: Shuffle Loses Track | 30 |
| Bug F: Queue Index Error | 25 |
| Bug G: Timer Cleanup | 25 |
| Bug D: Missing Debounce | 20 |
| **Total** | **100** |

---

Built for HackerRank debugging challenge.
