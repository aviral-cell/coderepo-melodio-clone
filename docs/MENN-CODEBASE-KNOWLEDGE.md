# MENN Codebase Knowledge Summary

## Overview

This document captures the comprehensive analysis of the MENN (MongoDB + Express via NestJS + Next.js + Node.js) codebase that serves as the reference implementation for the MERN stack migration.

**Source Codebase Location:** `C:\Users\ArijitSaha\Projects\office\zysk-projects\hackerrank\spotify-app-menn\spotify-mern-app-solution`

---

## Project Structure

### Root Level
```
spotify-mern-app-solution/
├── backend/          # NestJS API server
├── frontend/         # Next.js web application
├── node_modules/
├── output/
├── .vscode/
├── package.json      # Root package.json for workspace
├── hackerrank.yml    # HackerRank configuration
└── setup.sh          # Setup script
```

### Backend Structure (NestJS)
```
backend/
├── src/
│   ├── features/
│   │   ├── albums/       # Album management
│   │   ├── artists/      # Artist management
│   │   ├── auth/         # Authentication (JWT)
│   │   ├── playlists/    # Playlist CRUD + track operations
│   │   ├── search/       # Unified search
│   │   ├── tracks/       # Track management
│   │   └── users/        # User management
│   ├── scripts/
│   │   └── seed.ts       # Database seeding script
│   ├── shared/
│   │   ├── database/     # Database module
│   │   ├── decorators/   # Custom decorators (CurrentUser)
│   │   ├── filters/      # Global exception filter
│   │   ├── guards/       # JWT auth guard
│   │   ├── interceptors/ # Response transform interceptor
│   │   ├── pipes/        # Validation & ObjectId pipes
│   │   └── types/        # Shared TypeScript types
│   ├── app.module.ts
│   └── main.ts
├── test/
├── .env
├── jest.config.js
└── package.json
```

### Frontend Structure (Next.js)
```
frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── (auth)/       # Auth layout group
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── album/[id]/   # Album detail page
│   │   ├── genre/        # Genre browsing page
│   │   ├── playlist/[id]/ # Playlist detail page
│   │   ├── track/[id]/   # Track detail page
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx      # Home page
│   │   └── providers.tsx
│   ├── lib/
│   │   └── utils.ts      # Utility functions (cn, etc.)
│   └── shared/
│       ├── components/
│       │   ├── common/   # Reusable components
│       │   ├── layout/   # Layout components
│       │   └── ui/       # shadcn/ui components
│       ├── contexts/     # React contexts
│       ├── hooks/        # Custom hooks
│       ├── services/     # API service layer
│       ├── types/        # TypeScript types
│       └── utils/        # Utility functions
├── __tests__/            # Test files (task-based organization)
├── .env
├── jest.config.js
├── tailwind.config.ts
└── package.json
```

---

## Data Models

### User
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | Auto | Primary key |
| email | String | Yes | Unique, lowercase |
| username | String | Yes | Unique |
| passwordHash | String | Yes | Bcrypt hash |
| displayName | String | Yes | Display name |
| avatarUrl | String | No | Profile image |
| createdAt | Date | Auto | Timestamp |
| updatedAt | Date | Auto | Timestamp |

### Artist
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | Auto | Primary key |
| name | String | Yes | Artist name |
| bio | String | No | Biography |
| imageUrl | String | No | Profile image |
| genres | [String] | Yes | Genre list |
| followerCount | Number | Yes | Default: 0 |

### Album
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | Auto | Primary key |
| title | String | Yes | Album title |
| artistId | ObjectId | Yes | Ref: Artist |
| releaseDate | Date | Yes | Release date |
| coverImageUrl | String | No | Cover image |
| totalTracks | Number | Yes | Track count |

### Track
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | Auto | Primary key |
| title | String | Yes | Track title |
| artistId | ObjectId | Yes | Ref: Artist |
| albumId | ObjectId | Yes | Ref: Album |
| durationInSeconds | Number | Yes | Duration |
| trackNumber | Number | Yes | Position in album |
| genre | String | Yes | Lowercase genre |
| playCount | Number | Yes | Default: 0 |
| coverImageUrl | String | No | Cover image |

