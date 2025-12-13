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

function formatTime(seconds: number): string {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

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
				<div className="bg-gradient-to-b from-amber-800 to-melodio-dark-gray p-4 sm:p-8">
					<div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:gap-6">
						<Skeleton className="h-40 w-40 rounded sm:h-56 sm:w-56" />
						<div className="flex-1 text-center sm:text-left">
							<Skeleton className="mx-auto mb-2 h-4 w-16 sm:mx-0" />
							<Skeleton className="mx-auto mb-4 h-8 w-48 sm:mx-0 sm:mb-6 sm:h-16 sm:w-64" />
							<Skeleton className="mx-auto h-4 w-48 sm:mx-0" />
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
			<div className="bg-gradient-to-b from-amber-800 to-melodio-dark-gray p-4 sm:p-8">
				<div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:gap-6">
					<div className="relative h-40 w-40 overflow-hidden rounded shadow-2xl sm:h-56 sm:w-56">
						{album.coverImageUrl ? (
							<img
								src={album.coverImageUrl}
								alt={album.title}
								className="h-full w-full object-cover"
							/>
						) : (
							<div className="flex h-full w-full items-center justify-center bg-melodio-light-gray">
								<Music className="h-20 w-20 text-melodio-text-subdued" />
							</div>
						)}
					</div>
					<div className="text-center sm:text-left">
						<p className="text-sm font-medium text-white">Album</p>
						<h1 className="mb-4 text-2xl font-bold text-white sm:mb-6 sm:text-5xl">{album.title}</h1>
						<div className="flex flex-wrap items-center justify-center gap-1 text-sm sm:justify-start sm:gap-2">
							<span className="font-semibold text-white">{artistName}</span>
							<span className="text-melodio-text-subdued">-</span>
							<span className="text-melodio-text-subdued">{releaseYear}</span>
							<span className="text-melodio-text-subdued">-</span>
							<span className="text-melodio-text-subdued">
								{tracks.length} {tracks.length === 1 ? "song" : "songs"},{" "}
								{formatDuration(totalDuration)}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Controls */}
			<div className="bg-gradient-to-b from-melodio-dark-gray/60 to-melodio-black px-4 py-4 sm:px-8 sm:py-6">
				<div className="flex justify-center sm:justify-start">
					<Button
						size="lg"
						className="h-16 w-14 rounded-full bg-melodio-green hover:scale-105 hover:bg-melodio-green-dark"
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
			</div>

			{/* Track List */}
			<div className="px-4 sm:px-8">
				{tracks.length > 0 ? (
					<>
						{/* Header - hidden on mobile */}
						<div className="mb-4 hidden grid-cols-[16px_4fr_1fr] gap-4 border-b border-melodio-light-gray px-4 pb-2 text-melodio-text-subdued sm:grid">
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
										"group grid cursor-pointer grid-cols-[16px_1fr_auto] items-center gap-2 rounded-md px-2 py-2 transition-colors hover:bg-melodio-light-gray sm:grid-cols-[16px_4fr_1fr] sm:gap-4 sm:px-4",
										isCurrentTrack && "bg-melodio-light-gray/50"
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
												isCurrentTrack ? "text-melodio-green" : "text-melodio-text-subdued"
											)}
										>
											{isCurrentTrack && isPlaying ? (
												<span className="flex items-center gap-0.5">
													<span className="h-2 w-0.5 animate-pulse bg-melodio-green" />
													<span className="h-3 w-0.5 animate-pulse bg-melodio-green" style={{ animationDelay: "0.2s" }} />
													<span className="h-1.5 w-0.5 animate-pulse bg-melodio-green" style={{ animationDelay: "0.4s" }} />
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
												isCurrentTrack ? "text-melodio-green" : "text-white"
											)}
											onClick={(e) => e.stopPropagation()}
										>
											{track.title}
										</Link>
										<p className="truncate text-xs text-melodio-text-subdued">{artistName}</p>
									</div>

									{/* Duration */}
									<span className="text-right text-sm text-melodio-text-subdued">
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
