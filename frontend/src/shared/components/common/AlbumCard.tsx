'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Music } from 'lucide-react';

import { cn } from '@/lib/utils';
import { AlbumWithPopulated } from '@/shared/types/album.types';

interface AlbumCardProps {
  album: AlbumWithPopulated;
  className?: string;
}

export function AlbumCard({ album, className }: AlbumCardProps) {
  const artistName =
    typeof album.artistId === 'object' ? album.artistId.name : 'Unknown Artist';

  return (
    <Link
      href={`/album/${album._id}`}
      className={cn(
        'group relative block cursor-pointer rounded-md bg-spotify-dark-gray p-4 transition-colors hover:bg-spotify-light-gray',
        className,
      )}
    >
      {/* Album Cover */}
      <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-md shadow-lg">
        {album.coverImageUrl ? (
          <Image
            src={album.coverImageUrl}
            alt={album.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-spotify-light-gray">
            <Music className="h-12 w-12 text-spotify-text-subdued" />
          </div>
        )}
      </div>

      {/* Album Info */}
      <div className="min-w-0">
        <h3 className="truncate text-base font-semibold text-white">{album.title}</h3>
        <p className="truncate text-sm text-spotify-text-subdued">
          {new Date(album.releaseDate).getFullYear()} - {artistName}
        </p>
      </div>
    </Link>
  );
}
