# Spotify Clone — Technical Product Requirements Document

## Document Information

| Field | Value |
|-------|-------|
| Project | Spotify Clone for HackerRank Debugging Challenge |
| Version | 1.0 |
| Status | Approved for Development |

---

## 1. Project Overview

### 1.1 Purpose

Build a Spotify-like music streaming application that will serve as a debugging challenge on the HackerRank platform. The application will have two branches:

- **solution branch**: Fully working, bug-free implementation
- **question branch**: Same application with intentionally injected bugs for candidates to fix

### 1.2 Platform Constraints

The HackerRank platform has specific limitations that must be respected:

| Constraint | Impact |
|------------|--------|
| No audio playback | Music player must simulate playback using timers instead of actual audio |
| No email sending | No email-based features (password reset, notifications) |
| No WebSocket | No real-time features; all data fetching via REST API polling |
| No file upload | Playlist import feature is excluded |

### 1.3 Simulated Playback Model

Since actual audio cannot play, the player operates as follows:

- Each track has a `durationInSeconds` field in the database
- When a user clicks "play," a frontend timer starts incrementing `elapsedSeconds` by 1 every second
- When `elapsedSeconds` equals `durationInSeconds`, the track is considered complete, and the next track in the queue begins
- Pausing stops the timer; resuming continues from the paused position
- Seeking sets `elapsedSeconds` to the desired position directly

---

## 2. Technology Stack

### 2.1 Backend

| Component | Technology |
|-----------|------------|
| Runtime | Node.js (LTS version) |
| Framework | NestJS |
| Database | MongoDB |
| ODM | Mongoose |
| API Style | REST (JSON) |

### 2.2 Frontend

| Component | Technology |
|-----------|------------|
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS |
| State Management | React Context + useReducer (or Zustand if preferred) |
| HTTP Client | Fetch API or Axios |

### 2.3 Project Structure

The project should be a monorepo with the following structure:

```
spotify-clone/
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # Next.js frontend
├── packages/
│   └── shared/       # Shared types/interfaces (optional)
├── package.json
└── README.md
```

---

## 3. Database Schema

### 3.1 Collection: users

Stores user account information.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | Auto | Primary key |
| username | String | Yes | Unique username |
| email | String | Yes | Unique email address |
| passwordHash | String | Yes | Bcrypt-hashed password |
| displayName | String | Yes | Display name shown in UI |
| avatarUrl | String | No | URL to profile picture |
| createdAt | Date | Auto | Account creation timestamp |
| updatedAt | Date | Auto | Last update timestamp |

**Indexes:**
- Unique index on `email`
- Unique index on `username`

---

### 3.2 Collection: tracks

Stores all music tracks in the catalog.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | Auto | Primary key |
| title | String | Yes | Track title |
| artistId | ObjectId | Yes | Reference to artists collection |
| albumId | ObjectId | Yes | Reference to albums collection |
| durationInSeconds | Number | Yes | Track length in seconds |
| trackNumber | Number | Yes | Position in album (1-indexed) |
| genre | String | Yes | Primary genre (e.g., "rock", "jazz", "pop") |
| playCount | Number | Yes | Global play count (default: 0) |
| createdAt | Date | Auto | When track was added |

**Indexes:**
- Index on `artistId`
- Index on `albumId`
- Index on `genre`
- Text index on `title` for search

---

### 3.3 Collection: artists

Stores artist information.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | Auto | Primary key |
| name | String | Yes | Artist name |
| bio | String | No | Artist biography |
| imageUrl | String | No | Artist profile image URL |
| genres | [String] | Yes | List of genres associated with artist |
| followerCount | Number | Yes | Number of followers (default: 0) |
| createdAt | Date | Auto | When artist was added |

**Indexes:**
- Text index on `name` for search

---

### 3.4 Collection: albums

Stores album information.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | Auto | Primary key |
| title | String | Yes | Album title |
| artistId | ObjectId | Yes | Reference to artists collection |
| releaseDate | Date | Yes | Album release date |
| coverImageUrl | String | No | Album cover art URL |
| totalTracks | Number | Yes | Number of tracks in album |
| createdAt | Date | Auto | When album was added |

**Indexes:**
- Index on `artistId`
- Text index on `title` for search

