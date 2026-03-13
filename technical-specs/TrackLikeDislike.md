# Melodio: Track Like & Dislike

## Overview

Melodio is a music streaming app where users can like or dislike individual tracks. Liked tracks are saved to a personal collection for easy access, and the like/dislike status is shown on track cards throughout the app.

At the moment, the track like/dislike system is extensively broken. like/dislike is broken, the liked tracks list doesn't work, and the like status indicator does not reflect the actual state.

## API Contract

### POST /api/tracks/:id/like

**Purpose:** Like a track

**Auth:** Required (Bearer token)

**URL Parameters:**
- `:id` - Track ObjectId

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "like",
    "trackId": "track-id"
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

- 400 - "Invalid track ID format"
- 401 - "Unauthorized"
- 404 - "Track not found"

---

### POST /api/tracks/:id/dislike

**Purpose:** Dislike a track

**Auth:** Required (Bearer token)

**URL Parameters:**
- `:id` - Track ObjectId

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "dislike",
    "trackId": "track-id"
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

- 400 - "Invalid track ID format"
- 401 - "Unauthorized"
- 404 - "Track not found"

---

### DELETE /api/tracks/:id/like

**Purpose:** Remove any reaction for a track

**Auth:** Required (Bearer token)

**URL Parameters:**
- `:id` - Track ObjectId

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "status": null,
    "trackId": "track-id"
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

- 400 - "Invalid track ID format"
- 401 - "Unauthorized"

---

### GET /api/tracks/:id/like-status

**Purpose:** Get the current like/dislike status for a specific track

**Auth:** Required (Bearer token)

**URL Parameters:**
- `:id` - Track ObjectId

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "like"
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

- 400 - "Invalid track ID format"
- 401 - "Unauthorized"

---

### GET /api/tracks/liked

**Purpose:** Get a paginated list of the user's liked tracks with populated artist and album details

**Auth:** Required (Bearer token)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "track-id",
        "title": "Track Title",
        "durationInSeconds": 240,
        "trackNumber": 3,
        "genre": "Pop",
        "playCount": 1500,
        "coverImageUrl": "/images/tracks/track1.jpg",
        "description": "A great track",
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z",
        "artistId": {
          "_id": "artist-id",
          "name": "Artist Name",
          "imageUrl": "/images/artists/artist1.jpg"
        },
        "albumId": {
          "_id": "album-id",
          "title": "Album Title",
          "coverImageUrl": "/images/albums/album1.jpg"
        },
        "likedAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
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

---

### GET /api/tracks/liked/ids

**Purpose:** Get arrays of liked and disliked track IDs for the authenticated user

**Auth:** Required (Bearer token)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "likedIds": ["track-id-1", "track-id-2"],
    "dislikedIds": ["track-id-3"]
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

## Additional Information

- To manually reset the database, stop the running server and then restart it.
- The code repository may intentionally contain other issues that are unrelated to this specific task. Please focus only on the described task requirements and address bugs or errors directly associated with them.
- If you're using Run and Debug mode in the IDE, the frontend server may start before the backend (including database seeding) is ready. In that case, the frontend might not display any data. Please reload the preview once the backend setup is complete.
