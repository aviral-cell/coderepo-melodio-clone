# Frontend - Next.js Application

## Overview

Next.js 15+ frontend for the Hackify music streaming application. Uses App Router, React 19, Tailwind CSS, and Shadcn UI components.

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.1+ | React framework with App Router |
| React | 19.0 | UI library |
| TypeScript | 5.7+ | Type safety |
| Tailwind CSS | 3.4+ | Utility-first CSS |
| Shadcn UI | - | Radix-based component library |
| Lucide React | - | Icon library |
| Zod | 3.24+ | Schema validation |
| @dnd-kit | - | Drag and drop for queue reordering |

## Directory Structure

```
frontend/
├── src/
│   ├── app/                      # App Router pages
│   │   ├── layout.tsx            # Root layout with providers
│   │   ├── page.tsx              # Home page (/)
│   │   ├── providers.tsx         # Context providers wrapper
│   │   ├── globals.css           # Global styles + Tailwind
│   │   ├── (auth)/               # Auth route group
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── album/[id]/page.tsx   # Album detail
│   │   ├── genre/page.tsx        # Genre browsing
│   │   ├── playlist/[id]/page.tsx# Playlist detail
│   │   └── track/[id]/page.tsx   # Track detail
│   │
│   ├── lib/
│   │   └── utils.ts              # cn() helper for classnames
│   │
│   └── shared/
│       ├── components/
│       │   ├── common/           # Reusable components
│       │   │   ├── AlbumCard.tsx
│       │   │   ├── TrackCard.tsx
│       │   │   ├── PlaylistCard.tsx
│       │   │   ├── LoadingSpinner.tsx
│       │   │   └── __tests__/
│       │   ├── layout/           # Layout components
│       │   │   ├── Sidebar.tsx
│       │   │   ├── TopBar.tsx
│       │   │   ├── PlayerBar.tsx
│       │   │   └── QueuePanel.tsx
│       │   └── ui/               # Shadcn UI components
│       │       ├── button.tsx
│       │       ├── card.tsx
│       │       ├── dialog.tsx
│       │       └── ...
│       ├── contexts/
│       │   ├── AuthContext.tsx   # Authentication state
│       │   ├── PlayerContext.tsx # Music player state
│       │   └── __tests__/
│       ├── hooks/
│       │   ├── useDebounce.ts    # Debounce hook
│       │   ├── useLocalStorage.ts
│       │   ├── useRecentlyPlayed.ts
│       │   ├── useToast.ts
│       │   └── __tests__/
│       ├── services/             # API service layer
│       │   ├── api.service.ts    # Base fetch wrapper
│       │   ├── auth.service.ts
│       │   ├── tracks.service.ts
│       │   ├── albums.service.ts
│       │   ├── artists.service.ts
│       │   ├── playlists.service.ts
│       │   └── search.service.ts
│       ├── types/                # TypeScript types
│       │   ├── track.types.ts
│       │   ├── album.types.ts
│       │   ├── artist.types.ts
│       │   ├── playlist.types.ts
│       │   ├── player.types.ts
│       │   └── user.types.ts
│       └── utils/
│           └── formatters.ts     # formatTime, formatDate
```

## Code Style

### Imports Order
```typescript
// 1. React/Next.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// 2. Third-party libraries
import { Play, Pause, SkipForward } from 'lucide-react';

// 3. Local imports (absolute with @/)
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { usePlayer } from '@/shared/contexts/PlayerContext';
import { TrackWithPopulated } from '@/shared/types/track.types';
```

### Naming Conventions
- **Files**: `PascalCase.tsx` for components, `camelCase.ts` for utilities
- **Components**: `PascalCase` (e.g., `TrackCard`)
- **Hooks**: `use` prefix (e.g., `useDebounce`)
- **Types**: `PascalCase` with suffix (e.g., `TrackWithPopulated`)
- **Services**: `kebab-case.service.ts` (e.g., `auth.service.ts`)

### Component Pattern
```typescript
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ComponentProps {
  title: string;
  className?: string;
}

export function Component({ title, className }: ComponentProps) {
  const [state, setState] = useState(false);

  return (
    <div className={cn('base-styles', className)}>
      {title}
    </div>
  );
}
```

### State Management
- **NO Redux/Zustand** - Use React Context only
- `AuthContext` - User authentication state
- `PlayerContext` - Music player with useReducer

### Data Fetching
- Use native `fetch` API (NO Axios)
- Services wrap API calls with error handling
- Token stored in localStorage

## Commands

```bash
# Development
npm run dev              # Start dev server (port 3000)

# Build
npm run build            # Production build
npm run start            # Start production server

# Linting
npm run lint             # ESLint

# Testing
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Run single test file
npx jest src/shared/hooks/__tests__/useDebounce.test.ts
```

## Key Patterns

### PlayerContext Reducer
```typescript
// State management for music player
type PlayerAction =
  | { type: 'PLAY_TRACK'; payload: Track }
  | { type: 'PLAY_TRACKS'; payload: { tracks: Track[]; startIndex: number } }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'TOGGLE_REPEAT' }
  | { type: 'REMOVE_FROM_QUEUE'; payload: number }
  | { type: 'TICK' };
```

### API Service Pattern
```typescript
// services/api.service.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/api/v1${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });
  if (!response.ok) throw new Error('API request failed');
  return response.json();
}
```

### useDebounce Hook
```typescript
// Debounces value changes for search input
const debouncedQuery = useDebounce(query, 300);

useEffect(() => {
  if (debouncedQuery) {
    performSearch(debouncedQuery);
  }
}, [debouncedQuery]);
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Testing Patterns

```typescript
// Component tests with React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { TrackCard } from '../TrackCard';

const mockTrack = {
  _id: 'track-1',
  title: 'Test Track',
  artistId: { name: 'Test Artist' },
  albumId: { coverImageUrl: '/cover.jpg' },
  durationInSeconds: 180,
};

describe('TrackCard', () => {
  it('renders track title', () => {
    render(<TrackCard track={mockTrack} />);
    expect(screen.getByText('Test Track')).toBeInTheDocument();
  });
});
```

## Tailwind Custom Colors

```javascript
// tailwind.config.ts
colors: {
  'hackify-green': '#1DB954',
  'hackify-black': '#121212',
  'hackify-dark-gray': '#181818',
  'hackify-light-gray': '#282828',
  'hackify-text-subdued': '#B3B3B3',
}
```

## Key Dependencies

- **UI**: `@radix-ui/*` components, `lucide-react` icons
- **Styling**: `tailwindcss`, `tailwind-merge`, `class-variance-authority`
- **Drag & Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`
- **Validation**: `zod`
