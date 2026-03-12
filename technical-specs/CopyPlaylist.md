# Melodio: Copy Playlist

## Overview

Melodio is a music streaming platform where users can create and share playlists. The copy playlist feature allows users to duplicate any public playlist (or their own private playlists) into their library, creating an independent copy they can freely modify.

Your task is to implement the copy playlist feature. The route and method stubs exist but need to be implemented.

## API Contract

### POST /api/playlists/:id/copy

**Purpose:** Copy a playlist into the authenticated user's library

**Auth:** Required (Bearer token)

**Request Body:**
```json
{
  "name": "My Custom Playlist Name"
}
```
Note: The `name` field is optional. If not provided, defaults to "Copy of {originalName}".

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "new-playlist-id",
    "name": "Copy of Original Playlist",
    "ownerId": "user-id",
    "isPublic": false,
    "trackIds": ["track-id-1", "track-id-2"],
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Copy Rules:**
- The copied playlist's name defaults to "Copy of {originalName}" unless a custom name is provided in the request body.
- The copied playlist is always private, regardless of the original's visibility.
- The copied playlist is owned by the authenticated user, not the original owner.
- All tracks from the original playlist are copied in the same order.
- The copied playlist is an independent document with a new ID.
- Public playlists can be copied by anyone.
- Private playlists can only be copied by their owner.
- Free users are limited to 7 playlists total. If the user already has 7, the copy should be rejected.

**Error Responses:**
- 400 - Invalid playlist ID format
- 403 - Cannot copy a private playlist that you do not own
- 403 - Free user playlist limit reached (7 playlists)
- 404 - Playlist not found

## Additional Information

- The route, controller, and service stubs already exist and need to be implemented.
- The frontend is fully built and sends copy requests with an optional custom name.
- Free users are limited to 7 playlists total — the same limit applies for copies as for playlist creation.
- To manually reset the database, stop the running server and then restart it.
- The code repository may intentionally contain other issues that are unrelated to this specific task. Please focus only on the described task requirements and address bugs or errors directly associated with them.
- If you're using Run and Debug mode in the IDE, the frontend server may start before the backend (including database seeding) is ready. In that case, the frontend might not display any data. Please reload the preview once the backend setup is complete.
