import { Music, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDuration } from "@/shared/utils";
import { useSearch } from "@/shared/hooks/useSearch";
import type { TrackWithPopulated } from "@/shared/types/player.types";

interface SearchDropdownProps {
	query: string;
	isOpen: boolean;
	onClose: () => void;
	onTrackSelect: (track: TrackWithPopulated) => void;
}

export function SearchDropdown({
	query,
	isOpen,
	onClose,
	onTrackSelect,
}: SearchDropdownProps) {
	const { tracks, isLoading, error } = useSearch(query);

	const handleTrackClick = (track: TrackWithPopulated) => {
		onTrackSelect(track);
		onClose();
	};

	if (!isOpen) {
		return null;
	}

	return (
		<div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-lg bg-melodio-dark-gray shadow-xl">
			{isLoading ? (
				<div className="flex items-center justify-center py-8">
					<Loader2 className="h-6 w-6 animate-spin text-melodio-text-subdued" />
				</div>
			) : error ? (
				<div className="px-4 py-8 text-center text-sm text-melodio-text-subdued">
					{error}
				</div>
			) : tracks.length === 0 ? (
				<div className="px-4 py-8 text-center text-sm text-melodio-text-subdued">
					No results found
				</div>
			) : (
				<>
					<div className="border-b border-melodio-light-gray px-4 py-3">
						<span className="text-xs font-semibold uppercase tracking-wider text-melodio-text-subdued">
							{tracks.length} {tracks.length === 1 ? "RESULT" : "RESULTS"}
						</span>
					</div>
					<div className="py-2">
						{tracks.map((track) => {
							const artistName =
								typeof track.artistId === "object"
									? track.artistId.name
									: "Unknown Artist";
							const albumTitle =
								typeof track.albumId === "object"
									? track.albumId.title
									: "Unknown Album";
							const albumCover =
								typeof track.albumId === "object"
									? track.albumId.coverImageUrl
									: undefined;

							return (
								<button
									key={track._id}
									type="button"
									onClick={() => handleTrackClick(track)}
									className={cn(
										"flex w-full items-center gap-3 px-4 py-2 text-left transition-colors",
										"hover:bg-melodio-light-gray focus:bg-melodio-light-gray focus:outline-none"
									)}
								>
									<div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded">
										{albumCover ? (
											<img
												src={albumCover}
												alt={track.title}
												className="h-full w-full object-cover"
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center bg-melodio-light-gray">
												<Music className="h-4 w-4 text-melodio-text-subdued" />
											</div>
										)}
									</div>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-semibold text-white">
											{track.title}
										</p>
										<p className="truncate text-xs text-melodio-text-subdued">
											{artistName} - {albumTitle}
										</p>
									</div>
									<span className="flex-shrink-0 text-sm text-melodio-text-subdued">
										{formatDuration(track.durationInSeconds)}
									</span>
								</button>
							);
						})}
					</div>
				</>
			)}
		</div>
	);
}
