# Melodio: Podcast Browser

## Overview

Melodio is a music streaming app that also hosts podcasts. The Podcast Browser lets users explore podcast shows, view episode details, read descriptions, and play episodes.

At the moment, the podcast browser is extensively broken. Show durations are wrong, episodes don't load, and playback does not work.

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
        "title": "Episode Title",
        "durationInSeconds": 2400,
        "trackNumber": 1,
        "genre": "podcast",
        "playCount": 5000,
        "description": "Episode description text",
        "coverImageUrl": "/images/tracks/episode1.jpg",
        "artist": {
          "id": "artist-id",
          "name": "Host Name",
          "imageUrl": "/images/artists/host.jpg"
        },
        "album": {
          "id": "album-id",
          "title": "Show Title",
          "coverImageUrl": "/images/albums/show.jpg"
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

---

### GET /api/albums

**Purpose:** Get all albums

**Auth:** Required (Bearer token)

**Query Parameters:**
- `limit` (optional): Items per page (default 20, max 50)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "album-id",
        "title": "Show Title",
        "artist": {
          "_id": "artist-id",
          "name": "Host Name",
          "imageUrl": "/images/artists/host.jpg"
        },
        "releaseDate": "2024-01-01T00:00:00.000Z",
        "coverImageUrl": "/images/albums/show.jpg",
        "totalTracks": 10,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-06-01T00:00:00.000Z"
      }
    ],
    "total": 8,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

**Error Response (both endpoints):**
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

**Browse Shows:**

| data-testid | Description |
|-------------|-------------|
| `podcast-loading` | Loading state indicator |
| `podcast-shows` | All podcast shows section |
| `podcast-top-shows` | Top podcast shows section |
| `podcast-show-{albumId}` | Clickable podcast show entry (replace `{albumId}` with the actual album ID) |
| `podcast-show-duration-{albumId}` | Show total duration display (replace `{albumId}` with the actual album ID) |

**Show Detail & Episodes:**

| data-testid | Description |
|-------------|-------------|
| `podcast-selected-show` | Selected show detail view |
| `podcast-show-detail-duration` | Selected show total duration |
| `podcast-show-detail-play-count` | Selected show play count |
| `podcast-episodes` | Episodes list section |
| `podcast-episode-track-{trackId}` | Individual episode entry (replace `{trackId}` with the actual track ID) |
| `podcast-episode-date-{trackId}` | Episode date display (replace `{trackId}` with the actual track ID) |
| `podcast-selected-episode` | Selected episode detail view |
| `podcast-episode-description` | Episode description display |
| `podcast-sort-default` | Default sort button (by episode order) |
| `podcast-sort-latest` | Sort episodes by latest button |
| `podcast-sort-oldest` | Sort episodes by oldest button |

**Playback:**

| data-testid | Description |
|-------------|-------------|
| `podcast-play-all` | Play all episodes button |
| `podcast-play-episode-{trackId}` | Play individual episode button (replace `{trackId}` with the actual track ID) |
| `podcast-now-playing-{trackId}` | Now playing indicator for episode (replace `{trackId}` with the actual track ID) |
| `podcast-up-next` | Up next section |
| `podcast-up-next-episode-{trackId}` | Up next episode entry (replace `{trackId}` with the actual track ID) |

## Additional Information

- Shows are derived from albums of podcast genre; episodes are tracks within those albums.
- To manually reset the database, stop the running server and then restart it.
- The code repository may intentionally contain other issues that are unrelated to this specific task. Please focus only on the described task requirements and address bugs or errors directly associated with them.
- If you're using Run and Debug mode in the IDE, the frontend server may start before the backend (including database seeding) is ready. In that case, the frontend might not display any data. Please reload the preview once the backend setup is complete.
