# Hackify Music Player - Bug Fixing Challenge

## Overview

You are provided with **Hackify**, a Hackify-inspired music streaming application built using Next.js 15 (frontend) and NestJS (backend) with MongoDB. The application features a music player with queue management, shuffle, repeat, and search functionality.

The application compiles and runs successfully. However, it contains **3 bugs** in the frontend that you must identify and fix through code review. These bugs affect the music player's state management and user experience.

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
| Search | Find music | Results appear after user stops typing (debounced) |

---

## Your Task

You must **find and fix all 3 bugs** in the frontend codebase. Each bug has dedicated tests that currently **fail**. Your goal is to make all **12 frontend tests pass** by fixing the bugs.

### What's Working vs What's Broken

| Feature | Status | Details |
|---------|--------|---------|
| Playing tracks | Working | Tracks play correctly |
| Pausing/Resuming | Working | Playback controls work |
| Next/Previous track | Working | Navigation works correctly |
| Shuffle toggle | **BROKEN** | Current track changes unexpectedly |
| Timer/Progress | **BROKEN** | Multiple timers or memory issues |
| Search | **BROKEN** | Searches on every keystroke |

---

## Bug Descriptions

Below is a detailed description of each bug. Read carefully to understand what is broken and what the expected correct behavior should be.

---

### Task 1: Search Not Debounced

**What Users Experience:**
When you type "hello" in the search box, you see the loading spinner flash 5 times - once for each letter typed. The results keep changing rapidly as each intermediate search completes. The application feels sluggish and the server is overwhelmed with requests.

**The Problem:**
The search functionality directly uses the raw query value to trigger searches instead of a debounced value. This means every keystroke immediately fires an API request.

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

**Files to Investigate:**
- `frontend/src/shared/hooks/useDebounce.ts`
- `frontend/src/app/search/page.tsx`

**Associated Tests:** `frontend/__tests__/task1/useDebounce.test.ts`

---

### Task 2: Shuffle Loses Current Track

**What Users Experience:**
Imagine you're listening to your favorite song "Track C" at the 2-minute mark. You decide to enable shuffle so the next songs are randomized. But instead of continuing "Track C", suddenly a completely different song starts playing from the beginning. Your listening experience is interrupted.

**The Problem:**
When shuffle is toggled, the player doesn't preserve which track is currently playing. The current track reference gets lost during the queue reordering.

**What Should Happen:**
- Enabling shuffle: Current track continues playing at the same position
- The current track should move to the front of the shuffled queue
- Remaining tracks get shuffled behind the current track
- Disabling shuffle: Current track continues, queue returns to original order

**Files to Investigate:**
- `frontend/src/shared/contexts/playerReducer.ts`

**Associated Tests:** `frontend/__tests__/task2/playerReducer.test.ts`

---

### Task 3: Timer Interval Not Cleaned Up

**What Users Experience:**
You notice the progress bar moving too fast, or the elapsed time counter jumping by 2-3 seconds instead of 1. If you pause and resume multiple times, the timer seems to speed up even more!

**The Problem:**
The useEffect that creates the playback interval timer doesn't properly clean up the previous interval when dependencies change. This results in multiple intervals running simultaneously, each incrementing the elapsed time.

**What Should Happen:**
- Only ONE interval should ever be active at a time
- When isPlaying changes to false, the interval should be cleared
- When the component unmounts, the interval should be cleared

**Files to Investigate:**
- `frontend/src/shared/contexts/PlayerContext.tsx`

**Associated Tests:** `frontend/__tests__/task3/PlayerContext.test.tsx`

---

## Success Criteria

1. **All 12 frontend tests must pass** - Currently some tests fail due to the 3 bugs
2. **Application must compile** - No TypeScript or build errors
3. **Application must run** - Both frontend and backend must start without errors
4. **No new bugs introduced** - Fixes should be targeted, not rewrites
5. **Bugs are independent** - Each bug can be fixed without affecting others

---

## Project Structure (Relevant Files)

```
frontend/
├── src/
│   ├── app/
│   │   └── search/
│   │       └── page.tsx                 # Task 1: Search debouncing
│   │
│   └── shared/
│       ├── contexts/
│       │   ├── PlayerContext.tsx        # Task 3: Interval cleanup
│       │   └── playerReducer.ts         # Task 2: Shuffle logic
│       │
│       ├── hooks/
│       │   └── useDebounce.ts           # Task 1: Debounce hook
│       │
│       └── utils/
│           └── playerUtils.ts           # Shuffle utility function
│
└── __tests__/
    ├── task1/
    │   └── useDebounce.test.ts          # 4 tests
    ├── task2/
    │   └── playerReducer.test.ts        # 4 tests
    └── task3/
        └── PlayerContext.test.tsx       # 4 tests
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

### Run Task-Specific Tests
```bash
npm run test:task1          # Run Task 1 tests (debounce)
npm run test:task2          # Run Task 2 tests (shuffle)
npm run test:task3          # Run Task 3 tests (interval)
```

---

## Evaluation

| Task | Bug | Category | Points |
|------|-----|----------|--------|
| Task 1 | Search Not Debounced | Performance | 30 |
| Task 2 | Shuffle Loses Track | State Management | 35 |
| Task 3 | Timer Interval Cleanup | Memory Management | 35 |
| **Total** | | | **100** |

---

## Tips

1. **Run tests frequently** - Verify your fixes as you go with `npm run test:frontend`
2. **Run task-specific tests** - Focus on one bug at a time with `npm run test:task1`, `test:task2`, or `test:task3`
3. **Don't over-engineer** - Simple, targeted fixes are better than complex rewrites

Good luck!
