import { X, Music, Trash2, GripVertical, Play, Pause } from "lucide-react";
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
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { usePlayer } from "@/shared/contexts/PlayerContext";
import type { TrackWithPopulated } from "@/shared/types/player.types";
import { formatDuration } from "@/shared/utils";

interface SortableQueueItemProps {
	track: TrackWithPopulated;
	index: number;
	isCurrentTrack: boolean;
	isPlaying: boolean;
	onPlay: () => void;
	onRemove: () => void;
}

function SortableQueueItem({
	track,
	index,
	isCurrentTrack,
	isPlaying,
	onPlay,
	onRemove,
}: SortableQueueItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: `queue-${track._id}-${index}` });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const artistName =
		typeof track.artistId === "object" ? track.artistId.name : "Unknown Artist";

	const albumCover =
		typeof track.albumId === "object" ? track.albumId.coverImageUrl : undefined;

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				"group flex items-center gap-3 rounded-md p-2 transition-colors",
				isCurrentTrack
					? "bg-melodio-light-gray"
					: "hover:bg-melodio-light-gray/50"
			)}
		>
			<button
				{...attributes}
				{...listeners}
				className="cursor-grab text-melodio-text-subdued opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
				aria-label="Drag to reorder"
			>
				<GripVertical className="h-4 w-4" />
			</button>

			<button
				onClick={onPlay}
				className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded"
			>
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
				{isCurrentTrack && (
					<div className="absolute inset-0 flex items-center justify-center bg-black/40">
						{isPlaying ? (
							<span className="flex items-center gap-0.5">
								<span className="h-2 w-0.5 animate-pulse bg-melodio-green" />
								<span
									className="h-3 w-0.5 animate-pulse bg-melodio-green"
									style={{ animationDelay: "0.2s" }}
								/>
								<span
									className="h-1.5 w-0.5 animate-pulse bg-melodio-green"
									style={{ animationDelay: "0.4s" }}
								/>
							</span>
						) : (
							<Pause className="h-4 w-4 text-white" fill="white" />
						)}
					</div>
				)}
				{!isCurrentTrack && (
					<div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
						<Play className="h-4 w-4 text-white" fill="white" />
					</div>
				)}
			</button>

			<div className="min-w-0 flex-1">
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

			<span className="text-xs text-melodio-text-subdued">
				{formatDuration(track.durationInSeconds)}
			</span>

			{!isCurrentTrack && (
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
					onClick={onRemove}
					aria-label="Remove from queue"
				>
					<Trash2 className="h-4 w-4 text-melodio-text-subdued hover:text-red-400" />
				</Button>
			)}
		</div>
	);
}

export function QueuePanel() {
	const {
		state,
		toggleQueue,
		removeFromQueue,
		reorderQueue,
		clearQueue,
		playTrack,
		togglePlayPause,
	} = usePlayer();

	const { queue, queueIndex, currentTrack, isPlaying, isQueueOpen } = state;

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (!over || active.id === over.id) return;

		const activeIdParts = (active.id as string).split("-");
		const overIdParts = (over.id as string).split("-");

		const fromIndex = parseInt(activeIdParts[activeIdParts.length - 1], 10);
		const toIndex = parseInt(overIdParts[overIdParts.length - 1], 10);

		if (!isNaN(fromIndex) && !isNaN(toIndex)) {
			reorderQueue(fromIndex, toIndex);
		}
	};

	const handleTrackPlay = (track: TrackWithPopulated) => {
		if (currentTrack?._id === track._id) {
			togglePlayPause();
		} else {
			playTrack(track);
		}
	};

	const upcomingTracks = queue.slice(queueIndex + 1);

	if (!isQueueOpen) {
		return null;
	}

	return (
		<div className="fixed bottom-[120px] sm:bottom-[90px] right-0 z-50 flex h-[calc(100vh-120px)] sm:h-[calc(100vh-90px)] w-80 flex-col border-l border-melodio-light-gray bg-melodio-dark-gray">
			<div className="flex items-center justify-between border-b border-melodio-light-gray p-4">
				<h2 className="text-lg font-bold text-white">Queue</h2>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 text-melodio-text-subdued hover:text-white"
					onClick={toggleQueue}
					aria-label="Close queue"
				>
					<X className="h-5 w-5" />
				</Button>
			</div>

			<ScrollArea className="flex-1">
				<div className="p-4">
					{currentTrack && (
						<section className="mb-6">
							<h3 className="mb-2 text-sm font-semibold text-white">
								Now Playing
							</h3>
							<div
								className={cn(
									"group flex items-center gap-3 rounded-md bg-melodio-light-gray p-2"
								)}
							>
								<div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded">
									{typeof currentTrack.albumId === "object" &&
									currentTrack.albumId.coverImageUrl ? (
										<img
											src={currentTrack.albumId.coverImageUrl}
											alt={currentTrack.title}
											className="h-full w-full object-cover"
										/>
									) : (
										<div className="flex h-full w-full items-center justify-center bg-melodio-light-gray">
											<Music className="h-4 w-4 text-melodio-text-subdued" />
										</div>
									)}
									<div className="absolute inset-0 flex items-center justify-center bg-black/40">
										{isPlaying ? (
											<span className="flex items-center gap-0.5">
												<span className="h-2 w-0.5 animate-pulse bg-melodio-green" />
												<span
													className="h-3 w-0.5 animate-pulse bg-melodio-green"
													style={{ animationDelay: "0.2s" }}
												/>
												<span
													className="h-1.5 w-0.5 animate-pulse bg-melodio-green"
													style={{ animationDelay: "0.4s" }}
												/>
											</span>
										) : (
											<Pause className="h-4 w-4 text-white" fill="white" />
										)}
									</div>
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium text-melodio-green">
										{currentTrack.title}
									</p>
									<p className="truncate text-xs text-melodio-text-subdued">
										{typeof currentTrack.artistId === "object"
											? currentTrack.artistId.name
											: "Unknown Artist"}
									</p>
								</div>
							</div>
						</section>
					)}

					{upcomingTracks.length > 0 && (
						<section>
							<div className="mb-2 flex items-center justify-between">
								<h3 className="text-sm font-semibold text-white">
									Next Up ({upcomingTracks.length})
								</h3>
								<Button
									variant="ghost"
									size="sm"
									className="h-auto px-2 py-1 text-xs text-melodio-text-subdued hover:text-white"
									onClick={clearQueue}
								>
									Clear
								</Button>
							</div>

							<DndContext
								sensors={sensors}
								collisionDetection={closestCenter}
								onDragEnd={handleDragEnd}
							>
								<SortableContext
									items={upcomingTracks.map(
										(t, i) => `queue-${t._id}-${queueIndex + 1 + i}`
									)}
									strategy={verticalListSortingStrategy}
								>
									{upcomingTracks.map((track, index) => {
										const actualIndex = queueIndex + 1 + index;
										return (
											<SortableQueueItem
												key={`queue-${track._id}-${actualIndex}`}
												track={track}
												index={actualIndex}
												isCurrentTrack={false}
												isPlaying={false}
												onPlay={() => handleTrackPlay(track)}
												onRemove={() => removeFromQueue(actualIndex)}
											/>
										);
									})}
								</SortableContext>
							</DndContext>
						</section>
					)}

					{!currentTrack && queue.length === 0 && (
						<div className="py-8 text-center">
							<Music className="mx-auto mb-4 h-12 w-12 text-melodio-text-subdued" />
							<p className="text-sm font-semibold text-white">
								Your queue is empty
							</p>
							<p className="mt-1 text-xs text-melodio-text-subdued">
								Add tracks to start playing
							</p>
						</div>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
