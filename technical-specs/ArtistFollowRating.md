# Melodio: Artist Follow & Rating

## Overview

Melodio is a music streaming app where users can follow their favorite artists and rate them. Following an artist subscribes the user to updates, and ratings contribute to the artist's overall community score. These interactions are tracked per user and displayed on artist profile pages.

At the moment, the artist follow and rating system is completely broken because there are bugs present that prevent it from working correctly.

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

**Error Response:**
```json
{
  "success": false,
  "error": "<message>"
}
```

- 400 - "Invalid artist ID format"
- 401 - "Unauthorized"
- 404 - "Artist not found"

---

### POST /api/artists/:id/rate

**Purpose:** Rate an artist

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

**Error Response:**
```json
{
  "success": false,
  "error": "<message>"
}
```

- 400 - "Invalid artist ID format"
- 400 - "Rating must be between 0.5 and 5.0 in 0.5 increments"
- 401 - "Unauthorized"
- 404 - "Artist not found"

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

**Error Response:**
```json
{
  "success": false,
  "error": "<message>"
}
```

- 400 - "Invalid artist ID format"
- 401 - "Unauthorized"
- 404 - "Artist not found"

## Additional Information

- The aggregation for average rating must compute the correct average.
- To manually reset the database, stop the running server and then restart it.
- The code repository may intentionally contain other issues that are unrelated to this specific task. Please focus only on the described task requirements and address bugs or errors directly associated with them.
- If you're using Run and Debug mode in the IDE, the frontend server may start before the backend (including database seeding) is ready. In that case, the frontend might not display any data. Please reload the preview once the backend setup is complete.
