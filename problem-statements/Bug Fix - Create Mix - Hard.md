**Bug Fix: Create Mix - Hard**

Melodio is a music streaming app with a Mix feature that lets users create personalized track collections. The Mix page has a 3-step wizard: select artists, configure mix settings (variety, discovery, filters), and generate a scored mix. Users can also view and manage their saved mixes.

At the moment, the mix creation feature is completely broken. The wizard shows fake artists instead of real data, no user actions work, mix generation always produces an empty result, and mixes are never saved to or loaded from the backend.

**Issue Summary**

The artist selection grid shows a handful of fake artists instead of real artist data from the database. Selecting an artist has no visual effect — the selection does not register. The "Next" button is permanently disabled regardless of how many artists are selected. Even if navigation worked, the configuration controls (variety, discovery, filters) have no effect. Generating a mix always produces an empty track list with no title. Previously saved mixes never appear in the "Your Mixes" section, and saving a new mix does nothing.

**Steps to Reproduce**

* Log in using test credentials:
  * Email: alex.morgan@melodio.com
  * Password: password123
* Navigate to the Mix page from the sidebar.
* Observe that only a few generic artists appear instead of the real artist catalog.
* Observe that "Your Mixes" shows no saved mixes.
* Click the "Create Mix" card to start the wizard.
* Try selecting an artist — observe no visual feedback.
* Observe the "Next" button remains disabled.

**Expected Behavior**

* The artist grid should show all available artists from the database.
* Clicking an artist should toggle their selection with a visual indicator.
* The "Next" button should be enabled once at least 1 artist is selected.
* Configuration controls (variety, discovery, filters) should be interactive.
* Clicking "Done" should generate a scored mix based on selected artists and configuration, limited to 20 tracks.
* The mix title should be auto-generated from selected artist names.
* The mix should be automatically saved to the backend.
* Previously created mixes should appear in the "Your Mixes" section on page load.

**Note:** Make sure to review the technical-specs/CreateMix.md file carefully to understand all the specifications and expected behavior.
