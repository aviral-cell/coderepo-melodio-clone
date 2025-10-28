import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { PlayerState, PlayerControls, Song } from '../types';

// Global interval reference for time tracking
let intervalRef: number | null = null;

interface MusicPlayerState extends PlayerState {
  // Actions
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  playSong: (song: Song, queue?: Song[]) => void;
  setQueue: (queue: Song[]) => void;
  handlePlayClick: (playlist?: Song[]) => void;
}

const initialState: PlayerState = {
  currentSong: null,
  isPlaying: false,
  currentTime: 0,
  volume: 30,
  isShuffled: false,
  isRepeating: false,
  queue: []
};


export const useMusicPlayerStore = create<MusicPlayerState>()(
  devtools(
    (set, get) => ({
      // Initial state
      ...initialState,


      // Actions
      play: () => {
        set({ isPlaying: true });
        startTimeTracking();
      },

      pause: () => {
        set({ isPlaying: false });
        stopTimeTracking();
      },

      next: () => {
        const { currentSong, queue, isShuffled } = get();
        if (queue.length === 0) return;
        
        const currentIndex = queue.findIndex(song => song.id === currentSong?.id);
        const nextIndex = getNextSongIndex(currentIndex, queue, isShuffled);
        
        set({
          currentSong: queue[nextIndex],
          currentTime: 0
        });
      },

      previous: () => {
        const { currentSong, queue } = get();
        if (queue.length === 0) return;
        
        const currentIndex = queue.findIndex(song => song.id === currentSong?.id);
        let prevIndex = currentIndex - 1;
        
        if (prevIndex < 0) {
          prevIndex = 0; // Stay at first song if at beginning
        }
        
        set({
          currentSong: queue[prevIndex],
          currentTime: 0
        });
      },

      seek: (time: number) => {
        set({ currentTime: time });
      },

      setVolume: (volume: number) => {
        set({ volume });
      },

      toggleShuffle: () => {
        set(state => ({ isShuffled: !state.isShuffled }));
      },

      toggleRepeat: () => {
        set(state => ({ isRepeating: !state.isRepeating }));
      },

      playSong: (song: Song, queue: Song[] = []) => {
        set(prev => ({
          ...prev,
          currentSong: song,
          queue: queue.length > 0 ? queue : prev.queue,
          currentTime: 0,
          isPlaying: true
        }));
        startTimeTracking();
      },

      setQueue: (queue: Song[]) => {
        set({ queue });
      },

      handlePlayClick: (playlist?: Song[]) => {
        const { currentSong, isPlaying, queue, play, pause, playSong } = get();
        
        if (currentSong) {
          // If there's a current song, toggle play/pause
          if (isPlaying) {
            pause();
          } else {
            play();
          }
        } else {
          // If no current song, start a random song from the queue or provided playlist
          if (queue.length > 0) {
            const randomIndex = Math.floor(Math.random() * queue.length);
            const randomSong = queue[randomIndex];
            playSong(randomSong, queue);
          } else if (playlist && playlist.length > 0) {
            // Use provided playlist to initialize
            const randomIndex = Math.floor(Math.random() * playlist.length);
            const randomSong = playlist[randomIndex];
            playSong(randomSong, playlist);
          } else {
            console.log('No songs in the playlist. Please add songs to playlist.');
          }
        }
      },
    }),
    {
      name: 'music-player-store',
    }
  )
);

// Hook to get player state and controls
export const useMusicPlayer = () => {
  const store = useMusicPlayerStore();
  
  // Extract state and controls
  const playerState: PlayerState = {
    currentSong: store.currentSong,
    isPlaying: store.isPlaying,
    currentTime: store.currentTime,
    volume: store.volume,
    isShuffled: store.isShuffled,
    isRepeating: store.isRepeating,
    queue: store.queue
  };

  const playerControls: PlayerControls = {
    play: store.play,
    pause: store.pause,
    next: store.next,
    previous: store.previous,
    seek: store.seek,
    setVolume: store.setVolume,
    toggleShuffle: store.toggleShuffle,
    toggleRepeat: store.toggleRepeat,
    handlePlayClick: store.handlePlayClick
  };

  return {
    playerState,
    playerControls,
    playSong: store.playSong,
    setQueue: store.setQueue
  };
};


// Helper function to get next song index
const getNextSongIndex = (currentIndex: number, queue: Song[], isShuffled: boolean) => {
  if (queue.length === 0) return currentIndex;
  
  let nextIndex = currentIndex + 1;
  
  if (isShuffled) {
    nextIndex = Math.floor(Math.random() * queue.length);
  } else if (nextIndex >= queue.length) {
    nextIndex = currentIndex; // Stay at current song if at end
  }
  
  return nextIndex;
};

// Time tracking functions
const startTimeTracking = () => {
  if (intervalRef) return; // Already tracking
  
  intervalRef = setInterval(() => {
    const store = useMusicPlayerStore.getState();
    const { currentSong, isPlaying, currentTime, isRepeating, queue } = store;
    
    if (!isPlaying || !currentSong) {
      stopTimeTracking();
      return;
    }
    
    const newTime = currentTime + 1;
    
    // Check if song has ended
    if (newTime >= currentSong.duration) {
      // Handle repeat
      if (isRepeating) {
        store.seek(0);
      } else {
        // Move to next song or stop if at end of queue
        const currentIndex = queue.findIndex(song => song.id === currentSong.id);
        const nextIndex = getNextSongIndex(currentIndex, queue, store.isShuffled);
        
        if (nextIndex === currentIndex) {
          // Stop playing if at end of queue
          store.pause();
          store.seek(currentSong.duration);
        } else {
          // Move to next song
          store.playSong(queue[nextIndex], queue);
        }
      }
    } else {
      store.seek(newTime);
    }
  }, 1000);
};

const stopTimeTracking = () => {
  if (intervalRef) {
    clearInterval(intervalRef);
    intervalRef = null;
  }
};
