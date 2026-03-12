# Melodio: Artist Follow & Rating

## Overview

Melodio is a music streaming platform where users can interact with artists by following them and rating their work. The follow feature toggles the user's follow status for an artist and tracks follower counts, while the rating feature lets users rate artists on a 0.5-to-5 scale with aggregate statistics.

Your task is to fix the artist interaction feature. The routes, controllers, and services exist but contain bugs that prevent correct behavior — the follow toggle, rating upsert, aggregation logic, and interaction status retrieval all need to be corrected.

## API Contract

### POST /api/artists/:id/follow

**Purpose:** Toggle follow/unfollow for an artist

**Auth:** Required (Bearer token)

**URL Parameters:**
- `:id` - Artist ObjectId

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "isFollowing": true,
    "followerCount": 42
  }
}
```

**Follow/Unfollow Rules:**
- If the user is **not** currently following the artist: create an `ArtistFollow` document and increment the artist's `follower_count` by 1.
- If the user **is** currently following the artist: delete the `ArtistFollow` document and decrement the artist's `follower_count` by 1.
- `isFollowing` reflects the state **after** the toggle (true if just followed, false if just unfollowed).
- `followerCount` reflects the **updated** count after the operation.

**Error Responses:**
- 400 - Invalid artist ID format
- 401 - Unauthorized
- 404 - Artist not found

---

### POST /api/artists/:id/rate

**Purpose:** Rate an artist (upsert — creates or updates the user's rating)

**Auth:** Required (Bearer token)

**URL Parameters:**
- `:id` - Artist ObjectId

**Request Body:**
```json
{
  "rating": 4.5
}
```

**Validation Rules:**
- `rating` (required): Must be a number between 0.5 and 5 (inclusive).
- `rating` must be in 0.5 increments (e.g., 0.5, 1.0, 1.5, ..., 4.5, 5.0).

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userRating": 4.5,
    "averageRating": 3.8,
    "totalRatings": 15
  }
}
```

**Rating Rules:**
- Use `findOneAndUpdate` with upsert on `user_id` (from auth) and `artist_id` (from params) to create or update the rating.
- After upserting, compute `averageRating` using a MongoDB aggregation with `$avg` (not `$sum`) on the `rating` field, matching on the `artist_id`.
- `totalRatings` is the count of all rating documents for the artist.

**Error Responses:**
- 400 - Invalid artist ID format
- 400 - Invalid rating value (out of range or not a 0.5 increment)
- 401 - Unauthorized
- 404 - Artist not found

---

### GET /api/artists/:id/interaction

**Purpose:** Get the authenticated user's interaction state with an artist

**Auth:** Required (Bearer token)

**URL Parameters:**
- `:id` - Artist ObjectId

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "isFollowing": true,
    "userRating": 4.5,
    "averageRating": 3.8,
    "totalRatings": 15
  }
}
```

**Response Rules:**
- `isFollowing`: `true` if an `ArtistFollow` document exists for the `user_id` + `artist_id` pair, otherwise `false`.
- `userRating`: The user's rating from the `ArtistRating` document, or `0` if no rating exists.
- `averageRating`: Computed via aggregation with `$avg` on all ratings for the artist.
- `totalRatings`: Count of all rating documents for the artist.

**Error Responses:**
- 400 - Invalid artist ID format
- 401 - Unauthorized
- 404 - Artist not found

## Additional Information

- The aggregation for average rating must use `$avg` (not `$sum`) to compute the correct average.
- The `followerCount` in the follow response must reflect the count **after** the increment/decrement, not before.
- To manually reset the database, stop the running server and then restart it.
- The code repository may intentionally contain other issues that are unrelated to this specific task. Please focus only on the described task requirements and address bugs or errors directly associated with them.
- If you're using Run and Debug mode in the IDE, the frontend server may start before the backend (including database seeding) is ready. In that case, the frontend might not display any data. Please reload the preview once the backend setup is complete.
