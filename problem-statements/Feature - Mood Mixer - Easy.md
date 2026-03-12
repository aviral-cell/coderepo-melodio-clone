**Feature: Mood Mixer - Easy**

Melodio is a music streaming app that offers a mood-based track discovery feature. The Mood Mixer organizes the music library into five mood categories — Energetic, Chill, Happy, Focus, and Party — based on genre mappings. Users can browse all moods at once or select a specific mood to see only that category's tracks with a description.

Currently, the Mood Mixer page loads but shows incorrect data. The utility functions return empty values, and the page displays fake data instead of real tracks from the database.

**Product Requirements**

* The Mood Mixer should display 5 mood sections: Energetic, Chill, Happy, Focus, and Party.
* Each mood section should show tracks filtered by genre mapping:
  * Energetic: rock and electronic tracks
  * Chill: jazz tracks
  * Happy: pop tracks
  * Focus: electronic and jazz tracks
  * Party: pop and hip-hop tracks
* When no mood is selected, all 5 sections should be visible with their respective tracks.
* When a mood chip is clicked, only that mood's section should be visible, along with a description of the mood.
* Clicking the same mood chip again should deselect it and show all sections again.
* Each mood should display its description when selected (e.g., Energetic: "High-energy tracks to get you moving").

**Steps to Test Functionality**

* Log in using test credentials:
  * Email: alex.morgan@melodio.com
  * Password: password123
* Navigate to the Mood page from the sidebar.
* Observe that all 5 mood sections are displayed with tracks in each section.
* Click the "Energetic" mood chip.
* Observe that only the Energetic section is visible with rock and electronic tracks, and the description appears.
* Click the "Energetic" chip again to deselect it.
* Observe that all 5 sections reappear.
* Click different mood chips and verify the correct tracks and descriptions appear.

**Note:** Make sure to review the technical-specs/MoodMixer.md file carefully to understand all the specifications and expected behavior.
