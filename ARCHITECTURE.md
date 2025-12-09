# Architecture Documentation

This document describes the architecture of Hackify, a Hackify-inspired music streaming application.

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Player State Management](#player-state-management)
5. [Data Flow](#data-flow)
6. [Database Schema](#database-schema)

---

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Browser"
        UI[Next.js Frontend]
    end

    subgraph "Frontend (Next.js 15)"
        subgraph "App Router"
            Pages[Pages & Layouts]
        end

        subgraph "Shared"
            Contexts[Contexts]
            Services[Services]
            Components[Components]
            Hooks[Hooks]
        end
    end

    subgraph "Backend (NestJS)"
        subgraph "Features"
            Auth[Auth Module]
            Tracks[Tracks Module]
            Artists[Artists Module]
            Albums[Albums Module]
            Playlists[Playlists Module]
            Search[Search Module]
        end

        subgraph "Shared Backend"
            Guards[Guards]
            Pipes[Pipes]
            Filters[Filters]
        end
    end

    subgraph "Database"
        MongoDB[(MongoDB)]
    end

    UI --> Pages
    Pages --> Contexts
    Pages --> Services
    Pages --> Components
    Components --> Hooks

    Services -->|HTTP/REST| Auth
    Services -->|HTTP/REST| Tracks
    Services -->|HTTP/REST| Search

    Auth --> Guards
    Tracks --> MongoDB
    Artists --> MongoDB
    Albums --> MongoDB
    Playlists --> MongoDB
```

---

## Frontend Architecture

### Component Structure

```mermaid
graph TB
    subgraph "App Router"
        Layout[layout.tsx]
        Home[page.tsx /]
        Search[search/page.tsx]
        Album[album/id/page.tsx]
        Playlist[playlist/id/page.tsx]
        Login[login/page.tsx]
        Register[register/page.tsx]
    end

    subgraph "Providers"
        AuthCtx[AuthContext]
        PlayerCtx[PlayerContext]
        ToastCtx[Toaster]
    end

    subgraph "Layout Components"
        Sidebar[Sidebar]
        TopBar[TopBar]
        PlayerBar[PlayerBar]
        QueuePanel[QueuePanel]
    end

    subgraph "Common Components"
        TrackCard[TrackCard]
        AlbumCard[AlbumCard]
        PlaylistCard[PlaylistCard]
        LoadingSpinner[LoadingSpinner]
    end

    Layout --> AuthCtx
    AuthCtx --> PlayerCtx
    PlayerCtx --> ToastCtx

    Home --> Sidebar
    Home --> TopBar
    Home --> PlayerBar
    Home --> TrackCard

    Search --> AlbumCard
    Playlist --> TrackCard
```

### State Management Flow

```mermaid
flowchart TD
    subgraph "React Context Architecture"
        AuthContext["AuthContext
        - user
        - isAuthenticated
        - login()
        - logout()
        - register()"]

        PlayerContext["PlayerContext
        - currentTrack
        - queue
        - isPlaying
        - elapsedSeconds
        - shuffleEnabled
        - repeatMode"]

        Reducer["playerReducer
        - PLAY_TRACK
        - PAUSE/RESUME
        - NEXT/PREVIOUS
        - TOGGLE_SHUFFLE
        - REMOVE_FROM_QUEUE
        - TICK"]
    end

    subgraph "Component Layer"
        PlayerBar["PlayerBar Component"]
        QueuePanel["QueuePanel Component"]
        TrackCard["TrackCard Component"]
    end

    Reducer --> PlayerContext
    PlayerContext --> PlayerBar
    PlayerContext --> QueuePanel
    PlayerContext --> TrackCard
    AuthContext --> PlayerBar
```

---

## Backend Architecture

### Feature-Based Module Structure

```mermaid
graph LR
    subgraph "NestJS Application"
        AppModule[AppModule]

        subgraph "Feature Modules"
            AuthMod[AuthModule]
            UserMod[UsersModule]
            TrackMod[TracksModule]
            ArtistMod[ArtistsModule]
            AlbumMod[AlbumsModule]
            PlaylistMod[PlaylistsModule]
            SearchMod[SearchModule]
        end

        subgraph "Shared"
            DBMod[DatabaseModule]
            Guards[JwtAuthGuard]
            Pipes[ValidationPipe]
        end
    end

    AppModule --> AuthMod
    AppModule --> TrackMod
    AppModule --> SearchMod
    AppModule --> DBMod

    AuthMod --> Guards
    TrackMod --> Guards
    PlaylistMod --> Guards
```

### Module Internal Structure

```mermaid
graph TB
    subgraph "Feature Module Pattern"
        Controller["Controller
        - HTTP handlers
        - Request validation
        - Response formatting"]

        Service["Service
        - Business logic
        - Data transformation
        - Validation rules"]

        Repository["Repository (via Mongoose)
        - CRUD operations
        - Query building
        - Database access"]

        Schema["Schema
        - Document structure
        - Field validation
        - Indexes"]

        DTO["DTOs
        - Input validation
        - Type safety
        - API contracts"]
    end

    Controller --> Service
    Service --> Repository
    Repository --> Schema
    Controller --> DTO
```

---

## Player State Management

### Reducer Actions

```mermaid
stateDiagram-v2
    [*] --> Idle: Initial State

    Idle --> Playing: PLAY_TRACK / PLAY_TRACKS
    Playing --> Paused: PAUSE
    Paused --> Playing: RESUME

    Playing --> Playing: NEXT
    Playing --> Playing: PREVIOUS
    Playing --> Playing: TICK
    Playing --> Playing: SEEK

    Playing --> Playing: TOGGLE_SHUFFLE
    Playing --> Playing: TOGGLE_REPEAT
    Playing --> Playing: REMOVE_FROM_QUEUE
    Playing --> Playing: REORDER_QUEUE

    Playing --> Idle: Queue Empty
```

### Shuffle Toggle Flow (Bug B Location)

```mermaid
flowchart TD
    A[User Clicks Shuffle] --> B{Shuffle Currently Off?}

    B -->|Yes - Enable Shuffle| C[Save Current Queue as originalQueue]
    C --> D[Keep Current Track at Position 0]
    D --> E[Shuffle Remaining Tracks]
    E --> F[Update queueIndex to 0]
    F --> G["Set shuffleEnabled = true"]

    B -->|No - Disable Shuffle| H[Restore originalQueue]
    H --> I[Find Current Track in Original Queue]
    I --> J[Update queueIndex to Match]
    J --> K["Set shuffleEnabled = false"]

    subgraph "Bug B: Current Track Lost"
        BugB["If current track not preserved,
        user hears different song!"]
    end

    style BugB fill:#ff6b6b
```

### Remove from Queue Flow (Bug F Location)

```mermaid
flowchart TD
    A["User Removes Track at Index X"] --> B{Compare X with queueIndex}

    B -->|"X < queueIndex"| C["Decrement queueIndex by 1
    (Current track shifted left)"]

    B -->|"X > queueIndex"| D["Keep queueIndex unchanged
    (Current track not affected)"]

    B -->|"X == queueIndex"| E["Advance to next track
    (Current track was removed)"]

    C --> F[Remove Track from Queue]
    D --> F
    E --> F

    F --> G[Update State]

    subgraph "Bug F: Index Not Adjusted"
        BugF["If queueIndex not decremented,
        player points to wrong track!"]
    end

    style BugF fill:#ff6b6b
```

### Timer Management (Bug G Location)

```mermaid
sequenceDiagram
    participant C as Component
    participant UE as useEffect
    participant I as setInterval
    participant D as Dispatch TICK

    C->>UE: Mount / isPlaying changes

    alt isPlaying === true
        UE->>I: Create interval (1000ms)
        loop Every Second
            I->>D: dispatch({ type: 'TICK' })
        end
    end

    C->>UE: Cleanup (before re-run or unmount)
    UE->>I: clearInterval(interval)

    Note over UE,I: Bug G: If clearInterval not called,
    Note over UE,I: multiple intervals run simultaneously!
```

---

## Data Flow

### Search Flow (Bug D Location)

```mermaid
sequenceDiagram
    participant U as User
    participant I as Search Input
    participant D as useDebounce
    participant E as useEffect
    participant S as searchService
    participant API as Backend API

    U->>I: Types "h"
    I->>D: value = "h"
    Note over D: Start 300ms timer

    U->>I: Types "e" (before timer)
    I->>D: value = "he"
    Note over D: Reset timer to 300ms

    U->>I: Types "llo" (before timer)
    I->>D: value = "hello"
    Note over D: Reset timer to 300ms

    Note over D: 300ms passes...
    D->>E: debouncedValue = "hello"
    E->>S: search("hello")
    S->>API: GET /search?q=hello
    API-->>S: Results
    S-->>E: Display Results

    rect rgb(255, 107, 107)
        Note over I,S: Bug D: Without debounce, each<br/>keystroke triggers API call!
    end
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant AC as AuthContext
    participant AS as authService
    participant BE as Backend
    participant LS as localStorage

    C->>AC: login(email, password)
    AC->>AS: authService.login()
    AS->>BE: POST /auth/login
    BE-->>AS: { token, user }
    AS->>LS: Store token
    AS-->>AC: Return user
    AC->>AC: Update state
    AC-->>C: Navigate to home

    Note over C,BE: Subsequent requests include<br/>Authorization: Bearer <token>
```

---

## Database Schema

```mermaid
erDiagram
    users {
        ObjectId _id PK
        string email UK
        string password "Hashed"
        string username
        date createdAt
        date updatedAt
    }

    artists {
        ObjectId _id PK
        string name
        string imageUrl
        string bio
        date createdAt
    }

    albums {
        ObjectId _id PK
        string title
        ObjectId artistId FK
        string coverImageUrl
        date releaseDate
        date createdAt
    }

    tracks {
        ObjectId _id PK
        string title
        ObjectId artistId FK
        ObjectId albumId FK
        int durationInSeconds
        int trackNumber
        string genre
        int playCount
        date createdAt
    }

    playlists {
        ObjectId _id PK
        string name
        string description
        ObjectId ownerId FK
        ObjectId[] trackIds
        boolean isPublic
        date createdAt
        date updatedAt
    }

    artists ||--o{ albums : "has many"
    artists ||--o{ tracks : "has many"
    albums ||--o{ tracks : "contains"
    users ||--o{ playlists : "owns"
    playlists }o--o{ tracks : "contains"
```

---

## Component Interactions

### Player Bar Component Flow

```mermaid
flowchart LR
    subgraph "PlayerBar Component"
        Controls["Playback Controls
        - Play/Pause
        - Previous
        - Next"]

        Progress["Progress Bar
        - Current Time
        - Duration
        - Seek"]

        Volume["Volume Control
        - Slider
        - Mute"]

        Extra["Extra Controls
        - Shuffle
        - Repeat
        - Queue"]
    end

    subgraph "PlayerContext"
        State["State
        - currentTrack
        - isPlaying
        - elapsedSeconds"]

        Actions["Actions
        - togglePlayPause
        - next/previous
        - seek
        - toggleShuffle"]
    end

    Controls --> Actions
    Progress --> Actions
    Volume --> Actions
    Extra --> Actions

    State --> Controls
    State --> Progress
    State --> Volume
    State --> Extra
```

---

## Testing Architecture

```mermaid
graph TB
    subgraph "Test Pyramid"
        Unit["Unit Tests (24)
        - playerReducer
        - useDebounce
        - Components"]

        Integration["Component Tests
        - PlayerContext integration
        - Service mocking"]
    end

    subgraph "Frontend Test Files"
        ReducerTest["playerReducer.test.ts
        - Bug B tests
        - Bug F tests
        - Bug G tests"]

        DebounceTest["useDebounce.test.ts
        - Bug D tests"]

        ContextTest["PlayerContext.test.tsx
        - Integration tests"]

        ComponentTest["TrackCard.test.tsx
        - Component tests"]
    end

    Unit --> ReducerTest
    Unit --> DebounceTest
    Unit --> ComponentTest
    Integration --> ContextTest
```

---

## Key Design Decisions

### 1. React Context vs Redux

**Choice**: React Context with useReducer

**Rationale**:
- Simpler setup, no external dependencies
- Sufficient for application complexity
- HackerRank challenge constraint (no Redux/Zustand)
- Reducer pattern provides predictable state updates

### 2. Simulated Playback

**Choice**: Timer-based playback simulation

**Rationale**:
- No actual audio files needed
- Focuses on state management challenges
- Easy to test with fake timers
- Demonstrates interval cleanup patterns

### 3. Feature-Based Backend Structure

**Choice**: Modules organized by feature

**Rationale**:
- Clear separation of concerns
- Easy to navigate and understand
- Standard NestJS pattern
- Scalable for adding new features

### 4. Native Fetch vs Axios

**Choice**: Native Fetch API

**Rationale**:
- No additional dependencies
- Modern browser support
- HackerRank challenge constraint
- Simpler for assessment context
