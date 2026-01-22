# Melodio - Detailed Feature List (SOLUTION-PROD)

## Overview

This document provides a comprehensive breakdown of all features in the Melodio music streaming application. Each feature includes business logic explanations, user flows, acceptance criteria, data models, API endpoints, and edge cases.

**Document Version:** Solution Production Branch
**Status:** All features fully functional, no bugs
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
| Tone            | Modern, sleek, music-focused                                                      |
| Palette         | Deep blacks, dark grays, Spotify green accents, white text                        |

---

## 1. Authentication System

### 1.1 User Registration

**Description:** Allows new users to create an account.

**Business Logic:**

- Email must be unique (case-insensitive, stored lowercase)
- Username must be unique
- Password minimum length: 6 characters
- Password hashed using bcrypt with 10 salt rounds
- JWT token generated upon successful registration
- Token contains: userId, email, username
- Token expiration: 7 days

**User Flow:**

1. User navigates to `/register`
2. User enters email, username, password, display name
3. System validates uniqueness of email and username
4. System hashes password and creates user account
5. System returns JWT token and user data
6. User is redirected to home page

**Validation Rules:**

- Email: Valid email format (RFC 5322), unique, case-insensitive
- Username: Non-empty, unique
- Password: Minimum 6 characters
- Display Name: Non-empty, 2-50 characters

**Error Scenarios:**

- Email already registered → 409 Conflict
- Username already taken → 409 Conflict
- Invalid email format → 400 Bad Request
- Password less than 6 characters → 400 Bad Request
- Missing required fields → 400 Bad Request
- Database error → 500 Internal Server Error

**Data Initialization:**

```typescript
{
  email: "user@example.com",
  passwordHash: "<bcrypt_hash>",
  username: "johndoe",
  displayName: "John Doe",
  avatarUrl: null,
  createdAt: "2024-01-07T10:00:00Z",
  updatedAt: "2024-01-07T10:00:00Z"
}
```

---

### 1.2 User Login

**Description:** Authenticates existing users and returns JWT token.

**Business Logic:**

- Email lookup is case-insensitive
- Password verified against bcrypt hash
- Returns JWT token with 7-day expiration
- Invalid credentials return generic error (security best practice)
- Token includes userId and email claims

**User Flow:**

1. User navigates to `/login`
2. User enters email and password
3. System validates credentials
4. System returns JWT token and user data
5. User is redirected to home page

**Validation Rules:**

- Email and password are required
- Email must be valid format
- Password must match stored hash

**Error Scenarios:**

- Invalid email or password → 401 Unauthorized (generic message)
- Missing required fields → 400 Bad Request
- Email not found → 401 Unauthorized (generic message)
- Database error → 500 Internal Server Error

**Response on Success:**

```json
{
  "token": "<jwt_token>",
  "user": {
    "_id": "user123",
    "email": "user@example.com",
    "username": "johndoe",
    "displayName": "John Doe"
  }
}
```

---

### 1.3 Session Management

**Description:** Maintains user session across page refreshes using JWT tokens.

**Business Logic:**

- JWT stored in localStorage (key: `melodio_auth_token`)
- On app mount, check for existing token
- If token exists, validate with `/auth/me` endpoint
- If token invalid/expired, clear localStorage and redirect to login
- All API requests include `Authorization: Bearer <token>` header
- Token expiration triggers automatic logout
- Header displays **first word of displayName** (not username)

**User Flow:**

1. App loads
2. Check localStorage for `melodio_auth_token`
3. If found, call `/auth/me` to validate and fetch user data
4. If valid:
   - User remains logged in
   - Set user context/state with user data
5. If invalid/expired:
   - Clear localStorage
   - Redirect to `/login`

**Edge Cases:**

- Token expires during user session → Logout and redirect
- Multiple tabs open → All tabs share same localStorage (synchronized)
- Token tampered with → Validation fails, logout triggers
- Network error during `/auth/me` → Show error, allow retry

---

### 1.4 Logout

**Description:** Ends user session and clears authentication tokens.

**Business Logic:**

- Clear JWT from localStorage (key: `melodio_auth_token`)
- Clear user state from AuthContext
- Redirect to login page

**User Flow:**

1. User clicks logout button in header dropdown
2. Logout handler executed:
   - Remove token from localStorage
   - Clear user state
3. Redirect to `/login`

---

