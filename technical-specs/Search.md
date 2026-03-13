# Melodio: Search

## Overview

Melodio is a music streaming platform that allows users to browse artists, albums, and playlists through a built-in music player. A reliable search feature is essential for music discovery, enabling users to quickly find tracks they want to listen to.

Your task is to build the search feature on both the frontend and backend, enabling users to enter a query and see relevant, dynamic results. The search results should respond to user input and accurately reflect the queried tracks.


## API Contract

### GET /api/tracks/search?q={query}

**Purpose:** Search for tracks by query string

**Auth:** Required (Bearer token)

**Query Parameters:**
- `q` (required): Search query string

**Success Response (200):**
```json
[
  {
    "id": "track-id",
    "title": "Track Title",
    "durationInSeconds": 180,
    "trackNumber": 1,
    "genre": "rock",
    "playCount": 100,
    "coverImageUrl": "/images/track.jpg",
    "artist": {
      "id": "artist-id",
      "name": "Artist Name",
      "imageUrl": "/images/artist.jpg"
    },
    "album": {
      "id": "album-id",
      "title": "Album Title",
      "coverImageUrl": "/images/album.jpg"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Error Responses:**
- 401 - Unauthorized
- 500 - Server error

## Testing Requirements

The component includes specific data-testid attributes required for automated test execution. These identifiers must not be modified:

| data-testid | Description |
|-------------|-------------|
| `search-results-count` | Display showing the number of search results |
| `search-results-list` | Container for the list of search result items |
| `search-result-item-{trackId}` | Individual search result item (replace `{trackId}` with the actual track ID) |
| `search-result-title-{trackId}` | Track title in search result item (replace `{trackId}` with the actual track ID) |
| `search-result-artist-{trackId}` | Artist name in search result item (replace `{trackId}` with the actual track ID) |
| `search-result-duration-{trackId}` | Duration display in search result item (replace `{trackId}` with the actual track ID) |
| `search-no-results` | Message displayed when no search results found |
| `search-error` | Message displayed when search encounters an error |

## Additional Information

- Use case-insensitive prefix matching for search queries (matches should start with the typed text, regardless of letter case).
- The API must return no more than 5 items for any search query.
- Display full track details for each result: title, artist, album (shown as "Artist - Album"), and duration.
- Show an accurate results count that uses correct singular/plural wording (e.g., "1 RESULT" vs. "2 RESULTS").
- To manually reset the database, stop the running server and then restart it.
- The code repository may intentionally contain other issues that are unrelated to this specific task. Please focus only on the described task requirements and address bugs or errors directly associated with them.
- If you're using Run and Debug mode in the IDE, the frontend server may start before the backend (including database seeding) is ready. In that case, the frontend might not display any data. Please reload the preview once the backend setup is complete.
