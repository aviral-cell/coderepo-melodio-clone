# Melodio (Melodio) - Spotify Clone Development Summary

> Comprehensive extraction of unique points from development prompts for HackerRank technical assessment platform.

---

## Table of Contents

3. [Core Features](#3-core-features-5-total)
4. [UI/UX Requirements](#4-uiux-requirements)
5. [Bug Introduction Strategy](#5-bug-introduction-strategy-hackerrank-assessment)
6. [Final Tasks/Bugs](#6-final-3-tasksbugs)
7. [Testing Requirements](#7-testing-requirements)
8. [Documentation Requirements](#8-documentation-requirements)
10. [HackerRank-Specific Constraints](#10-hackerrank-specific-constraints)
11. [Code Quality Rules](#11-code-quality-rules)
12. [Verification Process](#12-verification-process)
13. [Out-of-Scope Features](#13-out-of-scope-features)

---

## 3. Core Features (5 Total)

### Feature 1: Authentication

- Login/logout functionality
- Profile display with first name
- Logout option in header
- Credentials stored in seeder
- JWT-based authentication

### Feature 2: Album/Track/Artist Detail Pages

- Gradient backgrounds on detail pages
- Track images (unique per track)
- Artist information display
- Album track listings
- Mobile-responsive layouts

### Feature 3: Music Player with Queue

- Fixed position at bottom (like Spotify)
- Play/pause functionality
- Shuffle mode
- Repeat mode
- Progress bar with seek functionality
- Volume control
- Queue management (add/remove/clear)
- Track advancement logic

### Feature 4: Playlist Management

- CRUD operations (Create, Read, Update, Delete)
- Drag-to-reorder tracks
- Add tracks to playlist
- Remove tracks from playlist
- Empty playlist handling (placeholder message)
- Modal for playlist operations

### Feature 5: Search with Autocomplete

- Modal dropdown (not page navigation)
- Keyword matching (prefix-based, not exact)
- Debounced input
- Tracks-only results
- Click behavior: Navigate to track detail
- Enter key: Immediate search
- Escape key: Close dropdown
- Click outside: Close dropdown

---

## 4. UI/UX Requirements

### Branding

| Element | Specification |
|---------|---------------|
| App Name | **Melodio** (avoid "Spotify" copyright) |
| Theme | Dark theme matching Spotify |
| Color Scheme | Spotify green (#1DB954), dark backgrounds |
| Logo | Music2 icon with Melodio branding |

### Layout Requirements

#### Sidebar

- Collapsible functionality
- Toggle icon at **bottom-right corner**
- Desktop/Large: Expanded by default
- Mobile/Small: Collapsed by default (icons only)
- When collapsed, body content fills the space
- Menu items: Home, Search, Your Library (playlists)
- Equal vertical spacing between icons when collapsed
- Hide playlist section in collapsed state

#### Header

- Search bar visible on all pages
- Profile icon with user's **first name** (not username)
- Logout option dropdown

#### Player Section

- Fixed at bottom
- Center-aligned on mobile
- Hide volume bar and extra icons on mobile screens
- Volume slider with properly aligned white pointer
- Cursor: pointer on hover for interactive elements

### Responsive Design

| Breakpoint | Behavior |
|------------|----------|
| Mobile (375px) | Single column, collapsed sidebar, simplified player |
| Desktop | 7 track cards per row, expanded sidebar, full player |

### Visual Elements

- Fade-in animations
- Shake animation on validation error
- Loading spinner on form submit
- Gradient backgrounds on detail pages
- Slim, dark-themed scrollbars (barely visible)
- Genre cards with images (not solid colors)
- American singer/band images for albums
- Unique image per track

### Interaction Patterns

- Play/pause button on track card: Plays track (no redirect)
- Track card click: Redirects to detail page
- Search results: Click navigates to track
- Cursor pointer on volume, progress bar hover

---

## 5. Bug Introduction Strategy (HackerRank Assessment)

### Branch Structure

```
solution (working code)
    └── question (buggy code - pulled from solution)
```

### Bug Design Principles

| Principle | Requirement |
|-----------|-------------|
| Independence | Bugs must NOT depend on each other |
| App Stability | App must compile and run with bugs |
| Test Behavior | Only tests should fail, not the app |
| File Spread | Candidate modifies **3-4+ files minimum** |
| Code Volume | **8-10+ lines of code** per file |
| Bug Type | Fix wrong logic (NOT implement empty stubs) |

### Test Management

- Delete **ALL passing test cases** from `question` branch
- Only failing tests remain in question branch
- Same test files in both branches, different outcomes
- Tests automatically fail due to introduced bugs

### Naming Conventions

| Do | Don't |
|----|-------|
| `task1`, `task2`, `task3` | `Bug B`, `Bug D`, `Bug F` |
| Feature-based names | Bug letter references |

### Test Commands

```bash
npm run test:task1
npm run test:task2
npm run test:task3
npm run test  # Runs all
```

### Output Structure

```
/output/
├── task1.xml
├── task2.xml
└── task3.xml
```

- No `junit.xml` merging required
- `.xml` files generated even when tests fail
- `.gitkeep` in output folder

---

## 6. Final 3 Tasks/Bugs

### Task 1: Playlist Operations

**Broken Features:**
- Track reordering not working
- Add to playlist issues
- Remove from playlist issues

**Files Affected:** 3-4 frontend files
- `usePlaylistOperations.ts`
- `playlists.service.ts`
- Additional context/reducer files

### Task 2: Player Controls

**Broken Features:**
- Progress bar stuck/not updating
- Shuffle button not working
- Repeat button not working

**Files Affected:** 3-4 frontend files
- `PlayerContext.tsx`
- `playerReducer.ts`
- Related hook files

### Task 3: Search Functionality

**Broken Features:**
- Shows sample song only
- Frontend search logic missing
- No actual API integration

**Implementation:**
- UI present with sample data
- Candidate implements actual functionality
- Tests validate correct implementation

---

## 7. Testing Requirements

### Query Strategy

| Approach | Usage |
|----------|-------|
| `data-testid` | Primary selector method |
| Placeholder text | Avoid (less reliable) |

### Console Handling

```javascript
// Suppress ALL console.error/warnings globally in Jest
// Configure in jest.setup.js
```

### Test Coverage

| Area | Requirement |
|------|-------------|
| API Tests | Playlist reorder, add/remove tracks |
| Frontend Tests | All task-related scenarios |
| Backend Tests | Not required for tasks |
| Edge Cases | Comprehensive coverage |

### Test File Structure

```typescript
describe('Feature Name', () => {
  /**
   * INTRO: What this test verifies
   * SCENARIO: Setup and preconditions
   * BUG BEHAVIOR: What currently happens (wrong)
   * EXPECTATION: What should happen (correct)
   */
  it('should do something specific', () => {
    // Test implementation
  });
});
```

### Test Documentation

- High-level comments on ALL test cases
- Clear description of what test validates
- No hints about solution in test names
- Scenario-based descriptions

---

## 8. Documentation Requirements

### Folder Structure

```
/technical-specs/
├── task1-playlist-operations.md
├── task2-player-controls.md
└── task3-search.md

/problem_statements/
├── task1_playlist_operations.md
├── task2_player_controls.md
└── task3_search.md
```

### Technical Specs Content

| Include | Exclude |
|---------|---------|
| API contracts | Helper utility references |
| Function signatures | Implementation hints |
| TypeScript interfaces | Solution code |
| Test assertions | File modification lists |
| How to run tests | Direct fix instructions |

### Problem Statements Content

| Include | Exclude |
|---------|---------|
| High-level task overview | Technical hints |
| Expected behavior | Code keywords |
| Current (buggy) behavior | File names to modify |
| Screenshot placeholders | Implementation details |

### File Naming

- Technical specs: `task1-playlist-operations.md` (kebab-case)
- Problem statements: `task1_playlist_operations.md` (snake_case)

### Git Attributes

```gitattributes
**/problem_statements/ export-ignore
```

### Deprecated Files

- `PROBLEM_STATEMENT.md` - Replaced by individual task docs
- `README.md` - Can be removed after extracting useful info

---

## 10. HackerRank-Specific Constraints

### Platform Limitations

| Feature | Status |
|---------|--------|
| Audio Playback | ❌ Not supported |
| Email Sending | ❌ Not supported |
| WebSocket | ❌ Not supported |
| File Upload | ❌ Not supported |

### Configuration Files

#### hackerrank.yml

- Update `readonly_paths` section
- Include all test file paths
- Configure task-specific test commands

### Credentials

| Field | Value |
|-------|-------|
| Email | `alex.morgan@melodio.com` |
| Password | `password123` |
| Domain | `melodio.com` (not `example.com`) |
| Style | Gender-neutral, real-world names |

### Test Runner

- Generates task-wise XML reports
- `pretest` command removed
- Database seeding automated via `npm start`

---

## 11. Code Quality Rules

### Comment Policy

| Location | Rule |
|----------|------|
| Business logic | **NO comments** |
| Inside functions | **NO comments** |
| Test files | High-level comments allowed |
| Configuration | Minimal necessary comments |

### Examples of Comments to Remove

```javascript
// ❌ Remove these:
// If on search page and query is cleared, stay on search page
// Immediate navigation on Enter key
// Silently fail - playlists will just be empty
```

### Asset Management

| Type | Requirement |
|------|-------------|
| Static images | Store locally (not external URLs) |
| Track images | Unique per track |
| Album images | American singer/band logos |

### Seeder Data

- Default playlist: "Playlist 1" with 6 tracks
- Two user accounts with gender-neutral names
- Unique images per track
- Real-world credential format

### Backend Default Page

```html
<!-- Simple HTML page -->
<h1>API server is running</h1>
```

---

## 12. Verification Process

### Tools & Methods

| Tool | Purpose |
|------|---------|
| Playwright MCP | UI verification, automated testing |
| BrowserOS | Reference actual Spotify app |
| Serena MCP | Traverse codebase |
| Context7 | Documentation lookup |

### Reference Implementation

- Location: `frontend-nextjs-backup`
- Use for: CSS, design patterns, feature comparison

### Server Management

```bash
# Kill servers after task completion
# Ensure ports are free: 3000 (FE), 5000 (BE)

# If ports in use:
npx kill-port 3000
npx kill-port 5000
```

### Database Operations

```bash
# Delete and reseed when needed
npm run seed
```

### Verification Checklist

- [ ] All tests passing (solution branch)
- [ ] Playwright UI verification
- [ ] Mobile responsiveness check
- [ ] Compare with reference implementation
- [ ] Compare with actual Spotify app
- [ ] Kill dev servers after completion

---

## 13. Out-of-Scope Features

The following features are explicitly **NOT** to be implemented:

| Feature | Status |
|---------|--------|
| Discover Weekly (Personalized Recommendations) | ❌ Out of scope |
| Analytics Dashboard | ❌ Out of scope |
| Smart Queue | ❌ Out of scope |
| Trending Section | ❌ Out of scope |

---

## Quick Reference Commands

```bash
# Development
npm run dev          # Run both FE and BE
npm start            # Production mode with seeding

# Testing
npm run test         # All tests
npm run test:task1   # Task 1 only
npm run test:task2   # Task 2 only
npm run test:task3   # Task 3 only

# Database
npm run seed         # Seed database

# Ports
npx kill-port 3000   # Free frontend port
npx kill-port 5000   # Free backend port
```

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Core Features | 5 |
| Tasks/Bugs | 3 |
| Agent Types | 7 |
| Branches | 5 |
| Test Categories | 3 per task |

---

*Document generated from development prompts for HackerRank Melodio (Spotify Clone) assessment project.*
