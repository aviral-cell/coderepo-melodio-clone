import { Play, Pause, Music } from "lucide-react";
import { useNavigate } from "react-router";

import { cn } from "@/lib/utils";
import { formatDuration } from "@/shared/utils";
import { usePlayer } from "@/shared/contexts/PlayerContext";
import type { TrackWithPopulated } from "@/shared/types/player.types";

interface TrackCardProps {
	track: TrackWithPopulated;
	className?: string;
}

/**
 * Track card component with play/pause button and navigation
 * - Play/pause button plays/pauses the track (does NOT redirect)
 * - Card click redirects to track detail page
 */
export function TrackCard({ track, className }: TrackCardProps) {
	const navigate = useNavigate();
	const { state, playTrack, togglePlayPause } = usePlayer();

	const isCurrentTrack = state.currentTrack?._id === track._id;
	const isPlaying = isCurrentTrack && state.isPlaying;

	// Handle both frontend types (artistId/albumId) and backend API response (artist/album)
	const artistName =
		(track as unknown as { artist?: { name: string } }).artist?.name ||
		(typeof track.artistId === "object" ? track.artistId?.name : null) ||
		"Unknown Artist";
	const albumCover =
		(track as unknown as { album?: { coverImageUrl: string } }).album?.coverImageUrl ||
		(typeof track.albumId === "object" ? track.albumId?.coverImageUrl : undefined);

	const handlePlayClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (isCurrentTrack) {
			togglePlayPause();
		} else {
			playTrack(track);
		}
	};

	const handleCardClick = () => {
		navigate(`/track/${track._id}`);
	};

	return (
		<div
			onClick={handleCardClick}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					handleCardClick();
				}
			}}
			role="button"
			tabIndex={0}
			className={cn(
				"group relative cursor-pointer rounded-md bg-hackify-dark-gray p-4 transition-all duration-300 hover:bg-hackify-light-gray",
				className
			)}
		>
			{/* Album Cover */}
			<div className="relative mb-4 aspect-square overflow-hidden rounded-md shadow-lg">
				{albumCover ? (
					<img
						src={albumCover}
						alt={track.title}
						className="h-full w-full object-cover"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-hackify-light-gray">
						<Music className="h-12 w-12 text-hackify-text-subdued" />
					</div>
				)}

				{/* Play/Pause Button Overlay */}
				<button
					type="button"
					onClick={handlePlayClick}
					aria-label={isPlaying ? "Pause" : "Play"}
					className={cn(
						"absolute bottom-2 right-2 flex h-12 w-12 items-center justify-center rounded-full bg-hackify-green shadow-xl transition-all duration-300",
						"hover:scale-105 hover:bg-hackify-green-dark",
						"opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0",
						isCurrentTrack && "opacity-100 translate-y-0"
					)}
				>
					{isPlaying ? (
						<Pause className="h-5 w-5 fill-black text-black" />
					) : (
						<Play className="h-5 w-5 fill-black text-black ml-0.5" />
					)}
				</button>
			</div>

			{/* Track Info */}
			<div className="min-w-0">
				<h3 className="truncate text-base font-semibold text-white">
					{track.title}
				</h3>
				<p className="mt-1 truncate text-sm text-hackify-text-subdued">
					{artistName}
				</p>
				<p className="mt-1 text-xs text-hackify-text-subdued">
					{formatDuration(track.durationInSeconds)}
				</p>
			</div>
		</div>
	);
}
