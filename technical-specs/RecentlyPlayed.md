# Melodio: Recently Played Tracks

## Overview

Melodio is a music streaming platform where users can listen to tracks and revisit their listening history. The recently played feature records each track play, displays a chronological history with full track details (artist, album), and allows users to clear their history.

Your task is to implement the recently played feature. The database structure, routes, and frontend are fully built, but the backend methods are stubs that need to be implemented.

## API Contract

### POST /api/history/play

**Purpose:** Record a track play in the user's history

**Auth:** Required (Bearer token)

**Request Body:**
```json
{
  "trackId": "track-id"
}
```

**Validation Rules:**
- `trackId` (required): Must be a valid ID
- The track must exist in the database — return 404 if not found

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "recorded": true
  },
  "message": "Play recorded successfully"
}
```

**Recording Rules:**
- Playing the same track multiple times creates separate entries (no deduplication).
- Maximum history size is 50 entries per user. When the limit is reached, the oldest entry should be removed before inserting the new one.

**Error Response:**
```json
{
  "success": false,
  "error": "<message>"
}
```

- 400 - "Invalid track ID format"
- 401 - "Unauthorized"
- 404 - "Track not found"

---

### GET /api/history/recently-played

**Purpose:** Get the user's recently played tracks with full details

**Auth:** Required (Bearer token)

**Query Parameters:**
- `limit` (optional): Number of tracks to return (default: 20)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "tracks": [
      {
        "id": "track-id",
        "title": "Track Title",
        "durationInSeconds": 240,
        "playedAt": "2024-01-15T10:00:00.000Z",
        "artist": {
          "id": "artist-id",
          "name": "Artist Name"
        },
        "album": {
          "id": "album-id",
          "title": "Album Title"
        }
      }
    ],
    "total": 25
  }
}
```

**Response Rules:**
- Tracks are sorted by most recently played first.
- Each track includes populated artist and album details.
- `total` is the full count of all history entries for the user (not capped by the limit parameter).

**Error Response:**
```json
{
  "success": false,
  "error": "<message>"
}
```

- 401 - "Unauthorized"

---

### DELETE /api/history/recently-played

**Purpose:** Clear the user's entire play history

**Auth:** Required (Bearer token)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "cleared": true
  },
  "message": "History cleared successfully"
}
```

**Deletion Rules:**
- Only the authenticated user's history entries are deleted.
- Other users' history is not affected.

**Error Response:**
```json
{
  "success": false,
  "error": "<message>"
}
```

- 401 - "Unauthorized"

## Additional Information

- The database structure and frontend are fully built and expect the API responses described above.
- The maximum history size is 50 entries per user — oldest entries are removed when the limit is reached.
- The default limit for retrieving recently played tracks is 20.
- To manually reset the database, stop the running server and then restart it.
- The code repository may intentionally contain other issues that are unrelated to this specific task. Please focus only on the described task requirements and address bugs or errors directly associated with them.
- If you're using Run and Debug mode in the IDE, the frontend server may start before the backend (including database seeding) is ready. In that case, the frontend might not display any data. Please reload the preview once the backend setup is complete.
