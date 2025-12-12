import { useEffect, useState, useCallback } from "react";
import type { JSX } from "react";
import { useParams } from "react-router";
import { Link } from "react-router";
import { Play, Pause, Music, Clock3 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { EmptyState } from "@/shared/components/common/EmptyState";
import { usePlayer } from "@/shared/contexts/PlayerContext";
import { useToast } from "@/shared/hooks/useToast";
import { albumsService, tracksService } from "@/shared/services";
import type { AlbumWithPopulated } from "@/shared/services/albums.service";
import type { TrackWithPopulated } from "@/shared/types/player.types";
import { formatDuration } from "@/shared/utils";

/**
 * Format seconds to mm:ss format
 */
function formatTime(seconds: number): string {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/**
 * AlbumDetailPage - Display album details with track list.
 * Gradient header based on album cover, play controls, and track list.
 */
export default function AlbumDetailPage(): JSX.Element {
	const params = useParams();
	const albumId = params.id as string;

	const { state, playTracks, togglePlayPause } = usePlayer();
	const { addToast } = useToast();

	const [album, setAlbum] = useState<AlbumWithPopulated | null>(null);
	const [tracks, setTracks] = useState<TrackWithPopulated[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const fetchAlbumData = useCallback(async () => {
		try {
			const [albumData, tracksData] = await Promise.all([
				albumsService.getById(albumId),
				tracksService.getAll({ albumId, limit: 50 }),
			]);
			setAlbum(albumData);
			setTracks(tracksData.items);
		} catch (error) {
			addToast({
				type: "error",
				message: error instanceof Error ? error.message : "Failed to load album",
			});
		} finally {
			setIsLoading(false);
		}
	}, [albumId, addToast]);

	useEffect(() => {
		fetchAlbumData();
	}, [fetchAlbumData]);

	const handlePlayAll = () => {
		if (tracks.length === 0) return;
		playTracks(tracks, 0);
	};

	const handleTrackPlay = (track: TrackWithPopulated, index: number) => {
		if (state.currentTrack?._id === track._id) {
			togglePlayPause();
		} else {
			playTracks(tracks, index);
		}
	};

	if (isLoading) {
		return (
			<>
				<div className="bg-gradient-to-b from-amber-800 to-hackify-dark-gray p-8">
					<div className="flex items-end gap-6">
						<Skeleton className="h-56 w-56 rounded" />
						<div className="flex-1">
							<Skeleton className="mb-2 h-4 w-16" />
							<Skeleton className="mb-6 h-16 w-64" />
							<Skeleton className="h-4 w-48" />
						</div>
					</div>
				</div>
			</>
		);
	}

	if (!album) {
		return (
			<div className="flex items-center justify-center p-8">
				<EmptyState
					title="Album not found"
					description="This album does not exist or has been removed"
				/>
			</div>
		);
	}

	const artistName =
		typeof album.artistId === "object" ? album.artistId.name : "Unknown Artist";

	const totalDuration = tracks.reduce((sum, track) => sum + track.durationInSeconds, 0);
	const releaseYear = new Date(album.releaseDate).getFullYear();

	const isAlbumPlaying =
		state.isPlaying && tracks.some((t) => t._id === state.currentTrack?._id);

	return (
		<>
			{/* Album Header */}
			<div className="bg-gradient-to-b from-amber-800 to-hackify-dark-gray p-8">
				<div className="flex items-end gap-6">
					<div className="relative h-56 w-56 overflow-hidden rounded shadow-2xl">
						{album.coverImageUrl ? (
							<img
								src={album.coverImageUrl}
								alt={album.title}
								className="h-full w-full object-cover"
							/>
						) : (
							<div className="flex h-full w-full items-center justify-center bg-hackify-light-gray">
								<Music className="h-20 w-20 text-hackify-text-subdued" />
							</div>
						)}
					</div>
					<div>
						<p className="text-sm font-medium text-white">Album</p>
						<h1 className="mb-4 text-5xl font-bold text-white">{album.title}</h1>
						<div className="flex items-center gap-2 text-sm">
							<span className="font-semibold text-white">{artistName}</span>
							<span className="text-hackify-text-subdued">-</span>
							<span className="text-hackify-text-subdued">{releaseYear}</span>
							<span className="text-hackify-text-subdued">-</span>
							<span className="text-hackify-text-subdued">
								{tracks.length} {tracks.length === 1 ? "song" : "songs"},{" "}
								{formatDuration(totalDuration)}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Controls */}
			<div className="bg-gradient-to-b from-hackify-dark-gray/60 to-hackify-black px-8 py-6">
				<Button
					size="lg"
					className="h-14 w-14 rounded-full bg-hackify-green hover:scale-105 hover:bg-hackify-green-dark"
					onClick={handlePlayAll}
					disabled={tracks.length === 0}
					aria-label={isAlbumPlaying ? "Pause" : "Play all"}
				>
					{isAlbumPlaying ? (
						<Pause className="h-6 w-6 text-black" fill="black" />
					) : (
						<Play className="h-6 w-6 text-black" fill="black" />
					)}
				</Button>
			</div>

			{/* Track List */}
			<div className="px-8">
				{tracks.length > 0 ? (
					<>
						{/* Header */}
						<div className="mb-4 grid grid-cols-[16px_4fr_1fr] gap-4 border-b border-hackify-light-gray px-4 pb-2 text-hackify-text-subdued">
							<span className="text-sm">#</span>
							<span className="text-sm">Title</span>
							<span className="flex justify-end">
								<Clock3 className="h-4 w-4" />
							</span>
						</div>

						{/* Tracks */}
						{tracks.map((track, index) => {
							const isCurrentTrack = state.currentTrack?._id === track._id;
							const isPlaying = isCurrentTrack && state.isPlaying;

							return (
								<div
									key={track._id}
									className={cn(
										"group grid cursor-pointer grid-cols-[16px_4fr_1fr] items-center gap-4 rounded-md px-4 py-2 transition-colors hover:bg-hackify-light-gray",
										isCurrentTrack && "bg-hackify-light-gray/50"
									)}
									onClick={() => handleTrackPlay(track, index)}
									role="button"
									tabIndex={0}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault();
											handleTrackPlay(track, index);
										}
									}}
								>
									{/* Track Number / Play Button */}
									<div className="flex items-center justify-center">
										<span
											className={cn(
												"text-sm group-hover:hidden",
												isCurrentTrack ? "text-hackify-green" : "text-hackify-text-subdued"
											)}
										>
											{isCurrentTrack && isPlaying ? (
												<span className="flex items-center gap-0.5">
													<span className="h-2 w-0.5 animate-pulse bg-hackify-green" />
													<span className="h-3 w-0.5 animate-pulse bg-hackify-green" style={{ animationDelay: "0.2s" }} />
													<span className="h-1.5 w-0.5 animate-pulse bg-hackify-green" style={{ animationDelay: "0.4s" }} />
												</span>
											) : (
												track.trackNumber
											)}
										</span>
										<button className="hidden group-hover:block">
											{isPlaying ? (
												<Pause className="h-4 w-4 text-white" fill="white" />
											) : (
												<Play className="h-4 w-4 text-white" fill="white" />
											)}
										</button>
									</div>

									{/* Title */}
									<div className="min-w-0">
										<Link
											to={`/track/${track._id}`}
											className={cn(
												"block truncate text-sm font-medium hover:underline",
												isCurrentTrack ? "text-hackify-green" : "text-white"
											)}
											onClick={(e) => e.stopPropagation()}
										>
											{track.title}
										</Link>
										<p className="truncate text-xs text-hackify-text-subdued">{artistName}</p>
									</div>

									{/* Duration */}
									<span className="text-right text-sm text-hackify-text-subdued">
										{formatTime(track.durationInSeconds)}
									</span>
								</div>
							);
						})}
					</>
				) : (
					<EmptyState
						title="No tracks"
						description="This album has no tracks yet"
					/>
				)}
			</div>
		</>
	);
}
