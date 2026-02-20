import { useRef, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Globe, TrendingUp, Rewind, Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TrackCard } from "@/shared/components/common/TrackCard";
import { AppImage } from "@/shared/components/common/AppImage";
import { getImageUrl } from "@/shared/utils";
import { useDiscovery } from "@/shared/hooks/useDiscovery";
import {
	AVAILABLE_LANGUAGES,
	AVAILABLE_GENRES,
	AVAILABLE_ERAS,
	getGenreDisplayName,
} from "@/shared/utils/discoveryUtils";
import type { TrackWithPopulated } from "@/shared/types/player.types";
import type { Artist } from "@/shared/types";

interface TrackCarouselProps {
	tracks: TrackWithPopulated[];
	testIdPrefix: string;
}

function TrackCarousel({ tracks, testIdPrefix }: TrackCarouselProps): JSX.Element {
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

	const pairs: TrackWithPopulated[][] = [];
	for (let i = 0; i < tracks.length; i += 2) {
		pairs.push(tracks.slice(i, i + 2));
	}

	return (
		<div className="relative">
			<div className="absolute -top-10 right-0 flex gap-1">
				<button
					type="button"
					aria-label="Scroll left"
					onClick={() => scroll("left")}
					className="rounded-full p-1.5 text-melodio-text-subdued transition-colors hover:bg-melodio-dark-gray hover:text-white"
				>
					<ChevronLeft className="h-5 w-5" />
				</button>
				<button
					type="button"
					aria-label="Scroll right"
					onClick={() => scroll("right")}
					className="rounded-full p-1.5 text-melodio-text-subdued transition-colors hover:bg-melodio-dark-gray hover:text-white"
				>
					<ChevronRight className="h-5 w-5" />
				</button>
			</div>

			<div
				ref={scrollRef}
				className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
				style={{ scrollSnapType: "x mandatory" }}
			>
				{pairs.map((pair, colIdx) => (
					<div
						key={colIdx}
						className="shrink-0 w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] md:w-[calc(25%-12px)] lg:w-[calc(14.285%-12px)] flex flex-col gap-4"
						style={{ scrollSnapAlign: "start" }}
					>
						{pair.map((track) => (
							<div key={track._id} data-testid={`${testIdPrefix}-${track._id}`}>
								<TrackCard track={track} />
							</div>
						))}
					</div>
				))}
			</div>
		</div>
	);
}

interface ChipGroupProps {
	items: string[];
	selected: string | null;
	onSelect: (value: string | null) => void;
	testIdPrefix: string;
	getLabel?: (item: string) => string;
}

function ChipGroup({ items, selected, onSelect, testIdPrefix, getLabel }: ChipGroupProps): JSX.Element {
	return (
		<div data-testid={`${testIdPrefix}s`} className="mb-4 flex flex-wrap gap-2">
			{items.map((item) => (
				<button
					key={item}
					type="button"
					data-testid={`${testIdPrefix}-${item.toLowerCase()}`}
					onClick={() => onSelect(selected === item ? null : item)}
					className={cn(
						"cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-all bg-melodio-dark-gray text-white hover:bg-melodio-light-gray",
						selected === item && "ring-2 ring-melodio-green",
					)}
				>
					{getLabel ? getLabel(item) : item}
				</button>
			))}
		</div>
	);
}

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

interface TopArtistsSectionProps {
	artists: Artist[];
	onArtistClick: (artistId: string) => void;
}

function TopArtistsSection({ artists, onArtistClick }: TopArtistsSectionProps): JSX.Element {
	return (
		<div data-testid="discovery-top-artists" className="grid gap-3 md:grid-cols-2">
			{artists.map((artist, idx) => (
				<div
					key={artist._id}
					data-testid={`discovery-artist-${artist._id}`}
					role="button"
					tabIndex={0}
					onClick={() => onArtistClick(artist._id)}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							onArtistClick(artist._id);
						}
					}}
					className="flex cursor-pointer items-center gap-4 rounded-md bg-melodio-dark-gray p-3 transition-colors hover:bg-melodio-light-gray"
				>
					<span className="w-8 text-center text-2xl font-bold text-melodio-text-subdued">
						{idx + 1}
					</span>
					<div className="h-12 w-12 shrink-0 overflow-hidden rounded-full">
						<AppImage
							src={getImageUrl(artist.imageUrl)}
							alt={artist.name}
							className="h-full w-full object-cover"
						/>
					</div>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-semibold text-white">{artist.name}</p>
						<p className="text-xs text-melodio-text-subdued">
							{formatFollowerCount(artist.followerCount)} followers
						</p>
					</div>
				</div>
			))}
		</div>
	);
}

