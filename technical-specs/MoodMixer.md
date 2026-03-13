# Melodio: Mood Mixer

## Overview

Melodio is a music streaming app that offers a mood-based track discovery feature. The Mood Mixer organizes the music library into five mood categories - Energetic, Chill, Happy, Focus, and Party; based on genre mappings.

Currently, the Mood Mixer page is not implemented. Your task is to implement the Mood Mixer feature in the frontend so that users can browse tracks by mood and filter them accordingly.

## API Contract

### GET /api/tracks

**Purpose:** Get all tracks

**Auth:** Required (Bearer token)

**Query Parameters:**
- `limit` (optional): Items per page (default 20, max 100)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "track-id",
        "title": "Track Title",
        "durationInSeconds": 240,
        "trackNumber": 3,
        "genre": "rock",
        "playCount": 1500,
        "description": "A great track",
        "coverImageUrl": "/images/tracks/track1.jpg",
        "artist": {
          "id": "artist-id",
          "name": "Artist Name",
          "imageUrl": "/images/artists/artist1.jpg"
        },
        "album": {
          "id": "album-id",
          "title": "Album Title",
          "coverImageUrl": "/images/albums/album1.jpg"
        },
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 100,
    "totalPages": 1
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

- 401 - "Unauthorized"
- 500 - "An error occurred"

## Testing Requirements

The component includes specific data-testid attributes required for automated test execution. These identifiers must not be modified:

| data-testid | Description |
|-------------|-------------|
| `mood-chips` | Mood selection chip container |
| `mood-chip-{moodId}` | Individual mood chip (replace `{moodId}` with the mood ID, e.g., `energetic`, `chill`, `happy`, `focus`, `party`) |
| `mood-description` | Selected mood description text (hidden when no mood is selected) |
| `mood-tracks` | Tracks container |
| `mood-track-{trackId}` | Individual track item (replace `{trackId}` with the actual track ID) |

## Additional Information

- To manually reset the database, stop the running server and then restart it.
- The code repository may intentionally contain other issues that are unrelated to this specific task. Please focus only on the described task requirements and address bugs or errors directly associated with them.
- If you're using Run and Debug mode in the IDE, the frontend server may start before the backend (including database seeding) is ready. In that case, the frontend might not display any data. Please reload the preview once the backend setup is complete.
