# Melodio Clone - Implementation Plan

## Document Information

| Field | Value |
|-------|-------|
| Project | Melodio Clone for HackerRank Debugging Challenge |
| Stack | MNN (MongoDB + Next.js + NestJS) |
| Version | 1.0 |
| Status | Ready for Development |

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Technology Stack Summary](#2-technology-stack-summary)
3. [Phase Breakdown](#3-phase-breakdown)
4. [Database Schemas](#4-database-schemas)
5. [API Endpoints](#5-api-endpoints)
6. [Frontend Components](#6-frontend-components)
7. [State Management](#7-state-management)
8. [Implementation Order](#8-implementation-order)
9. [Testing Strategy](#9-testing-strategy)

---

## 1. Project Structure

### 1.1 Root Structure

```
melodio-mern-app/
├── backend/                    # NestJS API
├── frontend/                   # Next.js App
├── docs/                       # Documentation
│   ├── melodio-clone-prd.md
│   ├── melodio-clone-features-summary.md
│   └── implementation-plan.md
├── .gitignore
└── README.md
```

### 1.2 Backend Structure (NestJS - Feature-Based)

```
backend/
├── src/
│   ├── shared/
│   │   ├── config/
│   │   │   ├── app-config.module.ts
│   │   │   ├── app-config.service.ts
│   │   │   └── env.validation.ts
│   │   ├── database/
│   │   │   └── database.module.ts
│   │   ├── filters/
│   │   │   └── global-exception.filter.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   ├── pipes/
│   │   │   ├── validation.pipe.ts
│   │   │   └── parse-object-id.pipe.ts
│   │   ├── decorators/
│   │   │   └── current-user.decorator.ts
│   │   ├── cache/
│   │   │   └── cache.service.ts
│   │   ├── swagger/
│   │   │   └── swagger.service.ts
│   │   └── types/
│   │       ├── index.ts
│   │       └── api-response.type.ts
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts
│   │   │   ├── dto/
│   │   │   │   ├── register.dto.ts
│   │   │   │   └── login.dto.ts
│   │   │   └── __tests__/
│   │   │       └── auth.service.spec.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── schemas/
│   │   │   │   └── user.schema.ts
│   │   │   ├── dto/
│   │   │   │   └── update-user.dto.ts
│   │   │   └── __tests__/
│   │   │       └── users.service.spec.ts
│   │   │
│   │   ├── tracks/
│   │   │   ├── tracks.module.ts
│   │   │   ├── tracks.controller.ts
│   │   │   ├── tracks.service.ts
│   │   │   ├── schemas/
│   │   │   │   └── track.schema.ts
│   │   │   ├── dto/
│   │   │   │   └── track-query.dto.ts
│   │   │   └── __tests__/
│   │   │       └── tracks.service.spec.ts
│   │   │
│   │   ├── artists/
│   │   │   ├── artists.module.ts
│   │   │   ├── artists.controller.ts
│   │   │   ├── artists.service.ts
│   │   │   ├── schemas/
│   │   │   │   └── artist.schema.ts
│   │   │   ├── dto/
│   │   │   │   └── artist-query.dto.ts
│   │   │   └── __tests__/
│   │   │       └── artists.service.spec.ts
│   │   │
│   │   ├── albums/
│   │   │   ├── albums.module.ts
│   │   │   ├── albums.controller.ts
│   │   │   ├── albums.service.ts
│   │   │   ├── schemas/
│   │   │   │   └── album.schema.ts
│   │   │   ├── dto/
│   │   │   │   └── album-query.dto.ts
│   │   │   └── __tests__/
│   │   │       └── albums.service.spec.ts
│   │   │
│   │   ├── playlists/
│   │   │   ├── playlists.module.ts
│   │   │   ├── playlists.controller.ts
│   │   │   ├── playlists.service.ts
│   │   │   ├── schemas/
│   │   │   │   └── playlist.schema.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-playlist.dto.ts
│   │   │   │   ├── update-playlist.dto.ts
│   │   │   │   └── reorder-tracks.dto.ts
│   │   │   └── __tests__/
│   │   │       └── playlists.service.spec.ts
│   │   │
│   │   ├── library/
│   │   │   ├── library.module.ts
│   │   │   ├── library.controller.ts
│   │   │   ├── library.service.ts
│   │   │   ├── schemas/
│   │   │   │   ├── liked-track.schema.ts
│   │   │   │   ├── liked-album.schema.ts
│   │   │   │   └── followed-artist.schema.ts
│   │   │   └── __tests__/
│   │   │       └── library.service.spec.ts
│   │   │
│   │   ├── listening-history/
│   │   │   ├── listening-history.module.ts
│   │   │   ├── listening-history.controller.ts
│   │   │   ├── listening-history.service.ts
│   │   │   ├── schemas/
│   │   │   │   └── listening-history.schema.ts
│   │   │   ├── dto/
│   │   │   │   └── log-play.dto.ts
│   │   │   └── __tests__/
│   │   │       └── listening-history.service.spec.ts
│   │   │
│   │   ├── search/
│   │   │   ├── search.module.ts
│   │   │   ├── search.controller.ts
│   │   │   ├── search.service.ts
│   │   │   ├── dto/
│   │   │   │   └── search-query.dto.ts
│   │   │   └── __tests__/
│   │   │       └── search.service.spec.ts
│   │   │
│   │   ├── discover-weekly/
│   │   │   ├── discover-weekly.module.ts
│   │   │   ├── discover-weekly.controller.ts
│   │   │   ├── discover-weekly.service.ts
│   │   │   └── __tests__/
│   │   │       └── discover-weekly.service.spec.ts
│   │   │
│   │   ├── analytics/
│   │   │   ├── analytics.module.ts
│   │   │   ├── analytics.controller.ts
│   │   │   ├── analytics.service.ts
│   │   │   └── __tests__/
│   │   │       └── analytics.service.spec.ts
│   │   │
│   │   ├── recommendations/
│   │   │   ├── recommendations.module.ts
│   │   │   ├── recommendations.controller.ts
│   │   │   ├── recommendations.service.ts
│   │   │   ├── dto/
│   │   │   │   └── queue-recommendations.dto.ts
│   │   │   └── __tests__/
│   │   │       └── recommendations.service.spec.ts
│   │   │
│   │   └── trending/
│   │       ├── trending.module.ts
│   │       ├── trending.controller.ts
│   │       ├── trending.service.ts
│   │       └── __tests__/
│   │           └── trending.service.spec.ts
│   │
│   ├── seed/
│   │   ├── seed.module.ts
│   │   ├── seed.service.ts
│   │   ├── data/
│   │   │   ├── artists.data.ts
│   │   │   ├── albums.data.ts
│   │   │   ├── tracks.data.ts
│   │   │   └── users.data.ts
│   │   └── seed.command.ts
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── test/
│   ├── jest-e2e.json
│   └── app.e2e-spec.ts
│
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── nest-cli.json
├── jest.config.js
├── tsconfig.json
├── tsconfig.build.json
└── package.json
```

### 1.3 Frontend Structure (Next.js App Router)

```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (main)/
│   │   │   ├── layout.tsx              # Main layout with sidebar + player
│   │   │   ├── page.tsx                # Home page
│   │   │   ├── search/
│   │   │   │   └── page.tsx
│   │   │   ├── library/
│   │   │   │   └── page.tsx
│   │   │   ├── playlist/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── album/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── artist/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── discover-weekly/
│   │   │   │   └── page.tsx
│   │   │   ├── stats/
│   │   │   │   └── page.tsx
│   │   │   └── trending/
│   │   │       └── page.tsx
│   │   │
│   │   ├── layout.tsx                  # Root layout
│   │   ├── globals.css
│   │   └── providers.tsx               # Context providers wrapper
│   │
│   ├── shared/
│   │   ├── components/
│   │   │   ├── ui/                     # Shadcn UI components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── slider.tsx
│   │   │   │   ├── toast.tsx
│   │   │   │   ├── toaster.tsx
│   │   │   │   ├── skeleton.tsx
│   │   │   │   └── scroll-area.tsx
│   │   │   │
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── TopNav.tsx
│   │   │   │   ├── PlayerBar.tsx
│   │   │   │   └── QueueSidebar.tsx
│   │   │   │
│   │   │   ├── track/
│   │   │   │   ├── TrackRow.tsx
│   │   │   │   ├── TrackList.tsx
│   │   │   │   └── TrackCard.tsx
│   │   │   │
│   │   │   ├── playlist/
│   │   │   │   ├── PlaylistCard.tsx
│   │   │   │   ├── CreatePlaylistDialog.tsx
│   │   │   │   └── AddToPlaylistMenu.tsx
│   │   │   │
│   │   │   ├── album/
│   │   │   │   └── AlbumCard.tsx
│   │   │   │
│   │   │   ├── artist/
│   │   │   │   └── ArtistCard.tsx
│   │   │   │
│   │   │   ├── search/
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   └── SearchResults.tsx
│   │   │   │
│   │   │   └── common/
│   │   │       ├── LoadingSpinner.tsx
│   │   │       ├── ErrorMessage.tsx
│   │   │       └── EmptyState.tsx
│   │   │
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx
│   │   │   └── PlayerContext.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── usePlayer.ts
│   │   │   ├── useDebounce.ts
│   │   │   └── useLocalStorage.ts
│   │   │
│   │   ├── services/
│   │   │   ├── api.service.ts          # Base fetch wrapper
│   │   │   ├── auth.service.ts
│   │   │   ├── tracks.service.ts
│   │   │   ├── artists.service.ts
│   │   │   ├── albums.service.ts
│   │   │   ├── playlists.service.ts
│   │   │   ├── library.service.ts
│   │   │   ├── search.service.ts
│   │   │   ├── analytics.service.ts
│   │   │   └── recommendations.service.ts
│   │   │
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   ├── track.types.ts
│   │   │   ├── artist.types.ts
│   │   │   ├── album.types.ts
│   │   │   ├── playlist.types.ts
│   │   │   ├── user.types.ts
│   │   │   ├── player.types.ts
│   │   │   └── api.types.ts
│   │   │
│   │   └── utils/
│   │       ├── formatters.ts           # Time, date formatters
│   │       └── validators.ts           # Zod schemas
│   │
│   └── lib/
│       └── utils.ts                    # Shadcn cn() utility
│
├── public/
│   ├── icons/
│   └── images/
│
├── __tests__/
│   ├── components/
│   │   ├── TrackRow.test.tsx
│   │   ├── PlayerBar.test.tsx
│   │   └── SearchBar.test.tsx
│   └── hooks/
│       └── usePlayer.test.ts
│
├── .env.example
├── .env.local
├── .eslintrc.json
├── components.json                     # Shadcn config
├── jest.config.js
├── jest.setup.ts
├── next.config.ts
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 2. Technology Stack Summary

### 2.1 Backend

| Component | Technology | Notes |
|-----------|------------|-------|
| Runtime | Node.js (LTS) | v20+ |
| Framework | NestJS v10+ | Feature-based modules |
| Database | MongoDB | Atlas or local |
| ODM | Mongoose v8+ | NOT Prisma/TypeORM |
| Validation | class-validator | DTOs |
| Auth | JWT (passport-jwt) | 7-day expiration |
| Caching | node-cache | In-memory, 5-min TTL |
| API Docs | Swagger (@nestjs/swagger) | Auto-generated |

### 2.2 Frontend

| Component | Technology | Notes |
|-----------|------------|-------|
| Framework | Next.js 15/16 | App Router |
| React | React 19 | Server + Client components |
| Styling | Tailwind CSS v4 | Dark theme |
| UI Library | Shadcn UI | Custom path: shared/components/ui |
| State | React Context + useReducer | NO Zustand |
| HTTP | Native Fetch API | NO Axios |
| Validation | Zod | Form validation |
| Icons | Lucide React | Consistent iconography |

### 2.3 Forbidden Technologies

| Category | Forbidden | Use Instead |
|----------|-----------|-------------|
| ORM | Prisma, TypeORM | Mongoose |
| HTTP Client | Axios, TanStack Query | Native Fetch |
| State | Redux, Zustand, Jotai | Context + useReducer |
| Database | PostgreSQL, MySQL | MongoDB |
| Auth | OAuth, SSO | Simple JWT |

---

## 3. Phase Breakdown

### Phase 1: Project Foundation (Days 1-2)

**Goal**: Set up both projects with core infrastructure.

#### Backend Tasks

| File | Purpose |
|------|---------|
| `package.json` | Dependencies: @nestjs/core, @nestjs/mongoose, mongoose, class-validator, passport-jwt, bcrypt, node-cache |
| `src/main.ts` | Bootstrap with validation pipe, CORS, versioning, Swagger |
| `src/app.module.ts` | Root module importing all feature modules |
| `src/shared/config/*` | Environment validation and config service |
| `src/shared/database/database.module.ts` | MongoDB connection via MongooseModule.forRootAsync |
| `src/shared/filters/global-exception.filter.ts` | Unified error response format |
| `src/shared/pipes/validation.pipe.ts` | Global DTO validation |
| `src/shared/pipes/parse-object-id.pipe.ts` | MongoDB ObjectId validation |
| `src/shared/interceptors/transform.interceptor.ts` | Response wrapper { success, data } |
| `src/shared/swagger/swagger.service.ts` | Swagger setup with bearer auth |
| `src/shared/types/api-response.type.ts` | TypeScript interfaces for responses |
| `.env.example` | Template for environment variables |

#### Frontend Tasks

| File | Purpose |
|------|---------|
| `package.json` | Dependencies: next, react, tailwindcss, shadcn components, zod, lucide-react |
| `src/app/layout.tsx` | Root layout with fonts, metadata |
| `src/app/globals.css` | Tailwind imports + CSS variables for dark theme |
| `src/app/providers.tsx` | Wrap app in context providers |
| `tailwind.config.ts` | Dark theme configuration, Melodio colors |
| `components.json` | Shadcn configuration pointing to shared/components/ui |
| `src/lib/utils.ts` | cn() utility for Shadcn |
| `src/shared/services/api.service.ts` | Base fetch wrapper with error handling |
| `src/shared/types/api.types.ts` | API response types |
| `next.config.ts` | API rewrites, image domains |

#### Deliverables
- [ ] Backend starts on port 5000, shows Swagger UI
- [ ] Frontend starts on port 3000, shows placeholder page
- [ ] MongoDB connection established
- [ ] Environment variables documented

---

### Phase 2: Authentication (Days 3-4)

**Goal**: JWT-based authentication with user registration/login.

#### Backend Tasks

| File | Purpose |
|------|---------|
| `src/features/users/schemas/user.schema.ts` | User mongoose schema with indexes |
| `src/features/users/users.module.ts` | Users module |
| `src/features/users/users.service.ts` | User CRUD operations |
| `src/features/auth/auth.module.ts` | Auth module with JWT config |
| `src/features/auth/auth.controller.ts` | /auth/register, /auth/login, /auth/me |
| `src/features/auth/auth.service.ts` | Registration, login logic with bcrypt |
| `src/features/auth/strategies/jwt.strategy.ts` | Passport JWT strategy |
| `src/features/auth/dto/register.dto.ts` | Registration validation |
| `src/features/auth/dto/login.dto.ts` | Login validation |
| `src/shared/guards/jwt-auth.guard.ts` | JWT authentication guard |
| `src/shared/decorators/current-user.decorator.ts` | Extract user from request |

#### Frontend Tasks

| File | Purpose |
|------|---------|
| `src/shared/contexts/AuthContext.tsx` | Auth state: user, token, isAuthenticated |
| `src/shared/hooks/useAuth.ts` | Hook to access auth context |
| `src/shared/services/auth.service.ts` | Login, register, me API calls |
| `src/app/(auth)/layout.tsx` | Centered layout for auth pages |
| `src/app/(auth)/login/page.tsx` | Login form with validation |
| `src/app/(auth)/register/page.tsx` | Registration form |
| `src/shared/utils/validators.ts` | Zod schemas for auth forms |

#### Deliverables
- [ ] User can register with username, email, password, displayName
- [ ] User can login and receive JWT
- [ ] Protected routes redirect to login
- [ ] Token stored in localStorage and sent with requests

---

### Phase 3: Core Catalog (Days 5-7)

**Goal**: Tracks, Artists, Albums with search functionality.

#### Backend Tasks

| File | Purpose |
|------|---------|
| `src/features/tracks/schemas/track.schema.ts` | Track schema with text index on title |
| `src/features/tracks/tracks.module.ts` | Tracks module |
| `src/features/tracks/tracks.controller.ts` | GET /tracks, GET /tracks/:id, POST /tracks/:id/play |
| `src/features/tracks/tracks.service.ts` | Track queries with pagination |
| `src/features/artists/schemas/artist.schema.ts` | Artist schema with text index on name |
| `src/features/artists/artists.module.ts` | Artists module |
| `src/features/artists/artists.controller.ts` | GET /artists, GET /artists/:id, GET /artists/:id/tracks |
| `src/features/artists/artists.service.ts` | Artist queries |
| `src/features/albums/schemas/album.schema.ts` | Album schema with text index on title |
| `src/features/albums/albums.module.ts` | Albums module |
| `src/features/albums/albums.controller.ts` | GET /albums, GET /albums/:id |
| `src/features/albums/albums.service.ts` | Album queries with track population |
| `src/features/search/search.module.ts` | Search module |
| `src/features/search/search.controller.ts` | GET /search?q={query} |
| `src/features/search/search.service.ts` | Unified search across collections |

#### Frontend Tasks

| File | Purpose |
|------|---------|
| `src/shared/types/track.types.ts` | Track interface |
| `src/shared/types/artist.types.ts` | Artist interface |
| `src/shared/types/album.types.ts` | Album interface |
| `src/shared/services/tracks.service.ts` | Track API calls |
| `src/shared/services/artists.service.ts` | Artist API calls |
| `src/shared/services/albums.service.ts` | Album API calls |
| `src/shared/services/search.service.ts` | Search API calls |
| `src/shared/components/track/TrackRow.tsx` | Track row with play, like, add to queue |
| `src/shared/components/track/TrackList.tsx` | List of track rows |
| `src/shared/components/album/AlbumCard.tsx` | Album grid card |
| `src/shared/components/artist/ArtistCard.tsx` | Artist grid card |
| `src/shared/components/search/SearchBar.tsx` | Debounced search input |
| `src/shared/components/search/SearchResults.tsx` | Categorized dropdown results |
| `src/shared/hooks/useDebounce.ts` | Debounce hook (300ms) |
| `src/app/(main)/search/page.tsx` | Search page |
| `src/app/(main)/album/[id]/page.tsx` | Album detail page |
| `src/app/(main)/artist/[id]/page.tsx` | Artist detail page |

#### Deliverables
- [ ] Browse all tracks with pagination
- [ ] View track, album, artist details
- [ ] Search across tracks, albums, artists
- [ ] Debounced search autocomplete

---

### Phase 4: Music Player (Days 8-10)

**Goal**: Simulated music player with queue management.

#### Backend Tasks

| File | Purpose |
|------|---------|
| `src/features/listening-history/schemas/listening-history.schema.ts` | History schema with indexes |
| `src/features/listening-history/listening-history.module.ts` | Module |
| `src/features/listening-history/listening-history.controller.ts` | POST /tracks/:id/play |
| `src/features/listening-history/listening-history.service.ts` | Log play, complete play |

#### Frontend Tasks

| File | Purpose |
|------|---------|
| `src/shared/types/player.types.ts` | PlayerState, PlayerAction types |
| `src/shared/contexts/PlayerContext.tsx` | Player state with useReducer |
| `src/shared/hooks/usePlayer.ts` | Hook to access player context |
| `src/shared/components/layout/PlayerBar.tsx` | Bottom player bar |
| `src/shared/components/layout/QueueSidebar.tsx` | Right slide-out queue |
| `src/shared/utils/formatters.ts` | formatTime (M:SS), formatDuration |

**PlayerContext State:**
```typescript
interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  elapsedSeconds: number;
  shuffleEnabled: boolean;
  repeatMode: 'off' | 'all' | 'one';
  volume: number;
  isQueueOpen: boolean;
}

type PlayerAction =
  | { type: 'PLAY_TRACK'; payload: Track }
  | { type: 'PLAY_TRACKS'; payload: { tracks: Track[]; startIndex: number } }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'SEEK'; payload: number }
  | { type: 'ADD_TO_QUEUE'; payload: Track }
  | { type: 'REMOVE_FROM_QUEUE'; payload: number }
  | { type: 'REORDER_QUEUE'; payload: { from: number; to: number } }
  | { type: 'CLEAR_QUEUE' }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'TOGGLE_REPEAT' }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'TICK' }
  | { type: 'TOGGLE_QUEUE' };
```

**Player Bar Features:**
- Track info (cover, title, artist)
- Play/Pause button
- Previous/Next buttons
- Progress bar (clickable, draggable)
- Time display (elapsed / total)
- Volume slider
- Shuffle toggle
- Repeat toggle (off/all/one icons)
- Queue toggle button

**Queue Sidebar Features:**
- Current track highlighted
- Drag-and-drop reorder
- Remove track button
- Clear queue button

#### Deliverables
- [ ] Click track to play (timer-based simulation)
- [ ] Play/Pause/Next/Previous controls
- [ ] Clickable progress bar with seek
- [ ] Queue management (add, remove, reorder)
- [ ] Shuffle and repeat modes
- [ ] Listening history logged to backend

---

### Phase 5: Playlists (Days 11-12)

**Goal**: Full playlist CRUD with drag-and-drop track reordering.

#### Backend Tasks

| File | Purpose |
|------|---------|
| `src/features/playlists/schemas/playlist.schema.ts` | Playlist schema |
| `src/features/playlists/playlists.module.ts` | Module |
| `src/features/playlists/playlists.controller.ts` | Full CRUD + track management |
| `src/features/playlists/playlists.service.ts` | Playlist operations |
| `src/features/playlists/dto/create-playlist.dto.ts` | Create DTO |
| `src/features/playlists/dto/update-playlist.dto.ts` | Update DTO |
| `src/features/playlists/dto/reorder-tracks.dto.ts` | Reorder DTO |

**Endpoints:**
- `GET /playlists` - User's playlists
- `GET /playlists/:id` - Single playlist with tracks
- `POST /playlists` - Create playlist
- `PATCH /playlists/:id` - Update name/description
- `DELETE /playlists/:id` - Delete playlist
- `POST /playlists/:id/tracks` - Add track
- `DELETE /playlists/:id/tracks/:trackId` - Remove track
- `PATCH /playlists/:id/reorder` - Reorder tracks

#### Frontend Tasks

| File | Purpose |
|------|---------|
| `src/shared/types/playlist.types.ts` | Playlist interface |
| `src/shared/services/playlists.service.ts` | Playlist API calls |
| `src/shared/components/playlist/PlaylistCard.tsx` | Playlist grid card |
| `src/shared/components/playlist/CreatePlaylistDialog.tsx` | Create playlist modal |
| `src/shared/components/playlist/AddToPlaylistMenu.tsx` | Submenu for adding tracks |
| `src/app/(main)/playlist/[id]/page.tsx` | Playlist detail with drag-and-drop |

**Optimistic Updates:**
- Add track immediately to UI, revert on error
- Remove track immediately, revert on error
- Reorder immediately, revert on error

#### Deliverables
- [ ] Create playlist with name and description
- [ ] Add tracks to playlist from track row menu
- [ ] Remove tracks from playlist
- [ ] Drag-and-drop reorder tracks
- [ ] Edit playlist name/description inline
- [ ] Delete playlist with confirmation

---

### Phase 6: Library (Likes/Follows) (Days 13-14)

**Goal**: Like tracks/albums, follow artists.

#### Backend Tasks

| File | Purpose |
|------|---------|
| `src/features/library/schemas/liked-track.schema.ts` | Schema with unique index |
| `src/features/library/schemas/liked-album.schema.ts` | Schema with unique index |
| `src/features/library/schemas/followed-artist.schema.ts` | Schema with unique index |
| `src/features/library/library.module.ts` | Module |
| `src/features/library/library.controller.ts` | All library endpoints |
| `src/features/library/library.service.ts` | Like/unlike, follow/unfollow |

**Endpoints:**
- `GET /library/tracks` - Liked tracks
- `POST /library/tracks/:trackId` - Like track
- `DELETE /library/tracks/:trackId` - Unlike track
- `GET /library/tracks/:trackId/status` - Check if liked
- `GET /library/albums` - Liked albums
- `POST /library/albums/:albumId` - Like album
- `DELETE /library/albums/:albumId` - Unlike album
- `GET /library/artists` - Followed artists
- `POST /library/artists/:artistId` - Follow artist
- `DELETE /library/artists/:artistId` - Unfollow artist

#### Frontend Tasks

| File | Purpose |
|------|---------|
| `src/shared/services/library.service.ts` | Library API calls |
| `src/app/(main)/library/page.tsx` | Library page with tabs |

**Library Page Tabs:**
- Liked Tracks
- Liked Albums
- Followed Artists

**Heart Icon Behavior:**
- Filled heart = liked
- Click toggles like status
- Optimistic update

#### Deliverables
- [ ] Like/unlike tracks from any track row
- [ ] Like/unlike albums from album page
- [ ] Follow/unfollow artists from artist page
- [ ] Library page shows all liked content
- [ ] Heart icon state synced with backend

---

### Phase 7: Advanced Features (Days 15-17)

**Goal**: Discover Weekly, Analytics, Queue Recommendations, Trending.

#### Backend Tasks

| File | Purpose |
|------|---------|
| `src/shared/cache/cache.service.ts` | node-cache wrapper |
| `src/features/discover-weekly/discover-weekly.module.ts` | Module |
| `src/features/discover-weekly/discover-weekly.controller.ts` | GET /discover-weekly |
| `src/features/discover-weekly/discover-weekly.service.ts` | Recommendation algorithm |
| `src/features/analytics/analytics.module.ts` | Module |
| `src/features/analytics/analytics.controller.ts` | GET /analytics/stats |
| `src/features/analytics/analytics.service.ts` | Stats aggregation |
| `src/features/recommendations/recommendations.module.ts` | Module |
| `src/features/recommendations/recommendations.controller.ts` | GET /recommendations/queue |
| `src/features/recommendations/recommendations.service.ts` | Smart queue algorithm |
| `src/features/trending/trending.module.ts` | Module |
| `src/features/trending/trending.controller.ts` | GET /trending |
| `src/features/trending/trending.service.ts` | Time-decayed scoring |

**Discover Weekly Algorithm:**
1. Get user's listening history (last 30 days)
2. Count plays per genre -> top 5 genres
3. Count plays per artist -> top 5 artists
4. Find tracks matching genres OR artists
5. Exclude already-played tracks
6. Return 30 random tracks from matches

**Analytics Stats:**
- `topArtists`: Top 5 by play count
- `topGenres`: Top 5 by play count
- `totalListeningTimeMinutes`: Sum of listen durations
- `listeningByDayOfWeek`: { 0: count, 1: count, ... }
- `currentStreak`: Consecutive days
- `longestStreak`: Best streak ever

**Queue Recommendations Algorithm:**
1. Same album next track (Priority 1)
2. Same artist, different album (Priority 2, up to 2 tracks)
3. Same genre, different artist (Priority 3, up to 2 tracks)
4. Popular tracks fallback (Priority 4)
5. Return exactly 5 tracks

**Trending Score Formula:**
```
score = SUM(1 / (1 + daysAgo * 0.1)) for each play
```
- Cached for 5 minutes

#### Frontend Tasks

| File | Purpose |
|------|---------|
| `src/shared/services/analytics.service.ts` | Analytics API |
| `src/shared/services/recommendations.service.ts` | Recommendations API |
| `src/app/(main)/discover-weekly/page.tsx` | Discover Weekly page |
| `src/app/(main)/stats/page.tsx` | Analytics dashboard |
| `src/app/(main)/trending/page.tsx` | Trending leaderboard |

**Stats Page Components:**
- Total listening time card
- Current/longest streak cards
- Top artists list (with images)
- Top genres list
- Day of week bar chart

#### Deliverables
- [ ] Discover Weekly page with 30 personalized tracks
- [ ] Analytics dashboard with all stats
- [ ] Queue recommendations shown in player
- [ ] Trending page with top 20 tracks

---

### Phase 8: Layout and Navigation (Day 18)

**Goal**: Complete Melodio-like layout.

#### Frontend Tasks

| File | Purpose |
|------|---------|
| `src/shared/components/layout/Sidebar.tsx` | Left navigation sidebar |
| `src/shared/components/layout/TopNav.tsx` | Top navigation bar |
| `src/app/(main)/layout.tsx` | Main layout composition |
| `src/app/(main)/page.tsx` | Home page with sections |

**Sidebar Contents:**
- Logo
- Home link
- Search link
- Your Library link
- Discover Weekly link
- Your Stats link
- Trending link
- Divider
- Create Playlist button
- User's playlists list

**Top Nav Contents:**
- Back/Forward navigation
- Search bar (in header)
- User menu (profile, logout)

**Home Page Sections:**
- Recently Played (if history exists)
- Trending Tracks
- Discover Weekly (teaser)
- Browse by Genre
- New Releases (albums)

#### Deliverables
- [ ] Fixed left sidebar
- [ ] Fixed bottom player bar
- [ ] Scrollable main content
- [ ] Responsive design (desktop-first)

---

### Phase 9: Seed Data (Day 19)

**Goal**: Populate database with realistic test data.

#### Backend Tasks

| File | Purpose |
|------|---------|
| `src/seed/data/artists.data.ts` | 20 artist objects |
| `src/seed/data/albums.data.ts` | 40 album objects |
| `src/seed/data/tracks.data.ts` | 200 track objects |
| `src/seed/data/users.data.ts` | 5 user objects |
| `src/seed/seed.service.ts` | Seed orchestration |
| `src/seed/seed.command.ts` | CLI command |

**Seed Data Requirements:**
- 20 artists across 5 genres (rock, pop, jazz, electronic, hip-hop)
- 40 albums (2 per artist average)
- 200 tracks (5 per album average, 120-300 seconds)
- 5 users with passwords
- 10 playlists (2 per user)
- 1000+ listening history entries (spread over 60 days)
- Some users with clear genre preferences
- Some users with minimal history

**Artist Data Example:**
```typescript
export const artistsData = [
  {
    name: 'The Rolling Stones',
    bio: 'Legendary rock band formed in London',
    imageUrl: 'https://picsum.photos/seed/artist1/300',
    genres: ['rock', 'blues'],
    followerCount: 15000,
  },
  // ... 19 more
];
```

#### Deliverables
- [ ] `npm run seed` command works
- [ ] All collections populated
- [ ] Listening history varies by user
- [ ] Test account: `testuser@example.com` / `password123`

---

### Phase 10: Polish and Testing (Days 20-21)

**Goal**: Bug fixes, edge cases, and test coverage.

#### Backend Testing

| Test File | Coverage |
|-----------|----------|
| `auth.service.spec.ts` | Register, login, validation |
| `tracks.service.spec.ts` | CRUD, pagination, search |
| `playlists.service.spec.ts` | CRUD, track management |
| `analytics.service.spec.ts` | Stats calculation |
| `trending.service.spec.ts` | Score calculation, caching |

#### Frontend Testing

| Test File | Coverage |
|-----------|----------|
| `TrackRow.test.tsx` | Render, play, like, add to queue |
| `PlayerBar.test.tsx` | Controls, progress, state |
| `SearchBar.test.tsx` | Debounce, results display |
| `usePlayer.test.ts` | All player actions |

#### Edge Cases to Handle
- Empty queue
- Single track queue
- New user (no history)
- User played all tracks in catalog
- Network errors
- Token expiration

#### Deliverables
- [ ] 80%+ backend test coverage
- [ ] Critical frontend components tested
- [ ] All edge cases handled
- [ ] Error states display correctly
- [ ] Loading states throughout

---

## 4. Database Schemas

### 4.1 User Schema

```typescript
// src/features/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true, unique: true, trim: true })
  username: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, trim: true })
  displayName: string;

  @Prop()
  avatarUrl?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });
```

### 4.2 Track Schema

```typescript
// src/features/tracks/schemas/track.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TrackDocument = HydratedDocument<Track>;

@Schema({ timestamps: true })
export class Track {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: Types.ObjectId, ref: 'Artist', required: true })
  artistId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Album', required: true })
  albumId: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  durationInSeconds: number;

  @Prop({ required: true, min: 1 })
  trackNumber: number;

  @Prop({ required: true, trim: true, lowercase: true })
  genre: string;

  @Prop({ default: 0, min: 0 })
  playCount: number;
}

export const TrackSchema = SchemaFactory.createForClass(Track);

TrackSchema.index({ artistId: 1 });
TrackSchema.index({ albumId: 1 });
TrackSchema.index({ genre: 1 });
TrackSchema.index({ title: 'text' });
TrackSchema.index({ playCount: -1 });
```

### 4.3 Artist Schema

```typescript
// src/features/artists/schemas/artist.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ArtistDocument = HydratedDocument<Artist>;

@Schema({ timestamps: true })
export class Artist {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  bio?: string;

  @Prop()
  imageUrl?: string;

  @Prop({ type: [String], required: true, default: [] })
  genres: string[];

  @Prop({ default: 0, min: 0 })
  followerCount: number;
}

export const ArtistSchema = SchemaFactory.createForClass(Artist);

ArtistSchema.index({ name: 'text' });
ArtistSchema.index({ followerCount: -1 });
```

### 4.4 Album Schema

```typescript
// src/features/albums/schemas/album.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AlbumDocument = HydratedDocument<Album>;

@Schema({ timestamps: true })
export class Album {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: Types.ObjectId, ref: 'Artist', required: true })
  artistId: Types.ObjectId;

  @Prop({ required: true })
  releaseDate: Date;

  @Prop()
  coverImageUrl?: string;

  @Prop({ required: true, min: 1 })
  totalTracks: number;
}

export const AlbumSchema = SchemaFactory.createForClass(Album);

AlbumSchema.index({ artistId: 1 });
AlbumSchema.index({ title: 'text' });
AlbumSchema.index({ releaseDate: -1 });
```

### 4.5 Playlist Schema

```typescript
// src/features/playlists/schemas/playlist.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PlaylistDocument = HydratedDocument<Playlist>;

@Schema({ timestamps: true })
export class Playlist {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'Track', default: [] })
  trackIds: Types.ObjectId[];

  @Prop()
  coverImageUrl?: string;

  @Prop({ default: true })
  isPublic: boolean;
}

export const PlaylistSchema = SchemaFactory.createForClass(Playlist);

PlaylistSchema.index({ ownerId: 1 });
```

### 4.6 ListeningHistory Schema

```typescript
// src/features/listening-history/schemas/listening-history.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ListeningHistoryDocument = HydratedDocument<ListeningHistory>;

@Schema({ timestamps: false })
export class ListeningHistory {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Track', required: true })
  trackId: Types.ObjectId;

  @Prop({ required: true })
  playedAt: Date;

  @Prop()
  completedAt?: Date;

  @Prop({ required: true, min: 0 })
  listenDurationSeconds: number;
}

export const ListeningHistorySchema = SchemaFactory.createForClass(ListeningHistory);

ListeningHistorySchema.index({ userId: 1, playedAt: -1 });
ListeningHistorySchema.index({ trackId: 1 });
ListeningHistorySchema.index({ playedAt: -1 });
```

### 4.7 LikedTrack Schema

```typescript
// src/features/library/schemas/liked-track.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LikedTrackDocument = HydratedDocument<LikedTrack>;

@Schema({ timestamps: false })
export class LikedTrack {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Track', required: true })
  trackId: Types.ObjectId;

  @Prop({ required: true })
  likedAt: Date;
}

export const LikedTrackSchema = SchemaFactory.createForClass(LikedTrack);

LikedTrackSchema.index({ userId: 1, trackId: 1 }, { unique: true });
LikedTrackSchema.index({ userId: 1 });
```

### 4.8 LikedAlbum Schema

```typescript
// src/features/library/schemas/liked-album.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LikedAlbumDocument = HydratedDocument<LikedAlbum>;

@Schema({ timestamps: false })
export class LikedAlbum {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Album', required: true })
  albumId: Types.ObjectId;

  @Prop({ required: true })
  likedAt: Date;
}

export const LikedAlbumSchema = SchemaFactory.createForClass(LikedAlbum);

LikedAlbumSchema.index({ userId: 1, albumId: 1 }, { unique: true });
LikedAlbumSchema.index({ userId: 1 });
```

### 4.9 FollowedArtist Schema

```typescript
// src/features/library/schemas/followed-artist.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FollowedArtistDocument = HydratedDocument<FollowedArtist>;

@Schema({ timestamps: false })
export class FollowedArtist {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Artist', required: true })
  artistId: Types.ObjectId;

  @Prop({ required: true })
  followedAt: Date;
}

export const FollowedArtistSchema = SchemaFactory.createForClass(FollowedArtist);

FollowedArtistSchema.index({ userId: 1, artistId: 1 }, { unique: true });
FollowedArtistSchema.index({ userId: 1 });
```

---

## 5. API Endpoints

### 5.1 Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Create new user | No |
| POST | `/api/v1/auth/login` | Login and get JWT | No |
| GET | `/api/v1/auth/me` | Get current user profile | Yes |

### 5.2 Tracks

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/tracks` | List tracks with pagination | Yes |
| GET | `/api/v1/tracks/:id` | Get single track | Yes |
| GET | `/api/v1/tracks/search` | Search tracks by title | Yes |
| POST | `/api/v1/tracks/:id/play` | Log play event | Yes |

**Query Parameters for GET /tracks:**
- `page` (default: 1)
- `limit` (default: 20, max: 50)
- `genre` (optional)
- `artistId` (optional)
- `albumId` (optional)

### 5.3 Artists

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/artists` | List artists with pagination | Yes |
| GET | `/api/v1/artists/:id` | Get single artist | Yes |
| GET | `/api/v1/artists/:id/tracks` | Get artist's tracks | Yes |
| GET | `/api/v1/artists/:id/albums` | Get artist's albums | Yes |
| GET | `/api/v1/artists/search` | Search artists by name | Yes |

### 5.4 Albums

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/albums` | List albums with pagination | Yes |
| GET | `/api/v1/albums/:id` | Get album with tracks | Yes |
| GET | `/api/v1/albums/search` | Search albums by title | Yes |

### 5.5 Playlists

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/playlists` | Get user's playlists | Yes |
| GET | `/api/v1/playlists/:id` | Get playlist with tracks | Yes |
| POST | `/api/v1/playlists` | Create playlist | Yes |
| PATCH | `/api/v1/playlists/:id` | Update playlist | Yes |
| DELETE | `/api/v1/playlists/:id` | Delete playlist | Yes |
| POST | `/api/v1/playlists/:id/tracks` | Add track to playlist | Yes |
| DELETE | `/api/v1/playlists/:id/tracks/:trackId` | Remove track | Yes |
| PATCH | `/api/v1/playlists/:id/reorder` | Reorder tracks | Yes |

### 5.6 Library

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/library/tracks` | Get liked tracks | Yes |
| POST | `/api/v1/library/tracks/:trackId` | Like track | Yes |
| DELETE | `/api/v1/library/tracks/:trackId` | Unlike track | Yes |
| GET | `/api/v1/library/tracks/:trackId/status` | Check if liked | Yes |
| GET | `/api/v1/library/albums` | Get liked albums | Yes |
| POST | `/api/v1/library/albums/:albumId` | Like album | Yes |
| DELETE | `/api/v1/library/albums/:albumId` | Unlike album | Yes |
| GET | `/api/v1/library/artists` | Get followed artists | Yes |
| POST | `/api/v1/library/artists/:artistId` | Follow artist | Yes |
| DELETE | `/api/v1/library/artists/:artistId` | Unfollow artist | Yes |

### 5.7 Search

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/search` | Unified search | Yes |

**Query Parameters:**
- `q` (required): Search query

**Response:**
```json
{
  "success": true,
  "data": {
    "tracks": [...],    // Max 5
    "albums": [...],    // Max 5
    "artists": [...]    // Max 5
  }
}
```

### 5.8 Discover Weekly

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/discover-weekly` | Get personalized recommendations | Yes |

**Response:**
```json
{
  "success": true,
  "data": {
    "tracks": [...]  // 30 tracks
  }
}
```

### 5.9 Analytics

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/analytics/stats` | Get user listening stats | Yes |

**Response:**
```json
{
  "success": true,
  "data": {
    "topArtists": [...],
    "topGenres": [...],
    "totalListeningTimeMinutes": 1234,
    "listeningByDayOfWeek": { "0": 10, "1": 15, ... },
    "currentStreak": 5,
    "longestStreak": 12
  }
}
```

### 5.10 Queue Recommendations

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/recommendations/queue` | Get smart queue suggestions | Yes |

**Query Parameters:**
- `trackId` (required): Currently playing track
- `excludeTrackIds` (optional): Comma-separated IDs to exclude

**Response:**
```json
{
  "success": true,
  "data": {
    "tracks": [...]  // Exactly 5 tracks
  }
}
```

### 5.11 Trending

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/trending` | Get trending leaderboard | Yes |

**Response:**
```json
{
  "success": true,
  "data": {
    "tracks": [
      { "rank": 1, "trendingScore": 245.5, ...trackData },
      // ... 19 more
    ],
    "cachedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 6. Frontend Components

### 6.1 Component Hierarchy

```
App
├── Providers (Auth + Player)
│   ├── (auth) Layout
│   │   ├── LoginPage
│   │   └── RegisterPage
│   │
│   └── (main) Layout
│       ├── Sidebar
│       │   ├── Logo
│       │   ├── NavLinks
│       │   ├── CreatePlaylistButton
│       │   └── PlaylistList
│       │
│       ├── TopNav
│       │   ├── NavigationButtons
│       │   ├── SearchBar
│       │   └── UserMenu
│       │
│       ├── MainContent (scrollable)
│       │   ├── HomePage
│       │   │   ├── RecentlyPlayed
│       │   │   ├── TrendingSection
│       │   │   └── BrowseGenres
│       │   │
│       │   ├── SearchPage
│       │   │   └── SearchResults
│       │   │
│       │   ├── LibraryPage
│       │   │   ├── LikedTracks
│       │   │   ├── LikedAlbums
│       │   │   └── FollowedArtists
│       │   │
│       │   ├── PlaylistPage
│       │   │   ├── PlaylistHeader
│       │   │   └── TrackList (draggable)
│       │   │
│       │   ├── AlbumPage
│       │   │   ├── AlbumHeader
│       │   │   └── TrackList
│       │   │
│       │   ├── ArtistPage
│       │   │   ├── ArtistHeader
│       │   │   ├── TopTracks
│       │   │   └── Discography
│       │   │
│       │   ├── DiscoverWeeklyPage
│       │   │   └── TrackList
│       │   │
│       │   ├── StatsPage
│       │   │   ├── StatsCards
│       │   │   ├── TopArtists
│       │   │   ├── TopGenres
│       │   │   └── DayOfWeekChart
│       │   │
│       │   └── TrendingPage
│       │       └── LeaderboardList
│       │
│       ├── PlayerBar
│       │   ├── NowPlaying
│       │   ├── PlayerControls
│       │   ├── ProgressBar
│       │   └── VolumeControl
│       │
│       └── QueueSidebar (conditional)
│           ├── CurrentTrack
│           ├── UpNext
│           └── QueueList
```

### 6.2 Key Component Specifications

#### TrackRow
- Props: `track`, `index`, `showAlbum`, `onPlay`, `isPlaying`, `isLiked`
- Features: Play on click, hover reveal, like toggle, add to queue, add to playlist

#### PlayerBar
- Fixed height: 90px
- Three sections: Left (track info), Center (controls), Right (volume/queue)
- Progress bar: clickable, shows tooltip on hover

#### Sidebar
- Fixed width: 280px
- Scrollable playlist section
- Active link highlighting

#### SearchBar
- Debounce: 300ms
- Dropdown: max-height with scroll
- Sections: Tracks, Albums, Artists

### 6.3 Shadcn UI Components Required

```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add slider
npx shadcn@latest add toast
npx shadcn@latest add skeleton
npx shadcn@latest add scroll-area
npx shadcn@latest add separator
npx shadcn@latest add tabs
npx shadcn@latest add avatar
```

---

## 7. State Management

### 7.1 AuthContext

```typescript
// src/shared/contexts/AuthContext.tsx
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}
```

**Persistence:**
- Token stored in localStorage
- User fetched on app load via /auth/me
- Token attached to all API requests

### 7.2 PlayerContext

```typescript
// src/shared/contexts/PlayerContext.tsx
interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  elapsedSeconds: number;
  shuffleEnabled: boolean;
  repeatMode: 'off' | 'all' | 'one';
  volume: number;
  isQueueOpen: boolean;
}

type PlayerAction =
  | { type: 'PLAY_TRACK'; payload: Track }
  | { type: 'PLAY_TRACKS'; payload: { tracks: Track[]; startIndex: number } }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'SEEK'; payload: number }
  | { type: 'ADD_TO_QUEUE'; payload: Track }
  | { type: 'REMOVE_FROM_QUEUE'; payload: number }
  | { type: 'REORDER_QUEUE'; payload: { from: number; to: number } }
  | { type: 'CLEAR_QUEUE' }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'TOGGLE_REPEAT' }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'TICK' }
  | { type: 'TOGGLE_QUEUE' };

interface PlayerContextType {
  state: PlayerState;
  dispatch: React.Dispatch<PlayerAction>;
  // Convenience methods
  playTrack: (track: Track) => void;
  playTracks: (tracks: Track[], startIndex?: number) => void;
  togglePlayPause: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
  clearQueue: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setVolume: (volume: number) => void;
  toggleQueue: () => void;
}
```

**Timer Logic:**
```typescript
useEffect(() => {
  let interval: NodeJS.Timeout;

  if (state.isPlaying && state.currentTrack) {
    interval = setInterval(() => {
      dispatch({ type: 'TICK' });
    }, 1000);
  }

  return () => clearInterval(interval);
}, [state.isPlaying, state.currentTrack]);
```

**TICK Reducer Logic:**
```typescript
case 'TICK': {
  const newElapsed = state.elapsedSeconds + 1;

  if (newElapsed >= state.currentTrack.durationInSeconds) {
    // Track complete
    if (state.repeatMode === 'one') {
      return { ...state, elapsedSeconds: 0 };
    }

    const nextIndex = state.queueIndex + 1;
    if (nextIndex >= state.queue.length) {
      if (state.repeatMode === 'all') {
        return {
          ...state,
          queueIndex: 0,
          currentTrack: state.queue[0],
          elapsedSeconds: 0,
        };
      }
      return { ...state, isPlaying: false, elapsedSeconds: 0 };
    }

    return {
      ...state,
      queueIndex: nextIndex,
      currentTrack: state.queue[nextIndex],
      elapsedSeconds: 0,
    };
  }

  return { ...state, elapsedSeconds: newElapsed };
}
```

---

## 8. Implementation Order

### 8.1 Dependencies Graph

```
Phase 1 (Foundation)
    │
    ├──► Phase 2 (Auth)
    │       │
    │       └──► Phase 3 (Catalog)
    │               │
    │               ├──► Phase 4 (Player)
    │               │       │
    │               │       └──► Phase 6 (Library) ────┐
    │               │                                   │
    │               └──► Phase 5 (Playlists) ──────────┤
    │                                                   │
    │                                                   ▼
    │                                           Phase 7 (Advanced)
    │                                                   │
    └──────────────────────────────────────────────────┤
                                                        ▼
                                                Phase 8 (Layout)
                                                        │
                                                        ▼
                                                Phase 9 (Seed)
                                                        │
                                                        ▼
                                               Phase 10 (Polish)
```

### 8.2 Critical Path

1. **Foundation** - Cannot proceed without base infrastructure
2. **Auth** - All other features require authentication
3. **Catalog** - Core data models needed for all features
4. **Player** - Central feature, blocks UX testing
5. **Playlists + Library** - Can be parallel
6. **Advanced Features** - Depend on listening history
7. **Layout** - Polish after core features work
8. **Seed + Testing** - Final validation

### 8.3 Parallel Tracks

**Track A (Backend-Heavy):**
- Phase 1 → Phase 2 → Phase 3 → Phase 9

**Track B (Frontend-Heavy):**
- Phase 1 → Phase 4 → Phase 8 → Phase 10

**Sync Points:**
- After Phase 2: API ready for frontend auth
- After Phase 3: API ready for catalog display
- After Phase 5: API ready for playlist testing

---

## 9. Testing Strategy

### 9.1 Backend Testing

**Unit Tests (Jest + @nestjs/testing):**
- Service methods with mocked repositories
- DTO validation
- Guard logic
- Cache service

**Integration Tests:**
- Controller endpoints with test database
- Auth flow
- Complex queries (analytics, trending)

**Coverage Target:** 80%+ lines

### 9.2 Frontend Testing

**Unit Tests (Jest + React Testing Library):**
- Component rendering
- User interactions
- Hook behavior

**Key Components to Test:**
- TrackRow (play, like, add actions)
- PlayerBar (controls, progress)
- SearchBar (debounce, results)
- PlayerContext (all actions)

**Coverage Target:** 70%+ for critical paths

### 9.3 E2E Testing (Optional)

**Happy Path Scenarios:**
1. Register → Login → Browse → Play track
2. Create playlist → Add tracks → Reorder
3. Search → Play result → Add to queue
4. View stats page with data

---

## Appendix A: Environment Variables

### Backend (.env)

```env
# App
NODE_ENV=development
APP_PORT=5000
APP_PREFIX=/api

# Database
MONGODB_URI=mongodb://localhost:27017/melodio-clone

# Auth
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=7d

# Cache
CACHE_TTL=300
```

### Frontend (.env.local)

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Appendix B: Melodio Color Palette

```css
:root {
  --melodio-green: #1db954;
  --melodio-green-hover: #1ed760;
  --melodio-black: #121212;
  --melodio-dark-gray: #181818;
  --melodio-gray: #282828;
  --melodio-light-gray: #b3b3b3;
  --melodio-white: #ffffff;
}
```

---

## Appendix C: API Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "statusCode": 400,
    "message": "Validation failed",
    "details": ["email must be valid"]
  }
}
```

**Paginated Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

---

*End of Implementation Plan*
