import { Play, Pause } from "lucide-react";
import { useNavigate } from "react-router";

import { cn } from "@/lib/utils";
import { AppImage } from "@/shared/components/common/AppImage";
import { formatDuration, getImageUrl } from "@/shared/utils";
import { usePlayer } from "@/shared/contexts/PlayerContext";
import type { TrackWithPopulated } from "@/shared/types/player.types";

interface TrackCardProps {
	track: TrackWithPopulated;
	className?: string;
}

export function TrackCard({ track, className }: TrackCardProps) {
	const navigate = useNavigate();
	const { state, playTrack, togglePlayPause } = usePlayer();

	const isCurrentTrack = state.currentTrack?._id === track._id;
	const isPlaying = isCurrentTrack && state.isPlaying;

	const artistName =
		(track as unknown as { artist?: { name: string } }).artist?.name ||
		(typeof track.artistId === "object" ? track.artistId?.name : null) ||
		"Unknown Artist";
	const albumCover =
		(track as unknown as { album?: { coverImageUrl: string } }).album?.coverImageUrl ||
		(typeof track.albumId === "object" ? track.albumId?.coverImageUrl : undefined);
	const trackCover = track.coverImageUrl || albumCover;

	const handlePlayClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (isCurrentTrack) {
			togglePlayPause();
		} else {
			playTrack(track);
		}
	};

	const handleCardClick = () => {
		if (!track._id) return;
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
				"group relative cursor-pointer rounded-md bg-melodio-dark-gray p-4 transition-all duration-300 hover:bg-melodio-light-gray",
				className
			)}
		>
			<div className="relative mb-4 aspect-square overflow-hidden rounded-md shadow-lg">
				<AppImage
					src={getImageUrl(trackCover)}
					alt={track.title}
					className="h-full w-full object-cover"
				/>

				<button
					type="button"
					onClick={handlePlayClick}
					aria-label={isPlaying ? "Pause" : "Play"}
					className={cn(
						"absolute bottom-2 right-2 flex h-12 w-12 items-center justify-center rounded-full bg-melodio-green shadow-xl transition-all duration-300",
						"hover:scale-105 hover:bg-melodio-green-dark",
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

			<div className="min-w-0">
				<h3 className="truncate text-base font-semibold text-white">
					{track.title}
				</h3>
				<p className="mt-1 truncate text-sm text-melodio-text-subdued">
					{artistName}
				</p>
				<p className="mt-1 text-xs text-melodio-text-subdued">
					{formatDuration(track.durationInSeconds)}
				</p>
			</div>
		</div>
	);
}
