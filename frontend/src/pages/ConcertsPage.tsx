import type { JSX } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
} from "@/shared/components/ui/dropdown-menu";
import { AppImage } from "@/shared/components/common/AppImage";
import { getImageUrl } from "@/shared/utils";
import { useConcertListing } from "@/shared/hooks/useConcerts";
import { CONCERT_CITIES, getMonthOptions, formatConcertDate } from "@/shared/utils/concertUtils";
import type { Concert, ArtistWithNextConcert } from "@/shared/utils/concertUtils";

interface ConcertCardProps {
	concert: Concert;
	formattedDate: string;
	formattedTime: string;
}

function ConcertCard({ concert, formattedDate, formattedTime }: ConcertCardProps): JSX.Element {
	const artistName =
		typeof concert.artistId === "object" ? concert.artistId.name : "Unknown Artist";
	const artistImage =
		typeof concert.artistId === "object" ? concert.artistId.imageUrl : undefined;

	const [month, day] = formattedDate.split(" ");

	return (
		<Link
			to={`/concerts/${concert._id}`}
			data-testid={`concerts-card-${concert._id}`}
			className="group flex cursor-pointer gap-4 rounded-lg bg-melodio-dark-gray/50 p-3 transition-colors hover:bg-melodio-light-gray"
		>
			<div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg">
				<AppImage
					src={getImageUrl(concert.coverImage || artistImage)}
					alt={`${artistName} at ${concert.venue}`}
					className="h-full w-full object-cover"
				/>
				<div
					data-testid={`concerts-card-date-${concert._id}`}
					className="absolute top-2 left-2 min-w-12 rounded-lg bg-black/80 px-2.5 py-1.5 text-center backdrop-blur-xs"
				>
					<div className="text-[10px] font-semibold uppercase tracking-wider text-melodio-green">
						{month}
					</div>
					<div className="text-xl font-bold leading-none text-white">
						{day}
					</div>
				</div>
			</div>
			<div className="flex min-w-0 flex-1 flex-col justify-center">
				<p
					data-testid={`concerts-card-artist-${concert._id}`}
					className="truncate font-semibold text-white"
				>
					{artistName}
				</p>
				<p
					data-testid={`concerts-card-venue-${concert._id}`}
					className="truncate text-sm text-melodio-text-subdued"
				>
					{concert.venue}
				</p>
				<div className="mt-2 flex items-center gap-2 text-xs text-melodio-text-subdued">
					<span className="text-melodio-text-subdued/40">&middot;</span>
					<span data-testid={`concerts-card-time-${concert._id}`}>
						{formattedTime}
					</span>
				</div>
			</div>
		</Link>
	);
}

interface CityChipGroupProps {
	cities: readonly string[];
	selectedCity: string | null;
	onCityChange: (city: string | null) => void;
}

function CityChipGroup({ cities, selectedCity, onCityChange }: CityChipGroupProps): JSX.Element {
	return (
		<div data-testid="concerts-city-chips" className="mb-4 flex flex-wrap gap-2">
			{cities.map((city) => {
				const citySlug = city.toLowerCase().replace(/\s+/g, "-");
				return (
					<button
						key={city}
						type="button"
						data-testid={`concerts-city-chip-${citySlug}`}
						onClick={() => onCityChange(selectedCity === city ? null : city)}
						className={cn(
							"cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-all bg-melodio-dark-gray text-white hover:bg-melodio-light-gray",
							selectedCity === city && "ring-2 ring-melodio-green",
						)}
					>
						{city}
					</button>
				);
			})}
		</div>
	);
}

