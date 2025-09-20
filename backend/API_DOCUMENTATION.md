# Hackify API - Core Endpoints Documentation

This document describes the core API endpoints for the Hackify API, a music service built with NestJS, Prisma ORM, and PostgreSQL.

### Search Songs

```http
GET /search?q=rock&limit=10&offset=0
```

**Query Parameters:**

- `q` (required): Search term
- `limit` (optional): Number of results (1-100, default: 10)
- `offset` (optional): Pagination offset (default: 0)

**Example:**

```bash
curl "http://localhost:3000/search?q=queen&limit=5"
```

### Like a Song (Add to Playlist)

```http
POST /liked
Content-Type: application/json

{
  "songId": "song_id_here",
  "userId": "user_001"
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/liked \
  -H "Content-Type: application/json" \
  -d '{"songId": "song_123", "userId": "user_001"}'
```

### Remove Liked Song

```http
DELETE /liked?id=song_id&userId=user_001
```

**Query Parameters:**

- `id` (required): Song ID to remove
- `userId` (required): User ID

**Example:**

```bash
curl -X DELETE "http://localhost:3000/liked?id=song_123&userId=user_001"
```

### Get Liked Songs

```http
GET /liked?userId=user_001&cursor=2024-01-01T00:00:00.000Z&limit=10
```

**Query Parameters:**

- `userId` (required): User ID
- `cursor` (optional): Cursor for pagination (ISO date string)
- `limit` (optional): Number of results (1-100, default: 10)

**Example:**

```bash
curl "http://localhost:3000/liked?userId=user_001&limit=10"
```

### Get User by ID

```http
GET /users/user_001
```

**Path Parameters:**

- `userId` (required): The unique identifier of the user

**Example:**

```bash
curl "http://localhost:3000/users/user_001"
```