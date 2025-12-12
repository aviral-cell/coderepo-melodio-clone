import type { JSX } from "react";
import { Music, TrendingUp, Clock, Disc } from "lucide-react";

/**
 * HomePage - Main landing page for authenticated users.
 * Displays featured content, recently played, and recommendations.
 */
export default function HomePage(): JSX.Element {
	return (
		<div className="p-6">
			{/* Hero Section */}
			<section className="mb-8">
				<h1 className="mb-2 text-3xl font-bold text-white">
					Good afternoon
				</h1>
				<p className="text-hackify-light-gray">
					Welcome back! Here is what is trending today.
				</p>
			</section>

			{/* Quick Access Grid */}
			<section className="mb-8">
				<div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
					{quickAccessItems.map((item) => (
						<QuickAccessCard key={item.title} {...item} />
					))}
				</div>
			</section>

			{/* Featured Playlists */}
			<section className="mb-8">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-2xl font-bold text-white">
						Featured Playlists
					</h2>
					<button
						type="button"
						className="text-sm font-semibold text-hackify-light-gray hover:text-white"
					>
						Show all
					</button>
				</div>
				<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
					{featuredPlaylists.map((playlist) => (
						<PlaylistCard key={playlist.id} {...playlist} />
					))}
				</div>
			</section>

			{/* Recently Played */}
			<section className="mb-8">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-2xl font-bold text-white">
						Recently Played
					</h2>
					<button
						type="button"
						className="text-sm font-semibold text-hackify-light-gray hover:text-white"
					>
						Show all
					</button>
				</div>
				<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
					{recentlyPlayed.map((track) => (
						<TrackCard key={track.id} {...track} />
					))}
				</div>
			</section>

			{/* Browse by Genre */}
			<section className="mb-8">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-2xl font-bold text-white">
						Browse by Genre
					</h2>
					<button
						type="button"
						className="text-sm font-semibold text-hackify-light-gray hover:text-white"
					>
						Show all
					</button>
				</div>
				<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
					{genres.map((genre) => (
						<GenreCard key={genre.id} {...genre} />
					))}
				</div>
			</section>
		</div>
	);
}

// Quick Access Card Component
interface QuickAccessCardProps {
	title: string;
	icon: React.ReactNode;
	color: string;
}

function QuickAccessCard({ title, icon, color }: QuickAccessCardProps): JSX.Element {
	return (
		<button
			type="button"
			className="flex items-center gap-3 rounded-md bg-hackify-dark-gray/60 p-3 transition-colors hover:bg-hackify-dark-gray"
		>
			<div
				className="flex h-12 w-12 items-center justify-center rounded"
				style={{ backgroundColor: color }}
			>
				{icon}
			</div>
			<span className="truncate font-semibold text-white">{title}</span>
		</button>
	);
}

// Playlist Card Component
interface PlaylistCardProps {
	id: string;
	title: string;
	description: string;
	imageUrl: string;
}

function PlaylistCard({ title, description, imageUrl }: PlaylistCardProps): JSX.Element {
	return (
		<button
			type="button"
			className="group rounded-md bg-hackify-dark-gray/40 p-4 text-left transition-colors hover:bg-hackify-dark-gray/80"
		>
			<div className="relative mb-4">
				<div className="aspect-square overflow-hidden rounded-md bg-hackify-dark-gray">
					{imageUrl ? (
						<img
							src={imageUrl}
							alt={title}
							className="h-full w-full object-cover"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center">
							<Music className="h-12 w-12 text-hackify-light-gray" />
						</div>
					)}
				</div>
			</div>
			<h3 className="mb-1 truncate font-semibold text-white">{title}</h3>
			<p className="line-clamp-2 text-sm text-hackify-light-gray">
				{description}
			</p>
		</button>
	);
}

// Track Card Component
interface TrackCardProps {
	id: string;
	title: string;
	artist: string;
	imageUrl: string;
}