export default function ConcertsPage(): JSX.Element {
	const {
		filteredConcerts,
		artistsInCity,
		formattedDates,
		formattedTimes,
		selectedMonth,
		selectedCity,
		isLoading,
		error,
		handleMonthChange,
		handleCityChange,
	} = useConcertListing();

	const monthOptions = getMonthOptions();
	const selectedMonthLabel = monthOptions.find((opt) => opt.value === selectedMonth)?.label || "All";

	if (isLoading) {
		return (
			<div className="p-6" data-testid="concerts-page">
				<h1 className="mb-8 text-3xl font-bold text-white">Concerts</h1>
				<div data-testid="concerts-loading" className="space-y-6">
					<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
						{[...Array(6)].map((_, i) => (
							<div key={i} className="flex gap-4 rounded-lg bg-melodio-dark-gray/50 p-3">
								<Skeleton className="h-24 w-24 shrink-0 rounded-lg" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-5 w-3/4 rounded" />
									<Skeleton className="h-4 w-1/2 rounded" />
									<Skeleton className="h-3 w-1/3 rounded" />
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-6" data-testid="concerts-page">
				<h1 className="mb-8 text-3xl font-bold text-white">Concerts</h1>
				<div
					data-testid="concerts-error"
					className="py-12 text-center text-red-400"
				>
					<p>{error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="p-6" data-testid="concerts-page">
			<h1 className="mb-8 text-3xl font-bold text-white">Concerts</h1>

			<section className="mb-10" data-testid="concerts-upcoming">
				<h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
					<CalendarDays className="h-5 w-5" />
					Upcoming Concerts
				</h2>

				<div className="mb-5">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								data-testid="concerts-month-filter"
								className="flex items-center gap-2 rounded-full border border-melodio-light-gray bg-melodio-dark-gray px-3 py-1.5 text-sm text-white"
							>
								{selectedMonthLabel}
								<ChevronDown className="h-4 w-4" />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="bg-melodio-dark-gray border-melodio-light-gray">
							<DropdownMenuRadioGroup
								value={String(selectedMonth)}
								onValueChange={(val) => handleMonthChange(Number(val))}
							>
								{monthOptions.map((opt) => (
									<DropdownMenuRadioItem
										key={opt.value}
										value={String(opt.value)}
										data-testid={`concerts-month-option-${opt.value}`}
										className="text-white focus:bg-melodio-light-gray focus:text-white"
									>
										{opt.label}
									</DropdownMenuRadioItem>
								))}
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				{filteredConcerts.length === 0 ? (
					<div className="py-8 text-center text-melodio-text-subdued">
						<p>No concerts found for this month.</p>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
						{filteredConcerts.map((concert) => (
							<ConcertCard
								key={concert._id}
								concert={concert}
								formattedDate={formattedDates.get(concert._id) || ""}
								formattedTime={formattedTimes.get(concert._id) || ""}
							/>
						))}
					</div>
				)}
			</section>

			<section data-testid="concerts-artists-section">
				<h2 className="mb-5 text-xl font-semibold text-white">
					{selectedCity ? `Popular in ${selectedCity}` : "Popular in town"}
				</h2>

				<CityChipGroup
					cities={CONCERT_CITIES}
					selectedCity={selectedCity}
					onCityChange={handleCityChange}
				/>

				{artistsInCity.length > 0 && (
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{artistsInCity.map(({ artist, nextConcertDate, nextConcertId }: ArtistWithNextConcert) => (
							<Link
								to={`/concerts/${nextConcertId}`}
								key={artist._id}
								data-testid={`concerts-artist-${artist._id}`}
								className="flex items-center gap-4 rounded-md bg-melodio-dark-gray p-3 transition-colors hover:bg-melodio-light-gray"
							>
								<div className="h-12 w-12 shrink-0 overflow-hidden rounded-full">
									<AppImage
										src={getImageUrl(artist.imageUrl)}
										alt={artist.name}
										className="h-full w-full object-cover"
									/>
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-semibold text-white">
										{artist.name}
									</p>
									<p
										data-testid={`concerts-artist-next-date-${artist._id}`}
										className="text-xs text-melodio-text-subdued"
									>
										Next: {formatConcertDate(nextConcertDate)}
									</p>
								</div>
							</Link>
						))}
					</div>
				)}

				{artistsInCity.length === 0 && (
					<div className="py-8 text-center text-melodio-text-subdued">
						<p>No artists found.</p>
					</div>
				)}
			</section>
		</div>
	);
}
