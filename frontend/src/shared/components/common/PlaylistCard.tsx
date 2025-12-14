import { ListMusic } from "lucide-react";
import { useNavigate } from "react-router";

import { cn } from "@/lib/utils";
import type { Playlist } from "@/shared/types";

interface PlaylistCardProps {
	playlist: Playlist;
	className?: string;
}

export function PlaylistCard({ playlist, className }: PlaylistCardProps) {
	const navigate = useNavigate();

	const trackCount = playlist.trackIds?.length ?? playlist.tracks?.length ?? 0;

	const handleCardClick = () => {
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
				{playlist.coverImageUrl ? (
					<img
						src={playlist.coverImageUrl}
						alt={playlist.name}
						className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-melodio-light-gray to-melodio-dark-gray">
						<ListMusic className="h-12 w-12 text-melodio-text-subdued" />
					</div>
				)}
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
