# Melodio: Live Music Concerts

## Overview

Melodio is a music streaming platform with a Live Music Concerts feature that lets users browse upcoming concerts, filter by month and city, view concert details, buy tickets, and explore the performing artist's albums and tracks. The concerts page displays upcoming events sorted by date, with a city-based artist discovery section. The concert detail page shows event information, ticket purchasing with quantity selection, and the artist's music catalog.

Your task is to fix the concerts feature. The page components (`ConcertsPage.tsx` and `ConcertDetailPage.tsx`) are fully built and correct, and the backend API is fully implemented. However, the utility functions in `concertUtils.ts` and the hooks in `useConcerts.ts` contain bugs that make the entire feature non-functional.

## API Contract

The backend is pre-built and fully working. These endpoints are provided for reference only — no backend changes are needed.

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
        "imageUrl": "/images/artists/amplifiers.jpg"
      },
      "venue": "Madison Square Garden",
      "city": "New York",
      "date": "2026-03-15",
      "time": "19:30",
      "coverImage": "/images/concerts/msg.jpg",
      "maxTicketsPerUser": 6,
      "tickets": [],
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

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
    "artistId": { "_id": "artist-id", "name": "The Amplifiers", "imageUrl": "/images/artists/amplifiers.jpg" },
    "venue": "Madison Square Garden",
    "city": "New York",
    "date": "2026-03-15",
    "time": "19:30",
    "coverImage": "/images/concerts/msg.jpg",
    "maxTicketsPerUser": 6,
    "tickets": [
      {
        "userId": "user-id",
        "quantity": 2,
        "ticketCodes": ["CONC-0001-abc123", "CONC-0001-def456"],
        "purchasedAt": "2026-01-15T10:00:00Z"
      }
    ]
  }
}
```

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

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "concert": { "...updated concert with new ticket appended..." },
    "userTickets": [ "...user's ticket records..." ]
  }
}
```

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
      "purchasedAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

## Additional Information

- The `ConcertsPage.tsx` and `ConcertDetailPage.tsx` components are fully built and read-only — they orchestrate the feature by consuming `useConcertListing` and `useConcertDetail`.
- The backend (`backend/src/features/concerts/`) is pre-built and fully working — no backend changes are needed.
- All bugs are concentrated in `concertUtils.ts` (utility function bugs) and `useConcerts.ts` (hook bugs).
- `MAX_TICKETS_PER_USER` is 6 — each user can purchase up to 6 tickets per concert.
- `CONCERT_CITIES` defines 5 cities: New York, Las Vegas, Los Angeles, Chicago, Miami.
- The `Concert` type has `artistId` as a populated object with `_id`, `name`, and `imageUrl` fields.
- A `ConcertTicket` record has `userId`, `quantity`, `ticketCodes` (array of strings), and `purchasedAt` (ISO date string).
- The `ConcertsPage` splits the formatted date string on space to extract month and day for the date badge — the format must be "Mon Day" (e.g., "Mar 15") for the badge to render correctly.
- `artistsService.getAll()`, `albumsService.getAll()`, and `tracksService.getAll()` return paginated responses with an `.items` field.
- To manually reset the database, stop the running server and then restart it.
- The code repository may intentionally contain other issues that are unrelated to this specific task. Please focus only on the described task requirements and address bugs or errors directly associated with them.
- If you're using Run and Debug mode in the IDE, the frontend server may start before the backend (including database seeding) is ready. In that case, the frontend might not display any data. Please reload the preview once the backend setup is complete.
