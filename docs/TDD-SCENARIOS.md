# Test-Driven Development (TDD) Scenarios Document

## Overview

This document defines all test scenarios for the music streaming application. Each feature has comprehensive test cases covering happy paths, edge cases, error scenarios, and boundary conditions.

**Purpose:** Subagents will use this document as the specification for writing tests BEFORE implementing features (TDD approach).

---

## Test Organization

### Folder Structure

```
spotify-mern-app/
├── __tests__/                        # Task-specific tests (HackerRank graded)
│   ├── task1/                        # Playlist operations (frontend)
│   │   └── usePlaylistOperations.test.ts
│   ├── task2/                        # Player controls (frontend)
│   │   └── playerReducer.test.ts
│   └── task3/                        # Search (frontend + backend)
│       ├── useSearch.test.ts         # Frontend search hook
│       └── search.service.test.ts    # Backend search API
├── backend/__tests__/others/         # Non-task backend tests
│   ├── auth.service.test.ts
│   ├── tracks.service.test.ts
│   ├── albums.service.test.ts
│   ├── artists.service.test.ts
│   └── playlists.service.test.ts
├── frontend/__tests__/others/        # Non-task frontend tests
│   ├── auth.context.test.tsx
│   ├── formatters.test.ts
│   ├── playerReducer.test.ts         # Duplicate for dev testing
│   ├── useDebounce.test.ts
│   ├── useLocalStorage.test.ts
│   ├── useRecentlyPlayed.test.ts
│   └── useToast.test.tsx
```

### Task to Scenario Mapping

| Task Folder | Scenarios in This Document |
|-------------|---------------------------|
| `__tests__/task1/` | Section 8 (usePlaylistOperations) |
| `__tests__/task2/` | Section 7 (Player Reducer) |
| `__tests__/task3/` | Section 6 (Search Service) + Section 10 (useSearch) |
| `backend/__tests__/others/` | Sections 1-5 (Auth, Tracks, Albums, Artists, Playlists) |
| `frontend/__tests__/others/` | Sections 9, 11-14 (useRecentlyPlayed, useDebounce, Playlist API, useLocalStorage, useToast) |

### Selector Strategy
- **Primary selector:** `data-testid` attributes
- **Avoid:** Placeholder text selectors (less reliable)

### Test Comment Format
Each test file should include high-level comments:
```
INTRO: What this test verifies
SCENARIO: Setup and preconditions
EXPECTATION: What should happen (correct behavior)
```

### Console Handling
- Suppress ALL `console.error` and `console.warn` globally in `jest.setup.js`

### Test Commands
```bash
npm run test:task1   # Runs __tests__/task1/**
npm run test:task2   # Runs __tests__/task2/**
npm run test:task3   # Runs __tests__/task3/**
npm run test         # All tests (tasks + others)
```

---

## Test Categories

- **Unit Tests:** Isolated component/function testing
- **Integration Tests:** API endpoint testing with database
- **E2E Tests:** Full user flow testing (optional, Playwright)

**Note:** Backend tests are NOT required for HackerRank tasks. Focus is on frontend tests.

---

# BACKEND TEST SCENARIOS

## 1. Authentication Service Tests

### 1.1 Register User

#### Scenario: Successful registration with valid data
- **Given:** Valid email, username, password, and displayName
- **When:** Register endpoint is called
- **Then:** User is created in database
- **And:** Password is hashed (not stored in plain text)
- **And:** JWT access token is returned
- **And:** User object is returned (without passwordHash)
- **And:** Response status is 201

#### Scenario: Registration fails when email already exists
- **Given:** Email "test@example.com" is already registered
- **When:** New user tries to register with same email
- **Then:** Response status is 409 Conflict
- **And:** Error message indicates email already registered
- **And:** No new user is created

#### Scenario: Registration fails when username already exists
- **Given:** Username "testuser" is already taken
- **When:** New user tries to register with same username
- **Then:** Response status is 409 Conflict
- **And:** Error message indicates username already taken
- **And:** No new user is created

#### Scenario: Registration fails with invalid email format
- **Given:** Email is "not-an-email"
- **When:** Register endpoint is called
- **Then:** Response status is 400 Bad Request
- **And:** Validation error for email field

#### Scenario: Registration fails with empty required fields
- **Given:** Any required field is empty or missing
- **When:** Register endpoint is called
- **Then:** Response status is 400 Bad Request
- **And:** Validation error indicates missing field

#### Scenario: Email is stored lowercase regardless of input case
- **Given:** Email is "Test@EXAMPLE.com"
- **When:** User successfully registers
- **Then:** Email stored in database is "test@example.com"

---

### 1.2 Login User

#### Scenario: Successful login with valid credentials
- **Given:** User exists with email "test@example.com" and password "password123"
- **When:** Login with correct email and password
- **Then:** Response status is 200 OK
- **And:** JWT access token is returned
- **And:** User object is returned (without passwordHash)

#### Scenario: Login fails with incorrect password
- **Given:** User exists with email "test@example.com"
- **When:** Login with correct email but wrong password
- **Then:** Response status is 401 Unauthorized
- **And:** Generic error message "Invalid email or password"
- **And:** No token is returned

#### Scenario: Login fails with non-existent email
- **Given:** No user with email "nonexistent@example.com"
- **When:** Login with that email
- **Then:** Response status is 401 Unauthorized
- **And:** Generic error message "Invalid email or password"

#### Scenario: Login is case-insensitive for email
- **Given:** User registered with email "test@example.com"
- **When:** Login with email "TEST@Example.COM"
- **Then:** Login succeeds

---

### 1.3 Get Current User (Me)

#### Scenario: Get current user with valid token
- **Given:** Valid JWT token for user "user123"
- **When:** GET /auth/me with Authorization header
- **Then:** Response status is 200 OK
- **And:** Returns user object with id, email, username, displayName, avatarUrl

