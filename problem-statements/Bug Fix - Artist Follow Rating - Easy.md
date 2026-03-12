**Bug Fix: Artist Follow Rating - Easy**

Melodio is a music streaming app where users can follow their favorite artists and rate them. Following an artist subscribes the user to updates, and ratings contribute to the artist's overall community score. These interactions are tracked per user and displayed on artist profile pages.

At the moment, the artist follow and rating system is completely broken. Following an artist produces incorrect follower counts, rating an artist calculates the wrong average, and retrieving a user's interaction with an artist returns incorrect data.

**Issue Summary**

When a user tries to follow an artist, the request fails because the server looks for the artist ID in the wrong place. The same issue affects the rating and interaction endpoints — all three fail before any processing occurs. Even if the ID issue is resolved, following an artist changes the follower count in the wrong direction (following decreases the count, unfollowing increases it). The returned follower count is always one step behind because it reflects the value before the update. Ratings are stored against the wrong entities due to swapped fields, and the "average" rating is actually computed as a sum. The interaction status always reports the user as "not following" regardless of the actual state. Invalid ratings outside the allowed range are accepted without error.

**Steps to Reproduce**

* Log in using test credentials:
  * Email: alex.morgan@melodio.com
  * Password: password123
* Navigate to any artist's profile page.
* Click the "Follow" button — observe that the request fails or the follower count changes in the wrong direction.
* Try to rate the artist — observe that the request fails or the rating is not calculated correctly.
* Refresh the page — observe that the interaction data does not reflect your actions.
* Try rating with an invalid value (e.g., 0 or 6) — observe that it is accepted without error.

**Expected Behavior**

* Following an unfollowed artist should increment the follower count by 1. Unfollowing should decrement by 1.
* The returned follower count should reflect the updated value, not the stale value before the change.
* Ratings should be between 0.5 and 5 in 0.5 increments. Invalid values should be rejected.
* The average rating should be a true average (not a sum).
* The interaction endpoint should return the correct follow status and rating data.
* If the artist does not exist, all endpoints should return a 404 error.

**Note:** Make sure to review the technical-specs/ArtistInteraction.md file carefully to understand all the specifications and expected behavior.
