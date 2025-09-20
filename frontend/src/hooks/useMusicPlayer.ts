import { useState, useCallback, useRef, useEffect } from 'react';
import { type PlayerState, type PlayerControls, type Song } from '../types';

const initialState: PlayerState = {
  currentSong: null,
  isPlaying: false,
  currentTime: 0,
  volume: 30,
  isShuffled: false,
  repeatMode: 'none',
  queue: []
};

export const useMusicPlayer = () => {
  const [playerState, setPlayerState] = useState<PlayerState>(initialState);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      audioRef.current.volume = playerState.volume / 100;
    }
  }, []);

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setPlayerState(prev => ({ ...prev, isPlaying: true }));
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const next = useCallback(() => {
    setPlayerState(prev => {
      if (prev.queue.length === 0) return prev;
      
      const currentIndex = prev.queue.findIndex(song => song.id === prev.currentSong?.id);
      let nextIndex = currentIndex + 1;
      
      if (prev.isShuffled) {
        nextIndex = Math.floor(Math.random() * prev.queue.length);
      } else if (nextIndex >= prev.queue.length) {
        nextIndex = prev.repeatMode === 'all' ? 0 : currentIndex;
      }
      
      return {
        ...prev,
        currentSong: prev.queue[nextIndex],
        currentTime: 0
      };
    });
  }, []);

  const previous = useCallback(() => {
    setPlayerState(prev => {
      if (prev.queue.length === 0) return prev;
      
      const currentIndex = prev.queue.findIndex(song => song.id === prev.currentSong?.id);
      let prevIndex = currentIndex - 1;
      
      if (prevIndex < 0) {
        prevIndex = prev.repeatMode === 'all' ? prev.queue.length - 1 : 0;
      }
      
      return {
        ...prev,
        currentSong: prev.queue[prevIndex],
        currentTime: 0
      };
    });
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setPlayerState(prev => ({ ...prev, currentTime: time }));
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
      setPlayerState(prev => ({ ...prev, volume }));
    }
  }, []);

  const toggleShuffle = useCallback(() => {
    setPlayerState(prev => ({ ...prev, isShuffled: !prev.isShuffled }));
  }, []);

  const toggleRepeat = useCallback(() => {
    setPlayerState(prev => {
      const modes: Array<'none' | 'one' | 'all'> = ['none', 'all', 'one'];
      const currentIndex = modes.indexOf(prev.repeatMode);
      const nextIndex = (currentIndex + 1) % modes.length;
      return { ...prev, repeatMode: modes[nextIndex] };
    });
  }, []);

  const playSong = useCallback((song: Song, queue: Song[] = []) => {
    setPlayerState(prev => ({
      ...prev,
      currentSong: song,
      queue: queue.length > 0 ? queue : prev.queue,
      currentTime: 0,
      isPlaying: true
    }));
  }, []);

  const setQueue = useCallback((queue: Song[]) => {
    setPlayerState(prev => ({ ...prev, queue }));
  }, []);

  const playerControls: PlayerControls = {
    play,
    pause,
    next,
    previous,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat
  };

  return {
    playerState,
    playerControls,
    playSong,
    setQueue
  };
};
