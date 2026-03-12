**Bug Fix: Search - Medium**

Melodio is a music streaming app with a search feature that lets users find tracks by typing a query. As the user types, the search should display matching tracks with details like title, artist, album, and duration. The search results should update dynamically and show an accurate count of matches.

Currently, the search feature is broken on both the frontend and backend. The frontend never contacts the server and instead displays fake, hardcoded results regardless of what the user types. Even if the frontend were fixed, the backend search always returns empty results for any query.

**Issue Summary**

When a user types into the search bar, the dropdown shows the same set of fake tracks every time, no matter what query is entered. These results do not come from the database — they are hardcoded in the frontend. On the backend, the search endpoint exists but always returns an empty array, so even if the frontend sent real requests, no results would come back.

**Steps to Reproduce**

* Log in using test credentials:
  * Email: alex.morgan@melodio.com
  * Password: password123
* Click on the search bar in the top navigation.
* Type any query (e.g., "Neon") — observe that the same set of results always appears, regardless of the query.
* Type a completely different query (e.g., "Jazz") — observe that the exact same results appear.
* The results shown do not match any real tracks in the database.

**Expected Behavior**

* The search should query the backend with the user's input and display real matching tracks from the database.
* Results should use case-insensitive prefix matching — tracks whose title starts with the query text should be returned.
* The API should return no more than 5 matching tracks per query.
* Each result should display the track title, artist name, album title, and duration.
* The results count should use correct singular/plural wording (e.g., "1 RESULT" vs. "3 RESULTS").
* If no tracks match the query, a "no results" message should appear.

**Note:** Make sure to review the technical-specs/Search.md file carefully to understand all the specifications and expected behavior.
