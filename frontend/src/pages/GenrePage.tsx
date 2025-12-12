import { useEffect, useState } from "react";
import type { JSX } from "react";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TrackCard } from "@/shared/components/common/TrackCard";
import { tracksService } from "@/shared/services";
import { useToast } from "@/shared/hooks/useToast";
import type { TrackWithPopulated } from "@/shared/types/player.types";

interface Genre {
	name: string;
	slug: string;
	color: string;
	image: string;
}

const genres: Genre[] = [
	{ name: "Rock", slug: "rock", color: "#E13300", image: "https://picsum.photos/seed/rock-genre/200/200" },
	{ name: "Pop", slug: "pop", color: "#1DB954", image: "https://picsum.photos/seed/pop-genre/200/200" },
	{ name: "Jazz", slug: "jazz", color: "#8D67AB", image: "https://picsum.photos/seed/jazz-genre/200/200" },
	{ name: "Electronic", slug: "electronic", color: "#1E3264", image: "https://picsum.photos/seed/electronic-genre/200/200" },
	{ name: "Hip-Hop", slug: "hip-hop", color: "#E61E32", image: "https://picsum.photos/seed/hiphop-genre/200/200" },
];

/**
 * GenrePage - Browse music by genre.
 * Displays genre cards with images, clicking filters tracks by genre.
 */
export default function GenrePage(): JSX.Element {
	const { addToast } = useToast();

	const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
	const [tracks, setTracks] = useState<TrackWithPopulated[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (!selectedGenre) return;

		const fetchTracks = async () => {
			setIsLoading(true);
			try {
				const response = await tracksService.getAll({ genre: selectedGenre, limit: 50 });
				setTracks(response.items);
			} catch (error) {
				addToast({
					type: "error",
					message: error instanceof Error ? error.message : "Failed to load tracks",
				});
			} finally {
				setIsLoading(false);
			}
		};

		fetchTracks();
	}, [selectedGenre, addToast]);

	const handleGenreClick = (slug: string) => {
		setSelectedGenre(slug);
	};

	const handleBackClick = () => {
		setSelectedGenre(null);
		setTracks([]);
	};

	const selectedGenreData = genres.find((g) => g.slug === selectedGenre);

	return (
		<div className="p-8">
			{selectedGenre ? (
				<>
					{/* Back Button and Genre Heading */}
					<div className="mb-6">
						<Button
							variant="ghost"
							className="mb-4 text-hackify-text-subdued hover:text-white"
							onClick={handleBackClick}
						>
							<ChevronLeft className="mr-2 h-4 w-4" />
							Back to Browse
						</Button>
						<h1 className="text-3xl font-bold text-white">
							{selectedGenreData?.name || selectedGenre}
						</h1>
					</div>

					{/* Tracks Grid */}
					{isLoading ? (
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
							{Array.from({ length: 10 }).map((_, index) => (
								<div key={index} className="rounded-md bg-hackify-dark-gray p-4">
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
						<p className="text-hackify-text-subdued">
							No tracks found for this genre.
						</p>
					)}
				</>
			) : (
				<>
					{/* Genre Browse Header */}
					<h1 className="mb-6 text-3xl font-bold text-white">Browse by Genre</h1>

					{/* Genre Cards Grid */}
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
						{genres.map((genre) => (
							<button
								key={genre.slug}
								onClick={() => handleGenreClick(genre.slug)}
								className="relative h-40 overflow-hidden rounded-lg transition-transform hover:scale-105"
								style={{ backgroundColor: genre.color }}
							>
								{/* Genre Name */}
								<span className="absolute left-4 top-4 text-2xl font-bold text-white">
									{genre.name}
								</span>

								{/* Rotated Image */}
								<div className="absolute -bottom-2 -right-4 h-24 w-24 rotate-[25deg] overflow-hidden rounded shadow-lg">
									<img
										src={genre.image}
										alt={genre.name}
										className="h-full w-full object-cover"
									/>
								</div>
							</button>
						))}
					</div>
				</>
			)}
		</div>
	);
}
