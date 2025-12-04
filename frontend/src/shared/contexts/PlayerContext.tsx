'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

import { PlayerState, PlayerAction, RepeatMode } from '../types/player.types';
import { TrackWithPopulated } from '../types/track.types';

export const initialState: PlayerState = {
  currentTrack: null,
  queue: [],
  originalQueue: [],
  queueIndex: 0,
  isPlaying: false,
  elapsedSeconds: 0,
  shuffleEnabled: false,
  repeatMode: 'off',
  volume: 80,
  isQueueOpen: false,
};

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'PLAY_TRACK': {
      const track = action.payload;
      const existingIndex = state.queue.findIndex((t) => t._id === track._id);

      if (existingIndex >= 0) {
        return {
          ...state,
          currentTrack: track,
          queueIndex: existingIndex,
          isPlaying: true,
          elapsedSeconds: 0,
        };
      }

      return {
        ...state,
        currentTrack: track,
        queue: [...state.queue, track],
        queueIndex: state.queue.length,
        isPlaying: true,
        elapsedSeconds: 0,
      };
    }

    case 'PLAY_TRACKS': {
      const { tracks, startIndex } = action.payload;
      return {
        ...state,
        queue: tracks,
        queueIndex: startIndex,
        currentTrack: tracks[startIndex] || null,
        isPlaying: true,
        elapsedSeconds: 0,
      };
    }

    case 'PAUSE':
      return { ...state, isPlaying: false };

    case 'RESUME':
      return { ...state, isPlaying: true };

    case 'NEXT': {
      if (state.queue.length === 0) return state;

      let nextIndex = state.queueIndex + 1;

      if (nextIndex >= state.queue.length) {
        if (state.repeatMode === 'all') {
          nextIndex = 0;
        } else {
          return { ...state, isPlaying: false, elapsedSeconds: 0 };
        }
      }

      return {
        ...state,
        queueIndex: nextIndex,
        currentTrack: state.queue[nextIndex],
        elapsedSeconds: 0,
      };
    }

    case 'PREVIOUS': {
      if (state.queue.length === 0) return state;

      // If more than 3 seconds elapsed, restart current track
      if (state.elapsedSeconds > 3) {
        return { ...state, elapsedSeconds: 0 };
      }

      const prevIndex = Math.max(0, state.queueIndex - 1);
      return {
        ...state,
        queueIndex: prevIndex,
        currentTrack: state.queue[prevIndex],
        elapsedSeconds: 0,
      };
    }

    case 'SEEK':
      return {
        ...state,
        elapsedSeconds: Math.min(
          action.payload,
          state.currentTrack?.durationInSeconds || 0,
        ),
      };

    case 'ADD_TO_QUEUE':
      return {
        ...state,
        queue: [...state.queue, action.payload],
      };

    case 'REMOVE_FROM_QUEUE': {
      const removeIndex = action.payload;
      const newQueue = state.queue.filter((_, i) => i !== removeIndex);

      let newQueueIndex = state.queueIndex;
      if (removeIndex < state.queueIndex) {
        newQueueIndex--;
      } else if (removeIndex === state.queueIndex) {
        // Current track was removed
        if (newQueue.length === 0) {
          return {
            ...state,
            queue: [],
            currentTrack: null,
            queueIndex: 0,
            isPlaying: false,
            elapsedSeconds: 0,
          };
        }
        newQueueIndex = Math.min(newQueueIndex, newQueue.length - 1);
      }

      return {
        ...state,
        queue: newQueue,
        queueIndex: newQueueIndex,
        currentTrack: newQueue[newQueueIndex] || null,
      };
    }

    case 'REORDER_QUEUE': {
      const { from, to } = action.payload;
      const newQueue = [...state.queue];
      const [removed] = newQueue.splice(from, 1);
      newQueue.splice(to, 0, removed);

      let newQueueIndex = state.queueIndex;
      if (from === state.queueIndex) {
        newQueueIndex = to;
      } else if (from < state.queueIndex && to >= state.queueIndex) {
        newQueueIndex--;
      } else if (from > state.queueIndex && to <= state.queueIndex) {
        newQueueIndex++;
      }

      return {
        ...state,
        queue: newQueue,
        queueIndex: newQueueIndex,
      };
    }

    case 'CLEAR_QUEUE':
      return {
        ...state,
        queue: state.currentTrack ? [state.currentTrack] : [],
        queueIndex: 0,
      };

    case 'TOGGLE_SHUFFLE': {
      if (!state.shuffleEnabled) {
        // Enabling shuffle: store original order, shuffle remaining tracks
        const currentTrack = state.currentTrack;
        if (!currentTrack || state.queue.length <= 1) {
          return { ...state, shuffleEnabled: true, originalQueue: [...state.queue] };
        }

        // Keep current track at position 0, shuffle the rest
        const otherTracks = state.queue.filter((t) => t._id !== currentTrack._id);
        const shuffledOthers = shuffleArray(otherTracks);
        const newQueue = [currentTrack, ...shuffledOthers];

        return {
          ...state,
          shuffleEnabled: true,
          originalQueue: [...state.queue],
          queue: newQueue,
          queueIndex: 0, // Current track is now at index 0
        };
      } else {
        // Disabling shuffle: restore original order
        const currentTrack = state.currentTrack;
        const originalQueue = state.originalQueue.length > 0 ? state.originalQueue : state.queue;

        // Find current track's position in original queue
        const newIndex = currentTrack
          ? originalQueue.findIndex((t) => t._id === currentTrack._id)
          : 0;

        return {
          ...state,
          shuffleEnabled: false,
          queue: originalQueue,
          originalQueue: [],
          queueIndex: newIndex >= 0 ? newIndex : 0,
        };
      }
    }

    case 'TOGGLE_REPEAT': {
      const modes: RepeatMode[] = ['off', 'all', 'one'];
      const currentIndex = modes.indexOf(state.repeatMode);
      const nextMode = modes[(currentIndex + 1) % modes.length];
      return { ...state, repeatMode: nextMode };
    }

    case 'SET_VOLUME':
      return { ...state, volume: Math.min(100, Math.max(0, action.payload)) };

    case 'TICK': {
      if (!state.currentTrack || !state.isPlaying) return state;

      const newElapsed = state.elapsedSeconds + 1;

      if (newElapsed >= state.currentTrack.durationInSeconds) {
        // Track complete
        if (state.repeatMode === 'one') {
          return { ...state, elapsedSeconds: 0 };
        }

        const nextIndex = state.queueIndex + 1;
        if (nextIndex >= state.queue.length) {
          if (state.repeatMode === 'all') {
            return {
              ...state,
              queueIndex: 0,
              currentTrack: state.queue[0],
              elapsedSeconds: 0,
            };
          }
          return { ...state, isPlaying: false, elapsedSeconds: 0 };
        }

        return {
          ...state,
          queueIndex: nextIndex,
          currentTrack: state.queue[nextIndex],
          elapsedSeconds: 0,
        };
      }

      return { ...state, elapsedSeconds: newElapsed };
    }

    case 'TOGGLE_QUEUE':
      return { ...state, isQueueOpen: !state.isQueueOpen };

    default:
      return state;
  }
}

