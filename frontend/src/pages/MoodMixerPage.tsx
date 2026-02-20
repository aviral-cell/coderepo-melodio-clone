import { useRef, type JSX } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TrackCard } from "@/shared/components/common/TrackCard";
import { AppImage } from "@/shared/components/common/AppImage";
import { useMoodMixer } from "@/shared/hooks/useMoodMixer";
import { getMoodImage, getMoodDescription } from "@/shared/utils/moodUtils";
import { getImageUrl } from "@/shared/utils";
import type { TrackWithPopulated } from "@/shared/types/player.types";

interface MoodSectionProps {
	mood: string;
	tracks: TrackWithPopulated[];
}

function MoodSection({ mood, tracks }: MoodSectionProps): JSX.Element {
	const scrollRef = useRef<HTMLDivElement>(null);

	const scroll = (direction: "left" | "right") => {
		if (scrollRef.current) {
			const scrollAmount = scrollRef.current.clientWidth * 0.8;
			scrollRef.current.scrollBy({
				left: direction === "left" ? -scrollAmount : scrollAmount,
				behavior: "smooth",
			});
		}
	};

	return (
		<section>
			<div className="mb-4 flex items-center justify-between">
				<h2 className="text-xl font-semibold text-white">{mood}</h2>
				<div className="flex gap-1">
					<button
						type="button"
						aria-label={`Scroll ${mood} left`}
						onClick={() => scroll("left")}
						className="rounded-full p-1.5 text-melodio-text-subdued transition-colors hover:bg-melodio-dark-gray hover:text-white"
					>
						<ChevronLeft className="h-5 w-5" />
					</button>
					<button
						type="button"
						aria-label={`Scroll ${mood} right`}
						onClick={() => scroll("right")}
						className="rounded-full p-1.5 text-melodio-text-subdued transition-colors hover:bg-melodio-dark-gray hover:text-white"
					>
						<ChevronRight className="h-5 w-5" />
					</button>
				</div>
			</div>

			<div
				ref={scrollRef}
				className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
				style={{ scrollSnapType: "x mandatory" }}
			>
				{tracks.map((track) => (
					<div
						key={track._id}
						data-testid={`mood-track-${track._id}`}
						className="shrink-0 w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] md:w-[calc(25%-12px)] lg:w-[calc(14.285%-12px)]"
						style={{ scrollSnapAlign: "start" }}
					>
						<TrackCard track={track} />
					</div>
				))}
			</div>
		</section>
	);
}

export default function MoodMixerPage(): JSX.Element {
	const {
		tracksByMood,
		moods,
		visibleMoods,
		selectedMood,
		setSelectedMood,
		moodDescription,
		isLoading,
	} = useMoodMixer();

	if (isLoading) {
		return (
			<div className="p-6" data-testid="mood-page">
				<h1 className="mb-8 text-3xl font-bold text-white">Mood Mixer</h1>
				<div data-testid="mood-loading" className="space-y-8">
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
						{[...Array(5)].map((_, i) => (
							<div key={i} className="rounded-md bg-melodio-dark-gray p-4">
								<Skeleton className="mb-4 aspect-square w-full rounded-md" />
								<Skeleton className="mb-2 h-4 w-3/4 rounded" />
								<Skeleton className="h-3 w-1/2 rounded" />
							</div>
						))}
					</div>
					{[...Array(2)].map((_, sectionIdx) => (
						<div key={sectionIdx} className="space-y-4">
							<Skeleton className="h-6 w-32 rounded" />
							<div className="flex gap-4">
								{[...Array(5)].map((_, i) => (
									<div key={i} className="shrink-0 w-[calc(14.285%-12px)]">
										<div className="rounded-md bg-melodio-dark-gray p-4">
											<Skeleton className="mb-4 aspect-square w-full rounded-md" />
											<Skeleton className="mb-2 h-4 w-3/4 rounded" />
											<Skeleton className="h-3 w-1/2 rounded" />
										</div>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="p-6" data-testid="mood-page">
			<h1 className="mb-8 text-3xl font-bold text-white">Mood Mixer</h1>

			<div
				data-testid="mood-chips"
				className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
			>
				{moods.map((mood) => (
					<div
						key={mood}
						data-testid={`mood-chip-${mood.toLowerCase()}`}
						onClick={() =>
							setSelectedMood(selectedMood === mood ? null : mood)
						}
						className={cn(
							"group cursor-pointer rounded-md bg-melodio-dark-gray p-4 transition-all duration-300 hover:bg-melodio-light-gray",
							selectedMood === mood && "ring-2 ring-melodio-green",
						)}
					>
						<div className="relative mb-4 aspect-square overflow-hidden rounded-md shadow-lg">
							<AppImage
								src={getImageUrl(getMoodImage(mood))}
								alt={mood}
								className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
							/>
						</div>
						<p className="truncate text-sm font-semibold text-white">
							{mood}
						</p>
						<p className="truncate text-xs text-melodio-text-subdued">
							{getMoodDescription(mood)}
						</p>
					</div>
				))}
			</div>

			{moodDescription && (
				<p
					data-testid="mood-description"
					className="mb-6 text-sm text-melodio-text-subdued"
				>
					{moodDescription}
				</p>
			)}

			{(() => {
				const allEmpty = visibleMoods.every(
					(mood) => (tracksByMood[mood] ?? []).length === 0,
				);

				if (allEmpty) {
					return (
						<div
							data-testid="mood-empty"
							className="py-12 text-center text-melodio-text-subdued"
						>
							<p>No tracks match this mood</p>
						</div>
					);
				}

				return (
					<div data-testid="mood-tracks" className="space-y-8">
						{visibleMoods.map((mood) => {
							const moodTracks = tracksByMood[mood] ?? [];
							if (moodTracks.length === 0) return null;
							return (
								<MoodSection
									key={mood}
									mood={mood}
									tracks={moodTracks}
								/>
							);
						})}
					</div>
				);
			})()}
		</div>
	);
}
