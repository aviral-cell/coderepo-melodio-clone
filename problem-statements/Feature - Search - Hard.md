# Feature: Search

`Hard`

## Overview

**Skills:** Node.js (Advanced), React (Advanced)
**Recommended Duration:** 60 mins

This subjective question evaluates React, Node.js, and full-stack development concepts, ideal for senior-level roles. The task involves building a responsive search feature for a music streaming app that provides real-time results based on user input.

Melodio is a music streaming app that allows users to browse artists, albums, and playlists through a built-in music player. Search is a core part of music discovery, helping users quickly find the tracks they want to listen to. At the moment, this search experience is not implemented, and users cannot look up songs.

Your task is to build the end-to-end search feature. Users should be able to type in a song and immediately see relevant, real-time results.

![Search feature mockup](https://hrcdn.net/s3_pub/istreet-assets/Br-j__FXomXo1Zyxk3C3tg/image_(3).png)

## Product Requirements

- The search experience should feel responsive without being noisy. The search should wait 300 milliseconds after the user stops typing before triggering a search request.
- If the search input is empty or contains only whitespace, no search should be performed. In this state, any existing search results should be cleared and any visible error message should be removed.
- If a search request fails, the user should see a clear and actionable error message indicating that the results could not be loaded.
- Any displayed error should be cleared automatically when the user clears the search input or initiates a new valid search.
- When a user selects a search result, they should be navigated to the corresponding music details page to continue their discovery journey.

## Steps to Test Functionality

- Log in using test credentials:
  ```
  Email: alex.morgan@melodio.com
  Password: password123
  ```
- Click on the search bar at the top of the page.
- Enter any search query (for example, "rock," or "jazz").
- Observe that the search results always display the same two mock songs, regardless of the query entered.
  ![Search mock results](https://hrcdn.net/s3_pub/istreet-assets/EtjlMfL5hgatKvDArEME_Q/Screenshot_2025-12-16_at_5.40.09%E2%80%AFPM.png)
- Instead, the search dropdown should dynamically display results that accurately match the user's search query.

**Note:** Make sure to review the `technical-specs/Search.md` file carefully to understand all the specifications and expected behavior.