### Playlist
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | Auto | Primary key |
| name | String | Yes | Playlist name |
| description | String | No | Description |
| ownerId | ObjectId | Yes | Ref: User |
| trackIds | [ObjectId] | Yes | Ordered track refs |
| coverImageUrl | String | No | Cover image |
| isPublic | Boolean | Yes | Default: true |

---

## API Endpoints

### Authentication (`/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/register | No | Register new user |
| POST | /auth/login | No | Login, returns JWT |
| GET | /auth/me | Yes | Get current user |

### Tracks (`/tracks`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /tracks | Yes | List tracks (paginated) |
| GET | /tracks/search | Yes | Search tracks by title |
| GET | /tracks/:id | Yes | Get track by ID |
| POST | /tracks/:id/play | Yes | Log play, increment count |

### Albums (`/albums`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /albums | Yes | List albums (paginated) |
| GET | /albums/search | Yes | Search albums |
| GET | /albums/:id | Yes | Get album by ID |

### Artists (`/artists`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /artists | Yes | List artists (paginated) |
| GET | /artists/search | Yes | Search artists |
| GET | /artists/:id | Yes | Get artist by ID |

### Playlists (`/playlists`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /playlists | Yes | Get user's playlists |
| GET | /playlists/:id | Yes | Get playlist with tracks |
| POST | /playlists | Yes | Create playlist |
| PATCH | /playlists/:id | Yes | Update playlist |
| DELETE | /playlists/:id | Yes | Delete playlist |
| POST | /playlists/:id/tracks | Yes | Add track to playlist |
| DELETE | /playlists/:id/tracks/:trackId | Yes | Remove track |
| PATCH | /playlists/:id/reorder | Yes | Reorder tracks |

### Search (`/search`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /search?q=query | Yes | Unified search (tracks, artists, albums) |

---

## Frontend State Management

### AuthContext
- Manages user authentication state
- Handles login/logout/register operations
- Persists JWT token to localStorage
- Auto-loads user on app mount

### PlayerContext + playerReducer
- Manages music playback simulation
- State includes:
  - `currentTrack`: Currently playing track
  - `queue`: Array of tracks to play
  - `originalQueue`: Pre-shuffle order (for restore)
  - `queueIndex`: Current position in queue
  - `isPlaying`: Playback state
  - `elapsedSeconds`: Progress in current track
  - `shuffleEnabled`: Shuffle mode
  - `repeatMode`: 'off' | 'all' | 'one'
  - `volume`: 0-100
  - `isQueueOpen`: Queue panel visibility

### Player Actions
- `PLAY_TRACK`: Play single track
- `PLAY_TRACKS`: Play array of tracks from index
- `PAUSE` / `RESUME`: Control playback
- `NEXT` / `PREVIOUS`: Navigation
- `SEEK`: Jump to position
- `ADD_TO_QUEUE` / `REMOVE_FROM_QUEUE` / `CLEAR_QUEUE`
- `REORDER_QUEUE`: Drag-and-drop reorder
- `TOGGLE_SHUFFLE`: Enable/disable shuffle
- `TOGGLE_REPEAT`: Cycle repeat modes
- `SET_VOLUME`: Adjust volume
- `TICK`: Timer tick (1 second increment)
- `TOGGLE_QUEUE`: Show/hide queue panel

### SidebarContext
- Manages sidebar collapse state

---

## Custom Hooks

### usePlaylistOperations
- `reorderTracks(oldIndex, newIndex)`: Drag-drop reorder
- `removeTrack(trackId)`: Remove track from playlist
- Implements optimistic updates with rollback on failure
- Exposes `isReordering`, `isRemoving` loading states

### useRecentlyPlayed
- Manages "Recently Played" track history
- Persists to localStorage (key: `hackify_clone_recently_played`)
- Max 10 tracks, most recent first
- Deduplication: re-played tracks move to front

### useSearch
- Search with debouncing (300ms)
- Returns `tracks`, `isLoading`, `error`
- Empty/whitespace queries return empty results

### useDebounce
- Generic debounce hook
- Delays value changes by specified ms

### useLocalStorage
- Generic localStorage persistence hook

---

## Seeding Data

The seed script creates:
- **5 Artists** (one per genre: rock, pop, jazz, electronic, hip-hop)
- **10 Albums** (2 per artist)
- **50 Tracks** (5 per album, 180-300 seconds duration)
  - Each track has **unique image**
