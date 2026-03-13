# Melodio: Track Like & Dislike

## Overview

Melodio is a music streaming platform where users can express preferences for tracks by liking or disliking them. Users can toggle between like and dislike states, remove their reaction entirely, view their current reaction status for any track, and browse a paginated list of all their liked tracks with full artist and album details.

Your task is to fix the track like/dislike feature. The routes, controllers, and services exist but contain bugs — the controller reads parameters from the wrong source, calls the wrong service methods, and the service logic for status retrieval, pagination, and ID collection needs to be corrected.

## API Contract

### POST /api/tracks/:id/like

**Purpose:** Like a track (upsert — if already disliked, switches to like)

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

**Like Rules:**
- If no reaction exists: create a `TrackLike` document with `type: "like"`.
- If the track is already disliked: update the existing document to `type: "like"`.
- If the track is already liked: no change (idempotent).
- Must validate the track exists in the database before creating/updating the reaction.
- Uses `findOneAndUpdate` with `upsert: true` on `user_id` + `track_id`.

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

**Purpose:** Dislike a track (upsert — if already liked, switches to dislike)

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

**Dislike Rules:**
- If no reaction exists: create a `TrackLike` document with `type: "dislike"`.
- If the track is already liked: update the existing document to `type: "dislike"`.
- If the track is already disliked: no change (idempotent).
- Must validate the track exists in the database before creating/updating the reaction.
- Uses `findOneAndUpdate` with `upsert: true` on `user_id` + `track_id`, setting `type` to `"dislike"`.

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

**Purpose:** Remove any reaction (like or dislike) for a track

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

**Removal Rules:**
- Deletes the `TrackLike` document for the `user_id` + `track_id` pair regardless of its current type.
- Must validate the ObjectId format (return 400 if invalid).
- Returns success even if no reaction existed.

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

**Status Rules:**
- Must query the database for a `TrackLike` document matching `user_id` + `track_id`.
- If a document exists, return its `type` field as `status` (`"like"` or `"dislike"`).
- If no document exists, return `status: null`.

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
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Pagination Rules:**
- Filter by `type: "like"` only (do not include disliked tracks).
- Sort by `created_at` descending (most recently liked first).
- Populate `track_id` with the full track document, including nested `artist_id` (fields: `name`, `image_url`) and `album_id` (fields: `title`, `cover_image_url`).
- Map the response fields: `title` from `track.title`, `description` from `track.description`, `artistId` from `track.artist_id`, `albumId` from `track.album_id`, `likedAt` from the TrackLike's `created_at` timestamp.

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

**Response Rules:**
- Query all `TrackLike` documents for the authenticated user.
- Partition by `type`: documents with `type: "like"` go to `likedIds`, documents with `type: "dislike"` go to `dislikedIds`.
- Each array contains the `track_id` values as strings.

**Error Response:**
```json
{
  "success": false,
  "error": "<message>"
}
```

- 401 - "Unauthorized"

## Additional Information

- The `TrackLike` model has a unique compound index on `(user_id, track_id)` — this is why using `create()` instead of `findOneAndUpdate()` causes duplicate key errors on repeated likes.
- Pay attention to the populate chain: `track_id` -> `artist_id` (from Track) -> and `album_id` (from Track). Without these populates, the nested fields will be ObjectIds rather than full documents.
- To manually reset the database, stop the running server and then restart it.
- The code repository may intentionally contain other issues that are unrelated to this specific task. Please focus only on the described task requirements and address bugs or errors directly associated with them.
- If you're using Run and Debug mode in the IDE, the frontend server may start before the backend (including database seeding) is ready. In that case, the frontend might not display any data. Please reload the preview once the backend setup is complete.
