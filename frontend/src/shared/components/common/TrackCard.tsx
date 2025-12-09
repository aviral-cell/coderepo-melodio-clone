'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play, Pause, MoreHorizontal, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { usePlayer } from '@/shared/contexts/PlayerContext';
import { TrackWithPopulated } from '@/shared/types/track.types';

interface TrackCardProps {
  track: TrackWithPopulated;
  className?: string;
  onAddToPlaylist?: (trackId: string) => void;
}

export function TrackCard({ track, className, onAddToPlaylist }: TrackCardProps) {
  const { state, playTrack, togglePlayPause, addToQueue } = usePlayer();

  const isCurrentTrack = state.currentTrack?._id === track._id;
  const isPlaying = isCurrentTrack && state.isPlaying;

  const artistName =
    typeof track.artistId === 'object' ? track.artistId.name : 'Unknown Artist';

  const albumCover =
    typeof track.albumId === 'object' ? track.albumId.coverImageUrl : undefined;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCurrentTrack) {
      togglePlayPause();
    } else {
      playTrack(track);
    }
  };

  const handleAddToQueue = () => {
    addToQueue(track);
  };

  return (
    <Link
      href={`/track/${track._id}`}
      className={cn(
        'group relative block cursor-pointer rounded-md bg-hackify-dark-gray p-4 transition-colors hover:bg-hackify-light-gray',
        className,
      )}
    >
      {/* Album Cover */}
      <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-md shadow-lg">
        {albumCover ? (
          <Image
            src={albumCover}
            alt={track.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-hackify-light-gray">
            <Play className="h-12 w-12 text-hackify-text-subdued" />
          </div>
        )}

        {/* Play Button Overlay */}
        <Button
          size="icon"
          className={cn(
            'absolute bottom-2 right-2 h-12 w-12 rounded-full bg-hackify-green shadow-xl transition-all hover:scale-105 hover:bg-hackify-green-dark',
            isPlaying
              ? 'translate-y-0 opacity-100'
              : 'translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100',
          )}
          onClick={handlePlayClick}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 text-black" fill="black" />
          ) : (
            <Play className="h-5 w-5 text-black" fill="black" />
          )}
        </Button>
      </div>

      {/* Track Info */}
      <div className="min-w-0">
        <h3 className="truncate text-base font-semibold text-white">{track.title}</h3>
        <p className="truncate text-sm text-hackify-text-subdued">{artistName}</p>
      </div>

      {/* More Options */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4 text-white" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleAddToQueue}>
            <Plus className="mr-2 h-4 w-4" />
            Add to queue
          </DropdownMenuItem>
          {onAddToPlaylist && (
            <DropdownMenuItem onClick={() => onAddToPlaylist(track._id)}>
              <Plus className="mr-2 h-4 w-4" />
              Add to playlist
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </Link>
  );
}
