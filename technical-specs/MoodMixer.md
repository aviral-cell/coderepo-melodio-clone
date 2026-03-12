# Melodio: Mood Mixer

## Overview

Melodio is a music streaming platform that offers a mood-based track discovery feature. The Mood Mixer groups the music library into five mood categories — Energetic, Chill, Happy, Focus, and Party — based on genre mappings. Users can browse all moods at once or select a specific mood to filter the view.

Your task is to implement the Mood Mixer feature. The page component (`MoodMixerPage.tsx`) is fully built and correct, but the utility functions in `moodUtils.ts` are stubs returning empty values, and the hook in `useMoodMixer.ts` returns hardcoded mock data instead of fetching and processing real tracks.

## Additional Information

- The `MoodMixerPage.tsx` component is fully implemented and does not need changes.
- All stubs are concentrated in `moodUtils.ts` (4 functions) and `useMoodMixer.ts` (the hook).
- `tracksService.getAll()` returns a `PaginatedResponse` with an `items` field — the hook must use `response.items`.
- A track's `genre` field is a lowercase string (e.g., `"rock"`, `"hip-hop"`) matching the values in `MOOD_GENRE_MAP`.
- The `AVAILABLE_MOODS` order must be: Energetic, Chill, Happy, Focus, Party.
- To manually reset the database, stop the running server and then restart it.
- The code repository may intentionally contain other issues that are unrelated to this specific task. Please focus only on the described task requirements and address bugs or errors directly associated with them.
- If you're using Run and Debug mode in the IDE, the frontend server may start before the backend (including database seeding) is ready. In that case, the frontend might not display any data. Please reload the preview once the backend setup is complete.
