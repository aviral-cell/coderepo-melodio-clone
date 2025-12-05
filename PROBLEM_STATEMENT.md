# Hackify Music Player - Bug Fixing Challenge

## Overview

You are provided with **Hackify**, a Spotify-inspired music streaming application built using Next.js 15 (frontend) and NestJS (backend) with MongoDB. The application features a music player with queue management, shuffle, repeat, and search functionality.

The application compiles and runs successfully. However, it contains **4 bugs** in the frontend that you must identify and fix through code review. These bugs affect the music player's state management and user experience.

---

## Application Context

### What the Application Does

1. **Music Player**: Users can play tracks, manage a queue, and control playback
2. **Shuffle Mode**: Randomizes the queue while preserving the current track
3. **Queue Management**: Users can add, remove, and reorder tracks in the queue
4. **Search**: Users can search for tracks, albums, and artists with real-time results

### Key User Interactions

| Feature | Description | Expected Behavior |
|---------|-------------|-------------------|
| Play/Pause | Control playback | Toggle between playing and paused states |
| Next/Previous | Navigate tracks | Move through the queue or restart current track |
| Shuffle | Randomize queue | Current song continues, remaining tracks are shuffled |
| Remove from Queue | Remove a track | Queue updates correctly, current track continues |
| Search | Find music | Results appear after user stops typing (debounced) |

---

## Your Task

You must **find and fix all 4 bugs** in the frontend codebase. Each bug has dedicated tests that currently **fail**. Your goal is to make all **24 frontend tests pass** by fixing the bugs.

### What's Working vs What's Broken

| Feature | Status | Details |
|---------|--------|---------|
| Playing tracks | Working | Tracks play correctly |
| Pausing/Resuming | Working | Playback controls work |
| Next/Previous track | Working | Navigation works correctly |
| Shuffle toggle | **BROKEN** | Current track changes unexpectedly |
| Remove from queue | **BROKEN** | Player jumps to wrong track |
| Timer/Progress | **BROKEN** | Multiple timers or memory issues |
| Search | **BROKEN** | Searches on every keystroke |

---

## Bug Descriptions

Below is a detailed description of each bug. Read carefully to understand what is broken and what the expected correct behavior should be.

---

### Shuffle Loses Current Track

**What Users Experience:**
Imagine you're listening to your favorite song "Track C" at the 2-minute mark. You decide to enable shuffle so the next songs are randomized. But instead of continuing "Track C", suddenly a completely different song starts playing from the beginning. Your listening experience is interrupted.

**The Problem:**
When shuffle is toggled, the player doesn't preserve which track is currently playing. The current track reference gets lost during the queue reordering.

**What Should Happen:**
- Enabling shuffle: Current track continues playing at the same position
- The current track should move to the front of the shuffled queue
- Remaining tracks get shuffled behind the current track
- Disabling shuffle: Current track continues, queue returns to original order

**Associated Tests:**
- `should preserve currentTrack when enabling shuffle`
- `should preserve elapsed time when enabling shuffle`
- `should restore original order and find current track position when disabling shuffle`

---

### Queue Index Not Adjusted When Removing Tracks

**What Users Experience:**
You're listening to "Track C" (the 3rd song in your queue). You decide to remove "Track A" (the 1st song) because you don't want to hear it. After removing it, instead of continuing "Track C", the player suddenly jumps to "Track D"!

**The Problem:**
When a track is removed from the queue that comes BEFORE the currently playing track, the queue index (which points to the current track) is not decremented. Since all tracks after the removed one shift down by 1, the index now points to the wrong track.

**Example:**
```
Before: Queue = [A, B, C, D, E], Index = 2 (pointing to C)
Remove A at index 0
After:  Queue = [B, C, D, E], Index = 2 (still 2, but now points to D!)
Should be: Index = 1 (to still point to C)
```

**What Should Happen:**
- If removed track is BEFORE current: Decrement the queue index by 1
- If removed track is AFTER current: Index stays the same
- If removed track IS the current: Advance to next track

**Associated Tests:**
- `should decrement queueIndex when a track BEFORE the current is removed`
- `should NOT change queueIndex when a track AFTER the current is removed`
- `should advance to next track when current track is removed`

---

### Timer Interval Not Cleaned Up

**What Users Experience:**
You notice the progress bar moving too fast, or the elapsed time counter jumping by 2-3 seconds instead of 1. If you pause and resume multiple times, the timer seems to speed up even more!

**The Problem:**
The useEffect that creates the playback interval timer doesn't properly clean up the previous interval when dependencies change. This results in multiple intervals running simultaneously, each incrementing the elapsed time.

**What Should Happen:**
- Only ONE interval should ever be active at a time
- When isPlaying changes to false, the interval should be cleared
- When the component unmounts, the interval should be cleared

**Associated Tests:**
- Tests in `PlayerContext.test.tsx` verify interval cleanup
- TICK reducer tests verify correct increment behavior

---

### Search Not Debounced

**What Users Experience:**
When you type "hello" in the search box, you see the loading spinner flash 5 times - once for each letter typed. The results keep changing rapidly as each intermediate search completes. The application feels sluggish and the server is overwhelmed with requests.

**The Problem:**
The search page directly uses the raw query value to trigger searches instead of a debounced value. This means every keystroke immediately fires an API request.

**What a User Sees:**
```
Types: h    -> Searches for "h"
Types: e    -> Searches for "he"
Types: l    -> Searches for "hel"
Types: l    -> Searches for "hell"
Types: o    -> Searches for "hello"
= 5 API calls instead of 1!
```

**What Should Happen:**
- Use the `useDebounce` hook with a 300ms delay
- Wait for user to stop typing before searching
- Only the final value ("hello") should trigger an API call
- Intermediate values should be ignored

**Associated Tests:**
- `should NOT update value immediately when input changes`
- `should reset timer when value changes rapidly`

---

## Success Criteria

1. **All 24 frontend tests must pass** - Currently some tests fail due to the 4 bugs
2. **Application must compile** - No TypeScript or build errors
3. **Application must run** - Both frontend and backend must start without errors
4. **No new bugs introduced** - Fixes should be targeted, not rewrites
5. **Bugs are independent** - Each bug can be fixed without affecting others

---

## Project Structure (Relevant Files)

```
frontend/src/
├── app/
│   └── search/
│       └── page.tsx                 # Search debouncing
│
└── shared/
    ├── contexts/
    │   ├── PlayerContext.tsx        # Player state
    │   └── __tests__/
    │       ├── playerReducer.test.ts
    │       └── PlayerContext.test.tsx
    │
    └── hooks/
        ├── useDebounce.ts           # Debounce hook (working)
        └── __tests__/
            └── useDebounce.test.ts
```

---

## How to Run

### Install Dependencies
```bash
npm install
```

### Start Development Servers
```bash
npm start
```

### Run Tests
```bash
npm test                    # Run all tests
npm run test:frontend       # Run only frontend tests
```

### Run Single Test File
```bash
npx jest frontend/src/shared/contexts/__tests__/playerReducer.test.ts
```

---

## Evaluation

| Bug | Category | Points |
|-----|----------|--------|
| Shuffle Loses Track | State Management | 30 |
| Queue Index Error | State Management | 25 |
| Timer Cleanup | Memory Management | 25 |
| Missing Debounce | Performance | 20 |
| **Total** | | **100** |

---

## Tips

1. **Run tests frequently** - Verify your fixes as you go with `npm run test:frontend`
2. **Don't over-engineer** - Simple, targeted fixes are better than complex rewrites

Good luck!
