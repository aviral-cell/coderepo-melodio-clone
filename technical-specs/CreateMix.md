# Melodio: Create Mix

## Overview

Melodio is a music streaming app with a Mix feature that lets users create personalized track collections. The Mix page has a 3-step wizard: select artists, configure mix settings (variety, discovery, filters), and generate a scored mix. Users can also view and manage their saved mixes.

At the moment, the mix creation feature is completely broken. The wizard shows fake artists and no configuration options are functional.

## API Contract

### POST /api/mixes

**Purpose:** Save a generated mix

**Auth:** Required (Bearer token)

**Request Body:**
```json
{
  "title": "The Amplifiers mix",
  "artistIds": ["artist-id-1"],
  "config": {
    "variety": "medium",
    "discovery": "blend",
    "filters": ["Popular"]
  },
  "trackIds": ["track-id-1", "track-id-2"],
  "coverImages": ["/images/artist1.jpg"]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "mix-id",
    "userId": "user-id",
    "title": "The Amplifiers mix",
    "artistIds": ["artist-id-1"],
    "config": { "..." },
    "trackIds": ["track-id-1", "track-id-2"],
    "trackCount": 2,
    "coverImages": ["/images/artist1.jpg"],
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

- 400 - "Title is required and cannot be empty"
- 400 - "At least one artist ID is required"
- 400 - "At least one track ID is required"
- 400 - "Invalid track ID format in trackIds"

---

### GET /api/mixes

**Purpose:** Get all mixes for the authenticated user

**Auth:** Required (Bearer token)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "mix-id",
      "userId": "user-id",
      "title": "The Amplifiers mix",
      "artistIds": ["artist-id-1"],
      "config": {
        "variety": "medium",
        "discovery": "blend",
        "filters": ["Popular"]
      },
      "trackIds": ["track-id-1", "track-id-2"],
      "coverImages": ["/images/artist1.jpg"],
      "trackCount": 2,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

### GET /api/mixes/:id

**Purpose:** Get a specific mix by ID with populated track details

**Auth:** Required (Bearer token)

**URL Parameters:**
- `:id` - Mix ObjectId

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "mix-id",
    "userId": "user-id",
    "title": "The Amplifiers mix",
    "artistIds": ["artist-id-1"],
    "config": {
      "variety": "medium",
      "discovery": "blend",
      "filters": ["Popular"]
    },
    "trackIds": ["track-id-1", "track-id-2"],
    "tracks": [
      {
        "id": "track-id-1",
        "title": "Thunder Road",
        "artist": {
          "id": "artist-id-1",
          "name": "The Amplifiers",
          "imageUrl": "/images/artist1.jpg"
        },
        "album": {
          "id": "album-id-1",
          "title": "Electric Storm",
          "coverImageUrl": "/images/album1.jpg"
        },
        "durationInSeconds": 210,
        "trackNumber": 1,
        "genre": "rock",
        "playCount": 5000,
        "coverImageUrl": "/images/track1.jpg",
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "coverImages": ["/images/artist1.jpg"],
    "trackCount": 2,
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

- 400 - "Invalid mix ID format"
- 404 - "Mix not found"

---

### PATCH /api/mixes/:id

**Purpose:** Rename a saved mix

**Auth:** Required (Bearer token)

**Request Body:**
```json
{
  "title": "New Mix Name"
}
```

---

### DELETE /api/mixes/:id

**Purpose:** Delete a saved mix

**Auth:** Required (Bearer token)

**URL Parameters:**
- `:id` - Mix ObjectId

**Success Response (204):**
No content.

**Error Response:**
```json
{
  "success": false,
  "error": "<message>"
}
```

- 400 - "Invalid mix ID format"
- 404 - "Mix not found"

## Testing Requirements

The component includes specific data-testid attributes required for automated test execution. These identifiers must not be modified:

**Mix Listing:**

| data-testid | Description |
|-------------|-------------|
| `mix-page` | Mix page container |
| `mix-your-mixes` | Your Mixes section |
| `mix-create-card` | Create new mix card (visible only for premium users) |
| `mix-card-{mixId}` | Individual saved mix card (replace `{mixId}` with the actual mix ID) |

**Wizard Navigation:**

| data-testid | Description |
|-------------|-------------|
| `mix-step-select` | Artist selection step |
| `mix-step-configure` | Configuration step |
| `mix-step-result` | Result step |
| `mix-next-btn` | Next step button |
| `mix-configure-back-btn` | Back button in configure step |
| `mix-back-to-mixes-btn` | Back to mixes button in result step |
| `mix-done-btn` | Done/save button |

**Artist Selection:**

| data-testid | Description |
|-------------|-------------|
| `mix-artists-grid` | Artists selection grid |
| `mix-artist-{artistId}` | Individual artist in grid (replace `{artistId}` with the actual artist ID) |

**Configuration:**

| data-testid | Description |
|-------------|-------------|
| `mix-variety-low` | Low variety option |
| `mix-variety-medium` | Medium variety option |
| `mix-variety-high` | High variety option |
| `mix-discovery-familiar` | Familiar discovery option |
| `mix-discovery-blend` | Blend discovery option |
| `mix-discovery-discover` | Discover discovery option |
| `mix-filters` | Filters container |
| `mix-filter-popular` | Popular filter |
| `mix-filter-deep-cuts` | Deep Cuts filter |
| `mix-filter-new-releases` | New Releases filter |
| `mix-filter-pump-up` | Pump Up filter |
| `mix-filter-chill` | Chill filter |
| `mix-filter-upbeat` | Upbeat filter |
| `mix-filter-downbeat` | Downbeat filter |
| `mix-filter-focus` | Focus filter |

**Result:**

| data-testid | Description |
|-------------|-------------|
| `mix-title` | Mix title display |
| `mix-result-tracks` | Generated tracks list |

## Additional Information

- The maximum number of tracks in a generated mix is 20.
- There are 8 filter options: Popular, Deep cuts, New releases, Pump up, Chill, Upbeat, Downbeat, Focus.
- To manually reset the database, stop the running server and then restart it.
- The code repository may intentionally contain other issues that are unrelated to this specific task. Please focus only on the described task requirements and address bugs or errors directly associated with them.
- If you're using Run and Debug mode in the IDE, the frontend server may start before the backend (including database seeding) is ready. In that case, the frontend might not display any data. Please reload the preview once the backend setup is complete.
