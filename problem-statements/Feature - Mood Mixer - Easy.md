# Feature: Mood Mixer

```
Tags: Theme:Melodio, MERN, Frontend, Feature Implementation, Easy
Time: 20 mins
Score: 50
```

## Overview

**Skills:** React (Basic)
**Recommended Duration:** 20 mins

Melodio is a music streaming app that offers a mood-based track discovery feature. The Mood Mixer organizes the music library into five mood categories; Energetic, Chill, Happy, Focus, and Party; based on genre mappings.

Currently, the Mood Mixer page is not implemented. Your task is to implement the Mood Mixer feature in the frontend so that users can browse tracks by mood and filter them accordingly.

[SS]

## Product Requirements

- The Mood Mixer should display 5 mood sections with tracks filtered by genre mapping.
- When no mood is selected, all 5 sections should be visible with their respective tracks.
- Clicking a mood chip should show only that mood's section with a description.
- Clicking the same mood chip again should deselect it and show all sections.

## Steps to Test Functionality

- Log in using test credentials:
  ```
  Email: alex.morgan@melodio.com
  Password: password123
  ```
- Navigate to the Mood Mixer page from the sidebar.
[SS]
- Observe that all 5 mood sections are displayed with real tracks in each section.
- Click the "Energetic" mood chip; observe only the Energetic section is visible with a description.
- Click it again to deselect it; observe all 5 sections reappear.

**Note:** Make sure to review the `technical-specs/MoodMixer.md` file carefully to understand all the specifications and expected behavior.
