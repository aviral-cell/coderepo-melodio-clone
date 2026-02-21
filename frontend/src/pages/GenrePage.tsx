import { useEffect, useState } from "react";
import type { JSX } from "react";
import { ChevronLeft } from "lucide-react";

import { AppImage } from "@/shared/components/common/AppImage";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TrackCard } from "@/shared/components/common/TrackCard";
import { tracksService } from "@/shared/services";
import { useToast } from "@/shared/hooks/useToast";
import type { TrackWithPopulated } from "@/shared/types/player.types";
import { getImageUrl, preloadImages } from "@/shared/utils";

interface Genre {
	name: string;
	slug: string;
	color: string;
	image: string;
}

const genres: Genre[] = [
	{ name: "Rock", slug: "rock", color: "#E13300", image: "/images/genres/rock.jpg" },
	{ name: "Pop", slug: "pop", color: "#1DB954", image: "/images/genres/pop.jpg" },
	{ name: "Jazz", slug: "jazz", color: "#8D67AB", image: "/images/genres/jazz.jpg" },
	{ name: "Electronic", slug: "electronic", color: "#1E3264", image: "/images/genres/electronic.jpg" },
	{ name: "Hip-Hop", slug: "hip-hop", color: "#E61E32", image: "/images/genres/hiphop.jpg" },
];

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
				preloadImages(response.items.map((t) => getImageUrl(t.coverImageUrl || (typeof t.albumId === "object" ? t.albumId.coverImageUrl : undefined))));
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
					<div className="mb-6">
						<Button
							variant="ghost"
							className="mb-4 text-melodio-green hover:text-melodio-green-dark hover:underline"
							onClick={handleBackClick}
						>
							<ChevronLeft className="mr-2 h-4 w-4" />
							Back to Browse
						</Button>
						<h1 className="text-3xl font-bold text-white">
							{selectedGenreData?.name || selectedGenre}
						</h1>
					</div>

					{isLoading ? (
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
							{Array.from({ length: 10 }).map((_, index) => (
								<div key={index} className="rounded-md bg-melodio-dark-gray p-4">
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
						<p className="text-melodio-text-subdued">
							No tracks found for this genre.
						</p>
					)}
				</>
			) : (
				<>
					<h1 className="mb-6 text-3xl font-bold text-white">Browse by Genre</h1>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
						{genres.map((genre) => (
							<button
								key={genre.slug}
								onClick={() => handleGenreClick(genre.slug)}
								className="relative h-40 overflow-hidden rounded-lg transition-transform hover:scale-105"
								style={{ backgroundColor: genre.color }}
							>
								<span className="absolute left-4 top-4 text-2xl font-bold text-white">
									{genre.name}
								</span>

								<div className="absolute -bottom-2 -right-4 h-24 w-24 rotate-[25deg] overflow-hidden rounded shadow-lg">
									<AppImage
										src={getImageUrl(genre.image)}
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
