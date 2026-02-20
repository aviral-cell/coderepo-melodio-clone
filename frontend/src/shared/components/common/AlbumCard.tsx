import { useNavigate } from "react-router";

import { cn } from "@/lib/utils";
import { AppImage } from "@/shared/components/common/AppImage";
import type { Album } from "@/shared/types";
import type { AlbumWithPopulated } from "@/shared/services/albums.service";
import { getImageUrl } from "@/shared/utils";

interface AlbumCardProps {
	album: Album | AlbumWithPopulated;
	className?: string;
}

export function AlbumCard({ album, className }: AlbumCardProps) {
	const navigate = useNavigate();

	const releaseYear = album.releaseDate
		? new Date(album.releaseDate).getFullYear()
		: null;

	const artistName =
		typeof album.artistId === "object" && album.artistId !== null
			? (album.artistId as { name: string }).name
			: "artist" in album && typeof album.artist === "object" && album.artist !== null
				? album.artist.name
				: undefined;

	const handleCardClick = () => {
		if (!album._id) return;
		navigate("/album/" + album._id);
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
					src={getImageUrl(album.coverImageUrl)}
					alt={album.title}
					className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
				/>
			</div>

			<div className="min-w-0">
				<h3 className="truncate text-base font-semibold text-white">
					{album.title}
				</h3>
				<p className="mt-1 truncate text-sm text-melodio-text-subdued">
					{releaseYear && <span>{releaseYear}</span>}
					{releaseYear && artistName && <span> &bull; </span>}
					{artistName && <span>{artistName}</span>}
					{!releaseYear && !artistName && <span>Album</span>}
				</p>
			</div>
		</div>
	);
}
