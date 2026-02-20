import { useEffect, useState } from "react";
import type { JSX } from "react";

import { Skeleton } from "@/shared/components/ui/skeleton";
import { TrackCard } from "@/shared/components/common/TrackCard";
import { AlbumCard } from "@/shared/components/common/AlbumCard";
import { PlaylistCard } from "@/shared/components/common/PlaylistCard";
import { tracksService, albumsService, playlistsService } from "@/shared/services";
import { getImageUrl, preloadImages } from "@/shared/utils";
import { useRecentlyPlayed } from "@/shared/hooks/useRecentlyPlayed";
import { useToast } from "@/shared/hooks/useToast";
import type { TrackWithPopulated } from "@/shared/types/player.types";
import type { AlbumWithPopulated } from "@/shared/services/albums.service";
import type { Playlist } from "@/shared/types";

export default function HomePage(): JSX.Element {
	const { addToast } = useToast();
	const { recentTracks } = useRecentlyPlayed();

	const [recommendedTracks, setRecommendedTracks] = useState<TrackWithPopulated[]>([]);
	const [tracks, setTracks] = useState<TrackWithPopulated[]>([]);
	const [albums, setAlbums] = useState<AlbumWithPopulated[]>([]);
	const [playlists, setPlaylists] = useState<Playlist[]>([]);
	const [isLoadingTracks, setIsLoadingTracks] = useState(true);
	const [isLoadingAlbums, setIsLoadingAlbums] = useState(true);
	const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(true);

	useEffect(() => {
		const shuffle = <T,>(arr: T[]): T[] => {
			const copy = [...arr];
			for (let i = copy.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[copy[i], copy[j]] = [copy[j], copy[i]];
			}
			return copy;
		};

		const fetchTracks = async () => {
			try {
				const response = await tracksService.getAll({ page: 1, limit: 100 });
				const allTracks = response.items;
				const shuffled = shuffle(allTracks);
				preloadImages(shuffled.slice(0, 30).map((t) => getImageUrl(t.coverImageUrl || (typeof t.albumId === "object" ? t.albumId.coverImageUrl : undefined))));
				setRecommendedTracks(shuffled.slice(0, 10));
				setTracks(shuffled.slice(10, 30));
			} catch (error) {
				addToast({
					type: "error",
					message: error instanceof Error ? error.message : "Failed to load tracks",
				});
			} finally {
				setIsLoadingTracks(false);
			}
		};

		const fetchAlbums = async () => {
			try {
				const response = await albumsService.getAll({ page: 1, limit: 20 });
				const shuffled = shuffle(response.items);
				preloadImages(shuffled.slice(0, 10).map((a) => getImageUrl(a.coverImageUrl)));
				setAlbums(shuffled.slice(0, 10));
			} catch (error) {
				addToast({
					type: "error",
					message: error instanceof Error ? error.message : "Failed to load albums",
				});
			} finally {
				setIsLoadingAlbums(false);
			}
		};

		const fetchPlaylists = async () => {
			try {
				const response = await playlistsService.getAll();
				const shuffled = shuffle(response);
				preloadImages(shuffled.map((p) => getImageUrl(p.coverImageUrl)));
				setPlaylists(shuffled);
			} catch (error) {
				addToast({
					type: "error",
					message: error instanceof Error ? error.message : "Failed to load playlists",
				});
			} finally {
				setIsLoadingPlaylists(false);
			}
		};

		fetchTracks();
		fetchAlbums();
		fetchPlaylists();
	}, [addToast]);

	const getGreeting = () => {
		const hour = new Date().getHours();
		if (hour < 12) return "Good morning";
		if (hour < 18) return "Good afternoon";
		return "Good evening";
	};

	return (
		<div className="p-8">
			<h1 className="mb-6 text-3xl font-bold text-white">{getGreeting()}</h1>

			<section className="mb-8">
				<h2 className="mb-4 text-xl font-bold text-white">Recommended for you</h2>
				{isLoadingTracks ? (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
						{Array.from({ length: 5 }).map((_, index) => (
							<div key={index} className="rounded-md bg-melodio-dark-gray p-4">
								<Skeleton className="mb-4 aspect-square w-full rounded-md" />
								<Skeleton className="mb-2 h-4 w-3/4" />
								<Skeleton className="h-3 w-1/2" />
							</div>
						))}
					</div>
				) : recommendedTracks.length > 0 ? (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
						{recommendedTracks.map((track) => (
							<TrackCard key={track._id} track={track} />
						))}
					</div>
				) : (
					<p className="text-melodio-text-subdued">
						No recommendations available yet.
					</p>
				)}
			</section>

			{recentTracks.length > 0 && (
				<section className="mb-8">
					<h2 className="mb-4 text-xl font-bold text-white">Recently played</h2>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
						{recentTracks.slice(0, 5).map((track) => (
							<TrackCard key={track._id} track={track} />
						))}
					</div>
				</section>
			)}

			<section className="mb-8">
				<h2 className="mb-4 text-xl font-bold text-white">Browse Albums</h2>
				{isLoadingAlbums ? (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
						{Array.from({ length: 5 }).map((_, index) => (
							<div key={index} className="rounded-md bg-melodio-dark-gray p-4">
								<Skeleton className="mb-4 aspect-square w-full rounded-md" />
								<Skeleton className="mb-2 h-4 w-3/4" />
								<Skeleton className="h-3 w-1/2" />
							</div>
						))}
					</div>
				) : albums.length > 0 ? (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
						{albums.map((album) => (
							<AlbumCard key={album._id} album={album} />
						))}
					</div>
				) : (
					<p className="text-melodio-text-subdued">
						No albums available. Check back later!
					</p>
				)}
			</section>

			<section className="mb-8">
				<h2 className="mb-4 text-xl font-bold text-white">Browse Tracks</h2>
				{isLoadingTracks ? (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
						{Array.from({ length: 10 }).map((_, index) => (
							<div key={index} className="rounded-md bg-melodio-dark-gray p-4">
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
					<p className="text-melodio-text-subdued">
						No tracks available. Check back later!
					</p>
				)}
			</section>

			<section className="mb-8">
				<h2 className="mb-4 text-xl font-bold text-white">Your Playlists</h2>
				{isLoadingPlaylists ? (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
						{Array.from({ length: 5 }).map((_, index) => (
							<div key={index} className="rounded-md bg-melodio-dark-gray p-4">
								<Skeleton className="mb-4 aspect-square w-full rounded-md" />
								<Skeleton className="mb-2 h-4 w-3/4" />
								<Skeleton className="h-3 w-1/2" />
							</div>
						))}
					</div>
				) : playlists.length > 0 ? (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
						{playlists.map((playlist) => (
							<PlaylistCard key={playlist._id} playlist={playlist} />
						))}
					</div>
				) : (
					<p className="text-melodio-text-subdued">
						You don&apos;t have any playlists yet. Create one to get started!
					</p>
				)}
			</section>
		</div>
	);
}
