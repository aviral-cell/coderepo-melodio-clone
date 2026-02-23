import { useEffect, useState, useCallback } from "react";
import type { JSX } from "react";
import { Link } from "react-router";
import { Clock, History, Play, Pause, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { AppImage } from "@/shared/components/common/AppImage";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { EmptyState } from "@/shared/components/common/EmptyState";
import { usePlayer } from "@/shared/contexts/PlayerContext";
import { useToast } from "@/shared/hooks/useToast";
import { historyService, type RecentlyPlayedTrack } from "@/shared/services/history.service";
import { formatDuration, getImageUrl, preloadImages, toTrackWithPopulated } from "@/shared/utils";

function formatRelativeTime(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffSeconds = Math.floor(diffMs / 1000);
	const diffMinutes = Math.floor(diffSeconds / 60);
	const diffHours = Math.floor(diffMinutes / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffSeconds < 60) {
		return "Just now";
	}
	if (diffMinutes < 60) {
		return `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`;
	}
	if (diffHours < 24) {
		return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
	}
	if (diffDays === 1) {
		return "Yesterday";
	}
	if (diffDays < 7) {
		return `${diffDays} days ago`;
	}

	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
	}).format(date);
}

export default function RecentlyPlayedPage(): JSX.Element {
	const { state, playTrack, togglePlayPause } = usePlayer();
	const { addToast } = useToast();

	const [tracks, setTracks] = useState<RecentlyPlayedTrack[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isClearing, setIsClearing] = useState(false);

	const fetchRecentlyPlayed = useCallback(async () => {
		try {
			setIsLoading(true);
			const response = await historyService.getRecentlyPlayed(50);
			preloadImages(response.tracks.map((t) => getImageUrl(t.coverImageUrl)));
			setTracks(response.tracks);
		} catch (error) {
			addToast({
				type: "error",
				message: error instanceof Error ? error.message : "Failed to load recently played",
			});
		} finally {
			setIsLoading(false);
		}
	}, [addToast]);

	useEffect(() => {
		fetchRecentlyPlayed();
	}, [fetchRecentlyPlayed]);

	const handleClearHistory = async () => {
		try {
			setIsClearing(true);
			await historyService.clearHistory();
			setTracks([]);
			addToast({
				type: "success",
				message: "Play history cleared",
			});
		} catch (error) {
			addToast({
				type: "error",
				message: error instanceof Error ? error.message : "Failed to clear history",
			});
		} finally {
			setIsClearing(false);
		}
	};

	const handleTrackPlay = (track: RecentlyPlayedTrack) => {
		const normalizedTrack = toTrackWithPopulated(track);
		if (state.currentTrack?._id === track.id) {
			togglePlayPause();
		} else {
			playTrack(normalizedTrack);
		}
	};

	if (isLoading) {
		return (
			<div className="p-4 sm:p-8" data-testid="recently-played-page">
				<div className="mb-6 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Skeleton className="h-10 w-10 rounded" />
						<Skeleton className="h-8 w-48" />
					</div>
					<Skeleton className="h-10 w-32" />
				</div>
				<div className="space-y-2">
					{Array.from({ length: 10 }).map((_, index) => (
						<div
							key={index}
							className="grid grid-cols-[16px_1fr_auto] items-center gap-2 rounded-md px-2 py-3 sm:grid-cols-[16px_4fr_2fr_1fr_1fr] sm:gap-4 sm:px-4"
						>
							<Skeleton className="h-4 w-4" />
							<div className="flex items-center gap-3">
								<Skeleton className="h-10 w-10 rounded" />
								<div className="flex-1">
									<Skeleton className="mb-1 h-4 w-32" />
									<Skeleton className="h-3 w-24" />
								</div>
							</div>
							<Skeleton className="hidden h-3 w-24 sm:block" />
							<Skeleton className="hidden h-3 w-16 sm:block" />
							<Skeleton className="h-3 w-12" />
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="p-4 sm:p-8" data-testid="recently-played-page">
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<div className="flex h-12 w-12 items-center justify-center rounded bg-gradient-to-br from-melodio-green to-emerald-600">
						<History className="h-6 w-6 text-white" />
					</div>
					<h1 className="text-2xl font-bold text-white sm:text-3xl">Recently Played</h1>
				</div>
				{tracks.length > 0 && (
					<Button
						variant="outline"
						onClick={handleClearHistory}
						disabled={isClearing}
						className="rounded-full border-melodio-light-gray text-melodio-text-subdued hover:bg-melodio-light-gray hover:text-white"
						data-testid="recently-played-clear-btn"
					>
						<Trash2 className="mr-2 h-4 w-4" />
						{isClearing ? "Clearing..." : "Clear History"}
					</Button>
				)}
			</div>

			{tracks.length === 0 ? (
				<EmptyState
					icon={History}
					title="No recently played tracks"
					description="Start listening to music and your play history will appear here"
					data-testid="recently-played-empty-state"
				/>
			) : (
				<div data-testid="recently-played-list">
					<div className="mb-2 hidden grid-cols-[16px_4fr_2fr_1fr_1fr] gap-4 border-b border-melodio-light-gray px-4 pb-2 text-melodio-text-subdued sm:grid">
						<span className="text-sm">#</span>
						<span className="text-sm">Title</span>
						<span className="text-sm">Album</span>
						<span className="text-sm">Played</span>
						<span className="flex justify-end">
							<Clock className="h-4 w-4" />
						</span>
					</div>

					{tracks.map((track, index) => {
						const isCurrentTrack = state.currentTrack?._id === track.id;
						const isPlaying = isCurrentTrack && state.isPlaying;

						return (
							<div
								key={`${track.id}-${track.playedAt}`}
								className={cn(
									"group grid cursor-pointer grid-cols-[16px_1fr_auto] items-center gap-2 rounded-md px-2 py-2 transition-colors hover:bg-melodio-light-gray sm:grid-cols-[16px_4fr_2fr_1fr_1fr] sm:gap-4 sm:px-4",
									isCurrentTrack && "bg-melodio-light-gray/50"
								)}
								onClick={() => handleTrackPlay(track)}
								role="button"
								tabIndex={0}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										handleTrackPlay(track);
									}
								}}
								data-testid={`recently-played-track-${track.id}`}
							>
								<div className="flex items-center justify-center">
									<span
										className={cn(
											"text-sm group-hover:hidden",
											isCurrentTrack ? "text-melodio-green" : "text-melodio-text-subdued"
										)}
									>
										{isCurrentTrack && isPlaying ? (
											<span className="flex items-center gap-0.5">
												<span className="h-2 w-0.5 animate-pulse bg-melodio-green" />
												<span className="h-3 w-0.5 animate-pulse bg-melodio-green" style={{ animationDelay: "0.2s" }} />
												<span className="h-1.5 w-0.5 animate-pulse bg-melodio-green" style={{ animationDelay: "0.4s" }} />
											</span>
										) : (
											index + 1
										)}
									</span>
									<button className="hidden group-hover:block" type="button">
										{isPlaying ? (
											<Pause className="h-4 w-4 text-white" fill="white" />
										) : (
											<Play className="h-4 w-4 text-white" fill="white" />
										)}
									</button>
								</div>

								<div className="flex min-w-0 items-center gap-3">
									<div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded">
										<AppImage
											src={getImageUrl(track.coverImageUrl)}
											alt={track.title}
											className="h-full w-full object-cover"
										/>
									</div>
									<div className="min-w-0 flex-1">
										<Link
											to={`/track/${track.id}`}
											className={cn(
												"block truncate text-sm font-medium hover:underline",
												isCurrentTrack ? "text-melodio-green" : "text-white"
											)}
											onClick={(e) => e.stopPropagation()}
										>
											{track.title}
										</Link>
										<p className="truncate text-xs text-melodio-text-subdued">
											{track.artist.name}
										</p>
									</div>
								</div>

								<Link
									to={`/album/${track.album.id}`}
									className="hidden truncate text-sm text-melodio-text-subdued hover:text-white hover:underline sm:block"
									onClick={(e) => e.stopPropagation()}
								>
									{track.album.title}
								</Link>

								<span className="hidden text-sm text-melodio-text-subdued sm:block">
									{formatRelativeTime(track.playedAt)}
								</span>

								<span className="text-right text-sm text-melodio-text-subdued">
									{formatDuration(track.durationInSeconds)}
								</span>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