#### Scenario: Get current user fails without token
- **Given:** No Authorization header provided
- **When:** GET /auth/me
- **Then:** Response status is 401 Unauthorized

#### Scenario: Get current user fails with invalid token
- **Given:** Invalid/malformed JWT token
- **When:** GET /auth/me with that token
- **Then:** Response status is 401 Unauthorized

#### Scenario: Get current user fails with expired token
- **Given:** Expired JWT token
- **When:** GET /auth/me with that token
- **Then:** Response status is 401 Unauthorized

---

## 2. Tracks Service Tests

### 2.1 Get All Tracks (Paginated)

#### Scenario: Get tracks with default pagination
- **Given:** 50 tracks exist in database
- **When:** GET /tracks without query params
- **Then:** Response contains 20 tracks (default limit)
- **And:** Pagination info shows page 1, total 50, totalPages 3

#### Scenario: Get tracks with custom pagination
- **Given:** 50 tracks exist
- **When:** GET /tracks?page=2&limit=10
- **Then:** Response contains 10 tracks (tracks 11-20)
- **And:** Pagination info shows page 2

#### Scenario: Get tracks filtered by genre
- **Given:** 10 rock tracks and 10 pop tracks exist
- **When:** GET /tracks?genre=rock
- **Then:** Only rock tracks are returned
- **And:** Genre filter is case-insensitive

#### Scenario: Get tracks filtered by artistId
- **Given:** Artist "artist123" has 5 tracks
- **When:** GET /tracks?artistId=artist123
- **Then:** Only tracks by that artist are returned

#### Scenario: Get tracks filtered by albumId
- **Given:** Album "album123" has 8 tracks
- **When:** GET /tracks?albumId=album123
- **Then:** Only tracks from that album are returned

#### Scenario: Tracks include populated artist and album
- **Given:** Track exists with artistId and albumId
- **When:** GET /tracks
- **Then:** Each track has artistId populated with name, imageUrl
- **And:** Each track has albumId populated with title, coverImageUrl

---

### 2.2 Get Track by ID

#### Scenario: Get existing track by ID
- **Given:** Track "track123" exists
- **When:** GET /tracks/track123
- **Then:** Response status is 200 OK
- **And:** Track object is returned with populated artist and album

#### Scenario: Get non-existent track
- **Given:** No track with ID "nonexistent"
- **When:** GET /tracks/nonexistent
- **Then:** Response status is 404 Not Found

#### Scenario: Get track with invalid ObjectId format
- **Given:** ID is "invalid-id" (not valid ObjectId)
- **When:** GET /tracks/invalid-id
- **Then:** Response status is 400 Bad Request

---

### 2.3 Search Tracks

#### Scenario: Search tracks by title prefix
- **Given:** Tracks with titles "Thunder Road", "Thunder Strike", "Lightning"
- **When:** GET /tracks/search?q=Thunder
- **Then:** Returns "Thunder Road" and "Thunder Strike"
- **And:** Does not return "Lightning"

#### Scenario: Search tracks by exact genre
- **Given:** Tracks with genres "rock", "pop", "rock-n-roll"
- **When:** GET /tracks/search?q=rock
- **Then:** Returns tracks with genre exactly "rock"
- **And:** Does not return "rock-n-roll" tracks (genre match is exact)

#### Scenario: Search is case-insensitive
- **Given:** Track with title "Thunder Road"
- **When:** GET /tracks/search?q=thunder
- **Then:** Returns the track

#### Scenario: Empty search query returns empty array
- **Given:** Any tracks exist
- **When:** GET /tracks/search?q=
- **Then:** Returns empty array

#### Scenario: Search results are limited
- **Given:** 100 tracks matching "Thunder"
- **When:** GET /tracks/search?q=Thunder
- **Then:** Returns maximum 5 tracks

---

### 2.4 Increment Play Count

#### Scenario: Successfully increment play count
- **Given:** Track "track123" has playCount 10
- **When:** POST /tracks/track123/play
- **Then:** Response status is 200 OK
- **And:** Track playCount is now 11

#### Scenario: Increment play count for non-existent track
- **Given:** No track with ID "nonexistent"
- **When:** POST /tracks/nonexistent/play
- **Then:** Response status is 404 Not Found

---

## 3. Albums Service Tests

### 3.1 Get All Albums

#### Scenario: Get albums with pagination
- **Given:** 10 albums exist
- **When:** GET /albums?page=1&limit=5
- **Then:** Returns 5 albums
- **And:** Sorted by releaseDate descending (newest first)

#### Scenario: Get albums filtered by artistId
- **Given:** Artist "artist123" has 3 albums
- **When:** GET /albums?artistId=artist123
- **Then:** Returns only albums by that artist

#### Scenario: Albums include populated artist
- **Given:** Album exists with artistId
- **When:** GET /albums
- **Then:** Each album has artistId populated with name, imageUrl

---

### 3.2 Get Album by ID

#### Scenario: Get existing album
- **Given:** Album "album123" exists
- **When:** GET /albums/album123
- **Then:** Returns album with populated artist

#### Scenario: Get non-existent album
- **Given:** No album with ID "nonexistent"
- **When:** GET /albums/nonexistent
- **Then:** Response status is 404 Not Found

---

### 3.3 Search Albums

#### Scenario: Search albums by title
- **Given:** Albums "Electric Storm", "Voltage"
- **When:** GET /albums/search?q=Electric
- **Then:** Returns "Electric Storm"

#### Scenario: Empty search returns empty array
- **Given:** Albums exist
- **When:** GET /albums/search?q=
- **Then:** Returns empty array

---

## 4. Artists Service Tests

### 4.1 Get All Artists