### 1.5 Validate Token (GET /auth/me)

**Description:** Validates JWT token and returns current user data.

**Business Logic:**

- Extract token from Authorization header: `Bearer <token>`
- Verify token signature and expiration
- Fetch user from database by userId (from token claims)
- Return user object without sensitive fields (no password hash)

**Validation Rules:**

- Authorization header must be present
- Token must be valid JWT format
- Token must not be expired
- User must exist in database

**Error Scenarios:**

- Missing Authorization header → 401 Unauthorized
- Invalid token format → 401 Unauthorized
- Expired token → 401 Unauthorized
- User not found (token valid but user deleted) → 401 Unauthorized
- Malformed token → 401 Unauthorized

**Response on Success:**

```json
{
  "_id": "user123",
  "email": "user@example.com",
  "username": "johndoe",
  "displayName": "John Doe",
  "avatarUrl": null,
  "createdAt": "2024-01-07T10:00:00Z"
}
```

---

## 2. Music Catalog Browsing

### 2.1 Home Page

**Description:** Landing page showing curated content sections.

**Business Logic:**

- Requires authentication
- Tracks fetched with artist and album populated
- Albums fetched with artist populated
- Playlists filtered by current user's ownerId

**Sections Displayed:**

- "Recommended for you" - Track cards (10 tracks)
- "Browse Albums" - Album cards (10 albums)
- "Browse Tracks" - Track cards (20 tracks)
- "Your Playlists" - User's playlist cards

**Layout:**

- Desktop: **7 track cards per row**
- Mobile: Single column layout

**User Flow:**

1. User navigates to `/` (home)
2. System fetches tracks, albums, and user playlists
3. System displays sections with cards
4. User can click on any card to view details

**Edge Cases:**

- No tracks in database → Show empty state message
- No user playlists → Show "Create your first playlist" message
- Track image missing → Show placeholder image

---

### 2.2 Browse All Tracks

**Description:** Display all tracks with pagination.

**Business Logic:**

- Fetch tracks paginated (default: 20 per page)
- Each track displays: title, artist, album, duration, cover image
- Tracks sorted by creation order
- Includes populated artist and album data

**User Flow:**

1. User navigates to tracks section
2. System fetches tracks from `/tracks`
3. System displays track cards in grid layout
4. User clicks on track to view details or play

**Display Requirements:**

- Desktop: Grid layout (7 tracks per row)
- Mobile: Single column layout
- Track cards show: cover image, title, artist name, duration
- Hover state shows play button overlay

---

### 2.3 GET /tracks Endpoint

**Description:** Fetch all tracks with pagination and filters.

**Request:**

