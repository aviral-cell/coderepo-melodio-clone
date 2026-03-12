# Bug Fix: Podcast Browser

`Hard`

## Overview

**Skills:** React (Advanced)
**Recommended Duration:** 60 mins

This subjective question evaluates React, data formatting, and media browsing concepts, ideal for senior-level roles. The problem requires identifying and fixing extensive bugs across the podcast browsing, detail view, and playback features of a music streaming app.

Melodio is a music streaming app that also hosts podcasts. The Podcast Browser lets users explore podcast shows, view episode details, read descriptions, and play episodes. Podcasts are organized as shows containing episodes.

At the moment, the podcast browser is extensively broken. Nearly every aspect of the feature — from browsing shows to viewing episode details to playing episodes — produces incorrect results.

[SS]

## Issue Summary

In the browse view, show durations display in the wrong format — showing only minutes instead of hours and minutes (e.g., "188m" instead of "3h 8m"). The top shows are sorted by lowest play count instead of highest, and only 3 appear instead of 5. All shows are sorted oldest-first instead of newest-first.

In the show detail view, episodes never load after selecting a show. The sort controls (Default/Latest/Oldest) have no effect. The show duration always displays "0m" and the play count always shows "0." Episode dates show raw unformatted text instead of dates like "Jan 21, 2024."

In the episode detail view, the episode description shows the album title instead of the actual episode description. The "Up Next" section shows episodes that come before the current one instead of after.

For playback, "Play All" does nothing, and clicking play on a specific episode always plays the first episode regardless of which one was selected.

## Steps to Reproduce

- Log in using test credentials:
  ```
  Email: alex.morgan@melodio.com
  Password: password123
  ```
- Navigate to the Podcasts page from the sidebar.
- Observe that shows are sorted in the wrong order and top shows display the least popular ones.
- Click on a show to view its episodes.
- Observe that episodes don't load, duration shows "0m", and play count shows "0."
- If episodes were to load, observe the sort controls don't work, dates are unformatted, and the description shows the wrong text.
- Select an episode and observe that "Up Next" shows the wrong episodes.
- Click "Play All" — nothing happens. Click play on a specific episode — the first episode plays instead.

## Expected Behavior

- Shows should be sorted by most recent episode date (newest first). Top Shows should display 5 shows sorted by total play count (highest first).
- Show durations should display in "Xh Ym" format (e.g., "3h 8m").
- Clicking a show should display its episodes, sorted by episode number by default.
- Sort buttons should reorder episodes accordingly.
- Episode dates should display as "Mon DD, YYYY" (e.g., "Jan 21, 2024").
- Play count should display with K/M suffixes (e.g., "25K").
- Episode descriptions should show the actual episode description text.
- "Up Next" should show episodes after the current one, not before.
- "Play All" should start playback from the first episode. Clicking play on a specific episode should start from that episode.

**Note:** Make sure to review the `technical-specs/PodcastBrowser.md` file carefully to understand all the specifications and expected behavior.