#### Scenario: Get artists with pagination
- **Given:** 5 artists exist
- **When:** GET /artists
- **Then:** Returns artists sorted by followerCount descending

---

### 4.2 Get Artist by ID

#### Scenario: Get existing artist
- **Given:** Artist "artist123" exists
- **When:** GET /artists/artist123
- **Then:** Returns artist object with all fields

#### Scenario: Get non-existent artist
- **Given:** No artist with ID "nonexistent"
- **When:** GET /artists/nonexistent
- **Then:** Response status is 404 Not Found

---

### 4.3 Artist Follower Count

#### Scenario: Increment follower count
- **Given:** Artist "artist123" has followerCount 100
- **When:** incrementFollowerCount is called
- **Then:** followerCount becomes 101

#### Scenario: Decrement follower count
- **Given:** Artist "artist123" has followerCount 100
- **When:** decrementFollowerCount is called
- **Then:** followerCount becomes 99

---

## 5. Playlists Service Tests

### 5.1 Get User Playlists

#### Scenario: Get playlists for authenticated user
- **Given:** User "user123" owns 3 playlists
- **And:** Other users own 5 playlists
- **When:** GET /playlists (as user123)
- **Then:** Returns only the 3 playlists owned by user123
- **And:** Sorted by updatedAt descending

#### Scenario: Get playlists when user has none
- **Given:** User "user123" owns no playlists
- **When:** GET /playlists (as user123)
- **Then:** Returns empty array

---

### 5.2 Get Playlist by ID

#### Scenario: Get public playlist as owner
- **Given:** User "user123" owns public playlist "playlist123"
- **When:** GET /playlists/playlist123 (as user123)
- **Then:** Returns playlist with tracks populated
- **And:** Each track has artist and album populated

#### Scenario: Get public playlist as non-owner
- **Given:** User "userA" owns public playlist "playlist123"
- **When:** GET /playlists/playlist123 (as userB)
- **Then:** Returns playlist successfully

#### Scenario: Get private playlist as owner
- **Given:** User "user123" owns private playlist "playlist123"
- **When:** GET /playlists/playlist123 (as user123)
- **Then:** Returns playlist successfully

#### Scenario: Get private playlist as non-owner (forbidden)
- **Given:** User "userA" owns private playlist "playlist123"
- **When:** GET /playlists/playlist123 (as userB)
- **Then:** Response status is 403 Forbidden

#### Scenario: Get non-existent playlist
- **Given:** No playlist with ID "nonexistent"
- **When:** GET /playlists/nonexistent
- **Then:** Response status is 404 Not Found

---

### 5.3 Create Playlist

#### Scenario: Create playlist with all fields
- **Given:** User "user123" is authenticated
- **When:** POST /playlists with name, description, isPublic
- **Then:** Response status is 201 Created
- **And:** Playlist is created with ownerId = user123
- **And:** trackIds is initialized as empty array

#### Scenario: Create playlist with only name
- **Given:** User is authenticated
- **When:** POST /playlists with only name
- **Then:** Playlist created with default isPublic = true

#### Scenario: Create playlist fails without name
- **Given:** User is authenticated
- **When:** POST /playlists without name
- **Then:** Response status is 400 Bad Request

---

### 5.4 Update Playlist

#### Scenario: Update own playlist name
- **Given:** User "user123" owns playlist "playlist123"
- **When:** PATCH /playlists/playlist123 with { name: "New Name" }
- **Then:** Playlist name is updated
- **And:** Other fields remain unchanged

#### Scenario: Update own playlist description
- **Given:** User owns playlist
- **When:** PATCH with { description: "New description" }
- **Then:** Description is updated

#### Scenario: Update own playlist visibility
- **Given:** User owns public playlist
- **When:** PATCH with { isPublic: false }
- **Then:** Playlist becomes private

#### Scenario: Update another user's playlist (forbidden)
- **Given:** User "userA" owns playlist "playlist123"
- **When:** User "userB" tries to PATCH /playlists/playlist123
- **Then:** Response status is 403 Forbidden

#### Scenario: Update non-existent playlist
- **Given:** No playlist with ID "nonexistent"
- **When:** PATCH /playlists/nonexistent
- **Then:** Response status is 404 Not Found

---

### 5.5 Delete Playlist

#### Scenario: Delete own playlist
- **Given:** User "user123" owns playlist "playlist123"
- **When:** DELETE /playlists/playlist123
- **Then:** Response status is 204 No Content
- **And:** Playlist is removed from database

#### Scenario: Delete another user's playlist (forbidden)
- **Given:** User "userA" owns playlist "playlist123"
- **When:** User "userB" tries to DELETE
- **Then:** Response status is 403 Forbidden

#### Scenario: Delete non-existent playlist
- **Given:** No playlist with ID "nonexistent"
- **When:** DELETE /playlists/nonexistent
- **Then:** Response status is 404 Not Found

---

### 5.6 Add Track to Playlist

#### Scenario: Add track to own playlist
- **Given:** User owns playlist with tracks [A, B]
- **When:** POST /playlists/:id/tracks with trackId C
- **Then:** Playlist trackIds becomes [A, B, C]

#### Scenario: Add duplicate track (no duplication)
- **Given:** User owns playlist with tracks [A, B, C]
- **When:** POST /playlists/:id/tracks with trackId B
- **Then:** Playlist trackIds remains [A, B, C]
- **And:** No error is returned

#### Scenario: Add track to another user's playlist (forbidden)
- **Given:** User "userA" owns playlist
- **When:** User "userB" tries to add track
- **Then:** Response status is 403 Forbidden

#### Scenario: Add track to non-existent playlist
- **Given:** No playlist with ID "nonexistent"
- **When:** POST /playlists/nonexistent/tracks
- **Then:** Response status is 404 Not Found

