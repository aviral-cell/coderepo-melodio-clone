**Bug Fix: Playlist Operations - Easy**

Melodio is a music streaming app where users can create playlists, add tracks, and manage their collections. Users should be able to remove tracks from playlists, create playlists with a visibility setting (public or private), and control playback of tracks within a playlist. However, several parts of the playlist feature are currently broken.

**Issue Summary**

When a user tries to remove a track from a playlist, the removal fails immediately without even attempting to contact the server. Even if the removal were to reach the backend, it would fail because the request is sent using the wrong HTTP method. Additionally, when creating a new playlist, there is no option to set the playlist's visibility — users cannot choose between public and private. Finally, when a track is paused and the user clicks it again, instead of resuming playback, it restarts the track from the beginning.

**Steps to Reproduce**

* Log in using test credentials:
  * Email: alex.morgan@melodio.com
  * Password: password123
* Navigate to any playlist that you own.
* Click the menu on any track and select "Remove" — observe that the removal fails with an error.
* Try creating a new playlist — observe that there is no option to set it as public or private.
* Play a track from a playlist, then pause it. Click the same track again — observe that it restarts instead of resuming.

**Expected Behavior**

* Removing a track from a playlist should send the correct request to the server and remove the track successfully.
* When creating a playlist, users should be able to choose between Public and Private visibility.
* Clicking a paused track should resume playback from where it was paused, not restart it.

**Note:** Make sure to review the technical-specs/PlaylistOperations.md file carefully to understand all the specifications and expected behavior.
