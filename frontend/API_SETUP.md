# API Setup Documentation

This document describes the API layer setup for the Hackify app, following React best practices with Zustand for state management.

## 📁 Folder Structure

```
src/
├── services/
│   └── api/
│       ├── config.ts          # API configuration and endpoints
│       ├── client.ts          # HTTP client with error handling
│       ├── songs.ts           # Songs API service
│       └── index.ts           # API exports
├── stores/
│   ├── likedSongsStore.ts     # Zustand store for liked songs
│   ├── searchStore.ts         # Zustand store for search functionality
│   └── index.ts               # Store exports
├── hooks/
│   ├── useLikedSongs.ts       # Custom hook for liked songs
│   ├── useSearch.ts           # Custom hook for search
│   └── index.ts               # Hook exports
├── types/
│   └── index.ts               # TypeScript interfaces
└── examples/
    ├── SearchExample.tsx      # Example usage of search hook
    ├── LikedSongsExample.tsx  # Example usage of liked songs hook
    └── index.ts               # Example exports
```

## 🚀 Getting Started

### 1. Environment Setup

Create a `.env` file in your project root:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### 2. Using the API in Components

**❌ Don't do this (calling API directly in component):**

```tsx
// BAD - Don't do this
const MyComponent = () => {
  const [songs, setSongs] = useState([]);
  
  useEffect(() => {
    fetch('/api/liked?userId=123')
      .then(res => res.json())
      .then(setSongs);
  }, []);
  
  return <div>{/* render songs */}</div>;
};
```

**✅ Do this (using custom hooks):**

```tsx
// GOOD - Use custom hooks
import { useLikedSongs } from '../hooks/useLikedSongs';

const MyComponent = () => {
  const { likedSongs, isLoading, fetchLikedSongs } = useLikedSongs();
  
  useEffect(() => {
    fetchLikedSongs('user-123', true);
  }, [fetchLikedSongs]);
  
  return <div>{/* render songs */}</div>;
};
```

## 🔧 API Services

### Songs API (`songsApi`)

```typescript
import { songsApi } from '../services/api';

// Like a song
await songsApi.likeSong({ songId: 'song-123', userId: 'user-123' });

// Remove liked song
await songsApi.removeLikedSong('song-123', 'user-123');

// Search songs
await songsApi.searchSongs('query', 10, 0);

// Get liked songs
await songsApi.getLikedSongs('user-123', 'cursor', 10);
```

## 🏪 Zustand Stores

### Liked Songs Store

```typescript
import { useLikedSongsStore } from '../stores/likedSongsStore';

const {
  likedSongs,        // Array of liked songs
  isLoading,         // Loading state
  error,             // Error state
  hasMore,           // Whether there are more songs to load
  total,             // Total number of liked songs
  fetchLikedSongs,   // Fetch liked songs
  loadMoreLikedSongs, // Load more liked songs
  likeSong,          // Like a song
  removeLikedSong,   // Remove liked song
  clearError,        // Clear error state
  reset,             // Reset store state
} = useLikedSongsStore();
```

### Search Store

```typescript
import { useSearchStore } from '../stores/searchStore';

const {
  searchResults,     // Array of search results
  isLoading,         // Loading state
  error,             // Error state
  query,             // Current search query
  total,             // Total number of results
  page,              // Current page
  totalPages,        // Total number of pages
  hasSearched,       // Whether a search has been performed
  searchSongs,       // Search for songs
  loadMoreResults,   // Load more search results
  clearSearch,       // Clear search results
  clearError,        // Clear error state
  reset,             // Reset store state
} = useSearchStore();
```

## 🎣 Custom Hooks

### useLikedSongs Hook

```typescript
import { useLikedSongs } from '../hooks/useLikedSongs';

const {
  // State
  likedSongs,
  isLoading,
  error,
  hasMore,
  total,
  
  // Actions
  fetchLikedSongs,
  loadMoreLikedSongs,
  likeSong,
  removeLikedSong,
  clearError,
  reset,
  
  // Helpers
  isSongLiked,       // Check if song is liked
  toggleLike,        // Toggle like status
} = useLikedSongs();
```

### useSearch Hook

```typescript
import { useSearch } from '../hooks/useSearch';

const {
  // State
  searchResults,
  isLoading,
  error,
  query,
  total,
  page,
  totalPages,
  hasSearched,
  
  // Actions
  search,
  loadMore,
  clearSearch,
  clearError,
  reset,
  
  // Helpers
  canLoadMore,       // Check if more results can be loaded
  isEmpty,           // Check if search is empty
} = useSearch();
```

## 🔒 Error Handling

The API layer includes comprehensive error handling:

```typescript
import { ApiError } from '../services/api';

try {
  await songsApi.likeSong({ songId: '123', userId: '456' });
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.message, error.status);
  }
}
```

## 🎯 Best Practices

1. **Never call APIs directly in components** - Always use the custom hooks
2. **Use the store actions** - Don't access store state directly, use the provided actions
3. **Handle errors gracefully** - Use the error state from hooks to show user feedback
4. **Use loading states** - Show loading indicators using the `isLoading` state
5. **Reset state when needed** - Use the `reset` function when navigating away from pages
6. **Use helper functions** - Leverage helper functions like `isSongLiked`, `toggleLike`, etc.

## 🔄 State Management Flow

1. **Component** calls custom hook action
2. **Custom Hook** calls Zustand store action
3. **Zustand Store** calls API service
4. **API Service** makes HTTP request
5. **Response** flows back through the chain
6. **Component** re-renders with updated state

This architecture ensures:
- ✅ Separation of concerns
- ✅ Reusable logic
- ✅ Centralized state management
- ✅ Type safety
- ✅ Error handling
- ✅ Loading states
- ✅ Easy testing
