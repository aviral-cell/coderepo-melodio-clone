# Melodio: Create Mix

## Overview

Melodio is a music streaming platform with a Mix feature that lets users create personalized track collections. The Mix page has a 3-step wizard: (1) select artists, (2) configure mix settings (variety, discovery, filters), and (3) generate and save the mix. Users can also view and manage their saved mixes.

Your task is to fix the mix creation feature. The page component (`MixPage.tsx`) is fully built and correct, and the backend API is fully implemented. However, the utility functions in `mixUtils.ts` are stubs returning empty values, and the hook in `useMixCreator.ts` has a no-op reducer, hardcoded mock data, and all methods are no-ops — making the entire wizard non-functional.

## API Contract

The backend is pre-built and fully working. These endpoints are provided for reference only — no backend changes are needed.

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
    "title": "The Amplifiers mix",
    "artistIds": ["artist-id-1"],
    "config": { "..." },
    "trackIds": ["track-id-1", "track-id-2"],
    "trackCount": 2,
    "coverImages": ["/images/artist1.jpg"],
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

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
      "title": "The Amplifiers mix",
      "trackCount": 10,
      "coverImages": ["/images/artist1.jpg"],
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

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

## Additional Information

- The `MixPage.tsx` component is fully built and read-only — it orchestrates the wizard by consuming `useMixCreator`.
- The backend (`backend/src/features/mixes/`) is pre-built and fully working — no backend changes are needed.
- All stubs are concentrated in `mixUtils.ts` (5 functions) and `useMixCreator.ts` (reducer + hook body).
- `MIX_LIMIT` is 20 — the maximum number of tracks in a generated mix.
- `FILTER_OPTIONS` has 8 options: Popular, Deep cuts, New releases, Pump up, Chill, Upbeat, Downbeat, Focus.
- `MixPage.handleDone()` calls `creator.generateAndAdvance()` then `creator.saveMix(trackIds)` — the hook must return the generated tracks synchronously from `generateAndAdvance()`.
- `tracksService.getAll()` and `artistsService.getAll()` return paginated responses with an `items` field.
- `mixService.getAll()` and `mixService.create()` return the data directly (not paginated).
- To manually reset the database, stop the running server and then restart it.
- The code repository may intentionally contain other issues that are unrelated to this specific task. Please focus only on the described task requirements and address bugs or errors directly associated with them.
- If you're using Run and Debug mode in the IDE, the frontend server may start before the backend (including database seeding) is ready. In that case, the frontend might not display any data. Please reload the preview once the backend setup is complete.
