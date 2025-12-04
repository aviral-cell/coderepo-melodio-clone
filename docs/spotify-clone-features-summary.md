# Spotify Clone — Feature Summary

**Purpose:** HackerRank debugging challenge  
**Total Features:** 7 (3 frontend + 4 full-stack)

---

## Frontend Features

### 1. Music Player with Queue

A simulated music player with standard controls: play, pause, skip forward/back, shuffle, and repeat. Users can view the current queue, remove tracks, and reorder them via drag-and-drop. Playback is simulated (no actual audio) — a timer counts elapsed time until the track "ends," then auto-advances.

**User Actions:**
- Play/pause current track
- Skip to next or previous track
- Toggle shuffle on/off
- Toggle repeat modes (off, repeat all, repeat one)
- Reorder or remove tracks from queue

---

### 2. Playlist Management

Users can create, rename, and delete playlists. Within a playlist, users can add tracks, remove tracks, and reorder them via drag-and-drop. Changes save to the backend.

**User Actions:**
- Create new playlist
- Rename or delete existing playlist
- Add/remove tracks
- Drag-and-drop to reorder tracks

---

### 3. Search with Autocomplete

A search bar that shows results as the user types. Results are grouped by category (tracks, albums, artists). Typing is debounced to avoid excessive requests.

**User Actions:**
- Type in search bar
- View categorized dropdown results
- Click result to navigate

---

## Full-Stack Features

### 4. Discover Weekly (Personalized Recommendations)

The system generates a personalized playlist for each user based on their listening history. It recommends tracks the user hasn't heard yet but are similar to what they enjoy — same genres, same artists, or popular among users with similar taste.

**User Experience:**
- User visits "Discover Weekly" section
- System displays a curated playlist of ~30 recommended tracks
- Recommendations differ per user based on their history

---

### 5. Listening Analytics Dashboard

A stats page showing the user's listening habits: top 5 artists, top 5 genres, total listening time, most active day of the week, and current listening streak (consecutive days with activity).

**User Experience:**
- User visits "Your Stats" or "Wrapped" section
- Sees visualized breakdown of their listening behavior
- Stats update as listening history grows

---

### 6. Smart Queue Recommendations

When a track plays, the system suggests 5 "up next" tracks. Recommendations prioritize: next track on the same album, other songs by the same artist, similar genre, or tracks commonly played after the current one.

**User Experience:**
- User plays a track
- "Up Next" section shows 5 recommended tracks
- User can add recommendations to queue with one click

---

### 7. Trending Tracks Leaderboard

A global leaderboard showing the top 20 trending tracks. Ranking uses a time-weighted score — recent plays count more than older plays. A track with 100 plays this week ranks higher than a track with 200 plays last month.

**User Experience:**
- User visits "Trending" section
- Sees top 20 tracks ranked by current popularity
- Leaderboard updates as new plays come in

---

## Summary

| # | Feature | Type |
|---|---------|------|
| 1 | Music Player with Queue | Frontend |
| 2 | Playlist Management | Frontend |
| 3 | Search with Autocomplete | Frontend |
| 4 | Discover Weekly | Full-Stack |
| 5 | Listening Analytics Dashboard | Full-Stack |
| 6 | Smart Queue Recommendations | Full-Stack |
| 7 | Trending Tracks Leaderboard | Full-Stack |

---

*Pending: Bug specifications (to be defined after feature approval)*
