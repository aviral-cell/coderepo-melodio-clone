# Bug Fix: Playlist Track Removal

`Easy`

## Overview

**Skills:** React (Basic)
**Recommended Duration:** 20 mins

This subjective question evaluates React, playlist management, and user interface concepts, ideal for junior-level roles. The problem requires identifying and fixing a bug where users cannot remove tracks from their playlists in a music app.

Melodio is a music app where users build playlists, add their favorite tracks, and organize their own vibe. Playlists are a big part of how users personalize their listening experience. Right now, there's a major friction point: users can't remove tracks from their playlists, which makes the whole playlist experience feel broken.

![Playlist track removal issue](https://hrcdn.net/s3_pub/istreet-assets/xhgddiBsP5syx83u7MLOtg/Screenshot_2025-12-16_at_5.33.06%E2%80%AFPM.png)

## Issue Summary

When a user clicks the remove button on a track, the playlist does not update and the track remains visible. Users expect the track to be removed immediately, but the action has no effect.

## Steps to Reproduce

- Log in using test credentials:
  ```
  Email: alex.morgan@melodio.com
  Password: password123
  ```
- Navigate to the existing playlist named Playlist 1 from the sidebar.
  ![Playlist sidebar navigation](https://hrcdn.net/s3_pub/istreet-assets/nOd9wFkz3AdoKJqCyUvTiQ/Screenshot_2025-12-16_at_5.33.31%E2%80%AFPM.png)
- Hover over any track and you will see a three-dots menu appear.
  ![Three-dots menu on track](https://hrcdn.net/s3_pub/istreet-assets/5BU0CnlSHCjyXbYa1brJ-g/Screenshot_2025-12-16_at_5.35.29%E2%80%AFPM.png)
- Click the three-dots menu, select Remove from playlist, and observe that the track is not removed.

## Expected Behavior

- When clicking remove, the track should immediately disappear from the UI.
- The API should be called to persist the removal.
- On success, a success message should appear.
- On failure, the track should reappear in its original position (rollback), and an error message should appear.

**Note:** Make sure to review the `technical-specs/PlaylistTrackRemoval.md` file carefully to understand all the specifications and expected behavior.
