'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play, Music } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { Playlist } from '@/shared/types/playlist.types';

interface PlaylistCardProps {
  playlist: Playlist;
  className?: string;
}

export function PlaylistCard({ playlist, className }: PlaylistCardProps) {
  const trackCount = Array.isArray(playlist.trackIds) ? playlist.trackIds.length : 0;

  return (
    <Link
      href={`/playlist/${playlist._id}`}
      className={cn(
        'group relative block cursor-pointer rounded-md bg-hackify-dark-gray p-4 transition-colors hover:bg-hackify-light-gray',
        className,
      )}
    >
      {/* Cover Image */}
      <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-md shadow-lg">
        {playlist.coverImageUrl ? (
          <Image
            src={playlist.coverImageUrl}
            alt={playlist.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-700 to-blue-500">
            <Music className="h-12 w-12 text-white" />
          </div>
        )}

        {/* Play Button Overlay */}
        <Button
          size="icon"
          className="absolute bottom-2 right-2 h-12 w-12 translate-y-2 rounded-full bg-hackify-green opacity-0 shadow-xl transition-all hover:scale-105 hover:bg-hackify-green-dark group-hover:translate-y-0 group-hover:opacity-100"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Could add play all functionality here
          }}
        >
          <Play className="h-5 w-5 text-black" fill="black" />
        </Button>
      </div>

      {/* Playlist Info */}
      <div className="min-w-0">
        <h3 className="truncate text-base font-semibold text-white">{playlist.name}</h3>
        <p className="truncate text-sm text-hackify-text-subdued">
          {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
        </p>
      </div>
    </Link>
  );
}