---

### 3.5 Collection: playlists

Stores user-created playlists.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | Auto | Primary key |
| name | String | Yes | Playlist name |
| description | String | No | Playlist description |
| ownerId | ObjectId | Yes | Reference to users collection |
| trackIds | [ObjectId] | Yes | Ordered array of track references |
| coverImageUrl | String | No | Playlist cover image URL |
| isPublic | Boolean | Yes | Whether playlist is publicly visible (default: true) |
| createdAt | Date | Auto | Creation timestamp |
| updatedAt | Date | Auto | Last modification timestamp |

**Indexes:**
- Index on `ownerId`

**Note:** The order of `trackIds` array determines the track order in the playlist.

---

### 3.6 Collection: listeningHistory

Stores every track play event for analytics and recommendations.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | Auto | Primary key |
| userId | ObjectId | Yes | Reference to users collection |
| trackId | ObjectId | Yes | Reference to tracks collection |
| playedAt | Date | Yes | Timestamp when track was played |
| completedAt | Date | No | Timestamp when track finished (null if skipped early) |
| listenDurationSeconds | Number | Yes | How many seconds the user listened |

**Indexes:**
- Compound index on `userId` + `playedAt` (descending)
- Index on `trackId`
- Index on `playedAt` for trending calculations

**Business Rule:** A listening history entry is created when a user starts playing a track. The `completedAt` field is updated if the user listens to the entire track.

---

### 3.7 Collection: likedTracks

Stores user's liked (saved) tracks.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | Auto | Primary key |
| userId | ObjectId | Yes | Reference to users collection |
| trackId | ObjectId | Yes | Reference to tracks collection |
| likedAt | Date | Yes | Timestamp when track was liked |

**Indexes:**
- Compound unique index on `userId` + `trackId` (prevents duplicate likes)
- Index on `userId`

---

### 3.8 Collection: likedAlbums

Stores user's liked (saved) albums.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | Auto | Primary key |
| userId | ObjectId | Yes | Reference to users collection |
| albumId | ObjectId | Yes | Reference to albums collection |
| likedAt | Date | Yes | Timestamp when album was liked |

**Indexes:**
- Compound unique index on `userId` + `albumId`
- Index on `userId`

---

### 3.9 Collection: followedArtists

Stores which artists a user follows.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | Auto | Primary key |
| userId | ObjectId | Yes | Reference to users collection |
| artistId | ObjectId | Yes | Reference to artists collection |
| followedAt | Date | Yes | Timestamp when artist was followed |

**Indexes:**
- Compound unique index on `userId` + `artistId`
- Index on `userId`

---

## 4. Authentication

### 4.1 Authentication Flow

The application uses JWT-based authentication.

**Registration:**
1. User submits username, email, password, and displayName
2. Backend validates uniqueness of email and username
3. Password is hashed using bcrypt (salt rounds: 10)
4. User document is created
5. JWT access token is returned

**Login:**
1. User submits email and password
2. Backend finds user by email
3. Password is verified against stored hash
4. JWT access token is returned

**Token Structure:**
- Payload contains: userId, email, username
- Expiration: 7 days
- Signed with server-side secret

**Protected Routes:**
- All API routes except `/auth/register` and `/auth/login` require a valid JWT
- Token is sent in the `Authorization` header as `Bearer <token>`

### 4.2 Auth API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Create new user account |
| POST | /auth/login | Authenticate and receive token |
| GET | /auth/me | Get current user profile |

---

## 5. API Endpoints

All endpoints return JSON. Authenticated endpoints require `Authorization: Bearer <token>` header.

### 5.1 Tracks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /tracks | Get paginated list of all tracks |
| GET | /tracks/:id | Get single track by ID |
| GET | /tracks/search?q={query} | Search tracks by title |
| POST | /tracks/:id/play | Log a play event (creates listeningHistory entry) |

**GET /tracks Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 50)
- `genre` (optional filter)
- `artistId` (optional filter)
- `albumId` (optional filter)

---

### 5.2 Artists

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /artists | Get paginated list of all artists |
| GET | /artists/:id | Get single artist by ID |
| GET | /artists/:id/tracks | Get all tracks by artist |
| GET | /artists/:id/albums | Get all albums by artist |
| GET | /artists/search?q={query} | Search artists by name |

