# Feature: Recently Played Tracks

`Easy`

## Overview

**Skills:** Node.js (Basic)
**Recommended Duration:** 20 mins

This backend development question evaluates Node.js, history tracking, and data retrieval concepts, ideal for junior-level roles. The task requires implementing a play history feature that records and displays recently played tracks in a music streaming app.

Melodio is a music streaming app that lets users discover and listen to music. To help users revisit tracks they have recently enjoyed, the platform should maintain a play history and display recently played tracks with full details including artist and album information.

Currently, the recently played feature exists in the application but is not implemented — plays are not recorded, history always returns empty, and clearing history does nothing.

[SS]

## Product Requirements

- When a user plays a track, the play should be recorded in their history with a timestamp.
- The system should validate that the track exists before recording — non-existent tracks should return a 404 error.
- Playing the same track multiple times should create separate history entries.
- The system should enforce a maximum history size of 50 entries per user. When the limit is reached, the oldest entry should be removed to make room.
- Users should be able to retrieve their recently played tracks, sorted by most recent first, with full track details including artist name and album title.
- The response should include a total count representing all history entries for the user.
- Users should be able to clear their entire play history.

## Steps to Test Functionality

- Log in using test credentials:
  ```
  Email: alex.morgan@melodio.com
  Password: password123
  ```
- Play several tracks from different albums and artists.
- Navigate to the "Recently Played" page from the sidebar.
- Observe that all played tracks appear in the list, sorted by most recently played first.
- Verify each track shows the title, artist name, album title, and duration.
- Play the same track again and verify it appears at the top of the list as a new entry.
- Click "Clear History" and verify the list becomes empty.
- Play a track again after clearing and verify it appears in the list.

**Note:** Make sure to review the `technical-specs/RecentlyPlayed.md` file carefully to understand all the specifications and expected behavior.