function TrackCard({ title, artist, imageUrl }: TrackCardProps): JSX.Element {
	return (
		<button
			type="button"
			className="group rounded-md bg-hackify-dark-gray/40 p-4 text-left transition-colors hover:bg-hackify-dark-gray/80"
		>
			<div className="relative mb-4">
				<div className="aspect-square overflow-hidden rounded-md bg-hackify-dark-gray">
					{imageUrl ? (
						<img
							src={imageUrl}
							alt={title}
							className="h-full w-full object-cover"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center">
							<Disc className="h-12 w-12 text-hackify-light-gray" />
						</div>
					)}
				</div>
			</div>
			<h3 className="mb-1 truncate font-semibold text-white">{title}</h3>
			<p className="truncate text-sm text-hackify-light-gray">{artist}</p>
		</button>
	);
}

// Genre Card Component
interface GenreCardProps {
	id: string;
	name: string;
	color: string;
}

function GenreCard({ name, color }: GenreCardProps): JSX.Element {
	return (
		<button
			type="button"
			className="relative h-32 overflow-hidden rounded-lg p-4 text-left"
			style={{ backgroundColor: color }}
		>
			<span className="text-xl font-bold text-white">{name}</span>
		</button>
	);
}

// Sample Data
const quickAccessItems: QuickAccessCardProps[] = [
	{
		title: "Liked Songs",
		icon: <Music className="h-6 w-6 text-white" />,
		color: "#1DB954",
	},
	{
		title: "Top Hits",
		icon: <TrendingUp className="h-6 w-6 text-white" />,
		color: "#E91E63",
	},
	{
		title: "Recently Played",
		icon: <Clock className="h-6 w-6 text-white" />,
		color: "#9C27B0",
	},
	{
		title: "Discover Weekly",
		icon: <Disc className="h-6 w-6 text-white" />,
		color: "#FF5722",
	},
];

const featuredPlaylists: PlaylistCardProps[] = [
	{
		id: "1",
		title: "Today's Top Hits",
		description: "The hottest tracks right now",
		imageUrl: "",
	},
	{
		id: "2",
		title: "RapCaviar",
		description: "New music from the biggest names in hip-hop",
		imageUrl: "",
	},
	{
		id: "3",
		title: "All Out 2010s",
		description: "The biggest songs of the 2010s",
		imageUrl: "",
	},
	{
		id: "4",
		title: "Rock Classics",
		description: "Rock legends and iconic songs",
		imageUrl: "",
	},
	{
		id: "5",
		title: "Chill Hits",
		description: "Kick back to the best new and recent chill hits",
		imageUrl: "",
	},
];

const recentlyPlayed: TrackCardProps[] = [
	{
		id: "1",
		title: "Blinding Lights",
		artist: "The Weeknd",
		imageUrl: "",
	},
	{
		id: "2",
		title: "Shape of You",
		artist: "Ed Sheeran",
		imageUrl: "",
	},
	{
		id: "3",
		title: "Bohemian Rhapsody",
		artist: "Queen",
		imageUrl: "",
	},
	{
		id: "4",
		title: "Bad Guy",
		artist: "Billie Eilish",
		imageUrl: "",
	},
	{
		id: "5",
		title: "Uptown Funk",
		artist: "Bruno Mars",
		imageUrl: "",
	},
];

const genres: GenreCardProps[] = [
	{ id: "1", name: "Pop", color: "#8B5CF6" },
	{ id: "2", name: "Hip-Hop", color: "#F97316" },
	{ id: "3", name: "Rock", color: "#EF4444" },
	{ id: "4", name: "Electronic", color: "#06B6D4" },
	{ id: "5", name: "R&B", color: "#EC4899" },
	{ id: "6", name: "Jazz", color: "#84CC16" },
	{ id: "7", name: "Classical", color: "#6366F1" },
	{ id: "8", name: "Country", color: "#F59E0B" },
];
