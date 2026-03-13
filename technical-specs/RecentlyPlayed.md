# Melodio: Recently Played Tracks

## Overview

Melodio is a music streaming app that lets users discover and listen to music. The platform should maintain a play history so users can revisit tracks they have recently enjoyed.

Currently, the recently played feature is not implemented. Your task is to implement the recently played tracks feature in the backend so that users can view their play history, which should be accurate and up-to-date.

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
- Playing the same track multiple times creates separate entries.
- Maximum history size is 50 entries per user. When the limit is reached, the oldest entry should be removed before inserting the new one.

**Error Responses:**
- 400 - Invalid track ID format
- 401 - Unauthorized
- 404 - Track not found

---

### GET /api/history/recently-played

**Purpose:** Get the user's recently played tracks with full details

**Auth:** Required (Bearer token)

**Query Parameters:**
- `limit` (optional): Number of tracks to return (default: 20)
- `offset` (optional): Number of entries to skip before returning results (default: 0)

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
        "trackNumber": 1,
        "genre": "rock",
        "playCount": 100,
        "coverImageUrl": "https://example.com/cover.jpg",
        "playedAt": "2024-01-15T10:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "artist": {
          "id": "artist-id",
          "name": "Artist Name",
          "imageUrl": "https://example.com/artist.jpg"
        },
        "album": {
          "id": "album-id",
          "title": "Album Title",
          "coverImageUrl": "https://example.com/album.jpg"
        }
      }
    ],
    "total": 25
  }
}
```

**Response Rules:**
- Tracks are sorted by most recently played first.

**Error Responses:**
- 401 - Unauthorized

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

**Error Responses:**
- 401 - Unauthorized

## Additional Information

- To manually reset the database, stop the running server and then restart it.
- The code repository may intentionally contain other issues that are unrelated to this specific task. Please focus only on the described task requirements and address bugs or errors directly associated with them.
- If you're using Run and Debug mode in the IDE, the frontend server may start before the backend (including database seeding) is ready. In that case, the frontend might not display any data. Please reload the preview once the backend setup is complete.
