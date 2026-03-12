# Feature: Copy Playlist

`Easy`

## Overview

**Skills:** Node.js (Basic)
**Recommended Duration:** 20 mins

This backend development question evaluates Node.js, data duplication, and playlist management concepts, ideal for junior-level roles. The task requires implementing a playlist copy feature that duplicates playlists into a user's library in a music streaming app.

Melodio is a music streaming app where users can create playlists to organize their favorite tracks. To help users quickly build their music collections, the platform should allow users to copy any public playlist (or their own private playlists) into their library. The copied playlist becomes a private, independent copy that the user can modify freely.

Currently, the copy playlist feature exists in the application but is not implemented — it returns empty responses.

[SS]

## Product Requirements

- Users should be able to copy any public playlist into their own library.
- Users should be able to copy their own private playlists.
- Users should not be able to copy another user's private playlist — a clear error message should be displayed.
- The copied playlist should have a default name of "Copy of {originalName}" unless a custom name is provided.
- The copied playlist should always be set to private, regardless of the original's visibility.
- All tracks from the original playlist should be copied to the new playlist, preserving their order.
- The new playlist should be owned by the user who initiated the copy.
- Free users are limited to 7 playlists. If the limit is reached, the copy should be rejected with a clear error message.

## Steps to Test Functionality

- Log in using test credentials:
  ```
  Email: alex.morgan@melodio.com
  Password: password123
  ```
- Navigate to a public playlist from another user.
- Click the "Copy Playlist" button.
- Observe that the playlist is copied with the name "Copy of {original name}."
- Verify the copied playlist appears in your library as a private playlist.
- Open the copied playlist and verify all tracks from the original are present in the same order.
- Try copying the same playlist again with a custom name — observe the custom name is used.
- Try to copy another user's private playlist — observe a 403 error.
- If you are a free user with 7 playlists, attempt to copy another playlist — observe a 403 error about the playlist limit.

**Note:** Make sure to review the `technical-specs/CopyPlaylist.md` file carefully to understand all the specifications and expected behavior.