- **2 Test Users** (gender-neutral names):
  - `alex.morgan@hackify.com` / `password123`
  - `jordan.casey@hackify.com` / `password123`
- **1 Default Playlist**: "**Playlist 1**" with 6 tracks

### User Display Name
- `displayName` field stores full name (e.g., "Alex Morgan")
- Header displays **first word of displayName** (e.g., "Alex")

---

## Test Coverage (Existing)

### Backend Tests (`backend/src/features/*/__tests__/`)
- `auth.service.spec.ts`: Register, login, getMe
- `playlists.service.spec.ts`: Create, findByOwnerId, addTrack
- `albums.service.spec.ts`: Service tests
- `artists.service.spec.ts`: Service tests
- `tracks.service.spec.ts`: Service tests
- `search.service.spec.ts`: Service tests
- `users.service.spec.ts`: Service tests

### Frontend Tests (`frontend/__tests__/`)
- `task1/usePlaylistOperations.test.ts`: Reorder, remove, optimistic updates, rollback
- `task2/playerReducer.test.ts`: Shuffle, repeat, tick, queue operations
- `task3/useRecentlyPlayed.test.ts`: Add, deduplicate, max limit, persistence
- `task4/useSearch.test.ts`: Debouncing, loading states, error handling

### Additional Frontend Tests
- `frontend/src/shared/hooks/__tests__/useDebounce.test.ts`
- `frontend/src/shared/utils/__tests__/formatters.test.ts`

---

## Key Business Logic

### Authentication
- JWT-based with 7-day expiration
- Password hashing with bcrypt (10 rounds)
- Email stored lowercase
- Unique constraints on email and username

### Playlist Operations
- Owner-only modification (create, update, delete, add/remove tracks)
- Private playlists only visible to owner
- Track order preserved via array order
- No duplicate tracks allowed

### Music Player (Simulated)
- Timer-based playback (no actual audio)
- `elapsedSeconds` increments by 1 each second
- Track ends when `elapsedSeconds >= durationInSeconds`
- Shuffle preserves current track at index 0
- Repeat modes: off (stop at end), all (loop queue), one (loop track)
- Previous within 3 seconds restarts track; after 3 seconds goes to previous

### Search
- Returns **tracks only** (not albums/artists in dropdown)
- **Prefix-based** title matching (case-insensitive)
- Results limited to **5 tracks max**
- Keyboard interactions: Enter (immediate), Escape (close), Click outside (close)

---

## UI Components

### Layout Components
- `MainLayout`: App shell with sidebar, main content, player bar
- `Sidebar`: Navigation + user's playlists
- `TopBar`: Search bar + user menu
- `PlayerBar`: Playback controls + progress + volume
- `QueuePanel`: Current queue with drag-drop reorder

### Common Components
- `AlbumCard`: Album display card
- `TrackCard`: Track display card with play button + menu
- `PlaylistCard`: Playlist display card
- `AddToPlaylistModal`: Add track to playlist modal
- `CreatePlaylistDialog`: Create new playlist dialog
- `SearchDropdown`: Search results dropdown
- `LoadingSpinner`, `ErrorMessage`, `EmptyState`: State components

### UI Components (shadcn/ui)
- Button, Card, Dialog, DropdownMenu, Input
- ScrollArea, Skeleton, Slider, Toast, Toaster

---

## Configuration

### Environment Variables
**Backend (.env)**
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `JWT_EXPIRES_IN`: Token expiration (e.g., "7d")
- `PORT`: Server port (default: 5000)

**Frontend (.env)**
- `NEXT_PUBLIC_API_URL`: Backend API URL

### Ports
- Backend: 5000 (MENN), 6001 (target MERN)
- Frontend: 3000 (MENN), 4000 (target MERN)

---

## Notes for MERN Migration

1. **NestJS to Express**: Replace decorators with Express middleware/routes
2. **Next.js to React**: Convert App Router to React Router v7
3. **Remove Next.js specifics**: Server components, `use client`, etc.
4. **Keep same API contracts**: Maintain endpoint paths and response shapes
5. **Preserve all business logic**: Same validation, error handling
6. **Test compatibility**: Ensure existing test scenarios still apply