---

### 5.7 Remove Track from Playlist

#### Scenario: Remove existing track from own playlist
- **Given:** User owns playlist with tracks [A, B, C]
- **When:** DELETE /playlists/:id/tracks/B
- **Then:** Playlist trackIds becomes [A, C]

#### Scenario: Remove non-existent track from playlist
- **Given:** User owns playlist with tracks [A, B, C]
- **When:** DELETE /playlists/:id/tracks/X
- **Then:** Playlist trackIds remains [A, B, C]
- **And:** No error is returned (idempotent)

#### Scenario: Remove track from another user's playlist (forbidden)
- **Given:** User "userA" owns playlist
- **When:** User "userB" tries to remove track
- **Then:** Response status is 403 Forbidden

---

### 5.8 Reorder Tracks in Playlist

#### Scenario: Reorder tracks in own playlist
- **Given:** User owns playlist with tracks [A, B, C, D]
- **When:** PATCH /playlists/:id/reorder with [D, A, C, B]
- **Then:** Playlist trackIds becomes [D, A, C, B]

#### Scenario: Reorder tracks in another user's playlist (forbidden)
- **Given:** User "userA" owns playlist
- **When:** User "userB" tries to reorder
- **Then:** Response status is 403 Forbidden

---

## 6. Search Service Tests

### 6.1 Track Search (Tracks Only)

#### Scenario: Search returns tracks only
- **Given:** Matching tracks, artists, and albums exist
- **When:** GET /search?q=Thunder
- **Then:** Response contains tracks array only
- **And:** No artists or albums in dropdown results

#### Scenario: Search uses prefix-based matching
- **Given:** Tracks with titles "Thunder Road", "Thunder Strike", "Thunderstorm"
- **When:** GET /search?q=Thunder
- **Then:** All three tracks are returned
- **And:** Matching is case-insensitive

#### Scenario: Search results are limited
- **Given:** 100 tracks matching query
- **When:** GET /search?q=Thunder
- **Then:** tracks array has maximum 5 items

#### Scenario: Empty query returns empty results
- **Given:** Content exists
- **When:** GET /search?q=
- **Then:** tracks array is empty

---

# FRONTEND TEST SCENARIOS

## 7. Player Reducer Tests

### 7.1 PLAY_TRACK Action

#### Scenario: Play track not in queue
- **Given:** Queue is [A, B], queueIndex is 0, currentTrack is A
- **When:** PLAY_TRACK with track C
- **Then:** Queue becomes [A, B, C]
- **And:** queueIndex is 2
- **And:** currentTrack is C
- **And:** isPlaying is true
- **And:** elapsedSeconds is 0

#### Scenario: Play track already in queue
- **Given:** Queue is [A, B, C], queueIndex is 0, currentTrack is A
- **When:** PLAY_TRACK with track B
- **Then:** Queue remains [A, B, C]
- **And:** queueIndex is 1
- **And:** currentTrack is B

---

### 7.2 PLAY_TRACKS Action

#### Scenario: Play tracks array from start
- **Given:** Any initial state
- **When:** PLAY_TRACKS with tracks [X, Y, Z], startIndex 0
- **Then:** Queue is [X, Y, Z]
- **And:** queueIndex is 0
- **And:** currentTrack is X
- **And:** isPlaying is true
- **And:** elapsedSeconds is 0
- **And:** shuffleEnabled is false
- **And:** originalQueue is []

#### Scenario: Play tracks array from middle
- **Given:** Any initial state
- **When:** PLAY_TRACKS with tracks [X, Y, Z], startIndex 1
- **Then:** queueIndex is 1
- **And:** currentTrack is Y

#### Scenario: PLAY_TRACKS resets shuffle state
- **Given:** shuffleEnabled is true, originalQueue is [A, B]
- **When:** PLAY_TRACKS with new tracks
- **Then:** shuffleEnabled is false
- **And:** originalQueue is []

---

### 7.3 PAUSE and RESUME Actions

#### Scenario: Pause sets isPlaying to false
- **Given:** isPlaying is true
- **When:** PAUSE action
- **Then:** isPlaying is false
- **And:** elapsedSeconds unchanged

#### Scenario: Resume sets isPlaying to true
- **Given:** isPlaying is false
- **When:** RESUME action
- **Then:** isPlaying is true

---

### 7.4 NEXT Action

#### Scenario: Next advances to next track
- **Given:** Queue is [A, B, C], queueIndex is 0
- **When:** NEXT action
- **Then:** queueIndex is 1
- **And:** currentTrack is B
- **And:** elapsedSeconds is 0

#### Scenario: Next at end of queue with repeatMode 'off'
- **Given:** Queue is [A, B, C], queueIndex is 2 (last), repeatMode is 'off'
- **When:** NEXT action
- **Then:** isPlaying is false
- **And:** elapsedSeconds is 0
- **And:** queueIndex remains 2

#### Scenario: Next at end of queue with repeatMode 'all'
- **Given:** Queue is [A, B, C], queueIndex is 2, repeatMode is 'all'
- **When:** NEXT action
- **Then:** queueIndex is 0
- **And:** currentTrack is A
- **And:** isPlaying remains true

#### Scenario: Next with empty queue
- **Given:** Queue is empty
- **When:** NEXT action
- **Then:** State unchanged

---

### 7.5 PREVIOUS Action

#### Scenario: Previous within first 3 seconds restarts track
- **Given:** elapsedSeconds is 2
- **When:** PREVIOUS action
- **Then:** elapsedSeconds is 0
- **And:** queueIndex unchanged
- **And:** currentTrack unchanged

