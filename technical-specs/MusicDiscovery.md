# Melodio: Music Discovery

## Overview

Melodio is a music streaming platform with a Discovery page that helps users explore music through multiple filter dimensions — language, genre, and era — along with a "New This Week" section and a "Top Artists" ranking. Each section dynamically filters based on the user's chip selections.

Your task is to fix the discovery feature. The page component (`DiscoveryPage.tsx`) is fully built and correct, but all utility functions in `discoveryUtils.ts` are stubs returning empty arrays, and the hook in `useDiscovery.ts` returns hardcoded mock data instead of fetching and computing real results.

## Additional Information

- The `DiscoveryPage.tsx` component is fully implemented and does not need changes.
- All stubs are concentrated in `discoveryUtils.ts` (3 arrays + 7 functions) and `useDiscovery.ts` (the hook).
- The `ChipGroup` component in the page already handles selected-chip visual highlighting with `ring-2 ring-melodio-green` classes.
- When no filter is selected, the default behavior is to show **all tracks** in each section (not an empty state).
- Era filtering requires album release dates, which are not available on `TrackWithPopulated` — the hook must fetch albums separately and build a `albumDateMap`.
- `tracksService.getAll()`, `artistsService.getAll()`, and `albumsService.getAll()` all return paginated responses with an `items` field.
- To manually reset the database, stop the running server and then restart it.
- The code repository may intentionally contain other issues that are unrelated to this specific task. Please focus only on the described task requirements and address bugs or errors directly associated with them.
- If you're using Run and Debug mode in the IDE, the frontend server may start before the backend (including database seeding) is ready. In that case, the frontend might not display any data. Please reload the preview once the backend setup is complete.
