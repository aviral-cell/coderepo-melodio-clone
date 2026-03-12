**Bug Fix: Track Like Dislike - Medium**

Melodio is a music streaming app where users can like or dislike individual tracks. Liked tracks are saved to a personal collection for easy access, and the like/dislike status is shown on track cards throughout the app. Users can also remove their reaction entirely. The feature supports pagination for the liked tracks list.

At the moment, the track like/dislike system is extensively broken. Liking a track actually triggers a dislike, disliking triggers a like, the liked tracks list displays incorrect data, pagination is ignored, and the like status indicator does not reflect the actual state.

**Issue Summary**

When a user clicks "Like" on a track, the request either fails or the track is disliked instead. Clicking "Dislike" does the opposite — it likes the track. Liking the same track twice causes an error instead of updating the existing reaction. The server does not check whether the track exists before processing the reaction.

The liked tracks page includes both liked and disliked tracks instead of showing only likes. The list is sorted with the oldest reactions first instead of the most recent. Track details (title, description, artist, album) are all mixed up — the wrong data appears in the wrong fields. Pagination parameters from the URL are ignored, and a hardcoded limit is used instead.

The like status indicator always reports the same status regardless of the actual state because it returns a hardcoded value instead of querying the database.

**Steps to Reproduce**

* Log in using test credentials:
  * Email: alex.morgan@melodio.com
  * Password: password123
* Navigate to any track or album page.
* Click the "Like" button on a track — observe that the request fails or the track is disliked instead.
* Click the "Dislike" button — observe that the track is liked instead.
* Navigate to the Liked Tracks page — observe incorrect metadata and mixed-in disliked tracks.
* Like a track, then refresh — observe the like status indicator does not reflect the actual state.

**Expected Behavior**

* Clicking "Like" should set the reaction to "like." Clicking "Dislike" should set it to "dislike."
* Both operations should update an existing reaction rather than create duplicates.
* The track must exist in the database — reacting to a non-existent track should return a 404 error.
* The liked tracks page should show only liked tracks, sorted by most recently liked first.
* Track details should display the correct title, description, artist, and album information.
* Pagination should respect the page and limit parameters from the request.
* The like status endpoint should return the user's actual reaction for the specified track.

**Note:** Make sure to review the technical-specs/TrackLikeDislike.md file carefully to understand all the specifications and expected behavior.
