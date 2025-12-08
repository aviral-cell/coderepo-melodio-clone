'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';

import { useAuth } from '@/shared/contexts/AuthContext';
import { useToast } from '@/shared/hooks/useToast';
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';
import { MainLayout } from '@/shared/components/layout/MainLayout';
import { TrackCard } from '@/shared/components/common/TrackCard';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { tracksService } from '@/shared/services/tracks.service';
import { TrackWithPopulated } from '@/shared/types/track.types';

interface Genre {
  name: string;
  slug: string;
  color: string;
  image: string;
}

const genres: Genre[] = [
  { name: 'Rock', slug: 'rock', color: '#E13300', image: 'https://picsum.photos/seed/rock-genre/200/200' },
  { name: 'Pop', slug: 'pop', color: '#1DB954', image: 'https://picsum.photos/seed/pop-genre/200/200' },
  { name: 'Jazz', slug: 'jazz', color: '#8D67AB', image: 'https://picsum.photos/seed/jazz-genre/200/200' },
  { name: 'Electronic', slug: 'electronic', color: '#1E3264', image: 'https://picsum.photos/seed/electronic-genre/200/200' },
  { name: 'Hip-Hop', slug: 'hip-hop', color: '#E61E32', image: 'https://picsum.photos/seed/hiphop-genre/200/200' },
];

export default function GenrePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [tracks, setTracks] = useState<TrackWithPopulated[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated || !selectedGenre) return;

    const fetchTracks = async () => {
      setIsLoading(true);
      try {
        const response = await tracksService.getAll({ genre: selectedGenre, limit: 50 });
        setTracks(response.items);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load tracks',
          description: error instanceof Error ? error.message : 'Please try again',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTracks();
  }, [isAuthenticated, selectedGenre, toast]);

  const handleGenreClick = (slug: string) => {
    setSelectedGenre(slug);
  };

  const handleBackClick = () => {
    setSelectedGenre(null);
    setTracks([]);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-spotify-black">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const selectedGenreData = genres.find((g) => g.slug === selectedGenre);

  return (
    <MainLayout>
      <div className="p-8">
        {selectedGenre ? (
          <>
            {/* Back Button and Genre Heading */}
            <div className="mb-6">
              <Button
                variant="ghost"
                className="mb-4 text-spotify-text-subdued hover:text-white"
                onClick={handleBackClick}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Browse
              </Button>
              <h1 className="text-3xl font-bold text-white">
                {selectedGenreData?.name || selectedGenre}
              </h1>
            </div>

            {/* Tracks Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div key={index} className="rounded-md bg-spotify-dark-gray p-4">
                    <Skeleton className="mb-4 aspect-square w-full rounded-md" />
                    <Skeleton className="mb-2 h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : tracks.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                {tracks.map((track) => (
                  <TrackCard key={track._id} track={track} />
                ))}
              </div>
            ) : (
              <p className="text-spotify-text-subdued">
                No tracks found for this genre.
              </p>
            )}
          </>
        ) : (
          <>
            {/* Genre Browse Header */}
            <h1 className="mb-6 text-3xl font-bold text-white">Browse by Genre</h1>

            {/* Genre Cards Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
              {genres.map((genre) => (
                <button
                  key={genre.slug}
                  onClick={() => handleGenreClick(genre.slug)}
                  className="relative h-40 overflow-hidden rounded-lg transition-transform hover:scale-105"
                  style={{ backgroundColor: genre.color }}
                >
                  {/* Genre Name */}
                  <span className="absolute left-4 top-4 text-2xl font-bold text-white">
                    {genre.name}
                  </span>

                  {/* Rotated Image */}
                  <div className="absolute -bottom-2 -right-4 h-24 w-24 rotate-[25deg] overflow-hidden rounded shadow-lg">
                    <Image
                      src={genre.image}
                      alt={genre.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
