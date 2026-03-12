**Bug Fix: Music Discovery - Hard**

Melodio is a music streaming app with a Discovery page that helps users explore music through multiple filter dimensions — language, genre, and era — along with a "New This Week" section and a "Top Artists" ranking. Each section dynamically updates based on the user's filter selections.

At the moment, the Discovery page is completely non-functional. No filter chips are rendered, all sections show empty results, and filtering has no effect.

**Issue Summary**

No language, genre, or era filter chips appear on the page because the filter lists are all empty. Genre display names show raw keys like "r-and-b" instead of formatted names like "R&B." The "New This Week" section is always empty. Selecting a language, genre, or era filter would have no effect because the filtering functions all return empty results. The "Top Artists" section is also empty. The page displays fake data instead of real tracks and artists from the database.

**Steps to Reproduce**

* Log in using test credentials:
  * Email: alex.morgan@melodio.com
  * Password: password123
* Navigate to the Discover page from the sidebar.
* Observe that no language, genre, or era filter chips are rendered.
* Observe that "New This Week" shows no tracks.
* Observe that all filter sections and "Top Artists" are empty.

**Expected Behavior**

* Language chips should show: English, Korean, French, German, Spanish, Chinese.
* Genre chips should show formatted names: Rock, R&B, Pop, Jazz, Electronic, Hip-Hop, Classical.
* Era chips should show: 2020's, 2010's, 2000's, 90's, 80's.
* "New This Week" should display tracks created within the last 7 days.
* Selecting a language chip should filter tracks to genres associated with that language.
* Selecting a genre chip should filter tracks matching that genre, sorted by play count.
* Selecting an era chip should filter tracks whose album release year falls within that era.
* "Top Artists" should display artists sorted by follower count in descending order.

**Note:** Make sure to review the technical-specs/MusicDiscovery.md file carefully to understand all the specifications and expected behavior.