---

### 5.3 Albums

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /albums | Get paginated list of all albums |
| GET | /albums/:id | Get single album by ID with all tracks |
| GET | /albums/search?q={query} | Search albums by title |

**GET /albums/:id Response:**
- Includes album metadata
- Includes array of tracks sorted by `trackNumber`

---

### 5.4 Playlists

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /playlists | Get all playlists owned by current user |
| GET | /playlists/:id | Get single playlist with populated tracks |
| POST | /playlists | Create new playlist |
| PATCH | /playlists/:id | Update playlist (name, description) |
| DELETE | /playlists/:id | Delete playlist |
| POST | /playlists/:id/tracks | Add track to playlist |
| DELETE | /playlists/:id/tracks/:trackId | Remove track from playlist |
| PATCH | /playlists/:id/reorder | Reorder tracks in playlist |

**POST /playlists Request Body:**
- `name` (required): Playlist name
- `description` (optional): Playlist description

**POST /playlists/:id/tracks Request Body:**
- `trackId` (required): ID of track to add

**PATCH /playlists/:id/reorder Request Body:**
- `trackIds` (required): Complete array of track IDs in new order

**Authorization:** Users can only modify their own playlists.

---

### 5.5 Library (Likes/Follows)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /library/tracks | Get all liked tracks for current user |
| POST | /library/tracks/:trackId | Like a track |
| DELETE | /library/tracks/:trackId | Unlike a track |
| GET | /library/tracks/:trackId/status | Check if track is liked |
| GET | /library/albums | Get all liked albums for current user |
| POST | /library/albums/:albumId | Like an album |
| DELETE | /library/albums/:albumId | Unlike an album |
| GET | /library/artists | Get all followed artists for current user |
| POST | /library/artists/:artistId | Follow an artist |
| DELETE | /library/artists/:artistId | Unfollow an artist |

---

### 5.6 Search (Unified)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /search?q={query} | Search across tracks, albums, and artists |

**Response Structure:**
Returns an object with three arrays:
- `tracks`: Array of matching tracks (limit 5)
- `albums`: Array of matching albums (limit 5)
- `artists`: Array of matching artists (limit 5)

Search uses MongoDB text indexes and matches against:
- Track titles
- Album titles
- Artist names

---

### 5.7 Discover Weekly (Recommendations)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /discover-weekly | Get personalized playlist for current user |

**Algorithm:**
1. Get user's top 5 genres from listening history (last 30 days)
2. Get user's top 5 artists from listening history (last 30 days)
3. Find tracks that match these genres or artists
4. Exclude tracks the user has already played
5. Return 30 tracks, shuffled for variety

**Response:**
- Array of 30 track objects (or fewer if catalog is limited)
- Includes full track details with artist and album populated

---

### 5.8 Listening Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /analytics/stats | Get listening statistics for current user |

**Response Structure:**

| Field | Type | Description |
|-------|------|-------------|
| topArtists | Array | Top 5 artists by play count |
| topGenres | Array | Top 5 genres by play count |
| totalListeningTimeMinutes | Number | Sum of all listening duration |
| listeningByDayOfWeek | Object | Play counts grouped by day (0=Sunday, 6=Saturday) |
| currentStreak | Number | Consecutive days with at least one play |
| longestStreak | Number | Longest consecutive days streak ever |

**Streak Calculation Logic:**
- A "day" is defined as a calendar day in UTC
- A streak continues if the user played at least one track on consecutive days
- The current streak counts backward from today
- If user did not play anything today, check if they played yesterday (streak may still be active)

---

### 5.9 Smart Queue Recommendations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /recommendations/queue?trackId={id} | Get recommended next tracks |

**Algorithm Priority:**
1. **Same album, next track**: If current track is from an album and not the last track, recommend the next track by `trackNumber`
2. **Same artist, different album**: Other tracks by the same artist the user hasn't recently played
3. **Same genre**: Tracks in the same genre from different artists
4. **Globally popular**: Fall back to high play count tracks if other criteria don't yield enough results

**Response:**
- Array of exactly 5 track objects
- Excludes the current track
- Excludes tracks already in user's queue (queue passed as query param)

