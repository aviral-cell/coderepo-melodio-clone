import { Disc } from "lucide-react";
import { useNavigate } from "react-router";

import { cn } from "@/lib/utils";
import type { Album } from "@/shared/types";
import type { AlbumWithPopulated } from "@/shared/services/albums.service";

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
				{album.coverImageUrl ? (
					<img
						src={album.coverImageUrl}
						alt={album.title}
						className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-melodio-light-gray">
						<Disc className="h-12 w-12 text-melodio-text-subdued" />
					</div>
				)}
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
