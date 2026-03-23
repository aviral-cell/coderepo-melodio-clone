import { useEffect } from "react";
import type { JSX } from "react";
import { Link } from "react-router";
import { ThumbsUp, Clock, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { AppImage } from "@/shared/components/common/AppImage";
import { LikeDislikeButtons } from "@/shared/components/common/LikeDislikeButtons";
import { EmptyState } from "@/shared/components/common/EmptyState";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Button } from "@/shared/components/ui/button";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/shared/components/ui/pagination";
import { useLikedTracks } from "@/shared/hooks/useLikedTracks";
import { formatDuration, getImageUrl } from "@/shared/utils";
import type { LikedSortOption } from "@/shared/utils/likedTracksUtils";

const SORT_OPTIONS: { value: LikedSortOption; label: string }[] = [
	{ value: "recent", label: "Recently Liked" },
	{ value: "title", label: "Title A-Z" },
	{ value: "artist", label: "Artist" },
	{ value: "duration", label: "Duration" },
];

function getSortLabel(sortBy: LikedSortOption): string {
	return SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label ?? "Recently Liked";
}

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
	if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
	const pages: (number | "ellipsis")[] = [1];
	if (current > 3) pages.push("ellipsis");
	for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
		pages.push(i);
	}
	if (current < total - 2) pages.push("ellipsis");
	pages.push(total);
	return pages;
}

