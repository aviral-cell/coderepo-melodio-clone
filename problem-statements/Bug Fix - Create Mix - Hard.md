# Bug Fix: Create Mix

```
Tags: Theme:Melodio, MERN, Frontend, Feature Implementation, Hard
Time: 60 mins
Score: 100
```

## Overview

**Skills:** React (Advanced)

Melodio is a music streaming app with a Mix feature that lets users create personalized track collections. The Mix page has a 3-step wizard: select artists, configure mix settings (variety, discovery, filters), and generate a scored mix. Users can also view and manage their saved mixes.

At the moment, the mix creation feature is completely broken. The wizard shows fake artists and no configuration options are functional.

[SS]

## Issue Summary

The artist selection grid shows a handful of fake artists instead of real artist data from the database. Selecting an artist has no visual effect. The Next button is permanently disabled. You Mixes option shows nothing. Your task is to fix the frontend issues in the Mix page to make the entire mix creation flow work smoothly end-to-end.

## Steps to Reproduce

- Log in using test credentials:
  ```
  Email: alex.morgan@melodio.com
  Password: password123
  ```
- Click on the Mix page from the sidebar.
[SS]
- Observe that Your Mixes shows no saved mixes.
- Click the Create Mix card to start the wizard.
[SS]
- Observe that only a few generic artists appear instead of the real artist.
[SS]
- Try selecting an artist; observe no visual feedback.
- Observe the Next button remains disabled.

## Expected Behavior

- The artist grid should show all available artists from the database.
- Clicking an artist should toggle their selection with a visual indicator.
- On click of Next, the Configuration controls (variety, discovery, filters) should be visible and interactive.
- Clicking Done should generate a scored mix based on selected artists and configuration.
- The mix title should be auto-generated from selected artist names.
- Previously created mixes should appear in the Your Mixes section on page load.

**Note:** Make sure to review the `technical-specs/CreateMix.md` file carefully to understand all the specifications and expected behavior.
