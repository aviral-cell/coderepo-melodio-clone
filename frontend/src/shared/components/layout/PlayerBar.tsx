'use client';

import Image from 'next/image';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  ListMusic,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { Slider } from '@/shared/components/ui/slider';
import { usePlayer } from '@/shared/contexts/PlayerContext';
import { formatTime } from '@/shared/utils/formatters';

export function PlayerBar() {
  const {
    state,
    togglePlayPause,
    next,
    previous,
    seek,
    toggleShuffle,
    toggleRepeat,
    setVolume,
    toggleQueue,
  } = usePlayer();

  const { currentTrack, isPlaying, elapsedSeconds, shuffleEnabled, repeatMode, volume } = state;

  const progress = currentTrack
    ? (elapsedSeconds / currentTrack.durationInSeconds) * 100
    : 0;

  const handleSeek = (value: number[]) => {
    if (currentTrack) {
      const newTime = (value[0] / 100) * currentTrack.durationInSeconds;
      seek(newTime);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  const artistName =
    typeof currentTrack?.artistId === 'object'
      ? currentTrack.artistId.name
      : 'Unknown Artist';

  const albumCover =
    typeof currentTrack?.albumId === 'object'
      ? currentTrack.albumId.coverImageUrl
      : undefined;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 h-[90px] border-t border-spotify-light-gray bg-spotify-dark-gray px-4">
      <div className="flex h-full items-center justify-between">
        {/* Left: Track Info */}
        <div className="flex w-[30%] items-center gap-4">
          {currentTrack && (
            <>
              <div className="relative h-14 w-14 overflow-hidden rounded">
                {albumCover ? (
                  <Image
                    src={albumCover}
                    alt={currentTrack.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-spotify-light-gray">
                    <ListMusic className="h-6 w-6 text-spotify-text-subdued" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm text-white">{currentTrack.title}</p>
                <p className="truncate text-xs text-spotify-text-subdued">
                  {artistName}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Center: Player Controls */}
        <div className="flex w-[40%] flex-col items-center gap-2">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8',
                shuffleEnabled ? 'text-spotify-green' : 'text-spotify-text-subdued hover:text-white',
              )}
              onClick={toggleShuffle}
            >
              <Shuffle className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-spotify-text-subdued hover:text-white"
              onClick={previous}
            >
              <SkipBack className="h-5 w-5" />
            </Button>

            <Button
              variant="default"
              size="icon"
              className="h-8 w-8 rounded-full bg-white text-black hover:scale-105 hover:bg-white"
              onClick={togglePlayPause}
              disabled={!currentTrack}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 pl-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-spotify-text-subdued hover:text-white"
              onClick={next}
            >
              <SkipForward className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8',
                repeatMode !== 'off'
                  ? 'text-spotify-green'
                  : 'text-spotify-text-subdued hover:text-white',
              )}
              onClick={toggleRepeat}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="h-4 w-4" />
              ) : (
                <Repeat className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="flex w-full max-w-[500px] items-center gap-2">
            <span className="w-10 text-right text-xs text-spotify-text-subdued">
              {formatTime(elapsedSeconds)}
            </span>
            <Slider
              value={[progress]}
              max={100}
              step={0.1}
              className="w-full"
              onValueChange={handleSeek}
            />
            <span className="w-10 text-xs text-spotify-text-subdued">
              {currentTrack ? formatTime(currentTrack.durationInSeconds) : '0:00'}
            </span>
          </div>
        </div>

        {/* Right: Volume & Queue */}
        <div className="flex w-[30%] items-center justify-end gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-spotify-text-subdued hover:text-white"
            onClick={toggleQueue}
          >
            <ListMusic className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-spotify-text-subdued" />
            <Slider
              value={[volume]}
              max={100}
              step={1}
              className="w-24"
              onValueChange={handleVolumeChange}
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