```
GET /tracks
GET /tracks?page=1&limit=20
GET /tracks?genre=rock
GET /tracks?artistId=artist123
GET /tracks?albumId=album123
Authorization: Bearer <token>
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `genre` (optional): Filter by genre (case-insensitive)
- `artistId` (optional): Filter by artist
- `albumId` (optional): Filter by album

**Response (200 OK):**

```json
{
  "tracks": [
    {
      "id": "track001",
      "title": "Thunder Road",
      "durationInSeconds": 289,
      "trackNumber": 1,
      "genre": "rock",
      "playCount": 1500,
      "coverImageUrl": "/images/tracks/track001.jpg",
      "artist": {
        "id": "artist001",
        "name": "Bruce Springsteen",
        "imageUrl": "/images/artists/artist001.jpg"
      },
      "album": {
        "id": "album001",
        "title": "Born to Run",
        "coverImageUrl": "/images/albums/album001.jpg"
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

**Data Model:**

```typescript
Track {
  _id: ObjectId,
  title: string (2-100 chars),
  durationInSeconds: number (positive integer),
  trackNumber: number (positive integer),
  genre: string (e.g., "rock", "pop", "jazz", "electronic", "hip-hop"),
  playCount: number (default 0),
  coverImageUrl: string (URL to image file),
  artist_id: ObjectId (foreign key to Artist),
  album_id: ObjectId (foreign key to Album),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Error Scenarios:**

- No tracks found → Return empty array with pagination
- Database error → 500 Internal Server Error

---

### 2.4 Genre Page

**Description:** Browse tracks filtered by genre.

**Available Genres:**

- rock, pop, jazz, electronic, hip-hop

**Visual:**

- Genre cards display with **images** (not solid colors)

**Business Logic:**

- Displays all unique genres from track collection
- Clicking genre filters tracks by that genre
- Tracks returned paginated (default: 20 per page)

**User Flow:**

1. User navigates to `/genre`
2. System displays genre cards with images
3. User clicks a genre
4. System displays tracks of that genre

**Edge Cases:**

- Genre with no tracks → Show empty state message
- Invalid genre parameter → Show all tracks

---

### 2.5 Album Detail Page

**Description:** View album details and track listing.

**Route:** `/album/:id`

**Displayed Information:**

- Album cover image
- Album title
- Artist name (linked)
- Release date
- Total tracks
- Track listing with:
  - Track number
  - Track title
  - Duration
  - Play button
  - Add to playlist button

**Visual:**

- **Gradient background** on detail page
- Mobile-responsive layout

**Business Logic:**

- Fetch album by ID with artist populated
- Fetch tracks by albumId, sorted by trackNumber
- Play button starts playback of entire album from selected track

**User Flow:**

1. User clicks on album card
2. System navigates to `/album/:id`
3. System fetches album details and tracks
4. User can play individual track or entire album
5. User can add tracks to playlist

---

### 2.6 Track Detail Page

**Description:** View individual track details.

**Route:** `/track/:id`

**Displayed Information:**

- Track cover image (**unique image per track**)
- Track title
- Artist name (linked)
- Album title (linked)
- Duration
- Genre
- Play count
- Play button
- Add to queue button
- Add to playlist button

**Visual:**

- **Gradient background** on detail page
- Mobile-responsive layout

---

## 3. Music Player

### 3.1 Playback Simulation

**Description:** Simulates music playback using timers (no actual audio).

**Business Logic:**

- When track plays, start 1-second interval timer
- `elapsedSeconds` increments by 1 each tick
- When `elapsedSeconds >= track.durationInSeconds`:
  - Track is "complete"
  - Behavior depends on repeat mode
  - Auto-advance to next track (if applicable)
- Pausing stops the timer
- Resuming continues from paused position

**State Properties:**

```typescript
PlayerState {
  currentTrack: Track | null,
  queue: Track[],
  queueIndex: number,
  isPlaying: boolean,
  elapsedSeconds: number,
  volume: number (0-100),
  shuffleEnabled: boolean,
  repeatMode: 'off' | 'all' | 'one',
  originalQueue: Track[],
  isQueueOpen: boolean
}
```

---

### 3.2 Play/Pause Controls

**Description:** Toggle playback state.

**Business Logic:**

- Play: Set `isPlaying = true`, start timer
- Pause: Set `isPlaying = false`, stop timer
- State persists `elapsedSeconds` across pause/resume

**User Actions:**

- Click play button → RESUME action
- Click pause button → PAUSE action
- Spacebar key → Toggle play/pause

---

### 3.3 Next/Previous Navigation

**Description:** Navigate between tracks in queue.

**NEXT Business Logic:**

- If queue is empty, no action
- If at last track:
  - If `repeatMode === 'all'`: Go to first track (index 0)
  - Else: Stop playback, reset `elapsedSeconds = 0`
- Otherwise: Advance `queueIndex` by 1
- Reset `elapsedSeconds = 0`
- Update `currentTrack` to queue[queueIndex]

**PREVIOUS Business Logic:**

- If queue is empty, no action
- If `elapsedSeconds > 3`: Restart current track (set `elapsedSeconds = 0`)
- If `elapsedSeconds <= 3`: Go to previous track
- At first track, stay at first track (index 0)
- Reset `elapsedSeconds = 0`

---

### 3.4 Seek/Progress Bar

**Description:** Jump to specific position in track.

**Business Logic:**

- SEEK action sets `elapsedSeconds` to specified value
- Value clamped to `0` to `track.durationInSeconds`
- Progress bar shows `elapsedSeconds / durationInSeconds` ratio

**User Interaction:**

- Click on progress bar → Seek to clicked position
- Drag progress handle → Seek while dragging

---

### 3.5 Volume Control

**Description:** Adjust playback volume (visual only).

**Business Logic:**

- SET_VOLUME action sets volume (0-100)
- Value clamped to valid range
- Volume slider reflects current value
- Note: No actual audio, volume is display-only

---

### 3.6 Shuffle Mode

**Description:** Randomize queue order while preserving current track position.

**Enable Shuffle Business Logic:**

1. Store current queue order in `originalQueue`
2. Keep current track at index 0
3. Shuffle remaining tracks (Fisher-Yates algorithm)
4. Set `queueIndex = 0` (current track now at front)
5. Set `shuffleEnabled = true`

**Disable Shuffle Business Logic:**

1. Restore queue from `originalQueue`
2. Find current track's position in original queue
3. Set `queueIndex` to that position
4. Clear `originalQueue`
5. Set `shuffleEnabled = false`

**Edge Cases:**

- Queue with 1 or 0 tracks: Enable shuffle flag but don't modify queue
- No current track: Enable flag, store empty originalQueue

**Pre-computed Shuffle (React StrictMode Compatibility):**

- Shuffle computation can be done at component level
- Pass pre-computed `shuffledQueue` in action payload
- Reducer uses payload if provided, else computes internally

---

### 3.7 Repeat Mode

**Description:** Control behavior at end of queue.

**Modes (cycle order):**

1. `'off'`: Stop at end of queue
2. `'all'`: Loop entire queue (go to first track after last)
3. `'one'`: Repeat current track indefinitely

**TOGGLE_REPEAT Logic:**

- Cycle: off → all → one → off

**TICK Behavior by Mode:**

- `'off'`: At end of last track, stop playback
- `'all'`: At end of last track, go to first track
- `'one'`: At end of track, restart same track (elapsedSeconds = 0)

---

### 3.8 TICK Action (Timer)

**Description:** Handles playback timer tick every second.

**Business Logic:**

- If not playing or no current track, return state unchanged
- Increment `elapsedSeconds` by 1
- If track ends (`elapsedSeconds >= durationInSeconds`):
  - If `repeatMode === 'one'`: Reset to 0, keep playing same track
  - If at last track and `repeatMode === 'all'`: Go to first track
  - If at last track and `repeatMode === 'off'`: Stop playback
  - Otherwise: Advance to next track

**Code:**

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

### 4.1 View Queue

**Description:** Display current playback queue.

**Displayed Information:**

- List of tracks in queue order
- Current track highlighted
- Track info: title, artist, duration
- Each track has remove button and drag handle

**User Action:**

- Click queue button in player bar to toggle panel

---

### 4.2 Add to Queue

**Description:** Add track to end of queue.

**Business Logic:**

- ADD_TO_QUEUE action appends track to queue array
- Does not affect current playback position
- Does not deduplicate (same track can be in queue multiple times)

---

### 4.3 Remove from Queue

**Description:** Remove track from queue by index.

**Business Logic (REMOVE_FROM_QUEUE):**

1. Remove track at specified index
2. Adjust `queueIndex` if needed:
   - If removed index < queueIndex: Decrement queueIndex
   - If removed index === queueIndex:
     - If queue now empty: Clear currentTrack, stop playback
     - Else: Keep queueIndex (or clamp to queue length - 1)
3. Update `currentTrack` to new queue[queueIndex]

---

### 4.4 Reorder Queue (Drag & Drop)

**Description:** Reorder tracks via drag-and-drop.

**Business Logic (REORDER_QUEUE):**

1. Receive `from` and `to` indices
2. Remove track from `from` position
3. Insert at `to` position
4. Adjust `queueIndex`:
   - If moving current track: queueIndex = to
   - If from < queueIndex and to >= queueIndex: queueIndex--
   - If from > queueIndex and to <= queueIndex: queueIndex++

---

### 4.5 Clear Queue

**Description:** Remove all tracks except current.

**Business Logic (CLEAR_QUEUE):**

- If currentTrack exists: queue = [currentTrack], queueIndex = 0
- If no currentTrack: queue = [], queueIndex = 0
- Reset shuffleEnabled = false
- Clear originalQueue = []

---

## 5. Playlist Management

### 5.1 View User Playlists

**Description:** List all playlists owned by current user.

**Business Logic:**

- GET /playlists returns playlists where ownerId === currentUserId
- Sorted by updatedAt descending (most recent first)

**Displayed in:**

- Sidebar (compact view with name and track count)
- Home page "Your Playlists" section (card view)

---

### 5.2 Create Playlist

**Description:** Create a new empty playlist.

**Input Fields:**

- Name (required)
- Description (optional)
- isPublic (default: true)

**Business Logic:**

- POST /playlists with name, description, isPublic
- ownerId set from JWT token
- trackIds initialized as empty array
- Returns created playlist

**User Flow:**

1. Click "Create playlist" button in sidebar
2. Modal/dialog opens
3. Enter playlist name
4. Click create
5. New playlist appears in sidebar

---

### 5.3 View Playlist Detail

**Description:** View playlist with all tracks.

**Route:** `/playlist/:id`

**Displayed Information:**

- Playlist name
- Description
- Track count
- Total duration
- Track list with:
  - Track number in playlist
  - Track title
  - Artist name
  - Album name
  - Duration
  - Play button
  - Remove button
  - Drag handle (for reorder)

**Empty State:**

- Empty playlist displays **placeholder message**: "Add tracks to your playlist"

**Business Logic:**

- GET /playlists/:id returns playlist with trackIds populated
- Population includes track.artistId and track.albumId
- Private playlist only accessible by owner

**Access Control:**

- Public playlists: Anyone can view
- Private playlists: Only owner can view
- Non-owner accessing private playlist → 403 Forbidden

---

### 5.4 Edit Playlist

**Description:** Update playlist name, description, or visibility.

**Business Logic:**

- PATCH /playlists/:id with updated fields
- Only owner can update
- Partial updates supported

**Error Scenarios:**

- Not owner → 403 Forbidden
- Playlist not found → 404 Not Found

---

### 5.5 Delete Playlist

**Description:** Permanently remove playlist.

**Business Logic:**

- DELETE /playlists/:id
- Only owner can delete
- Returns 204 No Content on success

---

### 5.6 Add Track to Playlist

**Description:** Add a track to a playlist.

**Business Logic:**

- POST /playlists/:id/tracks with { trackId }
- Track added to end of trackIds array
- Duplicate prevention: If trackId already exists, no action taken
- Only owner can add tracks

**User Flow:**

1. On track card, click menu → "Add to playlist"
2. Modal shows user's playlists
3. User clicks playlist
4. Track added, toast confirmation shown

---

### 5.7 Remove Track from Playlist

**Description:** Remove a track from a playlist.

**Business Logic:**

- DELETE /playlists/:id/tracks/:trackId
- Track removed from trackIds array
- Only owner can remove tracks
- Returns updated playlist

**Optimistic Update Pattern:**

1. Immediately update UI with track removed
2. Send API request
3. If API fails, rollback to previous state
4. Show error toast on failure

**Code (usePlaylistOperations hook):**

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

---

### 5.8 Reorder Tracks in Playlist

**Description:** Change track order via drag-and-drop.

**Business Logic:**

- PATCH /playlists/:id/reorder with { trackIds: [...] }
- New trackIds array must contain same IDs, different order
- Only owner can reorder

**Optimistic Update Pattern:**

1. Immediately update UI with new order
2. Send API request
3. If API fails, rollback to previous order
4. Show error toast on failure

---

## 6. Search

### 6.1 Search Input

**Description:** Search bar in top navigation header.

**UI Behavior:**

- **Modal dropdown** below search input (not page navigation)
- Debounced input (300ms delay)
- Empty/whitespace queries return no results
- Results appear in dropdown below input

**Keyboard Interactions:**

- **Enter key**: Immediate search (bypass debounce)
- **Escape key**: Close dropdown
- **Click outside**: Close dropdown

---

### 6.2 Search Results

**Description:** Search returns **tracks only** (not albums/artists in dropdown).

**API:** GET /tracks/search?q=query

**Response Structure:**

```json
[
  {
    "id": "track001",
    "title": "Thunder Road",
    "durationInSeconds": 289,
    "artist": { "id": "artist001", "name": "Bruce Springsteen" },
    "album": { "id": "album001", "title": "Born to Run" }
  }
]
```

**Search Logic:**

- Tracks: **Prefix-based** title match (not exact match)
- Case-insensitive matching
- Maximum 5 results returned

**Dropdown Display:**

- Shows matching tracks only
- Each result shows: track title, artist name, album cover thumbnail
- **Click behavior**: Navigate to track detail page (`/track/:id`)

---

### 6.3 Backend Search Implementation

**Description:** Server-side search logic in tracks.service.ts.

**Business Logic:**

- If query is empty or whitespace only, return empty array
- Perform prefix-based search on track title (case-insensitive)
- Also match exact genre
- Limit results to 5
- Populate artist and album data

**Code:**

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

### 6.4 Frontend Search Hook (useSearch)

**Description:** React hook for search functionality.

**Business Logic:**

- Uses useDebounce hook with 300ms delay
- Calls searchService.search() with debounced query
- Handles loading, error, and results states
- Empty/whitespace query clears results without API call
- Cancellation flag prevents stale results

**Code:**

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

## 7. Recently Played

### 7.1 Track Recently Played History

**Description:** Client-side history of recently played tracks.

**Business Logic:**

- Stored in localStorage (key: `melodio_clone_recently_played`)
- Maximum 10 tracks
- Most recent track at index 0
- Deduplication: Re-playing existing track moves it to front

**Add to Recently Played Logic:**

1. Check if track already in list (by _id)
2. If exists, remove from current position
3. Add track to front (index 0)
4. If length > 10, remove oldest (last item)
5. Persist to localStorage

---

## 8. UI/UX Features

### 8.1 Responsive Sidebar

**Description:** Collapsible sidebar navigation.

**Features:**

- Toggle collapse/expand with button
- Toggle icon positioned at **bottom-right corner** of sidebar
- Shows: Logo, Home link, Genre link, User playlists
- Collapsed state shows icons only with **equal vertical spacing**
- **Hide playlist section** when collapsed
- State managed in SidebarContext

**Responsive Behavior:**

- Desktop/Large screens: Expanded by default
- Mobile/Small screens: Collapsed by default (icons only)
- When collapsed, body content fills the space

---

### 8.2 Header

**Description:** Top navigation bar.

**Features:**

- Search bar visible on all pages
- Profile icon with user's **first name** (first word of displayName, not username)
- Logout option in dropdown menu

---

### 8.3 Player Bar

**Description:** Fixed music player at bottom of screen.

**Layout:**

- Fixed position at bottom (like Spotify)
- Center-aligned on mobile

**Desktop Features:**

- Full playback controls
- Progress bar with seek functionality
- Volume slider with white pointer

**Mobile Behavior:**

- **Hide volume bar** on mobile screens
- **Hide extra icons** on mobile screens
- Simplified, center-aligned controls

**Interactions:**

- Cursor: pointer on hover for all interactive elements
- Volume slider: properly aligned white pointer

---

### 8.4 Toast Notifications

**Description:** Feedback messages for user actions.

**Usage:**

- Success: Playlist created, track added, etc.
- Error: Failed operations, validation errors
- Auto-dismiss after timeout
- Uses shadcn/ui toast component

---

### 8.5 Loading States

**Description:** Visual feedback during async operations.

**Components:**

- LoadingSpinner: Centered spinner on form submit
- Skeleton: Placeholder content shape
- Button loading state: Disabled with spinner

---

### 8.6 Empty States

**Description:** Helpful messaging when no content.

**Scenarios:**

- No playlists: "Create your first playlist"
- Empty playlist: "Add tracks to your playlist"
- No search results: "No results found"
- Empty queue: "Queue is empty"

---

## Data Relationships Summary

```
User (1) ----< Playlist (*)
                  |
                  v
             Track (*) >---- Album (1) >---- Artist (1)
                  |
                  v
            Artist (1)
```

- User owns many Playlists
- Playlist contains ordered Track references
- Track belongs to one Album
- Track belongs to one Artist
- Album belongs to one Artist

---

## Out-of-Scope Features

The following features are explicitly **NOT** implemented in Melodio MVP:

| Feature                              | Status       | Reason                             |
| ------------------------------------ | ------------ | ---------------------------------- |
| Real audio playback                  | Out of scope | Audio not supported on HackerRank  |
| WebSocket live updates               | Out of scope | HackerRank platform limitation     |
| Email notifications                  | Out of scope | HackerRank platform limitation     |
| File uploads                         | Out of scope | HackerRank platform limitation     |
| Drag-and-drop queue reordering       | Out of scope | Jest/behavioral testing limitation |
| Discover Weekly / Recommendations    | Out of scope | MVP simplicity                     |
| Analytics Dashboard                  | Out of scope | MVP scope                          |
| Smart Queue                          | Out of scope | MVP scope                          |
| Trending Section                     | Out of scope | MVP scope                          |

---

## End of SOLUTION-PROD-FEATURE-LIST

**All features in this document are fully functional with no bugs.**
