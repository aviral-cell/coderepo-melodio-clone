# Melodio: Copy Playlist

## Overview

Melodio is a music streaming app where users can create playlists to organize their favorite tracks. The platform should allow users to copy any public playlist into their library.

Currently, the copy playlist feature is not implemented. Your task is to implement this feature in the backend so that users can easily copy playlists while respecting privacy and ownership rules.

## API Contract

### POST /api/playlists/:id/copy

**Purpose:** Copy a playlist into the user's library

**Auth:** Required (Bearer token)

**Request Body:**
```json
{
  "name": "My Custom Playlist Name"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "new-playlist-id",
    "name": "Copy of Original Playlist",
    "description": "A great playlist",
    "ownerId": "user-id",
    "trackIds": ["track-id-1", "track-id-2"],
    "coverImageUrl": "/images/playlists/default.jpg",
    "isPublic": false,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
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
- 400 - "Playlist name must be between 2 and 100 characters"
- 403 - "Cannot copy private playlist"
- 403 - "Free users can only create up to 7 playlists. Upgrade to Premium for unlimited playlists."
- 404 - "Playlist not found"

## Additional Information

- Free users are limited to 7 playlists total; the same limit applies for copies as for playlist creation.
- To manually reset the database, stop the running server and then restart it.
- The code repository may intentionally contain other issues that are unrelated to this specific task. Please focus only on the described task requirements and address bugs or errors directly associated with them.
- If you're using Run and Debug mode in the IDE, the frontend server may start before the backend (including database seeding) is ready. In that case, the frontend might not display any data. Please reload the preview once the backend setup is complete.
