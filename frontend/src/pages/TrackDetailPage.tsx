import { useEffect, useState, useCallback } from "react";
import type { JSX } from "react";
import { useParams } from "react-router";
import { Link } from "react-router";
import { Play, Pause, Music, Clock3, Plus, MoreHorizontal, ListPlus } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { EmptyState } from "@/shared/components/common/EmptyState";
import { AddToPlaylistModal } from "@/shared/components/common/AddToPlaylistModal";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { usePlayer } from "@/shared/contexts/PlayerContext";
import { useToast } from "@/shared/hooks/useToast";
import { useImageColor } from "@/shared/hooks/useImageColor";
import { tracksService } from "@/shared/services";
import type { TrackWithPopulated } from "@/shared/types/player.types";

function formatTime(seconds: number): string {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export default function TrackDetailPage(): JSX.Element {
	const params = useParams();
	const trackId = params.id as string;

	const { state, playTrack, togglePlayPause, addToQueue } = usePlayer();
	const { addToast } = useToast();

	const [track, setTrack] = useState<TrackWithPopulated | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);

	const albumCover = track && typeof track.albumId === "object" ? track.albumId.coverImageUrl : undefined;
	const { color: dominantColor, isReady: isColorReady } = useImageColor(albumCover);

	const fetchTrack = useCallback(async () => {
		try {
			const data = await tracksService.getById(trackId);
			setTrack(data);
		} catch (error) {
			addToast({
				type: "error",
				message: error instanceof Error ? error.message : "Failed to load track",
			});
		} finally {
			setIsLoading(false);
		}
	}, [trackId, addToast]);

	useEffect(() => {
		fetchTrack();
	}, [fetchTrack]);

	const handlePlay = () => {
		if (!track) return;
		if (state.currentTrack?._id === track._id) {
			togglePlayPause();
		} else {
			playTrack(track);
		}
	};

	const handleAddToQueue = () => {
		if (!track) return;
		addToQueue(track);
		addToast({
			type: "success",
			message: `"${track.title}" added to queue`,
		});
	};

	if (isLoading) {
		return (
			<>
				<div className="bg-melodio-dark-gray p-4 sm:p-8">
					<div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:gap-6">
						<Skeleton className="h-40 w-40 rounded sm:h-56 sm:w-56" />
						<div className="flex-1">
							<Skeleton className="mb-2 h-4 w-16" />
							<Skeleton className="mb-6 h-16 w-64" />
							<Skeleton className="h-4 w-48" />
						</div>
					</div>
				</div>
			</>
		);
	}

	if (!track) {
		return (
			<div className="flex items-center justify-center p-8">
				<EmptyState
					title="Track not found"
					description="This track does not exist or has been removed"
				/>
			</div>
		);
	}

	const artistName =
		typeof track.artistId === "object" ? track.artistId.name : "Unknown Artist";
	const artistId =
		typeof track.artistId === "object" ? track.artistId._id : null;

	const albumTitle =
		typeof track.albumId === "object" ? track.albumId.title : "Unknown Album";
	const albumId =
		typeof track.albumId === "object" ? track.albumId._id : null;

	const isCurrentTrack = state.currentTrack?._id === track._id;
	const isPlaying = isCurrentTrack && state.isPlaying;

	return (
		<>
			<div
				className="relative p-4 sm:p-8"
				style={{ backgroundColor: "var(--melodio-dark-gray, #121212)" }}
			>
				<div
					className="absolute inset-0"
					style={{
						background: `linear-gradient(to bottom, ${dominantColor}, var(--melodio-dark-gray, #121212))`,
						opacity: isColorReady ? 1 : 0,
						transition: "opacity 0.6s ease-in-out",
					}}
				/>
				<div className="relative flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:gap-6">
					<div className="relative h-40 w-40 overflow-hidden rounded shadow-2xl sm:h-56 sm:w-56">
						{albumCover ? (
							<img
								src={albumCover}
								alt={track.title}
								className="h-full w-full object-cover"
							/>
						) : (
							<div className="flex h-full w-full items-center justify-center bg-melodio-light-gray">
								<Music className="h-20 w-20 text-melodio-text-subdued" />
							</div>
						)}
					</div>
					<div className="text-center sm:text-left">
						<p className="text-sm font-medium text-white">Song</p>
						<h1 className="mb-4 text-2xl font-bold text-white sm:text-5xl">{track.title}</h1>
						<div className="flex items-center gap-2 text-sm">
							{artistId ? (
								<Link
									to={`/artist/${artistId}`}
									className="font-semibold text-white hover:underline"
								>
									{artistName}
								</Link>
							) : (
								<span className="font-semibold text-white">{artistName}</span>
							)}
							<span className="text-melodio-text-subdued">-</span>
							{albumId ? (
								<Link
									to={`/album/${albumId}`}
									className="text-melodio-text-subdued hover:text-white hover:underline"
								>
									{albumTitle}
								</Link>
							) : (
								<span className="text-melodio-text-subdued">{albumTitle}</span>
							)}
						</div>
						<div className="mt-2 flex items-center gap-4 text-sm text-melodio-text-subdued">
							<span className="capitalize">{track.genre}</span>
							<span className="flex items-center gap-1">
								<Clock3 className="h-4 w-4" />
								{formatTime(track.durationInSeconds)}
							</span>
							<span>{track.playCount.toLocaleString()} plays</span>
						</div>
					</div>
				</div>
			</div>

			<div className="bg-gradient-to-b from-melodio-dark-gray/60 to-melodio-black px-4 py-4 sm:px-8 sm:py-6">
				<div className="flex items-center justify-center gap-4 sm:justify-start">
					<Button
						size="lg"
						className="h-16 w-14 rounded-full bg-melodio-green hover:scale-105 hover:bg-melodio-green-dark"
						onClick={handlePlay}
						aria-label={isPlaying ? "Pause" : "Play"}
					>
						{isPlaying ? (
							<Pause className="h-8 w-8 fill-black text-black" fill="black" />
						) : (
							<Play className="h-8 w-8 fill-black text-black ml-0.5" fill="black" />
						)}
					</Button>

					<Button
						size="icon"
						variant="ghost"
						className="h-10 w-10 rounded-full text-melodio-text-subdued hover:scale-105 hover:text-white"
						onClick={() => setIsPlaylistModalOpen(true)}
						aria-label="Add to playlist"
					>
						<Plus className="h-6 w-6" />
					</Button>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								size="icon"
								variant="ghost"
								className="h-10 w-10 rounded-full text-melodio-text-subdued hover:scale-105 hover:text-white"
								aria-label="More options"
							>
								<MoreHorizontal className="h-6 w-6" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="start"
							className="w-48 border-melodio-light-gray bg-melodio-dark-gray"
						>
							<DropdownMenuItem
								onClick={handleAddToQueue}
								className="cursor-pointer text-white hover:bg-melodio-light-gray focus:bg-melodio-light-gray focus:text-white"
							>
								<ListPlus className="mr-2 h-4 w-4" />
								Add to queue
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => setIsPlaylistModalOpen(true)}
								className="cursor-pointer text-white hover:bg-melodio-light-gray focus:bg-melodio-light-gray focus:text-white"
							>
								<Plus className="mr-2 h-4 w-4" />
								Add to playlist
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<div className="px-4 py-4 sm:px-8">
				<div className="rounded-lg bg-melodio-dark-gray p-6">
					<h2 className="mb-4 text-lg font-bold text-white">About this track</h2>
					<dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
						<div>
							<dt className="text-melodio-text-subdued">Artist</dt>
							<dd className="mt-1 font-medium text-white">{artistName}</dd>
						</div>
						<div>
							<dt className="text-melodio-text-subdued">Album</dt>
							<dd className="mt-1 font-medium text-white">{albumTitle}</dd>
						</div>
						<div>
							<dt className="text-melodio-text-subdued">Genre</dt>
							<dd className="mt-1 font-medium capitalize text-white">{track.genre}</dd>
						</div>
						<div>
							<dt className="text-melodio-text-subdued">Track #</dt>
							<dd className="mt-1 font-medium text-white">{track.trackNumber}</dd>
						</div>
					</dl>
				</div>
			</div>

			<AddToPlaylistModal
				open={isPlaylistModalOpen}
				onOpenChange={setIsPlaylistModalOpen}
				trackId={track._id}
				trackTitle={track.title}
			/>
		</>
	);
}