interface PlayerContextType {
  state: PlayerState;
  dispatch: React.Dispatch<PlayerAction>;
  playTrack: (track: TrackWithPopulated) => void;
  playTracks: (tracks: TrackWithPopulated[], startIndex?: number) => void;
  togglePlayPause: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  addToQueue: (track: TrackWithPopulated) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
  clearQueue: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setVolume: (volume: number) => void;
  toggleQueue: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, initialState);

  // Timer for simulated playback
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (state.isPlaying && state.currentTrack) {
      interval = setInterval(() => {
        dispatch({ type: 'TICK' });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isPlaying, state.currentTrack]);

  // Helper to save recently played tracks to localStorage
  const saveToRecentlyPlayed = useCallback((track: TrackWithPopulated) => {
    try {
      const STORAGE_KEY = 'spotify_clone_recently_played';
      const MAX_RECENT = 10;
      const stored = localStorage.getItem(STORAGE_KEY);
      const recent: TrackWithPopulated[] = stored ? JSON.parse(stored) : [];
      const filtered = recent.filter((t) => t._id !== track._id);
      const updated = [track, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Silently fail if localStorage is unavailable
    }
  }, []);

  const playTrack = useCallback((track: TrackWithPopulated) => {
    dispatch({ type: 'PLAY_TRACK', payload: track });
    saveToRecentlyPlayed(track);
  }, [saveToRecentlyPlayed]);

  const playTracks = useCallback(
    (tracks: TrackWithPopulated[], startIndex = 0) => {
      dispatch({ type: 'PLAY_TRACKS', payload: { tracks, startIndex } });
      if (tracks[startIndex]) {
        saveToRecentlyPlayed(tracks[startIndex]);
      }
    },
    [saveToRecentlyPlayed],
  );

  const togglePlayPause = useCallback(() => {
    dispatch({ type: state.isPlaying ? 'PAUSE' : 'RESUME' });
  }, [state.isPlaying]);

  const next = useCallback(() => dispatch({ type: 'NEXT' }), []);
  const previous = useCallback(() => dispatch({ type: 'PREVIOUS' }), []);
  const seek = useCallback((seconds: number) => dispatch({ type: 'SEEK', payload: seconds }), []);
  const addToQueue = useCallback(
    (track: TrackWithPopulated) => dispatch({ type: 'ADD_TO_QUEUE', payload: track }),
    [],
  );
  const removeFromQueue = useCallback(
    (index: number) => dispatch({ type: 'REMOVE_FROM_QUEUE', payload: index }),
    [],
  );
  const reorderQueue = useCallback(
    (from: number, to: number) => dispatch({ type: 'REORDER_QUEUE', payload: { from, to } }),
    [],
  );
  const clearQueue = useCallback(() => dispatch({ type: 'CLEAR_QUEUE' }), []);
  const toggleShuffle = useCallback(() => dispatch({ type: 'TOGGLE_SHUFFLE' }), []);
  const toggleRepeat = useCallback(() => dispatch({ type: 'TOGGLE_REPEAT' }), []);
  const setVolume = useCallback(
    (volume: number) => dispatch({ type: 'SET_VOLUME', payload: volume }),
    [],
  );
  const toggleQueue = useCallback(() => dispatch({ type: 'TOGGLE_QUEUE' }), []);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      playTrack,
      playTracks,
      togglePlayPause,
      next,
      previous,
      seek,
      addToQueue,
      removeFromQueue,
      reorderQueue,
      clearQueue,
      toggleShuffle,
      toggleRepeat,
      setVolume,
      toggleQueue,
    }),
    [
      state,
      playTrack,
      playTracks,
      togglePlayPause,
      next,
      previous,
      seek,
      addToQueue,
      removeFromQueue,
      reorderQueue,
      clearQueue,
      toggleShuffle,
      toggleRepeat,
      setVolume,
      toggleQueue,
    ],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextType {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
