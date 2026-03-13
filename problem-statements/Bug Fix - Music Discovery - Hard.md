# Bug Fix: Music Discovery

`Hard`

## Overview

**Skills:** React (Advanced)
**Recommended Duration:** 60 mins

Melodio is a music streaming app with a Discovery page that helps users explore music through multiple filter dimensions; language, genre, and era; along with a "New This Week" section and a "Top Artists" ranking.

At the moment, the Discovery page is completely non-functional. It shows mock data instead of real content, and no filters are available.

[SS]

## Issue Summary

The page shows dummy tracks instead of real data from the database. No filter chips appear for language, genre, or era. The "New This Week" section shows only placeholder tracks. All filtered sections and "Top Artists" are empty. Your task is to fix these frontend issues so the Discovery page works smoothly end-to-end.

## Steps to Reproduce

- Log in using test credentials:
  ```
  Email: alex.morgan@melodio.com
  Password: password123
  ```
- Click on the Discover page from the sidebar.
[SS]
- Observe that "New This Week" shows mock tracks instead of real data.
- Observe that no language, genre, or era filters are rendered.
- Observe that "Top Artists" shows dummy artists.
[SS]

## Expected Behavior

- Language, genre, and era filter chips should appear with correct options.
- "New This Week" should display tracks created within the last 7 days.
- Selecting a filter chip should show matching tracks from the database.
- Genre display names should be properly formatted (e.g., "R&B" not "r-and-b").
- "Top Artists" should display artists sorted by follower count.

**Note:** Make sure to review the `technical-specs/MusicDiscovery.md` file carefully to understand all the specifications and expected behavior.