**Query Parameters:**
- `trackId` (required): Currently playing track ID
- `excludeTrackIds` (optional): Comma-separated IDs to exclude (current queue)

---

### 5.10 Trending Tracks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /trending | Get top 20 trending tracks |

**Algorithm:**
Time-decayed popularity score calculated as:

```
For each play of a track:
  daysAgo = (now - playedAt) in days
  score += 1 / (1 + daysAgo * 0.1)

Total score = sum of all play scores
```

- A play today contributes approximately 1.0 to the score
- A play 7 days ago contributes approximately 0.59
- A play 30 days ago contributes approximately 0.25

**Caching:**
- Results should be cached for 5 minutes to avoid expensive recalculation
- Cache key: `trending:global`
- Cache invalidation: TTL-based (5 minutes)

**Response:**
- Array of 20 track objects sorted by trending score (descending)
- Each track includes `trendingScore` field

---

## 6. Frontend Pages and Components

### 6.1 Page Structure

| Route | Page | Description |
|-------|------|-------------|
| / | Home | Landing page with trending and recommendations |
| /login | Login | Login form |
| /register | Register | Registration form |
| /search | Search | Search page with results |
| /library | Library | User's liked tracks, albums, followed artists |
| /playlist/:id | Playlist Detail | Single playlist view with tracks |
| /album/:id | Album Detail | Single album view with tracks |
| /artist/:id | Artist Detail | Artist page with discography |
| /discover-weekly | Discover Weekly | Personalized recommendations |
| /stats | Analytics | User listening statistics |
| /trending | Trending | Global trending leaderboard |

### 6.2 Core Components

**Player Bar (Persistent)**
- Fixed at bottom of viewport
- Displays current track info (title, artist, album art)
- Play/Pause button
- Previous/Next buttons
- Progress bar (clickable and draggable)
- Current time / Total duration display
- Volume slider (visual only, no actual audio)
- Shuffle toggle button
- Repeat toggle button (cycles: off → all → one)

**Queue Sidebar**
- Slides in from right side
- Shows current queue of tracks
- Each track has a remove button
- Tracks can be reordered via drag-and-drop
- "Clear Queue" button

**Navigation Sidebar**
- Fixed on left side
- Links to: Home, Search, Library, Discover Weekly, Stats, Trending
- User's playlists listed below main nav
- "Create Playlist" button

