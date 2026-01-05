import { useEffect, useState, useCallback } from "react";
import type { JSX } from "react";
import { useParams, useNavigate } from "react-router";
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	Play,
	Pause,
	Clock3,
	MoreHorizontal,
	Trash2,
	Edit2,
	Music,
	GripVertical,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { EmptyState } from "@/shared/components/common/EmptyState";
import { usePlayer } from "@/shared/contexts/PlayerContext";
import { usePlaylistRefresh } from "@/shared/contexts/PlaylistContext";
import { useToast } from "@/shared/hooks/useToast";
import { usePlaylistOperations } from "@/shared/hooks/usePlaylistOperations";
import { useImageColor } from "@/shared/hooks/useImageColor";
import { playlistsService, type PlaylistWithTracks } from "@/shared/services/playlist.service";
import type { TrackWithPopulated } from "@/shared/types/player.types";
import { formatDuration } from "@/shared/utils";

interface SortableTrackItemProps {
	track: TrackWithPopulated;
	index: number;
	isCurrentTrack: boolean;
	isPlaying: boolean;
	onPlay: () => void;
	onRemove: () => void;
}

function SortableTrackItem({
	track,
	index,
	isCurrentTrack,
	isPlaying,
	onPlay,
	onRemove,
}: SortableTrackItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: track._id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const artistName =
		typeof track.artistId === "object" ? track.artistId.name : "Unknown Artist";
	const albumTitle =
		typeof track.albumId === "object" ? track.albumId.title : "Unknown Album";
	const albumCover =
		typeof track.albumId === "object" ? track.albumId.coverImageUrl : undefined;

	const formatTime = (seconds: number): string => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				"group grid grid-cols-[24px_16px_1fr_auto_40px] items-center gap-2 rounded-md px-2 py-2 transition-colors hover:bg-melodio-light-gray sm:grid-cols-[24px_16px_4fr_3fr_1fr_40px] sm:gap-4 sm:px-4",
				isCurrentTrack && "bg-melodio-light-gray/50",
				isDragging && "bg-melodio-light-gray z-50"
			)}
		>
			<button
				className="cursor-grab touch-none text-melodio-text-subdued opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
				{...attributes}
				{...listeners}
				aria-label="Drag to reorder"
			>
				<GripVertical className="h-4 w-4" />
			</button>

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
				<button
					onClick={onPlay}
					className="hidden group-hover:block"
					aria-label={isPlaying && isCurrentTrack ? "Pause" : "Play"}
				>
					{isPlaying && isCurrentTrack ? (
						<Pause className="h-4 w-4 text-white" fill="white" />
					) : (
						<Play className="h-4 w-4 text-white" fill="white" />
					)}
				</button>
			</div>

			<div className="flex min-w-0 items-center gap-3">
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
				<div className="min-w-0">
					<p
						className={cn(
							"truncate text-sm font-medium",
							isCurrentTrack ? "text-melodio-green" : "text-white"
						)}
					>
						{track.title}
					</p>
					<p className="truncate text-xs text-melodio-text-subdued">{artistName}</p>
				</div>
			</div>

			<span className="hidden truncate text-sm text-melodio-text-subdued sm:block">{albumTitle}</span>

			<span className="text-sm text-melodio-text-subdued">
				{formatTime(track.durationInSeconds)}
			</span>

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
					>
						<MoreHorizontal className="h-4 w-4 text-melodio-text-subdued" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem
						onClick={onRemove}
						className="text-red-400"
						data-testid="remove-track-menu-item"
					>
						<Trash2 className="mr-2 h-4 w-4" />
						Remove from playlist
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