#### Scenario: Previous after 3 seconds goes to previous track
- **Given:** Queue is [A, B, C], queueIndex is 1, elapsedSeconds is 5
- **When:** PREVIOUS action
- **Then:** queueIndex is 0
- **And:** currentTrack is A
- **And:** elapsedSeconds is 0

#### Scenario: Previous at first track stays at first track
- **Given:** Queue is [A, B, C], queueIndex is 0, elapsedSeconds is 1
- **When:** PREVIOUS action
- **Then:** queueIndex is 0
- **And:** elapsedSeconds is 0

#### Scenario: Previous with empty queue
- **Given:** Queue is empty
- **When:** PREVIOUS action
- **Then:** State unchanged

---

### 7.6 SEEK Action

#### Scenario: Seek to valid position
- **Given:** currentTrack has durationInSeconds 180
- **When:** SEEK with payload 90
- **Then:** elapsedSeconds is 90

#### Scenario: Seek clamped to track duration
- **Given:** currentTrack has durationInSeconds 180
- **When:** SEEK with payload 200
- **Then:** elapsedSeconds is 180

#### Scenario: Seek to negative value clamped to 0
- **Given:** Any currentTrack
- **When:** SEEK with payload -10
- **Then:** elapsedSeconds is 0

---

### 7.7 ADD_TO_QUEUE Action

#### Scenario: Add track to queue
- **Given:** Queue is [A, B]
- **When:** ADD_TO_QUEUE with track C
- **Then:** Queue is [A, B, C]
- **And:** queueIndex unchanged
- **And:** currentTrack unchanged

---

### 7.8 REMOVE_FROM_QUEUE Action

#### Scenario: Remove track before current index
- **Given:** Queue is [A, B, C, D], queueIndex is 2 (C)
- **When:** REMOVE_FROM_QUEUE with index 0
- **Then:** Queue is [B, C, D]
- **And:** queueIndex is 1
- **And:** currentTrack is still C

#### Scenario: Remove track after current index
- **Given:** Queue is [A, B, C, D], queueIndex is 1 (B)
- **When:** REMOVE_FROM_QUEUE with index 3
- **Then:** Queue is [A, B, C]
- **And:** queueIndex is 1
- **And:** currentTrack is still B

#### Scenario: Remove current track
- **Given:** Queue is [A, B, C], queueIndex is 1 (B)
- **When:** REMOVE_FROM_QUEUE with index 1
- **Then:** Queue is [A, C]
- **And:** queueIndex is 1 (clamped)
- **And:** currentTrack is C

#### Scenario: Remove last remaining track
- **Given:** Queue is [A], queueIndex is 0
- **When:** REMOVE_FROM_QUEUE with index 0
- **Then:** Queue is []
- **And:** currentTrack is null
- **And:** isPlaying is false
- **And:** elapsedSeconds is 0

---

### 7.9 REORDER_QUEUE Action

#### Scenario: Move track from earlier to later position
- **Given:** Queue is [A, B, C, D], queueIndex is 0 (A)
- **When:** REORDER_QUEUE from 0 to 2
- **Then:** Queue is [B, C, A, D]
- **And:** queueIndex is 2 (A moved)

#### Scenario: Move track from later to earlier position
- **Given:** Queue is [A, B, C, D], queueIndex is 0 (A)
- **When:** REORDER_QUEUE from 3 to 0
- **Then:** Queue is [D, A, B, C]
- **And:** queueIndex is 1 (A shifted)

#### Scenario: Move non-current track, current track position adjusts
- **Given:** Queue is [A, B, C, D], queueIndex is 2 (C)
- **When:** REORDER_QUEUE from 0 to 3
- **Then:** Queue is [B, C, D, A]
- **And:** queueIndex is 1 (C position adjusted)

---

### 7.10 CLEAR_QUEUE Action

#### Scenario: Clear queue keeps current track
- **Given:** Queue is [A, B, C, D], currentTrack is B
- **When:** CLEAR_QUEUE action
- **Then:** Queue is [B]
- **And:** queueIndex is 0
- **And:** currentTrack is B
- **And:** shuffleEnabled is false
- **And:** originalQueue is []

#### Scenario: Clear queue with no current track
- **Given:** Queue is [A, B, C], currentTrack is null
- **When:** CLEAR_QUEUE action
- **Then:** Queue is []
- **And:** queueIndex is 0

---

### 7.11 TOGGLE_SHUFFLE Action

#### Scenario: Enable shuffle preserves current track at index 0
- **Given:** Queue is [A, B, C], queueIndex is 1 (B)
- **When:** TOGGLE_SHUFFLE action
- **Then:** shuffleEnabled is true
- **And:** queue[0] is B (current track)
- **And:** queueIndex is 0
- **And:** originalQueue contains [A, B, C]

#### Scenario: Enable shuffle with pre-computed queue (payload)
- **Given:** Queue is [A, B, C], queueIndex is 1 (B)
- **And:** Payload has shuffledQueue: [B, C, A]
- **When:** TOGGLE_SHUFFLE action
- **Then:** Queue is [B, C, A] (exact payload)
- **And:** queueIndex is 0

