# Melodio: Live Music Concerts

## Overview

Melodio is a music streaming app with a Live Music Concerts feature that lets users browse upcoming concerts, filter by month and city, view concert details, buy tickets, and explore the performing artist's albums and tracks.

At the moment, the concerts feature is extensively broken. Concert cards are missing dates and times, filters don't work, and the detail page has multiple issues with ticket purchasing and artist content.

## API Contract

### GET /api/concerts

**Purpose:** Get all upcoming concerts

**Auth:** Required (Bearer token)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "concert-id",
      "artistId": {
        "_id": "artist-id",
        "name": "The Amplifiers",
        "imageUrl": "/images/artists/amplifiers.jpg",
        "genres": ["Rock", "Alternative"]
      },
      "venue": "Madison Square Garden",
      "city": "New York",
      "date": "2026-03-15T00:00:00.000Z",
      "time": "19:30",
      "coverImage": "/images/concerts/msg.jpg",
      "maxTicketsPerUser": 6,
      "tickets": [],
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
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

---

### GET /api/concerts/:id

**Purpose:** Get a single concert by ID

**Auth:** Required (Bearer token)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "concert-id",
    "artistId": { "_id": "artist-id", "name": "The Amplifiers", "imageUrl": "/images/artists/amplifiers.jpg", "genres": ["Rock", "Alternative"] },
    "venue": "Madison Square Garden",
    "city": "New York",
    "date": "2026-03-15T00:00:00.000Z",
    "time": "19:30",
    "coverImage": "/images/concerts/msg.jpg",
    "maxTicketsPerUser": 6,
    "tickets": [
      {
        "userId": "user-id",
        "quantity": 2,
        "ticketCodes": ["CONC-0001-abc123", "CONC-0001-def456"],
        "purchasedAt": "2026-01-15T10:00:00.000Z"
      }
    ]
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

- 400 - "Invalid concert ID format"
- 401 - "Unauthorized"
- 404 - "Concert not found"
- 500 - "An error occurred"

---

### POST /api/concerts/:id/tickets

**Purpose:** Buy tickets for a concert

**Auth:** Required (Bearer token)

**Request Body:**
```json
{
  "quantity": 2
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "concert": { "..." },
    "userTickets": [ "...user's ticket records..." ]
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

- 400 - "Invalid concert ID format"
- 400 - "Quantity must be an integer between 1 and 6"
- 400 - "Cannot exceed N tickets per user. You already have M tickets."
- 401 - "Unauthorized"
- 404 - "Concert not found"
- 500 - "An error occurred"

---

### GET /api/concerts/:id/tickets

**Purpose:** Get the authenticated user's tickets for a concert

**Auth:** Required (Bearer token)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "userId": "user-id",
      "quantity": 2,
      "ticketCodes": ["CONC-0001-abc123", "CONC-0001-def456"],
      "purchasedAt": "2026-01-15T10:00:00.000Z"
    }
  ]
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "<message>"
}
```

- 400 - "Invalid concert ID format"
- 401 - "Unauthorized"
- 404 - "Concert not found"
- 500 - "An error occurred"

## Testing Requirements

The component includes specific data-testid attributes required for automated test execution. These identifiers must not be modified:

**Concerts Listing Page:**

| data-testid | Description |
|-------------|-------------|
| `concerts-page` | Concerts listing page container |
| `concerts-upcoming` | Upcoming concerts section |
| `concerts-card-{concertId}` | Individual concert card (replace `{concertId}` with the actual concert ID) |
| `concerts-card-date-{concertId}` | Date badge on concert card |
| `concerts-card-time-{concertId}` | Time display on concert card |
| `concerts-month-filter` | Month filter dropdown |
| `concerts-month-option-{monthIndex}` | Month filter option (replace `{monthIndex}` with 0-based month index, e.g., `0` for All, `3` for March) |
| `concerts-city-chips` | City filter chip container |
| `concerts-city-chip-{city}` | City filter chip (replace `{city}` with kebab-case city name, e.g., `new-york`) |
| `concerts-artist-{artistId}` | Artist entry in city section (replace `{artistId}` with the actual artist ID) |

**Concert Detail Page:**

| data-testid | Description |
|-------------|-------------|
| `concert-detail-date` | Concert date display |
| `concert-detail-time` | Concert time display |
| `concert-detail-albums` | Artist's albums section |
| `concert-detail-album-{albumId}` | Individual album entry (replace `{albumId}` with the actual album ID) |
| `concert-detail-tracks` | Artist's tracks section |
| `concert-detail-track-{trackId}` | Individual track entry (replace `{trackId}` with the actual track ID) |
| `concert-detail-ticket-count` | Ticket count display (e.g., "0/6 tickets") |
| `concert-detail-buy-btn` | Buy tickets button |
| `concert-detail-view-tickets-btn` | View purchased tickets button |

**Ticket Purchase Dialog:**

| data-testid | Description |
|-------------|-------------|
| `concert-buy-dialog` | Ticket purchase dialog |
| `concert-buy-available` | Available tickets display |
| `concert-buy-quantity` | Current quantity display |
| `concert-buy-increment` | Increment quantity button |
| `concert-buy-decrement` | Decrement quantity button |
| `concert-buy-confirm` | Confirm purchase button |

**View Tickets Dialog:**

| data-testid | Description |
|-------------|-------------|
| `concert-tickets-dialog` | View tickets dialog |
| `concert-ticket-{ticketCode}` | Individual ticket entry (replace `{ticketCode}` with the actual ticket code) |

## Additional Information

- Each user can purchase up to 6 tickets per concert.
- To manually reset the database, stop the running server and then restart it.
- The code repository may intentionally contain other issues that are unrelated to this specific task. Please focus only on the described task requirements and address bugs or errors directly associated with them.
- If you're using Run and Debug mode in the IDE, the frontend server may start before the backend (including database seeding) is ready. In that case, the frontend might not display any data. Please reload the preview once the backend setup is complete.
