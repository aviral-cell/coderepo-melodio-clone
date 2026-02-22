import type { TrackWithPopulated } from "@/shared/types/player.types";
import type { Artist } from "@/shared/types";

interface AlbumLike {
	_id: string;
	title: string;
	artistId: string | { _id: string; name?: string };
	coverImageUrl?: string;
	totalTracks: number;
	releaseDate: string;
	createdAt: string;
	updatedAt: string;
}

// ===== TYPES =====

export interface Concert {
	_id: string;
	artistId: Artist | { _id: string; name: string; imageUrl: string };
	venue: string;
	city: string;
	date: string;
	time: string;
	coverImage: string;
	maxTicketsPerUser: number;
	tickets: ConcertTicket[];
	createdAt: string;
	updatedAt: string;
}

export interface ConcertTicket {
	userId: string;
	quantity: number;
	ticketCodes: string[];
	purchasedAt: string;
}

export interface ArtistWithNextConcert {
	artist: Artist;
	nextConcertDate: string;
	nextConcertId: string;
}

export interface TicketDisplayItem {
	ticketCode: string;
	concertName: string;
	artistName: string;
	venue: string;
	date: string;
}

// ===== CONSTANTS =====

export const CONCERT_CITIES = [
	"New York",
	"Las Vegas",
	"Los Angeles",
	"Chicago",
	"Miami",
] as const;

export const MAX_TICKETS_PER_USER = 6;

// ===== BROWSE FUNCTIONS (correct on BOTH branches) =====

export function getUpcomingConcerts(concerts: Concert[]): Concert[] {
	const now = new Date();
	return concerts.filter((c) => new Date(c.date) > now);
}

export function getUniqueCities(concerts: Concert[]): string[] {
	return [...new Set(concerts.map((c) => c.city))];
}

export function getMonthOptions(): { value: number; label: string }[] {
	const months = [
		"January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December",
	];
	return [
		{ value: 0, label: "All" },
		...months.map((label, i) => ({ value: i + 1, label })),
	];
}

// ===== INTERACTION FUNCTIONS (solution versions) =====

export function sortConcertsByDate(
	concerts: Concert[],
	order: "asc" | "desc" = "desc",
): Concert[] {
	return [...concerts].sort((a, b) => {
		const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
		return order === "desc" ? -diff : diff;
	});
}

export function filterByMonth(concerts: Concert[], month: number): Concert[] {
	if (month === 0) return concerts;
	return concerts.filter((c) => new Date(c.date).getUTCMonth() + 1 === month);
}

export function getArtistsInCity(
	concerts: Concert[],
	artists: Artist[],
	city: string,
): ArtistWithNextConcert[] {
	if (!city) return [];
	const cityConcerts = concerts.filter((c) => c.city === city);
	const artistMap = new Map<string, { date: string; concertId: string }>();

	for (const concert of cityConcerts) {
		const artistId =
			typeof concert.artistId === "object"
				? concert.artistId._id
				: concert.artistId;
		const existing = artistMap.get(artistId);
		if (!existing || new Date(concert.date) < new Date(existing.date)) {
			artistMap.set(artistId, { date: concert.date, concertId: concert._id });
		}
	}

	const result: ArtistWithNextConcert[] = [];
	for (const [artistId, { date, concertId }] of artistMap) {
		const artist = artists.find((a) => a._id === artistId);
		if (artist) {
			result.push({ artist, nextConcertDate: date, nextConcertId: concertId });
		}
	}
	return result;
}

export function formatConcertDate(dateStr: string): string {
	const months = [
		"Jan", "Feb", "Mar", "Apr", "May", "Jun",
		"Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
	];
	const date = new Date(dateStr);
	const month = months[date.getUTCMonth()];
	const day = date.getUTCDate();
	return `${month} ${day}`;
}

export function formatConcertTime(timeStr: string): string {
	const [hoursStr, minutesStr] = timeStr.split(":");
	let hours = parseInt(hoursStr, 10);
	const minutes = minutesStr;
	const period = hours >= 12 ? "PM" : "AM";
	if (hours === 0) {
		hours = 12;
	} else if (hours > 12) {
		hours -= 12;
	}
	return `${hours}:${minutes} ${period}`;
}

export function calculateUserTicketCount(
	concert: Concert,
	userId: string,
): number {
	const tickets = concert.tickets || [];
	const userTickets = tickets.filter((t) => t.userId === userId);
	return userTickets.reduce((sum, t) => sum + t.quantity, 0);
}

export function canBuyMoreTickets(
	userTicketCount: number,
	maxPerUser: number,
): boolean {
	return userTicketCount < maxPerUser;
}

export function generateTicketCodes(
	quantity: number,
	concertId: string,
): string[] {
	const codes: string[] = [];
	const suffix = concertId.slice(-4);
	for (let i = 0; i < quantity; i++) {
		const random = Math.random().toString(16).slice(2, 8);
		codes.push(`CONC-${suffix}-${random}`);
	}
	return codes;
}

export function getArtistAlbumsForConcert<T extends AlbumLike>(
	albums: T[],
	artistId: string,
): T[] {
	return albums.filter((a) => {
		const albumArtistId =
			typeof a.artistId === "object" ? a.artistId._id : a.artistId;
		return albumArtistId === artistId;
	});
}

export function getArtistTracksForConcert(
	tracks: TrackWithPopulated[],
	artistId: string,
): TrackWithPopulated[] {
	return tracks.filter((t) => {
		const trackArtistId =
			typeof t.artistId === "object" ? t.artistId._id : t.artistId;
		return trackArtistId === artistId;
	});
}