**Track Row Component**
- Used in playlists, albums, search results
- Displays: track number/index, title, artist, album, duration
- Play button on hover
- Heart icon to like/unlike
- "Add to Queue" option
- "Add to Playlist" option (opens submenu of user's playlists)

**Search Bar**
- Debounced input (300ms delay)
- Dropdown shows categorized results as user types
- Categories: Tracks, Albums, Artists
- Clicking result navigates to appropriate page

### 6.3 State Management

**Player State (Global)**
- `currentTrack`: Currently playing track object or null
- `queue`: Array of track objects in play order
- `queueIndex`: Current position in queue
- `isPlaying`: Boolean indicating playback state
- `elapsedSeconds`: Current playback position
- `shuffleEnabled`: Boolean for shuffle mode
- `repeatMode`: "off" | "all" | "one"

**Player Actions:**
- `play(track)`: Start playing a track, add to queue if not present
- `pause()`: Stop the timer
- `resume()`: Restart the timer
- `next()`: Advance to next track in queue
- `previous()`: Go to previous track or restart current
- `seek(seconds)`: Set elapsed time to specific position
- `addToQueue(track)`: Append track to end of queue
- `removeFromQueue(index)`: Remove track at index
- `reorderQueue(fromIndex, toIndex)`: Move track within queue
- `toggleShuffle()`: Enable/disable shuffle
- `toggleRepeat()`: Cycle repeat modes

**Shuffle Logic:**
- When shuffle is enabled, create a shuffled index mapping
- Original queue order is preserved; only playback order changes
- When shuffle is disabled, continue from current track in original order

**Repeat Logic:**
- `off`: Stop when queue ends
- `all`: Loop back to first track when queue ends
- `one`: Repeat the same track indefinitely

---

## 7. Feature Specifications

### 7.1 Feature: Simulated Music Player with Queue

**Description:**
A music player that simulates audio playback using timers. Provides all standard player controls.

**Functional Requirements:**

1. **Play/Pause**
   - Clicking play starts a 1-second interval timer that increments `elapsedSeconds`
   - Clicking pause clears the interval timer
   - UI updates to show correct button state

2. **Progress Tracking**
   - Progress bar width = (elapsedSeconds / durationInSeconds) * 100%
   - Time display format: "M:SS" (e.g., "3:45") or "H:MM:SS" for tracks over 1 hour
   - When elapsed equals duration, track is complete

3. **Track Completion**
   - When a track completes, check repeat mode:
     - If `repeatMode === "one"`: reset elapsedSeconds to 0, continue playing
     - If `repeatMode === "all"` and at end of queue: go to first track
     - If `repeatMode === "off"` and at end of queue: stop playback
     - Otherwise: advance to next track

4. **Skip Next**
   - Move to next track in queue (or shuffled order if shuffle enabled)
   - Reset elapsed to 0
   - If at end of queue and repeat is off, stop; if repeat all, go to first

5. **Skip Previous**
   - If elapsed > 3 seconds: restart current track (reset elapsed to 0)
   - If elapsed <= 3 seconds: go to previous track
   - If at first track: restart current track

6. **Seek**
   - User can click anywhere on progress bar to seek
   - User can drag the progress handle
   - Calculate target seconds from click/drag position
   - Update elapsedSeconds immediately
   - If paused, remain paused at new position

7. **Queue Management**
   - Display queue in sidebar
   - Remove track: removes from queue array, adjusts currentIndex if needed
   - Reorder: drag and drop changes position in queue array
   - If currently playing track is removed, advance to next

8. **Shuffle**
   - Toggle creates a shuffled mapping of queue indices
   - Current track remains current; shuffle affects what comes next
   - Toggling off returns to original order from current position

9. **Repeat Modes**
   - Visual indicator shows current mode
   - Cycles: off → all → one → off

**Edge Cases:**
- Empty queue: player shows empty state, controls disabled
- Single track queue: next/previous restart the track
- Removing currently playing track: auto-advance or stop if queue empty
- Seeking beyond duration: clamp to duration - 1

---

### 7.2 Feature: Playlist CRUD with Drag-and-Drop Reorder

**Description:**
Users can create, edit, and delete playlists. Tracks within playlists can be reordered via drag-and-drop.

**Functional Requirements:**

1. **Create Playlist**
   - User clicks "Create Playlist" button
   - Modal appears with name input (required) and description input (optional)
   - On submit, POST to /playlists
   - New playlist appears in sidebar

2. **Edit Playlist**
   - User can edit name and description from playlist detail page
   - Changes saved via PATCH to /playlists/:id
   - Inline editing or modal-based editing acceptable

3. **Delete Playlist**
   - Confirmation dialog before deletion
   - DELETE to /playlists/:id
   - Playlist removed from sidebar

4. **Add Track to Playlist**
   - From track row, user selects "Add to Playlist"
   - Submenu shows list of user's playlists
   - Selecting a playlist sends POST to /playlists/:id/tracks
   - Visual feedback (toast notification) confirms addition

5. **Remove Track from Playlist**
   - On playlist detail page, each track has remove option
   - DELETE to /playlists/:id/tracks/:trackId
   - Track removed from list immediately (optimistic update)

6. **Reorder Tracks**
   - User can drag tracks to new positions
   - On drop, determine new order
   - Send PATCH to /playlists/:id/reorder with new trackIds array
   - Optimistic update: show new order immediately
   - On API failure: revert to previous order, show error message

**Optimistic Updates:**
- All playlist modifications update UI immediately
- If API call fails, revert state and show error toast
- Loading states shown on buttons during API calls

---

### 7.3 Feature: Search with Debounced Autocomplete

**Description:**
A search bar that shows results as the user types, with debouncing to reduce API calls.

**Functional Requirements:**

1. **Debounced Input**
   - Wait 300ms after user stops typing before firing API request
   - If user types again within 300ms, reset the timer

2. **Request Cancellation**
   - If a new search is triggered while previous request is pending, cancel the previous request
   - Use AbortController to cancel fetch requests
   - Only display results from the most recent query

3. **Results Display**
   - Dropdown appears below search bar when results exist
   - Results grouped by category: Tracks, Albums, Artists
   - Each category shows up to 5 results
   - Each result is clickable and navigates to appropriate page
   - Show "No results found" if query returns empty

4. **Clear Behavior**
   - If search input is cleared, hide dropdown immediately (no API call)
   - If user clicks outside dropdown, close it

5. **Loading State**
   - Show spinner in dropdown while request is pending
   - Replace spinner with results when response arrives

**Edge Cases:**
- Very short queries (1-2 characters): still search, but may return broad results
- Special characters: should be URL-encoded in query
- Rapid typing then clearing: no stale results should appear

---

### 7.4 Feature: Discover Weekly (Personalized Recommendations)

**Description:**
Backend generates a personalized playlist based on user's listening history.

**Functional Requirements:**

1. **Data Source**
   - Analyze user's listeningHistory from the last 30 days
   - Calculate top genres by counting plays per genre
   - Calculate top artists by counting plays per artist

2. **Recommendation Algorithm**
   - Find tracks where:
     - Genre matches one of user's top 5 genres, OR
     - Artist matches one of user's top 5 artists
   - Exclude tracks that appear in user's listeningHistory (already played)
   - Randomly sample 30 tracks from the matching set

3. **Response**
   - Return array of 30 track objects
   - Each track includes populated artist and album fields
   - If fewer than 30 matching tracks exist, return all that match

4. **Frontend Display**
   - Dedicated page showing the 30 tracks
   - "Play All" button to add all tracks to queue
   - Each track row has standard play/like/add-to-playlist options
   - Refresh button to regenerate recommendations

**Edge Cases:**
- New user with no listening history: return random selection of popular tracks
- User has played all tracks in their preferred genres: expand to related genres or return fewer tracks
- Very small catalog: return whatever matches, even if less than 30

---

### 7.5 Feature: Listening Analytics Dashboard

**Description:**
A stats page showing the user's listening habits and patterns.

**Functional Requirements:**

1. **Top Artists**
   - Query listeningHistory grouped by track's artistId
   - Count plays per artist
   - Return top 5 sorted by count descending
   - Include artist name and image

2. **Top Genres**
   - Query listeningHistory, join with tracks to get genre
   - Count plays per genre
   - Return top 5 sorted by count descending

3. **Total Listening Time**
   - Sum of `listenDurationSeconds` from all listeningHistory entries
   - Convert to minutes for display
   - Display format: "X hours Y minutes" or "X minutes" if under 1 hour

4. **Listening by Day of Week**
   - Group listeningHistory by day of week (0-6, Sunday-Saturday)
   - Count plays per day
   - Return object with counts for each day
   - Frontend displays as bar chart or similar visualization

5. **Current Streak**
   - Get distinct dates from listeningHistory for the user
   - Sort descending
   - Count consecutive days starting from today (or yesterday if no plays today yet)
   - Streak breaks if a day is missing

6. **Longest Streak**
   - Calculate the longest consecutive day sequence in entire history
   - Store/update this value whenever analytics are requested

**Frontend Display:**
- Stats cards for quick metrics (total time, current streak)
- List or horizontal cards for top artists/genres
- Simple bar chart for day-of-week distribution

---

### 7.6 Feature: Smart Queue Recommendations

**Description:**
When a track plays, the system suggests 5 "up next" tracks based on musical context.

**Functional Requirements:**

1. **Trigger**
   - Request recommendations when a new track starts playing
   - Endpoint: GET /recommendations/queue?trackId={currentTrackId}&excludeTrackIds={queueIds}

2. **Recommendation Priority**

   **Priority 1 - Same Album, Next Track:**
   - If current track is not the last on its album, include the next track (by trackNumber)
   - This gets highest priority (slot 1)

   **Priority 2 - Same Artist, Different Album:**
   - Find other tracks by the same artist
   - Exclude tracks from the same album
   - Exclude tracks user recently played (last 50 in history)
   - Take up to 2 tracks

   **Priority 3 - Same Genre:**
   - Find tracks with matching genre
   - Exclude same artist (already covered)
   - Exclude recently played
   - Take up to 2 tracks

   **Priority 4 - Popular Tracks (Fallback):**
   - If still need more tracks to reach 5, fill with popular tracks (high playCount)
   - Exclude already-included tracks

3. **Response**
   - Always return exactly 5 tracks (or fewer if catalog is very limited)
   - Each track includes populated artist and album

4. **Frontend Display**
   - "Up Next" section near the player or in queue sidebar
   - Each recommendation has "Add to Queue" button
   - Can play directly by clicking

---

### 7.7 Feature: Trending Tracks Leaderboard

**Description:**
A global leaderboard showing the most popular tracks based on recent plays with time decay.

**Functional Requirements:**

1. **Score Calculation**
   - For each track, iterate through all plays in listeningHistory
   - For each play: `daysAgo = (currentDate - playedAt) / (1000 * 60 * 60 * 24)`
   - Add to track's score: `1 / (1 + daysAgo * 0.1)`
   - Sum all play contributions for final score

2. **Aggregation Pipeline**
   - Query listeningHistory collection
   - Group by trackId
   - Calculate score using date arithmetic
   - Sort by score descending
   - Limit to 20 tracks
   - Lookup track details (title, artist, album)

3. **Caching Strategy**
   - Expensive query; cache results
   - Cache key: "trending:leaderboard"
   - TTL: 5 minutes
   - On cache hit: return cached data immediately
   - On cache miss: run aggregation, store result, return

4. **Response**
   - Array of 20 track objects
   - Each includes `rank` (1-20) and `trendingScore`
   - Tracks include populated artist and album

5. **Frontend Display**
   - Numbered list (1-20)
   - Each row shows rank, track info, trending score (optional)
   - Each track has play/like/add-to-queue options
   - "Last updated: X minutes ago" indicator

---

## 8. Error Handling

### 8.1 API Error Responses

All errors return JSON with consistent structure:

| Field | Type | Description |
|-------|------|-------------|
| statusCode | Number | HTTP status code |
| message | String | Human-readable error message |
| error | String | Error type identifier |

Common status codes:
- 400: Bad Request (validation errors)
- 401: Unauthorized (missing or invalid token)
- 403: Forbidden (not allowed to access resource)
- 404: Not Found (resource doesn't exist)
- 500: Internal Server Error

### 8.2 Frontend Error Handling

- API errors displayed as toast notifications
- Network errors show "Connection failed" message with retry option
- Form validation errors displayed inline near relevant fields
- 401 errors redirect to login page

---

## 9. Seed Data Requirements

The application requires pre-seeded data for testing and demonstration.

### 9.1 Minimum Seed Data

| Collection | Minimum Count |
|------------|---------------|
| users | 5 |
| artists | 20 |
| albums | 40 (2 per artist average) |
| tracks | 200 (5 per album average) |
| playlists | 10 (2 per user average) |
| listeningHistory | 1000+ (varied across users) |

### 9.2 Seed Data Characteristics

- **Genres:** Include at least 5 distinct genres (rock, pop, jazz, electronic, hip-hop)
- **Track durations:** Vary between 120-300 seconds
- **Listening history:** Spread across last 60 days with varying patterns per user
- **Some users should have clear preferences** (heavy on one genre) for testing recommendations
- **Some users should have minimal history** for testing edge cases

---

## 10. Non-Functional Requirements

### 10.1 Performance

- API response time: < 500ms for standard queries
- Trending endpoint: < 100ms with cache, < 1000ms without
- Search results: < 300ms
- Frontend initial load: < 3 seconds

### 10.2 Security

- Passwords hashed with bcrypt (salt rounds: 10)
- JWT tokens signed with secure secret (minimum 256 bits)
- API routes protected by auth guard
- Users can only modify their own playlists
- No sensitive data exposed in client-side code

---

## 11. Development Notes

### 11.1 Branch Strategy

- **solution branch**: Complete, working implementation
- **question branch**: Fork of solution with intentional bugs injected (bugs to be specified in separate document)

### 11.2 Testing Approach

- Backend: Unit tests for services, integration tests for controllers
- Frontend: Component tests for critical UI elements
- E2E: Basic happy path tests for core features

---

*End of PRD*