export default function PlaylistDetailPage(): JSX.Element {
	const params = useParams();
	const navigate = useNavigate();
	const playlistId = params.id as string;

	const { state, playTracks, togglePlayPause } = usePlayer();
	const { triggerRefresh } = usePlaylistRefresh();
	const { addToast } = useToast();

	const [playlist, setPlaylist] = useState<PlaylistWithTracks | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [editName, setEditName] = useState("");
	const [editDescription, setEditDescription] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const tracks = playlist?.tracks || [];
	const coverImageUrl = playlist?.coverImageUrl ||
		(tracks[0] && typeof tracks[0].albumId === "object" ? tracks[0].albumId.coverImageUrl : undefined);
	const { color: dominantColor, isReady: isColorReady } = useImageColor(coverImageUrl);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const setTracks = useCallback((newTracks: TrackWithPopulated[]) => {
		setPlaylist((prev) => {
			if (!prev) return prev;
			return {
				...prev,
				tracks: newTracks,
				trackIds: newTracks.map((t) => t._id),
			};
		});
	}, []);

	const { reorderTracks, removeTrack, isReordering, isRemoving } = usePlaylistOperations(
		playlistId,
		playlist?.tracks || [],
		setTracks,
		(error) => {
			addToast({
				type: "error",
				message: error.message || "Operation failed",
			});
		}
	);

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event;

			if (over && active.id !== over.id && playlist?.tracks) {
				const oldIndex = playlist.tracks.findIndex((t) => t._id === active.id);
				const newIndex = playlist.tracks.findIndex((t) => t._id === over.id);

				if (oldIndex !== -1 && newIndex !== -1) {
					reorderTracks(oldIndex, newIndex);
					triggerRefresh();
				}
			}
		},
		[playlist?.tracks, reorderTracks, triggerRefresh]
	);

	const fetchPlaylist = useCallback(async () => {
		try {
			const data = await playlistsService.getById(playlistId);
			setPlaylist(data);
			setEditName(data.name);
			setEditDescription(data.description || "");
		} catch (error) {
			addToast({
				type: "error",
				message: error instanceof Error ? error.message : "Failed to load playlist",
			});
		} finally {
			setIsLoading(false);
		}
	}, [playlistId, addToast]);

	useEffect(() => {
		fetchPlaylist();
	}, [fetchPlaylist]);

	const handlePlayAll = () => {
		if (!playlist || !playlist.tracks || playlist.tracks.length === 0) return;
		playTracks(playlist.tracks, 0);
	};

	const handleTrackPlay = (track: TrackWithPopulated, index: number) => {
		if (!playlist || !playlist.tracks) return;

		if (state.currentTrack?._id === track._id) {
			togglePlayPause();
		} else {
			playTracks(playlist.tracks, index);
		}
	};

	const handleRemoveTrack = async (trackId: string) => {
		try {
			await removeTrack(trackId);
			triggerRefresh();
			addToast({
				type: "success",
				message: "Track removed from playlist",
			});
		} catch {
		}
	};

	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!editName.trim()) {
			addToast({
				type: "error",
				message: "Please enter a playlist name",
			});
			return;
		}

		setIsSubmitting(true);

		try {
			const updated = await playlistsService.update(playlistId, {
				name: editName.trim(),
				description: editDescription.trim() || undefined,
			});

			setPlaylist((prev) => {
				if (!prev) return prev;
				return { ...prev, name: updated.name, description: updated.description };
			});

			triggerRefresh();
			addToast({
				type: "success",
				message: "Playlist updated",
			});

			setIsEditDialogOpen(false);
		} catch (error) {
			addToast({
				type: "error",
				message: error instanceof Error ? error.message : "Failed to update playlist",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		setIsSubmitting(true);

		try {
			await playlistsService.delete(playlistId);
			triggerRefresh();
			addToast({
				type: "success",
				message: "Playlist deleted",
			});
			navigate("/");
		} catch (error) {
			addToast({
				type: "error",
				message: error instanceof Error ? error.message : "Failed to delete playlist",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoading) {
		return (
			<>
				<div className="bg-melodio-dark-gray p-4 sm:p-8">
					<div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:gap-6">
						<Skeleton className="h-40 w-40 rounded sm:h-56 sm:w-56" />
						<div className="flex-1 text-center sm:text-left">
							<Skeleton className="mx-auto mb-2 h-4 w-20 sm:mx-0" />
							<Skeleton className="mx-auto mb-4 h-8 w-48 sm:mx-0 sm:mb-6 sm:h-16 sm:w-64" />
							<Skeleton className="mx-auto h-4 w-48 sm:mx-0" />
						</div>
					</div>
				</div>
				<div className="bg-gradient-to-b from-melodio-dark-gray/60 to-melodio-black px-4 py-4 sm:px-8 sm:py-6">
					<div className="flex justify-center sm:justify-start">
						<Skeleton className="h-14 w-14 rounded-full" />
					</div>
				</div>
				<div className="px-4 sm:px-8">
					{Array.from({ length: 5 }).map((_, i) => (
						<div
							key={i}
							className="grid grid-cols-[16px_1fr_auto_40px] gap-2 px-2 py-2 sm:grid-cols-[16px_4fr_3fr_1fr_40px] sm:gap-4 sm:px-4"
						>
							<Skeleton className="h-4 w-4" />
							<div className="flex items-center gap-3">
								<Skeleton className="h-10 w-10 rounded" />
								<div>
									<Skeleton className="mb-1 h-4 w-24 sm:w-32" />
									<Skeleton className="h-3 w-16 sm:w-24" />
								</div>
							</div>
							<Skeleton className="hidden h-4 w-24 sm:block" />
							<Skeleton className="h-4 w-10" />
							<Skeleton className="h-4 w-4" />
						</div>
					))}
				</div>
			</>
		);
	}

	if (!playlist) {
		return (
			<div className="flex items-center justify-center p-8">
				<EmptyState
					title="Playlist not found"
					description="This playlist does not exist or you do not have access to it"
				/>
			</div>
		);
	}

	const totalDuration = tracks.reduce((sum, track) => sum + track.durationInSeconds, 0);

	const isPlaylistPlaying =
		state.isPlaying && tracks.some((t) => t._id === state.currentTrack?._id);

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
						{playlist.coverImageUrl ? (
							<img
								src={playlist.coverImageUrl}
								alt={playlist.name}
								className="h-full w-full object-cover"
							/>
						) : (
							<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-700 to-blue-500">
								<Music className="h-20 w-20 text-white" />
							</div>
						)}
					</div>
					<div className="text-center sm:text-left">
						<p className="text-sm font-medium text-white">Playlist</p>
						<h1 className="mb-4 text-2xl font-bold text-white sm:mb-6 sm:text-6xl">{playlist.name}</h1>
						{playlist.description && (
							<p className="mb-2 text-sm text-melodio-text-subdued">
								{playlist.description}
							</p>
						)}
						<p className="text-sm text-melodio-text-subdued">
							{tracks.length}{" "}
							{tracks.length === 1 ? "track" : "tracks"}
							{totalDuration > 0 && ` - ${formatDuration(totalDuration)}`}
						</p>
					</div>
				</div>
			</div>

			<div className="bg-gradient-to-b from-melodio-dark-gray/60 to-melodio-black px-4 py-4 sm:px-8 sm:py-6">
				<div className="flex items-center justify-center gap-4 sm:justify-start sm:gap-6">
					<Button
						size="lg"
						className="h-16 w-14 rounded-full bg-melodio-green hover:scale-105 hover:bg-melodio-green-dark"
						onClick={handlePlayAll}
						disabled={tracks.length === 0}
						aria-label={isPlaylistPlaying ? "Pause" : "Play all"}
					>
						{isPlaylistPlaying ? (
							<Pause className="h-8 w-8 fill-black text-black" fill="black" />
						) : (
							<Play className="h-8 w-8 fill-black text-black ml-0.5" fill="black" />
						)}
					</Button>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-10 w-10 text-melodio-text-subdued hover:text-white"
							>
								<MoreHorizontal className="h-6 w-6" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
							<DropdownMenuItem
								onClick={() => setIsEditDialogOpen(true)}
								data-testid="edit-playlist-menu-item"
							>
								<Edit2 className="mr-2 h-4 w-4" />
								Edit details
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => setIsDeleteDialogOpen(true)}
								className="text-red-400"
								data-testid="delete-playlist-menu-item"
							>
								<Trash2 className="mr-2 h-4 w-4" />
								Delete playlist
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<div className="px-4 sm:px-8">
				{tracks.length > 0 ? (
					<>
						<div className="mb-4 hidden grid-cols-[24px_16px_4fr_3fr_1fr_40px] gap-4 border-b border-melodio-light-gray px-4 pb-2 text-melodio-text-subdued sm:grid">
							<span />
							<span className="text-sm">#</span>
							<span className="text-sm">Title</span>
							<span className="text-sm">Album</span>
							<span className="flex justify-end">
								<Clock3 className="h-4 w-4" />
							</span>
							<span />
						</div>

						<DndContext
							sensors={sensors}
							collisionDetection={closestCenter}
							onDragEnd={handleDragEnd}
						>
							<SortableContext
								items={tracks.map((t) => t._id)}
								strategy={verticalListSortingStrategy}
							>
								{tracks.map((track, index) => {
									const isCurrentTrack = state.currentTrack?._id === track._id;
									const isPlaying = isCurrentTrack && state.isPlaying;

									return (
										<SortableTrackItem
											key={track._id}
											track={track}
											index={index}
											isCurrentTrack={isCurrentTrack}
											isPlaying={isPlaying}
											onPlay={() => handleTrackPlay(track, index)}
											onRemove={() => handleRemoveTrack(track._id)}
										/>
									);
								})}
							</SortableContext>
						</DndContext>

						{isReordering && (
							<div className="mt-2 text-center text-sm text-melodio-text-subdued">
								Saving order...
							</div>
						)}
					</>
				) : (
					<EmptyState
						title="No tracks yet"
						description="Add tracks to this playlist to see them here"
					/>
				)}
			</div>

			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className="border-melodio-light-gray bg-melodio-dark-gray sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="text-white">Edit Playlist</DialogTitle>
						<DialogDescription>
							Update your playlist details
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleEditSubmit}>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<label htmlFor="edit-name" className="text-sm font-medium text-white">
									Name
								</label>
								<Input
									id="edit-name"
									type="text"
									value={editName}
									onChange={(e) => setEditName(e.target.value)}
									className="bg-melodio-light-gray"
								/>
							</div>
							<div className="space-y-2">
								<label htmlFor="edit-description" className="text-sm font-medium text-white">
									Description (optional)
								</label>
								<Input
									id="edit-description"
									type="text"
									value={editDescription}
									onChange={(e) => setEditDescription(e.target.value)}
									className="bg-melodio-light-gray"
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="ghost"
								onClick={() => setIsEditDialogOpen(false)}
								disabled={isSubmitting}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isSubmitting || !editName.trim()}>
								{isSubmitting ? "Saving..." : "Save"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent className="border-melodio-light-gray bg-melodio-dark-gray sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="text-white">Delete Playlist</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete &quot;{playlist.name}&quot;? This action
							cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							type="button"
							variant="ghost"
							onClick={() => setIsDeleteDialogOpen(false)}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDelete}
							disabled={isSubmitting}
						>
							{isSubmitting ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
