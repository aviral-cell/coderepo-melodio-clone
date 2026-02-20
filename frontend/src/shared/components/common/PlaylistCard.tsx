import { useNavigate } from "react-router";

import { cn } from "@/lib/utils";
import { AppImage } from "@/shared/components/common/AppImage";
import type { Playlist } from "@/shared/types";
import { getImageUrl } from "@/shared/utils";

interface PlaylistCardProps {
	playlist: Playlist;
	className?: string;
}

export function PlaylistCard({ playlist, className }: PlaylistCardProps) {
	const navigate = useNavigate();

	const trackCount = playlist.trackIds?.length ?? playlist.tracks?.length ?? 0;

	const handleCardClick = () => {
		if (!playlist._id) return;
		navigate(`/playlist/${playlist._id}`);
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
				"group cursor-pointer rounded-md bg-melodio-dark-gray p-4 transition-all duration-300 hover:bg-melodio-light-gray",
				className
			)}
		>
			<div className="relative mb-4 aspect-square overflow-hidden rounded-md shadow-lg">
				<AppImage
					src={getImageUrl(playlist.coverImageUrl)}
					alt={playlist.name}
					className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
				/>
			</div>

			<div className="min-w-0">
				<h3 className="truncate text-base font-semibold text-white">
					{playlist.name}
				</h3>
				<p className="mt-1 truncate text-sm text-melodio-text-subdued">
					{trackCount} {trackCount === 1 ? "track" : "tracks"}
				</p>
			</div>
		</div>
	);
}
