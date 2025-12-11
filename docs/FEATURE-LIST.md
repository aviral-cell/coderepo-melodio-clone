# Melodio - Detailed Feature List

## Overview

This document provides a comprehensive breakdown of all features in the Melodio music streaming application (Spotify clone). Each feature includes business logic explanations, user flows, and acceptance criteria.

---

## Branding & Theme

| Element | Specification |
|---------|---------------|
| App Name | **Melodio** (avoid Spotify/Hackify copyright) |
| Logo | Music2 icon with Melodio branding |
| Primary Color | #1DB954 (Spotify green) |
| Theme | Dark theme matching Spotify aesthetic |
| Color Scheme | Spotify green accents, dark backgrounds |

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
4. System creates user account
5. System returns JWT token and user data
6. User is redirected to home page

**Validation Rules:**
- Email: Valid email format, unique
- Username: Non-empty, unique
- Password: Minimum 6 characters
- Display Name: Non-empty

**Error Scenarios:**
- Email already registered → 409 Conflict
- Username already taken → 409 Conflict
- Invalid input format → 400 Bad Request

---

### 1.2 User Login

**Description:** Authenticates existing users.

**Business Logic:**
- Email lookup is case-insensitive
- Password verified against bcrypt hash
- Returns same JWT structure as registration
- Invalid credentials return generic error (security)

**User Flow:**
1. User navigates to `/login`
2. User enters email and password
3. System validates credentials
4. System returns JWT token and user data
5. User is redirected to home page

**Error Scenarios:**
- Invalid email or password → 401 Unauthorized (generic message)
- Missing required fields → 400 Bad Request

---

### 1.3 Session Management

**Description:** Maintains user session across page refreshes.

**Business Logic:**
- JWT stored in localStorage (key: `hackify_auth_token`)
- On app mount, check for existing token
- If token exists, call `/auth/me` to validate and get user data
- If token invalid/expired, clear localStorage and show login
- All API requests include `Authorization: Bearer <token>` header
- Header displays **first word of displayName** (not username)

**User Flow:**
1. App loads
2. Check localStorage for token
3. If found, validate with `/auth/me`
4. If valid, user remains logged in
5. If invalid, redirect to login

---

### 1.4 Logout

**Description:** Ends user session.

**Business Logic:**
- Clear JWT from localStorage
- Clear user state from AuthContext
- Redirect to login page

---

## 2. Music Catalog Browsing

### 2.1 Home Page

**Description:** Landing page showing curated content.

**Sections Displayed:**
- "Recommended for you" - Track cards (10 tracks)
- "Browse Albums" - Album cards (10 albums)
- "Browse Tracks" - Track cards (20 tracks)
- "Your Playlists" - User's playlist cards

**Layout:**
- Desktop: **7 track cards per row**
- Mobile: Single column layout

**Business Logic:**
- Requires authentication
- Tracks fetched with artist and album populated
- Albums fetched with artist populated
- Playlists filtered by current user's ownerId

---

### 2.2 Genre Page

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

---

### 2.3 Album Detail Page

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

---

### 2.4 Track Detail Page

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
- `currentTrack`: Currently playing track object
- `isPlaying`: Boolean playback state
- `elapsedSeconds`: Current position in seconds
- `volume`: 0-100 (display only, no actual audio)

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

**API:** GET /search?q=query

**Response Structure:**
```json
{
  "tracks": [...]    // max 5 tracks
}
```

**Search Logic:**
- Tracks: **Prefix-based** title match (not exact match)
- Case-insensitive matching

**Dropdown Display:**
- Shows matching tracks only
- Each result shows: track title, artist name, album cover thumbnail
- **Click behavior**: Navigate to track detail page (`/track/:id`)

---

## 7. Recently Played

### 7.1 Track Recently Played History

**Description:** Client-side history of recently played tracks.

**Business Logic:**
- Stored in localStorage (key: `hackify_clone_recently_played`)
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

### 8.7 Animations

**Description:** Visual transitions and feedback.

**Implemented Animations:**
- **Fade-in**: Page load transitions
- **Shake**: Validation error feedback on form fields

---

### 8.8 Visual Styling

**Scrollbars:**
- Slim, dark-themed scrollbars
- Barely visible (matches Spotify aesthetic)

**Images:**
- All images stored **locally** (no external URLs)
- **Unique image per track**
- Genre cards use images (not solid colors)
- Album images: American singer/band artwork

---

### 8.9 Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| Mobile (375px) | Single column, collapsed sidebar, simplified player |
| Desktop | 7 track cards per row, expanded sidebar, full player controls |

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

## 9. Out-of-Scope Features

The following features are explicitly **NOT** to be implemented:

| Feature | Status |
|---------|--------|
| Discover Weekly / Personalized Recommendations | Out of scope |
| Analytics Dashboard | Out of scope |
| Smart Queue | Out of scope |
| Trending Section | Out of scope |
| Audio Playback (actual audio files) | Out of scope |
| WebSocket real-time features | Out of scope |
| File Upload | Out of scope |
| Email Sending | Out of scope |
