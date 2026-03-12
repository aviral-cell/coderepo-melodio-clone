# Melodio: Podcast Browser

## Overview

Melodio is a music streaming platform that also hosts podcasts. The Podcast Browser lets users explore podcast shows, view episodes, read descriptions, and play episodes. Podcasts are stored as albums with `genre: "podcast"`, and episodes are the tracks within those albums.

Your task is to fix the podcast browser feature. The page component (`PodcastPage.tsx`) is structurally correct, but the utility functions in `podcastUtils.ts` and the hook in `usePodcastBrowser.ts` contain bugs that prevent the UI from working.

## Additional Information

- The `PodcastPage.tsx` component is structurally correct and does not need changes.
- All bugs are in the utility layer (`podcastUtils.ts`) and the hook (`usePodcastBrowser.ts`).
- Fix the utility functions first (pure functions), then fix the hook's dependencies and hardcoded values.
- The hook correctly filters tracks by `genre === "podcast"` — that part works fine.
- Shows are derived from albums of podcast genre; episodes are tracks within those albums.
- To manually reset the database, stop the running server and then restart it.
- The code repository may intentionally contain other issues that are unrelated to this specific task. Please focus only on the described task requirements and address bugs or errors directly associated with them.
- If you're using Run and Debug mode in the IDE, the frontend server may start before the backend (including database seeding) is ready. In that case, the frontend might not display any data. Please reload the preview once the backend setup is complete.
