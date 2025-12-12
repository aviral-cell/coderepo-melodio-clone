import {
	Play,
	Pause,
	SkipBack,
	SkipForward,
	Shuffle,
	Repeat,
	Repeat1,
	Volume2,
	ListMusic,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { Slider } from "@/shared/components/ui/slider";
import { usePlayer } from "@/shared/contexts/PlayerContext";
import { formatDuration } from "@/shared/utils";

export function PlayerBar() {
	const {
		state,
		togglePlayPause,
		next,
		previous,
		seek,
		toggleShuffle,
		toggleRepeat,
		setVolume,
		toggleQueue,
	} = usePlayer();

	const {
		currentTrack,
		isPlaying,
		elapsedSeconds,
		shuffleEnabled,
		repeatMode,
		volume,
	} = state;

	const progress = currentTrack
		? (elapsedSeconds / currentTrack.durationInSeconds) * 100
		: 0;

	const handleSeek = (value: number[]) => {
		if (currentTrack) {
			const newTime = (value[0] / 100) * currentTrack.durationInSeconds;
			seek(newTime);
		}
	};

	const handleVolumeChange = (value: number[]) => {
		setVolume(value[0]);
	};

	const artistName =
		typeof currentTrack?.artistId === "object"
			? currentTrack.artistId.name
			: "Unknown Artist";

	const albumCover =
		typeof currentTrack?.albumId === "object"
			? currentTrack.albumId.coverImageUrl
			: undefined;

	return (
		<footer className="fixed bottom-0 left-0 right-0 z-40 h-[90px] border-t border-hackify-light-gray bg-hackify-dark-gray px-4">
			<div className="flex h-full items-center justify-center sm:justify-between">
				{/* Left: Track Info - hidden on mobile */}
				<div className="hidden w-[30%] items-center gap-4 sm:flex">
					{currentTrack && (
						<>
							<div className="relative h-14 w-14 overflow-hidden rounded">
								{albumCover ? (
									<img
										src={albumCover}
										alt={currentTrack.title}
										className="h-full w-full object-cover"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center bg-hackify-light-gray">
										<ListMusic className="h-6 w-6 text-hackify-text-subdued" />
									</div>
								)}
							</div>
							<div className="min-w-0">
								<p className="truncate text-sm text-white">
									{currentTrack.title}
								</p>
								<p className="truncate text-xs text-hackify-text-subdued">
									{artistName}
								</p>
							</div>
						</>
					)}
				</div>

				{/* Center: Player Controls - full width on mobile, 40% on desktop */}
				<div className="flex w-full flex-col items-center gap-2 sm:w-[40%]">
					<div className="flex items-center gap-4">
						<Button
							variant="ghost"
							size="icon"
							className={cn(
								"h-8 w-8",
								shuffleEnabled
									? "text-hackify-green"
									: "text-hackify-text-subdued hover:text-white"
							)}
							onClick={toggleShuffle}
						>
							<Shuffle className="h-4 w-4" />
						</Button>

						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-hackify-text-subdued hover:text-white"
							onClick={previous}
						>
							<SkipBack className="h-5 w-5" />
						</Button>

						<button
							type="button"
							className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105 disabled:opacity-50"
							onClick={togglePlayPause}
							disabled={!currentTrack}
						>
							{isPlaying ? (
								<Pause className="h-4 w-4" fill="black" />
							) : (
								<Play className="h-4 w-4 pl-0.5" fill="black" />
							)}
						</button>

						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-hackify-text-subdued hover:text-white"
							onClick={next}
						>
							<SkipForward className="h-5 w-5" />
						</Button>

						<Button
							variant="ghost"
							size="icon"
							className={cn(
								"h-8 w-8",
								repeatMode !== "off"
									? "text-hackify-green"
									: "text-hackify-text-subdued hover:text-white"
							)}
							onClick={toggleRepeat}
						>
							{repeatMode === "one" ? (
								<Repeat1 className="h-4 w-4" />
							) : (
								<Repeat className="h-4 w-4" />
							)}
						</Button>
					</div>

					{/* Progress Bar */}
					<div className="flex w-full max-w-[500px] items-center gap-2">
						<span className="w-10 text-right text-xs text-hackify-text-subdued">
							{formatDuration(elapsedSeconds)}
						</span>
						<Slider
							value={[progress]}
							max={100}
							step={0.1}
							className="w-full"
							onValueChange={handleSeek}
						/>
						<span className="w-10 text-xs text-hackify-text-subdued">
							{currentTrack
								? formatDuration(currentTrack.durationInSeconds)
								: "0:00"}
						</span>
					</div>
				</div>

				{/* Right: Volume & Queue - hidden on mobile */}
				<div className="hidden w-[30%] items-center justify-end gap-4 sm:flex">
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 text-hackify-text-subdued hover:text-white"
						onClick={toggleQueue}
					>
						<ListMusic className="h-4 w-4" />
					</Button>

					<div className="flex items-center gap-2">
						<Volume2 className="h-4 w-4 text-hackify-text-subdued" />
						<Slider
							value={[volume]}
							max={100}
							step={1}
							className="w-24"
							onValueChange={handleVolumeChange}
						/>
					</div>
				</div>
			</div>
		</footer>
	);
}
