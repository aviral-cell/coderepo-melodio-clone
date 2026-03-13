# Bug Fix: Artist Follow & Rating

`Easy`

## Overview

**Skills:** Node.js (Basic)
**Recommended Duration:** 20 mins

Melodio is a music streaming app where users can follow their favorite artists and rate them. Following an artist subscribes the user to updates, and ratings contribute to the artist's overall community score. These interactions are tracked per user and displayed on artist profile pages.

At the moment, the artist follow and rating system is completely broken because there are bugs present that prevent it from working correctly.

[SS]

## Issue Summary

When a user tries to follow an artist, the follow button doesn't work and the same is with the rating system. Your task is to fix these backend issues so the artist follow and rating system works smoothly end-to-end.

## Steps to Reproduce

- Log in using test credentials:
  ```
  Email: alex.morgan@melodio.com
  Password: password123
  ```
- Click on any track to navigate to the track details page.
[SS]
- Click on the Artist hyperlink to navigate to any artist's profile page.
[SS]
- Click the "Follow" button — observe the button is unresponsive.
- Try to rate the artist — observe that is not captured.
[SS]

## Expected Behavior

- Following an unfollowed artist should increment the follower count by 1. Unfollowing should decrement by 1.
- Ratings should be between 0.5 and 5 in 0.5 increments.
- The average rating should be a true average (not a sum).
- The interaction endpoint should return the correct follow status and rating data.
- If the artist does not exist, all endpoints should return a 404 error.

**Note:** Make sure to review the `technical-specs/ArtistInteraction.md` file carefully to understand all the specifications and expected behavior.
