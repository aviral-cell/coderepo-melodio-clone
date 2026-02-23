import { useState, useEffect } from "react";
import { ListMusic, Plus, Check, Loader2 } from "lucide-react";
import { AppImage } from "@/shared/components/common/AppImage";
import { getImageUrl } from "@/shared/utils";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { usePlaylistRefresh } from "@/shared/contexts/PlaylistContext";
import { useToast } from "@/shared/hooks/useToast";
import { playlistsService } from "@/shared/services/playlist.service";
import type { Playlist } from "@/shared/types";

interface AddToPlaylistModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	trackId: string;
	trackTitle?: string;
	onSuccess?: () => void;
}

export function AddToPlaylistModal({
	open,
	onOpenChange,
	trackId,
	trackTitle,
	onSuccess,
}: AddToPlaylistModalProps) {
	const [playlists, setPlaylists] = useState<Playlist[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [addingToPlaylistId, setAddingToPlaylistId] = useState<string | null>(
		null
	);
	const [addedToPlaylistIds, setAddedToPlaylistIds] = useState<Set<string>>(
		new Set()
	);
	const { addToast } = useToast();
	const { triggerRefresh } = usePlaylistRefresh();

	useEffect(() => {
		if (open) {
			fetchPlaylists();
			setAddedToPlaylistIds(new Set());
		}
	}, [open]);

	const fetchPlaylists = async () => {
		setIsLoading(true);
		try {
			const data = await playlistsService.getAll();
			setPlaylists(data);
		} catch (error) {
			addToast({
				type: "error",
				message:
					error instanceof Error ? error.message : "Failed to load playlists",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleAddToPlaylist = async (playlist: Playlist) => {
		if (addedToPlaylistIds.has(playlist._id)) {
			return;
		}

		setAddingToPlaylistId(playlist._id);
		try {
			await playlistsService.addTrack(playlist._id, trackId);
			setAddedToPlaylistIds((prev) => new Set(prev).add(playlist._id));
			setPlaylists((prev) =>
				prev.map((p) =>
					p._id === playlist._id
						? { ...p, trackIds: [...(p.trackIds || []), trackId] }
						: p
				)
			);
			addToast({
				type: "success",
				message: `Added to "${playlist.name}"`,
			});
			triggerRefresh();
			onSuccess?.();
		} catch (error) {
			addToast({
				type: "error",
				message:
					error instanceof Error
						? error.message
						: "Failed to add track to playlist",
			});
		} finally {
			setAddingToPlaylistId(null);
		}
	};

	const handleClose = () => {
		if (!addingToPlaylistId) {
			onOpenChange(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="border-melodio-light-gray bg-melodio-dark-gray sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-white">Add to Playlist</DialogTitle>
					<DialogDescription>
						{trackTitle
							? `Add "${trackTitle}" to one of your playlists.`
							: "Select a playlist to add this track."}
					</DialogDescription>
				</DialogHeader>

				<div className="overflow-hidden py-4">
					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="h-6 w-6 animate-spin text-melodio-text-subdued" />
						</div>
					) : playlists.length === 0 ? (
						<div className="py-8 text-center">
							<ListMusic className="mx-auto h-12 w-12 text-melodio-text-subdued" />
							<p className="mt-4 text-sm text-melodio-text-subdued">
								You don&apos;t have any playlists yet.
							</p>
							<p className="mt-1 text-xs text-melodio-text-subdued">
								Create a playlist first to add tracks.
							</p>
						</div>
					) : (
						<ScrollArea className="max-h-[300px] [&_[data-radix-scroll-area-viewport]>div]:!block">
							<div className="space-y-1">
								{playlists.map((playlist) => {
									const isAdding = addingToPlaylistId === playlist._id;
									const isAdded = addedToPlaylistIds.has(playlist._id);
									const trackCount =
										playlist.trackIds?.length ?? playlist.tracks?.length ?? 0;

									return (
										<button
											key={playlist._id}
											type="button"
											onClick={() => handleAddToPlaylist(playlist)}
											disabled={isAdding || isAdded}
											className={cn(
												"flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
												"hover:bg-melodio-light-gray focus:bg-melodio-light-gray focus:outline-none",
												"disabled:cursor-not-allowed disabled:opacity-50",
												isAdded && "bg-melodio-light-gray/50"
											)}
										>
											<div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded">
												<AppImage
													src={getImageUrl(playlist.coverImageUrl)}
													alt={playlist.name}
													className="h-full w-full object-cover"
												/>
											</div>

											<div className="min-w-0 flex-1">
												<p className="truncate text-sm font-medium text-white">
													{playlist.name}
												</p>
												<p className="truncate text-xs text-melodio-text-subdued">
													{trackCount} {trackCount === 1 ? "track" : "tracks"}
												</p>
											</div>

											<div className="flex-shrink-0">
												{isAdding ? (
													<Loader2 className="h-5 w-5 animate-spin text-melodio-text-subdued" />
												) : isAdded ? (
													<Check className="h-5 w-5 text-melodio-green" />
												) : (
													<Plus className="h-5 w-5 text-melodio-text-subdued" />
												)}
											</div>
										</button>
									);
								})}
							</div>
						</ScrollArea>
					)}
				</div>

				<div className="flex justify-end">
					<Button
						type="button"
						variant="ghost"
						className="rounded-full"
						onClick={handleClose}
						disabled={!!addingToPlaylistId}
					>
						Done
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