export default function LikedTracksPage(): JSX.Element {
	const {
		tracks,
		sortBy,
		handleSortChange,
		isLoadingTracks,
		pagination,
		fetchLikedTracks,
		goToPage,
		isLiked,
	} = useLikedTracks();

	const visibleTracks = tracks.filter((t) => isLiked(t._id));

	useEffect(() => {
		fetchLikedTracks();
	}, [fetchLikedTracks]);

	if (isLoadingTracks) {
		return (
			<div className="p-4 sm:p-8" data-testid="liked-tracks-page">
				<div className="mb-6 flex items-center gap-3">
					<Skeleton className="h-12 w-12 rounded" />
					<Skeleton className="h-8 w-48" />
				</div>
				<div className="mb-4">
					<Skeleton className="h-10 w-40" />
				</div>
				<div className="space-y-2">
					{Array.from({ length: 8 }).map((_, index) => (
						<div
							key={index}
							className="grid grid-cols-[16px_1fr_auto] items-center gap-2 rounded-md px-2 py-3 sm:grid-cols-[16px_4fr_2fr_1fr_auto] sm:gap-4 sm:px-4"
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
							<Skeleton className="hidden h-3 w-12 sm:block" />
							<Skeleton className="h-8 w-16" />
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="p-4 sm:p-8" data-testid="liked-tracks-page">
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<div className="flex h-12 w-12 items-center justify-center rounded bg-gradient-to-br from-melodio-green to-emerald-600">
						<ThumbsUp className="h-6 w-6 text-white" />
					</div>
					<h1 className="text-2xl font-bold text-white sm:text-3xl">Liked Tracks</h1>
				</div>

				{visibleTracks.length > 0 && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								className="rounded-full border-melodio-light-gray text-melodio-text-subdued hover:bg-melodio-light-gray hover:text-white"
								data-testid="liked-tracks-sort-btn"
							>
								Sort: {getSortLabel(sortBy)}
								<ChevronDown className="ml-2 h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="w-48 border-melodio-light-gray bg-melodio-dark-gray"
						>
							{SORT_OPTIONS.map((option) => (
								<DropdownMenuItem
									key={option.value}
									onClick={() => handleSortChange(option.value)}
									className={cn(
										"hover:bg-melodio-light-gray focus:bg-melodio-light-gray focus:text-white",
										sortBy === option.value
											? "text-melodio-green"
											: "text-white",
									)}
									data-testid={`liked-tracks-sort-${option.value}`}
								>
									{option.label}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>

			{visibleTracks.length === 0 ? (
				<EmptyState
					icon={ThumbsUp}
					title="No liked tracks yet"
					description="Browse and like tracks to see them here."
					data-testid="liked-tracks-empty-state"
				/>
			) : (
				<div data-testid="liked-tracks-list">
					{pagination.total > 0 && (
						<div className="mb-3 text-sm text-melodio-text-subdued">
							Showing {visibleTracks.length} of {pagination.total} tracks
						</div>
					)}

					<div className="mb-2 hidden grid-cols-[16px_4fr_2fr_1fr_auto] gap-4 border-b border-melodio-light-gray px-4 pb-2 text-melodio-text-subdued sm:grid">
						<span className="text-sm">#</span>
						<span className="text-sm">Title</span>
						<span className="text-sm">Album</span>
						<span className="flex justify-end">
							<Clock className="h-4 w-4" />
						</span>
						<span className="w-16" />
					</div>

					{visibleTracks.map((track, index) => {
						const artistName =
							typeof track.artistId === "object" ? track.artistId.name : "Unknown Artist";
						const artistId =
							typeof track.artistId === "object" ? track.artistId._id : null;
						const albumTitle =
							typeof track.albumId === "object" ? track.albumId.title : "Unknown Album";
						const albumId =
							typeof track.albumId === "object" ? track.albumId._id : null;
						const coverImage =
							track.coverImageUrl ||
							(typeof track.albumId === "object" ? track.albumId.coverImageUrl : undefined);

						return (
							<div
								key={track._id}
								className="group grid grid-cols-[16px_1fr_auto] items-center gap-2 rounded-md px-2 py-2 transition-colors hover:bg-melodio-light-gray sm:grid-cols-[16px_4fr_2fr_1fr_auto] sm:gap-4 sm:px-4"
								data-testid={`liked-track-${track._id}`}
							>
								<div className="flex items-center justify-center">
									<span className="text-sm text-melodio-text-subdued">
										{index + 1}
									</span>
								</div>

								<div className="flex min-w-0 items-center gap-3">
									<div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded">
										<AppImage
											src={getImageUrl(coverImage)}
											alt={track.title}
											className="h-full w-full object-cover"
										/>
									</div>
									<div className="min-w-0 flex-1">
										<Link
											to={`/track/${track._id}`}
											className="block truncate text-sm font-medium text-white hover:underline"
										>
											{track.title}
										</Link>
										<p className="truncate text-xs text-melodio-text-subdued">
											{artistId ? (
												<Link
													to={`/artist/${artistId}`}
													className="hover:text-white hover:underline"
												>
													{artistName}
												</Link>
											) : (
												artistName
											)}
											{albumId && (
												<>
													{" "}
													<span className="text-melodio-text-subdued">&middot;</span>{" "}
													<Link
														to={`/album/${albumId}`}
														className="hover:text-white hover:underline"
													>
														{albumTitle}
													</Link>
												</>
											)}
										</p>
									</div>
								</div>

								<Link
									to={albumId ? `/album/${albumId}` : "#"}
									className="hidden truncate text-sm text-melodio-text-subdued hover:text-white hover:underline sm:block"
								>
									{albumTitle}
								</Link>

								<span className="hidden text-right text-sm text-melodio-text-subdued sm:block">
									{formatDuration(track.durationInSeconds)}
								</span>

								<div className="flex items-center justify-end">
									<LikeDislikeButtons trackId={track._id} size="sm" />
								</div>
							</div>
						);
					})}

					{pagination.totalPages > 1 && (
						<Pagination className="mt-6" data-testid="liked-tracks-pagination">
							<PaginationContent>
								<PaginationItem>
									<PaginationPrevious
										onClick={() => goToPage(pagination.page - 1)}
										className={cn(
											"cursor-pointer text-melodio-text-subdued hover:bg-melodio-light-gray hover:text-white",
											pagination.page <= 1 && "pointer-events-none opacity-50",
										)}
									/>
								</PaginationItem>
								{getPageNumbers(pagination.page, pagination.totalPages).map((pageNum, i) =>
									pageNum === "ellipsis" ? (
										<PaginationItem key={`ellipsis-${i}`}>
											<PaginationEllipsis className="text-melodio-text-subdued" />
										</PaginationItem>
									) : (
										<PaginationItem key={pageNum}>
											<PaginationLink
												isActive={pageNum === pagination.page}
												onClick={() => goToPage(pageNum)}
												className={cn(
													"cursor-pointer",
													pageNum === pagination.page
														? "border-melodio-green bg-melodio-green text-black hover:bg-melodio-green/90 hover:text-black"
														: "text-melodio-text-subdued hover:bg-melodio-light-gray hover:text-white",
												)}
											>
												{pageNum}
											</PaginationLink>
										</PaginationItem>
									),
								)}
								<PaginationItem>
									<PaginationNext
										onClick={() => goToPage(pagination.page + 1)}
										className={cn(
											"cursor-pointer text-melodio-text-subdued hover:bg-melodio-light-gray hover:text-white",
											pagination.page >= pagination.totalPages && "pointer-events-none opacity-50",
										)}
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					)}
				</div>
			)}
		</div>
	);
}
