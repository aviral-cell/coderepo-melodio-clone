# Hackify API - Core Endpoints Documentation

This document describes the core API endpoints for the Hackify API, a music service built with NestJS, Prisma ORM, and MongoDB.

## Overview

The Hackify API provides endpoints for:

- **Search**: Find songs by title, artist, or album
- **Playlist Management**: Create and manage multiple playlists per user
- **User Management**: Get user information

## Database Schema

The API uses a playlist-based system where users can create multiple named playlists. Each playlist can contain multiple songs, and the same song can exist in multiple playlists for the same user.

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

## Playlist Management

### Add Song to Playlist

```http
POST /playlist
Content-Type: application/json

{
  "songId": "song_id_here",
  "userId": "user_001",
  "playlistName": "My Playlist"
}
```

**Request Body:**

- `songId` (required): The ID of the song to add
- `userId` (required): The ID of the user
- `playlistName` (required): The name of the playlist

**Example:**

```bash
curl -X POST http://localhost:3000/playlist \
  -H "Content-Type: application/json" \
  -d '{"songId": "song_123", "userId": "user_001", "playlistName": "Liked Songs"}'
```

**Response:**

```json
{
  "success": true,
  "message": "Song added to \"Liked Songs\" playlist successfully",
  "data": {
    "id": "playlist_entry_id",
    "playlistName": "Liked Songs",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "song": {
      "id": "song_123",
      "title": "Bohemian Rhapsody",
      "artist": "Queen",
      "album": "A Night at the Opera",
      "duration": 355
    }
  }
}
```

### Remove Song from Playlist

```http
DELETE /playlist?songId=song_id&userId=user_001&playlistName=My%20Playlist
```

**Query Parameters:**

- `songId` (required): Song ID to remove
- `userId` (required): User ID
- `playlistName` (required): Name of the playlist

**Example:**

```bash
curl -X DELETE "http://localhost:3000/playlist?songId=song_123&userId=user_001&playlistName=Liked%20Songs"
```

**Response:**

```json
{
  "success": true,
  "message": "Song removed from \"Liked Songs\" playlist successfully"
}
```

### Get Songs from Playlist

```http
GET /playlist?userId=user_001&playlistName=My%20Playlist&cursor=2024-01-01T00:00:00.000Z&limit=10
```

**Query Parameters:**

- `userId` (required): User ID
- `playlistName` (required): Name of the playlist
- `cursor` (optional): Cursor for pagination (ISO date string)
- `limit` (optional): Number of results (1-100, default: 10)

**Example:**

```bash
curl "http://localhost:3000/playlist?userId=user_001&playlistName=Liked%20Songs&limit=10"
```

**Response:**

```json
{
  "data": [
    {
      "id": "playlist_entry_id",
      "playlistName": "Liked Songs",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "song": {
        "id": "song_123",
        "title": "Bohemian Rhapsody",
        "artist": "Queen",
        "album": "A Night at the Opera",
        "duration": 355
      }
    }
  ],
  "nextCursor": "2024-01-14T15:45:00.000Z",
  "hasMore": true,
  "total": 12
}
```

### Get All User Playlists

```http
GET /playlist/user?userId=user_001
```

**Query Parameters:**

- `userId` (required): User ID

**Example:**

```bash
curl "http://localhost:3000/playlist/user?userId=user_001"
```

**Response:**

```json
{
  "data": [
    {
      "playlistName": "Liked Songs",
      "songCount": 12,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "playlistName": "Gym Playlist",
      "songCount": 7,
      "createdAt": "2024-01-14T15:45:00.000Z"
    },
    {
      "playlistName": "Late Night Drive",
      "songCount": 3,
      "createdAt": "2024-01-13T20:15:00.000Z"
    }
  ],
  "total": 3
}
```

## User Management

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

**Response:**

```json
{
  "id": "user_001",
  "email": "hackerrank@example.com",
  "username": "hackerrank_music",
  "firstName": "George",
  "lastName": "Chen",
  "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

## Error Handling

The API returns standard HTTP status codes and error messages:

### Common Error Responses

**400 Bad Request:**

```json
{
  "statusCode": 400,
  "message": ["playlistName should not be empty"],
  "error": "Bad Request"
}
```

**404 Not Found:**

```json
{
  "statusCode": 404,
  "message": "User with ID user_999 not found",
  "error": "Not Found"
}
```

**409 Conflict:**

```json
{
  "statusCode": 409,
  "message": "Song is already in your \"Liked Songs\" playlist",
  "error": "Conflict"
}
```

## Playlist System Features

### Key Features:

- **Multiple Playlists**: Users can create unlimited named playlists
- **Duplicate Prevention**: Same song cannot be added twice to the same playlist
- **Cross-Playlist Songs**: Same song can exist in multiple playlists
- **Pagination**: Cursor-based pagination for large playlists
- **Playlist Overview**: Get all user playlists with song counts

### Example Playlist Workflow:

1. **Create a playlist** by adding the first song:

   ```bash
   POST /playlist
   {
     "songId": "song_123",
     "userId": "user_001",
     "playlistName": "My New Playlist"
   }
   ```

2. **Add more songs** to the same playlist:

   ```bash
   POST /playlist
   {
     "songId": "song_456",
     "userId": "user_001",
     "playlistName": "My New Playlist"
   }
   ```

3. **View all your playlists**:

   ```bash
   GET /playlist/user?userId=user_001
   ```

4. **Get songs from a specific playlist**:

   ```bash
   GET /playlist?userId=user_001&playlistName=My%20New%20Playlist
   ```

5. **Remove a song from playlist**:
   ```bash
   DELETE /playlist?songId=song_123&userId=user_001&playlistName=My%20New%20Playlist
   ```