export default function DiscoveryPage(): JSX.Element {
	const navigate = useNavigate();
	const {
		newThisWeek,
		popularByLanguage,
		popularByGenre,
		tracksByEra,
		topArtists,
		selectedLanguage,
		setSelectedLanguage,
		selectedGenre,
		setSelectedGenre,
		selectedEra,
		setSelectedEra,
		isLoading,
		error,
	} = useDiscovery();

	if (isLoading) {
		return (
			<div className="p-6" data-testid="discovery-page">
				<h1 className="mb-8 text-3xl font-bold text-white">Discover</h1>
				<div data-testid="discovery-loading" className="space-y-8">
					{[...Array(4)].map((_, sectionIdx) => (
						<div key={sectionIdx} className="space-y-4">
							<Skeleton className="h-6 w-48 rounded" />
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

	if (error) {
		return (
			<div className="p-6" data-testid="discovery-page">
				<h1 className="mb-8 text-3xl font-bold text-white">Discover</h1>
				<div data-testid="discovery-error" className="py-12 text-center text-red-500">
					<p>{error}</p>
				</div>
			</div>
		);
	}

	const languageHeading = selectedLanguage ? `Popular in ${selectedLanguage}` : "Popular in Language";
	const genreHeading = selectedGenre ? `Popular in ${getGenreDisplayName(selectedGenre)}` : "Popular in Genre";
	const eraHeading = selectedEra ? `Jump Back In \u2014 ${selectedEra}` : "Jump Back In";

	return (
		<div className="p-6" data-testid="discovery-page">
			<h1 className="mb-8 text-3xl font-bold text-white">Discover</h1>

			<div className="space-y-8">
				{/* Section 1: New This Week */}
				<section data-testid="discovery-new-this-week">
					<div className="relative mb-4">
						<h2 className="flex items-center gap-2 text-xl font-semibold text-white">
							<Sparkles className="h-5 w-5" />
							New This Week
						</h2>
					</div>
					<TrackCarousel tracks={newThisWeek} testIdPrefix="discovery-new-track" />
				</section>

				{/* Section 2: Popular in Language */}
				<section data-testid="discovery-popular-language">
					<div className="relative mb-4">
						<h2 className="flex items-center gap-2 text-xl font-semibold text-white">
							<Globe className="h-5 w-5" />
							{languageHeading}
						</h2>
					</div>
					<ChipGroup
						items={AVAILABLE_LANGUAGES}
						selected={selectedLanguage}
						onSelect={setSelectedLanguage}
						testIdPrefix="discovery-language-chip"
					/>
					<TrackCarousel tracks={popularByLanguage} testIdPrefix="discovery-language-track" />
				</section>

				{/* Section 3: Popular in Genre */}
				<section data-testid="discovery-popular-genre">
					<div className="relative mb-4">
						<h2 className="flex items-center gap-2 text-xl font-semibold text-white">
							<TrendingUp className="h-5 w-5" />
							{genreHeading}
						</h2>
					</div>
					<ChipGroup
						items={AVAILABLE_GENRES}
						selected={selectedGenre}
						onSelect={setSelectedGenre}
						testIdPrefix="discovery-genre-chip"
						getLabel={getGenreDisplayName}
					/>
					<TrackCarousel tracks={popularByGenre} testIdPrefix="discovery-genre-track" />
				</section>

				{/* Section 4: Jump Back In */}
				<section data-testid="discovery-jump-back-in">
					<div className="relative mb-4">
						<h2 className="flex items-center gap-2 text-xl font-semibold text-white">
							<Rewind className="h-5 w-5" />
							{eraHeading}
						</h2>
					</div>
					<ChipGroup
						items={AVAILABLE_ERAS}
						selected={selectedEra}
						onSelect={setSelectedEra}
						testIdPrefix="discovery-era-chip"
					/>
					<TrackCarousel tracks={tracksByEra} testIdPrefix="discovery-era-track" />
				</section>

				{/* Section 5: Top Artists */}
				<section>
					<div className="mb-4">
						<h2 className="flex items-center gap-2 text-xl font-semibold text-white">
							<Users className="h-5 w-5" />
							Top Artists
						</h2>
					</div>
					<TopArtistsSection artists={topArtists} onArtistClick={(id) => navigate(`/artist/${id}`)} />
				</section>
			</div>
		</div>
	);
}
