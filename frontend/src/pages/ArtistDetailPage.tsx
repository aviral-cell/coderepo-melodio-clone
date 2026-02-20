import { useEffect, useState, useCallback } from "react";
import type { JSX } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TrackCard } from "@/shared/components/common/TrackCard";
import { AppImage } from "@/shared/components/common/AppImage";
import { artistsService } from "@/shared/services";
import { tracksService } from "@/shared/services";
import { getImageUrl } from "@/shared/utils";
import type { Artist } from "@/shared/types";
import type { TrackWithPopulated } from "@/shared/types/player.types";

function formatFollowerCount(count: number): string {
	if (count >= 1_000_000) {
		const value = count / 1_000_000;
		return value % 1 === 0 ? `${value}M` : `${value.toFixed(1)}M`;
	}
	if (count >= 1_000) {
		const value = count / 1_000;
		return value % 1 === 0 ? `${value}K` : `${value.toFixed(1)}K`;
	}
	return count.toString();
}

export default function ArtistDetailPage(): JSX.Element {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [artist, setArtist] = useState<Artist | null>(null);
	const [tracks, setTracks] = useState<TrackWithPopulated[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchArtistData = useCallback(async () => {
		if (!id) return;
		try {
			setIsLoading(true);
			setError(null);
			const [artistData, tracksRes] = await Promise.all([
				artistsService.getById(id),
				tracksService.getAll({ artistId: id, limit: 100 }),
			]);
			setArtist(artistData);
			setTracks(tracksRes.items);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load artist");
		} finally {
			setIsLoading(false);
		}
	}, [id]);

	useEffect(() => {
		fetchArtistData();
	}, [fetchArtistData]);

	if (isLoading) {
		return (
			<div className="p-8">
				<Skeleton className="mb-4 h-8 w-32 rounded" />
				<div className="mb-8 flex items-center gap-6">
					<Skeleton className="h-32 w-32 rounded-full" />
					<div>
						<Skeleton className="mb-2 h-8 w-48 rounded" />
						<Skeleton className="h-4 w-32 rounded" />
					</div>
				</div>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
					{Array.from({ length: 10 }).map((_, index) => (
						<div key={index} className="rounded-md bg-melodio-dark-gray p-4">
							<Skeleton className="mb-4 aspect-square w-full rounded-md" />
							<Skeleton className="mb-2 h-4 w-3/4" />
							<Skeleton className="h-3 w-1/2" />
						</div>
					))}
				</div>
			</div>
		);
	}

	if (error || !artist) {
		return (
			<div className="p-8">
				<Button
					variant="ghost"
					className="mb-4 text-melodio-text-subdued hover:text-white"
					onClick={() => navigate(-1)}
				>
					<ChevronLeft className="mr-2 h-4 w-4" />
					Back
				</Button>
				<div className="py-12 text-center text-red-500">
					<p>{error || "Artist not found"}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="p-8">
			<Button
				variant="ghost"
				className="mb-4 text-melodio-text-subdued hover:text-white"
				onClick={() => navigate(-1)}
			>
				<ChevronLeft className="mr-2 h-4 w-4" />
				Back
			</Button>

			<div className="mb-8 flex items-center gap-6">
				<div className="h-32 w-32 shrink-0 overflow-hidden rounded-full">
					<AppImage
						src={getImageUrl(artist.imageUrl)}
						alt={artist.name}
						className="h-full w-full object-cover"
					/>
				</div>
				<div>
					<h1 className="text-3xl font-bold text-white">{artist.name}</h1>
					<p className="text-melodio-text-subdued">
						{formatFollowerCount(artist.followerCount)} followers
					</p>
					{artist.genres && artist.genres.length > 0 && (
						<p className="mt-1 text-sm text-melodio-text-subdued">
							{artist.genres.map((g) => g.charAt(0).toUpperCase() + g.slice(1)).join(", ")}
						</p>
					)}
				</div>
			</div>

			<h2 className="mb-4 text-xl font-semibold text-white">
				Tracks ({tracks.length})
			</h2>

			{tracks.length > 0 ? (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
					{tracks.map((track) => (
						<TrackCard key={track._id} track={track} />
					))}
				</div>
			) : (
				<p className="text-melodio-text-subdued">No tracks found for this artist.</p>
			)}
		</div>
	);
}
