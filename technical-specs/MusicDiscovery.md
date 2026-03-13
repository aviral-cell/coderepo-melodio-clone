# Melodio: Music Discovery

## Overview

Melodio is a music streaming app with a Discovery page that helps users explore music through multiple filter dimensions; language, genre, and era; along with a "New This Week" section and a "Top Artists" ranking.

At the moment, the Discovery page is completely non-functional. It shows mock data instead of real content, and no filters are available.

## API Contract

### GET /api/tracks

**Purpose:** Get all tracks

**Auth:** Required (Bearer token)

**Query Parameters:**
- `limit` (optional): Items per page (default 20, max 100).

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

---

### GET /api/artists

**Purpose:** Get all artists

**Auth:** Required (Bearer token)

**Query Parameters:**
- `limit` (optional): Items per page (default 20, max 50).

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "artist-id",
        "name": "Artist Name",
        "bio": "Artist biography",
        "imageUrl": "/images/artists/artist1.jpg",
        "genres": ["rock", "pop"],
        "followerCount": 15000,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-06-01T00:00:00.000Z"
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

---

### GET /api/albums

**Purpose:** Get all albums

**Auth:** Required (Bearer token)

**Query Parameters:**
- `limit` (optional): Items per page (default 20, max 50).

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "album-id",
        "title": "Album Title",
        "artist": {
          "_id": "artist-id",
          "name": "Artist Name",
          "imageUrl": "/images/artists/artist1.jpg"
        },
        "releaseDate": "1995-06-15T00:00:00.000Z",
        "coverImageUrl": "/images/albums/album1.jpg",
        "totalTracks": 12,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-06-01T00:00:00.000Z"
      }
    ],
    "total": 14,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

**Error Response (all endpoints):**
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

**Page State:**

| data-testid | Description |
|-------------|-------------|
| `discovery-loading` | Loading state indicator |
| `discovery-error` | Error state display |

**New This Week:**

| data-testid | Description |
|-------------|-------------|
| `discovery-new-this-week` | New This Week section |
| `discovery-new-track-{trackId}` | Individual new track entry (replace `{trackId}` with the actual track ID) |

**Popular by Language:**

| data-testid | Description |
|-------------|-------------|
| `discovery-popular-language` | Popular by Language section |
| `discovery-language-chips` | Language filter chips container |
| `discovery-language-chip-{language}` | Language chip (replace `{language}` with lowercase language name, e.g., `korean`) |
| `discovery-language-track-{trackId}` | Language-filtered track entry (replace `{trackId}` with the actual track ID) |

**Popular by Genre:**

| data-testid | Description |
|-------------|-------------|
| `discovery-popular-genre` | Popular by Genre section |
| `discovery-genre-chips` | Genre filter chips container |
| `discovery-genre-chip-{genre}` | Genre chip (replace `{genre}` with lowercase genre name, e.g., `rock`) |
| `discovery-genre-track-{trackId}` | Genre-filtered track entry (replace `{trackId}` with the actual track ID) |

**Jump Back In (Era):**

| data-testid | Description |
|-------------|-------------|
| `discovery-jump-back-in` | Jump Back In section |
| `discovery-era-chips` | Era filter chips container |
| `discovery-era-chip-{era}` | Era chip (replace `{era}` with the era label, e.g., `90's`) |
| `discovery-era-track-{trackId}` | Era-filtered track entry (replace `{trackId}` with the actual track ID) |

**Top Artists:**

| data-testid | Description |
|-------------|-------------|
| `discovery-top-artists` | Top Artists section |
| `discovery-artist-{artistId}` | Individual artist row (replace `{artistId}` with the actual artist ID) |

## Additional Information

- To manually reset the database, stop the running server and then restart it.
- The code repository may intentionally contain other issues that are unrelated to this specific task. Please focus only on the described task requirements and address bugs or errors directly associated with them.
- If you're using Run and Debug mode in the IDE, the frontend server may start before the backend (including database seeding) is ready. In that case, the frontend might not display any data. Please reload the preview once the backend setup is complete.