#### Scenario: Disable shuffle restores original queue
- **Given:** shuffleEnabled is true
- **And:** Queue is [B, C, A], originalQueue is [A, B, C]
- **And:** currentTrack is B
- **When:** TOGGLE_SHUFFLE action
- **Then:** shuffleEnabled is false
- **And:** Queue is [A, B, C]
- **And:** queueIndex is 1 (B's position in original)
- **And:** originalQueue is []

#### Scenario: Enable shuffle with single track queue
- **Given:** Queue is [A], queueIndex is 0
- **When:** TOGGLE_SHUFFLE action
- **Then:** shuffleEnabled is true
- **And:** Queue is [A] (unchanged)

#### Scenario: Enable shuffle with empty queue
- **Given:** Queue is [], currentTrack is null
- **When:** TOGGLE_SHUFFLE action
- **Then:** shuffleEnabled is true
- **And:** Queue is []
- **And:** originalQueue is []

#### Scenario: Enable shuffle with no current track
- **Given:** Queue is [A, B, C], currentTrack is null
- **When:** TOGGLE_SHUFFLE action
- **Then:** shuffleEnabled is true
- **And:** Queue unchanged
- **And:** originalQueue saved

#### Scenario: Disable shuffle with empty originalQueue fallback
- **Given:** shuffleEnabled is true, originalQueue is []
- **And:** Queue is [B, A, C]
- **When:** TOGGLE_SHUFFLE action
- **Then:** Queue is [B, A, C] (uses current as fallback)
- **And:** shuffleEnabled is false

---

### 7.12 TOGGLE_REPEAT Action

#### Scenario: Toggle repeat cycles through modes
- **Given:** repeatMode is 'off'
- **When:** TOGGLE_REPEAT action
- **Then:** repeatMode is 'all'

- **Given:** repeatMode is 'all'
- **When:** TOGGLE_REPEAT action
- **Then:** repeatMode is 'one'

- **Given:** repeatMode is 'one'
- **When:** TOGGLE_REPEAT action
- **Then:** repeatMode is 'off'

---

### 7.13 SET_VOLUME Action

#### Scenario: Set volume to valid value
- **Given:** volume is 50
- **When:** SET_VOLUME with payload 75
- **Then:** volume is 75

#### Scenario: Volume clamped to 0-100
- **Given:** Any volume
- **When:** SET_VOLUME with payload 150
- **Then:** volume is 100

- **When:** SET_VOLUME with payload -20
- **Then:** volume is 0

---

### 7.14 TICK Action

#### Scenario: Tick increments elapsedSeconds
- **Given:** isPlaying is true, elapsedSeconds is 10
- **When:** TICK action
- **Then:** elapsedSeconds is 11

#### Scenario: Tick when not playing does nothing
- **Given:** isPlaying is false
- **When:** TICK action
- **Then:** State unchanged

#### Scenario: Tick when no current track does nothing
- **Given:** currentTrack is null
- **When:** TICK action
- **Then:** State unchanged

#### Scenario: Track ends with repeatMode 'one'
- **Given:** currentTrack.durationInSeconds is 180
- **And:** elapsedSeconds is 179, repeatMode is 'one'
- **When:** TICK action
- **Then:** elapsedSeconds is 0
- **And:** currentTrack unchanged
- **And:** isPlaying is true

#### Scenario: Track ends with repeatMode 'off', more tracks
- **Given:** Queue is [A, B], queueIndex is 0
- **And:** Track A duration is 180, elapsedSeconds is 179
- **And:** repeatMode is 'off'
- **When:** TICK action
- **Then:** queueIndex is 1
- **And:** currentTrack is B
- **And:** elapsedSeconds is 0

#### Scenario: Track ends with repeatMode 'off', last track
- **Given:** Queue is [A, B], queueIndex is 1 (last)
- **And:** Track B duration is 180, elapsedSeconds is 179
- **And:** repeatMode is 'off'
- **When:** TICK action
- **Then:** isPlaying is false
- **And:** elapsedSeconds is 0

#### Scenario: Track ends with repeatMode 'all', last track
- **Given:** Queue is [A, B], queueIndex is 1 (last)
- **And:** Track B duration is 180, elapsedSeconds is 179
- **And:** repeatMode is 'all'
- **When:** TICK action
- **Then:** queueIndex is 0
- **And:** currentTrack is A
- **And:** isPlaying is true

---

### 7.15 TOGGLE_QUEUE Action

#### Scenario: Toggle queue panel visibility
- **Given:** isQueueOpen is false
- **When:** TOGGLE_QUEUE action
- **Then:** isQueueOpen is true

- **Given:** isQueueOpen is true
- **When:** TOGGLE_QUEUE action
- **Then:** isQueueOpen is false

---

## 8. usePlaylistOperations Hook Tests

### 8.1 reorderTracks

#### Scenario: Reorder tracks optimistically updates UI
- **Given:** Playlist with tracks [A, B, C]
- **When:** reorderTracks(0, 2) is called
- **Then:** setPlaylist is called immediately with [B, C, A]
- **And:** API is called with new track order

#### Scenario: Reorder tracks rolls back on API failure
- **Given:** Playlist with tracks [A, B, C]
- **And:** API will fail
- **When:** reorderTracks(0, 2) is called
- **Then:** setPlaylist called first with [B, C, A]
- **And:** setPlaylist called second with [A, B, C] (rollback)
- **And:** onError callback is called

#### Scenario: Reorder with same index does nothing
- **Given:** Playlist with tracks [A, B, C]
- **When:** reorderTracks(1, 1) is called
- **Then:** setPlaylist is NOT called
- **And:** API is NOT called

#### Scenario: isReordering is true during API call
- **Given:** Playlist with tracks
- **And:** API is pending
- **When:** reorderTracks is called
- **Then:** isReordering is true
- **And:** After API resolves, isReordering is false

---

### 8.2 removeTrack

#### Scenario: Remove track optimistically updates UI
- **Given:** Playlist with tracks [A, B, C]
- **When:** removeTrack('B') is called
- **Then:** setPlaylist is called immediately with [A, C]
- **And:** API is called

#### Scenario: Remove track rolls back on API failure
- **Given:** Playlist with tracks [A, B, C]
- **And:** API will fail
- **When:** removeTrack('B') is called
- **Then:** setPlaylist called first with [A, C]
- **And:** setPlaylist called second with [A, B, C] (rollback)
- **And:** onError callback is called

#### Scenario: isRemoving is true during API call
- **Given:** Playlist with tracks
- **And:** API is pending
- **When:** removeTrack is called
- **Then:** isRemoving is true
- **And:** After API resolves, isRemoving is false

---

## 9. useRecentlyPlayed Hook Tests

### 9.1 addToRecentlyPlayed

#### Scenario: Add new track to beginning
- **Given:** Recently played is [A, B]
- **When:** addToRecentlyPlayed(C)
- **Then:** Recently played is [C, A, B]

#### Scenario: Re-add existing track moves to front (deduplication)
- **Given:** Recently played is [A, B, C]
- **When:** addToRecentlyPlayed(B)
- **Then:** Recently played is [B, A, C]
- **And:** Length is 3 (no duplicates)

#### Scenario: Max 10 tracks enforced
- **Given:** Recently played has 10 tracks
- **When:** addToRecentlyPlayed(NEW)
- **Then:** Recently played has 10 tracks
- **And:** NEW is at index 0
- **And:** Oldest track is removed

#### Scenario: Persists to localStorage
- **Given:** Any state
- **When:** addToRecentlyPlayed(track)
- **Then:** localStorage.setItem called with correct key

---

### 9.2 Initial Load

#### Scenario: Loads from localStorage on mount
- **Given:** localStorage has saved tracks
- **When:** Hook mounts
- **Then:** recentTracks initialized from localStorage

#### Scenario: Handles empty localStorage
- **Given:** localStorage is empty
- **When:** Hook mounts
- **Then:** recentTracks is []

#### Scenario: Handles corrupted localStorage
- **Given:** localStorage has invalid JSON
- **When:** Hook mounts
- **Then:** recentTracks is [] (graceful fallback)

---

## 10. useSearch Hook Tests

### 10.1 Search Execution

#### Scenario: Search calls API with debounced value
- **Given:** useDebounce returns "debounced"
- **When:** useSearch("original") is called
- **Then:** API called with "debounced"

#### Scenario: Search returns tracks only
- **Given:** Valid search query
- **When:** useSearch("Thunder") is called
- **Then:** tracks array is returned
- **And:** No artists or albums arrays

#### Scenario: Empty query returns empty results
- **Given:** Query is empty string
- **When:** useSearch("") is called
- **Then:** tracks is []
- **And:** API is NOT called

#### Scenario: Whitespace query returns empty results
- **Given:** Query is "   "
- **When:** useSearch is called
- **Then:** tracks is []
- **And:** API is NOT called

#### Scenario: isLoading is true during fetch
- **Given:** API is pending
- **When:** useSearch is called
- **Then:** isLoading is true
- **And:** After resolve, isLoading is false

#### Scenario: Error sets error state
- **Given:** API rejects with Error("Network error")
- **When:** useSearch is called
- **Then:** error is "Network error"
- **And:** tracks is []

#### Scenario: Non-Error exception gets generic message
- **Given:** API rejects with string
- **When:** useSearch is called
- **Then:** error is "Search failed"

#### Scenario: Error clears when query becomes empty
- **Given:** error is "Network error"
- **When:** Query changes to ""
- **Then:** error is null
- **And:** tracks is []

### 10.2 Search Dropdown Interactions

#### Scenario: Click on search result navigates to track detail
- **Given:** Search dropdown shows track results
- **When:** User clicks on a track result
- **Then:** Navigate to /track/:id
- **And:** Dropdown closes

#### Scenario: Enter key triggers immediate search
- **Given:** User is typing in search input
- **When:** Enter key is pressed
- **Then:** Search executes immediately (bypasses debounce)

#### Scenario: Escape key closes dropdown
- **Given:** Search dropdown is open with results
- **When:** Escape key is pressed
- **Then:** Dropdown closes
- **And:** Search input remains focused

#### Scenario: Click outside closes dropdown
- **Given:** Search dropdown is open with results
- **When:** User clicks outside the dropdown
- **Then:** Dropdown closes

---

## 11. useDebounce Hook Tests

### 11.1 Debounce Behavior

#### Scenario: Returns initial value immediately
- **Given:** Initial value "hello"
- **When:** Hook mounts
- **Then:** Returns "hello"

#### Scenario: Delays value updates
- **Given:** Value changes from "hello" to "world"
- **And:** Delay is 300ms
- **When:** Less than 300ms has passed
- **Then:** Returns "hello"
- **And:** After 300ms, returns "world"

#### Scenario: Resets timer on rapid changes
- **Given:** Delay is 300ms
- **When:** Value changes A→B at 0ms, B→C at 100ms, C→D at 200ms
- **Then:** After 500ms (200+300), returns "D"
- **And:** "B" and "C" were never returned

---

## 12. Playlist Service API Tests

### 12.1 reorderTracks

#### Scenario: Calls correct endpoint
- **When:** reorderTracks("playlist-123", ["a", "b", "c"])
- **Then:** PATCH /playlists/playlist-123/reorder
- **And:** Body is { trackIds: ["a", "b", "c"] }

#### Scenario: Propagates API errors
- **Given:** API returns error
- **When:** reorderTracks is called
- **Then:** Error is thrown

---

### 12.2 addTrack

#### Scenario: Calls correct endpoint
- **When:** addTrack("playlist-123", "track-456")
- **Then:** POST /playlists/playlist-123/tracks
- **And:** Body is { trackId: "track-456" }

---

### 12.3 removeTrack

#### Scenario: Calls correct endpoint
- **When:** removeTrack("playlist-123", "track-456")
- **Then:** DELETE /playlists/playlist-123/tracks/track-456

---

## 13. useLocalStorage Hook Tests

**Test Location:** `frontend/__tests__/others/useLocalStorage.test.ts`

### 13.1 Initial State

#### Scenario: Returns initial value when localStorage is empty
- **Given:** localStorage has no value for "test-key"
- **When:** useLocalStorage("test-key", "default") is called
- **Then:** Returns "default"

#### Scenario: Returns stored value when localStorage has data
- **Given:** localStorage has "stored-value" for "test-key"
- **When:** useLocalStorage("test-key", "default") is called
- **Then:** Returns "stored-value"

#### Scenario: Handles object values from localStorage
- **Given:** localStorage has serialized object { name: "test", count: 42 }
- **When:** Hook reads the value
- **Then:** Returns parsed object with correct properties

#### Scenario: Handles array values from localStorage
- **Given:** localStorage has serialized array [1, 2, 3]
- **When:** Hook reads the value
- **Then:** Returns parsed array

---

### 13.2 setValue

#### Scenario: Updates state and localStorage
- **Given:** Initial value "initial"
- **When:** setValue("updated") is called
- **Then:** State becomes "updated"
- **And:** localStorage contains "updated"

#### Scenario: Handles function updater
- **Given:** Initial value 0
- **When:** setValue((prev) => prev + 1) is called
- **Then:** State becomes 1

#### Scenario: Handles object updates
- **Given:** Initial value { count: 0 }
- **When:** setValue({ count: 10 }) is called
- **Then:** State and localStorage both contain { count: 10 }

---

### 13.3 Error Handling

#### Scenario: Returns initial value when localStorage has invalid JSON
- **Given:** localStorage has "invalid-json{" for key
- **When:** Hook reads the value
- **Then:** Returns initial value (graceful fallback)

#### Scenario: Handles localStorage getItem throwing
- **Given:** localStorage.getItem throws QuotaExceeded error
- **When:** Hook tries to read
- **Then:** Returns initial value (graceful fallback)

#### Scenario: Handles localStorage setItem throwing
- **Given:** localStorage.setItem throws QuotaExceeded error
- **When:** setValue is called
- **Then:** State still updates (in-memory)
- **And:** No error thrown to user

---

### 13.4 Cross-tab Synchronization

#### Scenario: Updates state when storage event fires
- **Given:** Hook has value "initial"
- **When:** Storage event fires with newValue "from-other-tab"
- **Then:** State becomes "from-other-tab"

#### Scenario: Ignores storage events for different keys
- **Given:** Hook uses key "my-key"
- **When:** Storage event fires for key "other-key"
- **Then:** State unchanged

#### Scenario: Resets to initial value when storage is cleared
- **Given:** Hook has stored value
- **When:** Storage event fires with newValue null
- **Then:** State resets to initial value

---

### 13.5 Cleanup

#### Scenario: Removes storage event listener on unmount
- **Given:** Hook is mounted
- **When:** Component unmounts
- **Then:** removeEventListener called for "storage" event

---

## 14. useToast Hook Tests

**Test Location:** `frontend/__tests__/others/useToast.test.tsx`

### 14.1 addToast

#### Scenario: Adds a toast to the list
- **Given:** Empty toast list
- **When:** addToast({ message: "Test", type: "info" })
- **Then:** toasts array has 1 item
- **And:** Toast has correct message and type

#### Scenario: Generates unique IDs for toasts
- **Given:** Empty toast list
- **When:** Two toasts are added
- **Then:** Each toast has unique ID

#### Scenario: Supports different toast types
- **Given:** Empty toast list
- **When:** Toasts with types "success", "error", "warning", "info" are added
- **Then:** Each toast has correct type property

---

### 14.2 removeToast

#### Scenario: Removes a toast by ID
- **Given:** Toast list has 1 toast with known ID
- **When:** removeToast(id) is called
- **Then:** toasts array is empty

#### Scenario: Only removes the specified toast
- **Given:** Toast list has 3 toasts
- **When:** removeToast(middleToastId) is called
- **Then:** toasts array has 2 toasts
- **And:** Middle toast is not in array

---

### 14.3 Auto-dismiss

#### Scenario: Auto-dismisses toasts after duration
- **Given:** Toast added with duration 3000ms
- **When:** 3000ms passes
- **Then:** Toast is automatically removed

#### Scenario: Uses default duration if not specified
- **Given:** Toast added without duration
- **When:** 5000ms (default) passes
- **Then:** Toast is automatically removed

---

### 14.4 Error Handling

#### Scenario: Throws when used outside ToastProvider
- **Given:** No ToastProvider wrapper
- **When:** useToast() is called
- **Then:** Throws "useToast must be used within a ToastProvider"

---

## Summary

| Area | Scenario Count | Test Location |
|------|----------------|---------------|
| Auth Service | 15 | `backend/__tests__/others/auth.service.test.ts` |
| Tracks Service | 15 | `backend/__tests__/others/tracks.service.test.ts` |
| Albums Service | 8 | `backend/__tests__/others/albums.service.test.ts` |
| Artists Service | 6 | `backend/__tests__/others/artists.service.test.ts` |
| Playlists Service | 28 | `backend/__tests__/others/playlists.service.test.ts` |
| Search Service | 4 | `__tests__/task3/search.service.test.ts` |
| Player Reducer | 45+ | `__tests__/task2/playerReducer.test.ts` |
| usePlaylistOperations | 8 | `__tests__/task1/usePlaylistOperations.test.ts` |
| useRecentlyPlayed | 7 | `frontend/__tests__/others/useRecentlyPlayed.test.ts` |
| useSearch | 8 | `__tests__/task3/useSearch.test.ts` |
| useDebounce | 3 | `frontend/__tests__/others/useDebounce.test.ts` |
| Playlist Service API | 4 | `frontend/__tests__/others/` |
| useLocalStorage | 14 | `frontend/__tests__/others/useLocalStorage.test.ts` |
| useToast | 8 | `frontend/__tests__/others/useToast.test.tsx` |
| **Total** | **175+** |
