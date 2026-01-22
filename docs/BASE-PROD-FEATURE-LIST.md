# Melodio - Detailed Feature List (BASE-PROD)

## Overview

This document provides a comprehensive breakdown of all features in the Melodio music streaming application **AS DEPLOYED IN BASE-PROD BRANCH**.

**IMPORTANT:** This branch contains **3 intentional bugs** designed for HackerRank debugging assessment:

1. **EASY BUG (Task 1):** Playlist Track Removal - removeTrack function broken
2. **HARD BUG (Task 2):** Player Controls - Shuffle, Repeat, and Timer combined
3. **MEDIUM BUG (Task 3):** Search - Frontend mock data + Backend empty results

**Document Version:** Base Production Branch
**Status:** Contains bugs for testing/debugging
**Tech Stack:** MERN (MongoDB, Express, React, Node.js) on TypeScript
**Theme:** Dark theme (Spotify aesthetic)
**Timezone:** Single timezone (server-based)

---

## Branding & Theme

| Element         | Specification                                                                     |
| --------------- | --------------------------------------------------------------------------------- |
| App Name        | **Melodio**                                                                       |
| Logo            | Music2 icon with Melodio branding                                                 |
| Primary Color   | #1DB954 (Spotify green)                                                           |
| Secondary Color | #191414 (Dark background)                                                         |
| Accent Color    | #FFFFFF (White text on dark backgrounds)                                          |
| Background      | #121212 (Deep black for dark mode)                                                |
| Surface         | #282828 (Dark gray for cards/surfaces)                                            |
| Theme           | **Dark theme** - Deep black backgrounds (#121212), white text, green accents      |

---

## EASY BUG SUMMARY (Task 1: Playlist Track Removal)

**Bug Category:** Frontend hook broken functionality

**Affected Files:**

- `frontend/src/shared/hooks/usePlaylistOperations.ts` - removeTrack function

**Bug Impact:**

- Users cannot remove tracks from playlists
- Remove button click triggers error immediately
- No API call is made to backend
- Error toast always shows "Failed to remove track"

**Root Cause:**

- `removeTrack` function immediately throws error without:
  - Storing original tracks for rollback
  - Calling the playlist service API
  - Actually filtering out the track
- Function returns failure path directly

---

## HARD BUG SUMMARY (Task 2: Player Controls)

**Bug Category:** Frontend reducer missing implementations (A+B+C combined)

**Affected Files:**

- `frontend/src/shared/contexts/playerReducer.ts` - TOGGLE_SHUFFLE, TOGGLE_REPEAT, TICK actions

**Bug Impact:**

- Shuffle button does nothing when clicked
- Repeat button does nothing when clicked
- Progress bar stuck at 0:00 (timer never advances)
- Track never auto-advances to next track
- Playback simulation completely broken

**Root Causes:**

1. TOGGLE_SHUFFLE action just returns state unchanged
2. TOGGLE_REPEAT action just returns state unchanged
3. TICK action just returns state unchanged (no timer logic)

---

## MEDIUM BUG SUMMARY (Task 3: Search)

**Bug Category:** Frontend mock data + Backend empty results

**Affected Files:**

- `frontend/src/shared/hooks/useSearch.ts` - Returns mock data instead of API call
- `backend/src/features/tracks/tracks.service.ts` - search() returns empty array

**Bug Impact:**

- Search always returns same 2 mock tracks regardless of query
- Backend search endpoint returns empty array for all queries
- Search results don't match user's query
- No real search functionality

**Root Causes:**

1. Frontend useSearch hook hardcodes mock tracks instead of calling searchService
2. Backend search method returns `[]` without querying database

---

# FEATURES (BASE-PROD VERSION)

## 1. Authentication System

### 1.1 - 1.5: [Same as SOLUTION-PROD-FEATURE-LIST.md]

**No bugs in Authentication feature.**

All auth features work correctly in BASE-PROD. Refer to SOLUTION-PROD for details.

---

## 2. Music Catalog Browsing

### 2.1 - 2.6: [Same as SOLUTION-PROD-FEATURE-LIST.md]

**No bugs in Music Catalog Browsing feature.**

Music catalog browsing works correctly in BASE-PROD. Refer to SOLUTION-PROD for details.

---

## 3. Music Player ⚠️ **CONTAINS HARD BUG (Task 2)**

### 3.1 - 3.5: [Same as SOLUTION-PROD-FEATURE-LIST.md]

Playback simulation, play/pause, next/previous, seek, and volume work correctly.

---

### 3.6 Shuffle Mode (BUGGY)

**Description:** Randomize queue order while preserving current track position.

**Intended Business Logic:**

- When enabling: Store original queue, shuffle remaining tracks, keep current at index 0
- When disabling: Restore original queue, find current track's position

**ACTUAL BUGGY BEHAVIOR:**

#### BUG A: TOGGLE_SHUFFLE Returns State Unchanged

- **Code Path:** TOGGLE_SHUFFLE action in playerReducer.ts
- **Issue:** Action just returns current state without any shuffle logic
- **Manifestation:** User clicks shuffle button, nothing happens
- **Root Cause:**
  - Missing shuffle implementation
  - Current code: `return state;`
  - Should: Store originalQueue, shuffle tracks, update queueIndex

**Buggy Code:**

```typescript
case "TOGGLE_SHUFFLE": {
  return state;  // ❌ Does nothing!
}
```

**Correct Code Should Be:**

```typescript
case "TOGGLE_SHUFFLE": {
  if (!state.shuffleEnabled) {
    const currentTrack = state.currentTrack;
    if (!currentTrack || state.queue.length <= 1) {
      return { ...state, shuffleEnabled: true, originalQueue: [...state.queue] };
    }
    let newQueue: typeof state.queue;
    if (action.payload?.shuffledQueue) {
      newQueue = action.payload.shuffledQueue;
    } else {
      const otherTracks = state.queue.filter((t) => t._id !== currentTrack._id);
      const shuffledOthers = shuffleArray(otherTracks);
      newQueue = [currentTrack, ...shuffledOthers];
    }

    return {
      ...state,
      shuffleEnabled: true,
      originalQueue: [...state.queue],
      queue: newQueue,
      queueIndex: 0,
    };
  } else {
    const currentTrack = state.currentTrack;
    const originalQueue = state.originalQueue.length > 0 ? state.originalQueue : state.queue;

    const newIndex = currentTrack
      ? originalQueue.findIndex((t) => t._id === currentTrack._id)
      : 0;

    return {
      ...state,
      shuffleEnabled: false,
      queue: originalQueue,
      originalQueue: [],
      queueIndex: newIndex >= 0 ? newIndex : 0,
    };
  }
}
```

---

### 3.7 Repeat Mode (BUGGY)

**Description:** Control behavior at end of queue.

**Intended Behavior:**

- Modes cycle: off → all → one → off
- 'all' mode: Loop entire queue
- 'one' mode: Repeat current track

**ACTUAL BUGGY BEHAVIOR:**

#### BUG B: TOGGLE_REPEAT Returns State Unchanged

- **Code Path:** TOGGLE_REPEAT action in playerReducer.ts
- **Issue:** Action just returns current state without cycling modes
- **Manifestation:** User clicks repeat button, mode never changes
- **Root Cause:**
  - Missing mode cycling logic
  - Current code: `return state;`
  - Should: Cycle through 'off' → 'all' → 'one' → 'off'

**Buggy Code:**

```typescript
case "TOGGLE_REPEAT": {
  return state;  // ❌ Does nothing!
}
```

**Correct Code Should Be:**

```typescript
case "TOGGLE_REPEAT": {
  const modes: RepeatMode[] = ["off", "all", "one"];
  const currentIndex = modes.indexOf(state.repeatMode);
  const nextMode = modes[(currentIndex + 1) % modes.length];
  return { ...state, repeatMode: nextMode };
}
```

---

### 3.8 TICK Action (Timer) (BUGGY)

**Description:** Handles playback timer tick every second.

**Intended Behavior:**

- Increment elapsedSeconds while playing
- Handle track end based on repeat mode
- Auto-advance to next track

**ACTUAL BUGGY BEHAVIOR:**

#### BUG C: TICK Returns State Unchanged

- **Code Path:** TICK action in playerReducer.ts
- **Issue:** Action just returns current state without incrementing timer
- **Manifestation:**
  - Progress bar stuck at 0:00
  - Track never ends
  - Auto-advance never happens
  - Repeat modes have no effect
- **Root Cause:**
  - Missing entire timer logic
  - Current code: `return state;`
  - Should: Increment elapsedSeconds, handle track completion, advance queue

**Buggy Code:**

```typescript
case "TICK": {
  return state;  // ❌ Does nothing!
}
```

**Correct Code Should Be:**

```typescript
case "TICK": {
  if (!state.currentTrack || !state.isPlaying) return state;

  const newElapsed = state.elapsedSeconds + 1;

  if (newElapsed >= state.currentTrack.durationInSeconds) {
    if (state.repeatMode === "one") {
      return { ...state, elapsedSeconds: 0 };
    }

    const nextIndex = state.queueIndex + 1;
    if (nextIndex >= state.queue.length) {
      if (state.repeatMode === "all") {
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

## 4. Queue Management

### 4.1 - 4.5: [Same as SOLUTION-PROD-FEATURE-LIST.md]

**No bugs in Queue Management feature.**

Queue operations work correctly in BASE-PROD. Refer to SOLUTION-PROD for details.

---

## 5. Playlist Management ⚠️ **CONTAINS MEDIUM BUG (Task 1)**

### 5.1 - 5.6: [Same as SOLUTION-PROD-FEATURE-LIST.md]

View, create, detail, edit, delete, and add track features work correctly.

---

### 5.7 Remove Track from Playlist (BUGGY)

**Description:** Remove a track from a playlist.

**Intended Behavior:**

- Optimistically remove track from UI
- Call API to persist removal
- Rollback on failure

**ACTUAL BUGGY BEHAVIOR:**

#### BUG: removeTrack Always Throws Error

- **Code Path:** `removeTrack` function in usePlaylistOperations.ts
- **Issue:** Function immediately throws error without any actual logic
- **Manifestation:**
  - User clicks remove button
  - Error toast shows "Failed to remove track"
  - Track remains in playlist
  - No API call made
- **Root Cause:**
  - Function body replaced with immediate error throw
  - Missing: original tracks storage, filter logic, API call, rollback

**Buggy Code:**

```typescript
const removeTrack = useCallback(
  async (trackId: string): Promise<void> => {
    const err = new Error("Failed to remove track");
    onError?.(err);
    throw err;
  },
  [playlistId, tracks, setPlaylist, onError]
);
```

**Correct Code Should Be:**

```typescript
const removeTrack = useCallback(
  async (trackId: string) => {
    const originalTracks = [...tracks];
    const newTracks = tracks.filter((t) => t._id !== trackId);

    setPlaylist(newTracks);
    setIsRemoving(true);

    try {
      await playlistService.removeTrack(playlistId, trackId);
    } catch (error) {
      setPlaylist(originalTracks);
      const err = error instanceof Error ? error : new Error("Failed to remove track");
      onError?.(err);
      throw err;
    } finally {
      setIsRemoving(false);
    }
  },
  [playlistId, tracks, setPlaylist, onError]
);
```

**User Experience:**

1. User views playlist with 5 tracks
2. User clicks "Remove" on one track
3. Error toast shows immediately
4. Track is NOT removed
5. Playlist unchanged

---

### 5.8 Reorder Tracks in Playlist

**No bugs in reorder feature.**

Reordering works correctly in BASE-PROD.

---

## 6. Search ⚠️ **CONTAINS MEDIUM BUG (Task 3)**

### 6.1 Search Input

**No bugs in search input UI.**

Search input and debounce work correctly.

---

### 6.2 Search Results (BUGGY - Frontend)

**Description:** Search returns **tracks only**.

**Intended Behavior:**

- Call searchService.search() with debounced query
- Return matching tracks from backend
- Handle loading and error states

**ACTUAL BUGGY BEHAVIOR:**

#### BUG: useSearch Returns Mock Data

- **Code Path:** `useSearch` hook in useSearch.ts
- **Issue:** Hook returns hardcoded mock tracks instead of calling API
- **Manifestation:**
  - User types any query
  - Same 2 mock tracks always shown
  - Results don't match query
  - Real tracks never displayed

**Buggy Code:**

```typescript
const mockTracks: TrackWithPopulated[] = [
  {
    _id: "mock-1",
    title: "Mock Song 1",
    durationInSeconds: 180,
    artist: { _id: "artist-1", name: "Mock Artist", imageUrl: "" },
    album: { _id: "album-1", title: "Mock Album", coverImageUrl: "" },
  },
  {
    _id: "mock-2",
    title: "Mock Song 2",
    durationInSeconds: 240,
    artist: { _id: "artist-1", name: "Mock Artist", imageUrl: "" },
    album: { _id: "album-1", title: "Mock Album", coverImageUrl: "" },
  },
];

export function useSearch(query: string): UseSearchReturn {
  // ... state declarations ...

  useEffect(() => {
    const trimmedQuery = debouncedQuery.trim();

    if (!trimmedQuery) {
      setTracks([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setTracks(mockTracks);  // ❌ Returns mock data!
    setIsLoading(false);
  }, [debouncedQuery]);

  return { tracks, isLoading, error };
}
```

**Correct Code Should Be:**

```typescript
export function useSearch(query: string): UseSearchReturn {
  const [tracks, setTracks] = useState<TrackWithPopulated[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, DEBOUNCE_DELAY);

  useEffect(() => {
    const trimmedQuery = debouncedQuery.trim();

    if (!trimmedQuery) {
      setTracks([]);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await searchService.search(trimmedQuery);
        if (!cancelled) {
          setTracks(result.tracks);
        }
      } catch (err) {
        if (!cancelled) {
          const errorMessage = err instanceof Error ? err.message : "Search failed";
          setError(errorMessage);
          setTracks([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchResults();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  return { tracks, isLoading, error };
}
```

---

### 6.3 Backend Search Implementation (BUGGY)

**Description:** Server-side search logic in tracks.service.ts.

**Intended Behavior:**

- Query database with prefix-based title match
- Return up to 5 matching tracks
- Populate artist and album data

**ACTUAL BUGGY BEHAVIOR:**

#### BUG: search() Returns Empty Array

- **Code Path:** `search` method in tracks.service.ts
- **Issue:** Method returns empty array without querying database
- **Manifestation:**
  - Any search query returns no results
  - Database never queried
  - Frontend receives empty array (if it were calling API)

**Buggy Code:**

```typescript
async search(query: string, limit = 5): Promise<TrackResponse[]> {
  return [];  // ❌ Returns empty array always!
}
```

**Correct Code Should Be:**

```typescript
async search(query: string, limit = 5): Promise<TrackResponse[]> {
  if (!query || query.trim() === "") {
    return [];
  }

  const trimmedQuery = query.trim();
  const lowercaseQuery = trimmedQuery.toLowerCase();

  const tracks = await Track.find({
    $or: [
      { title: { $regex: `^${escapeRegex(trimmedQuery)}`, $options: "i" } },
      { genre: lowercaseQuery },
    ],
  })
    .populate<{ artist_id: PopulatedArtist | null }>("artist_id", "name image_url")
    .populate<{ album_id: PopulatedAlbum | null }>("album_id", "title cover_image_url")
    .limit(limit)
    .lean<LeanTrackWithPopulated[]>()
    .exec();

  return tracks.map((track) => transformTrack(track));
}
```

---

## 7. Recently Played

### 7.1: [Same as SOLUTION-PROD-FEATURE-LIST.md]

**No bugs in Recently Played feature.**

Recently played works correctly in BASE-PROD. Refer to SOLUTION-PROD for details.

---

## 8. UI/UX Features

### 8.1 - 8.6: [Same as SOLUTION-PROD-FEATURE-LIST.md]

**No bugs in UI/UX features.**

All UI/UX features work correctly in BASE-PROD. Refer to SOLUTION-PROD for details.

---

## Bug Summary Table

| Bug                        | Feature          | Severity | Type                  | Lines to Fix | Files                       |
| -------------------------- | ---------------- | -------- | --------------------- | ------------ | --------------------------- |
| BUG Task 1 (removeTrack)   | Playlist         | EASY     | Missing Implementation| 15-20        | usePlaylistOperations.ts    |
| BUG Task 2A (TOGGLE_SHUFFLE) | Player         | HARD     | Missing Implementation| 25-30        | playerReducer.ts            |
| BUG Task 2B (TOGGLE_REPEAT)  | Player         | HARD     | Missing Implementation| 4-5          | playerReducer.ts            |
| BUG Task 2C (TICK)           | Player         | HARD     | Missing Implementation| 25-30        | playerReducer.ts            |
| BUG Task 3A (useSearch)      | Search         | MEDIUM   | Mock Data             | 30-35        | useSearch.ts                |
| BUG Task 3B (search API)     | Search         | MEDIUM   | Empty Return          | 15-20        | tracks.service.ts           |

---

## Candidate Debugging Tasks

### Task 1: Fix Playlist Track Removal (EASY - 15 minutes)

**Problem Statement:**

- Remove track button shows error immediately
- Tracks cannot be removed from playlists
- No API call made to backend

**What Needs Fixing:**

1. Store original tracks before removal
2. Optimistically update UI with filtered tracks
3. Call playlistService.removeTrack API
4. Rollback on failure, throw error for caller

**Expected Test Cases to Pass:** 4-6 behavioral tests

**Files to Touch:** 1 file (usePlaylistOperations.ts)

**Estimated Lines:** 15-20 lines

---

### Task 2: Fix Player Controls (HARD - 45 minutes)

**Problem Statement:**

- Shuffle button does nothing
- Repeat button does nothing
- Progress bar stuck at 0:00 (timer broken)
- Tracks never auto-advance

**What Needs Fixing:**

1. TOGGLE_SHUFFLE: Implement shuffle/unshuffle logic with originalQueue
2. TOGGLE_REPEAT: Implement mode cycling (off → all → one → off)
3. TICK: Implement timer increment and track completion handling

**Expected Test Cases to Pass:** 15-20 behavioral tests

**Files to Touch:** 1 file (playerReducer.ts)

**Estimated Lines:** 55-65 lines across 3 case blocks

---

### Task 3: Fix Search (MEDIUM - 30 minutes)

**Problem Statement:**

- Search shows mock data instead of real tracks
- Backend search returns empty results
- Results don't match user's query

**What Needs Fixing:**

1. Frontend useSearch: Replace mock data with actual API call
2. Backend search: Implement database query with prefix matching

**Expected Test Cases to Pass:** 8-12 behavioral tests

**Files to Touch:** 2 files (useSearch.ts, tracks.service.ts)

**Estimated Lines:** 45-55 lines across both files

---

## End of BASE-PROD-FEATURE-LIST

**This branch contains bugs that candidates must debug and fix.**
