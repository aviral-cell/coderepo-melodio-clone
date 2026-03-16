# Bug Fix: Live Music Concerts

```
Tags: Theme:Melodio, MERN, Frontend, BugFix, Medium
Time: 40 mins
Score: 75
```

## Overview

**Skills:** React (Intermediate)

Melodio is a music streaming app with a Live Music Concerts feature that lets users browse upcoming concerts, filter by month and city, view concert details, buy tickets, and explore the performing artist's albums and tracks.

At the moment, the concerts feature is extensively broken. Concert cards are missing dates and times, filters don't work, and the detail page has multiple issues with ticket purchasing and artist content.

[SS]

## Issue Summary

Concert cards show no dates or times. The month and city filters have no effect. On the detail page, the "Buy Tickets" and "View My Tickets" buttons do nothing, and albums and tracks appear from all artists instead of just the performer. Your task is to fix these frontend issues so the concerts feature works smoothly end-to-end.

## Steps to Reproduce

- Log in using test credentials:
  ```
  Email: alex.morgan@melodio.com
  Password: password123
  ```
- Click on the Concerts page from the sidebar.
[SS]
- Observe that concerts has no date or time information.
- Try selecting a month or clicking a city chip; observe no change.
- Click on a concert to view details; observe the "Buy Tickets" button does nothing.
[SS]

## Expected Behavior

- Concert cards should display formatted dates and times.
- The month dropdown should filter concerts. City chips should filter the artist discovery section.
- On the detail page, only the performing artist's albums and tracks should appear.
- The "Buy Tickets" and "View My Tickets" dialogs should open and function correctly.
- Ticket counts and codes should display correctly.

**Note:** Make sure to review the `technical-specs/LiveMusicConcerts.md` file carefully to understand all the specifications and expected behavior.
