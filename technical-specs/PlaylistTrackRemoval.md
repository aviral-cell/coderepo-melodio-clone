# Melodio: Playlist Operations

## Overview

Melodio is a music streaming application where users can create and manage playlists. Key features include creating playlists, adding tracks, reordering tracks via drag-and-drop, and removing tracks from playlists.

Currently, the remove tracks feature is broken. When users click the remove button on a track, the track remains in the playlist. Your task is to fix this issue on the frontend.

## API Contract

### DELETE /api/playlists/:playlistId/tracks/:trackId

**Purpose:** Remove a track from a playlist

**Auth:** Required (Bearer token)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "playlist-id",
    "name": "My Playlist",
    "description": "A playlist",
    "ownerId": "user-id",
    "trackIds": ["track-id-1", "track-id-3"],
    "isPublic": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "<message>"
}
```

- 400 - "Invalid playlist ID format"
- 400 - "Invalid track ID format"
- 401 - "Unauthorized"
- 403 - "Not authorized to modify this playlist"
- 404 - "Playlist not found"

## Additional Information

- To manually reset the database, stop the running server and then restart it.
- The code repository may intentionally contain other issues that are unrelated to this specific task. Please focus only on the described task requirements and address bugs or errors directly associated with them.
- If you're using Run and Debug mode in the IDE, the frontend server may start before the backend (including database seeding) is ready. In that case, the frontend might not display any data. Please reload the preview once the backend setup is complete.
