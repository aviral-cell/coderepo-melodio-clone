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

export const CONCERT_CITIES = [
	"New York",
	"Las Vegas",
	"Los Angeles",
	"Chicago",
	"Miami",
] as const;

export const MAX_TICKETS_PER_USER = 6;

export function getUpcomingConcerts(concerts: Concert[]): Concert[] {
	return concerts;
}

export function getUniqueCities(concerts: Concert[]): string[] {
	return [...new Set(concerts.map((c) => c.city))];
}

export function getMonthOptions(): { value: number; label: string }[] {
	const months = [
		"January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December",
	];
	return months.map((label, i) => ({ value: i + 1, label }));
}

export function sortConcertsByDate(
	concerts: Concert[],
	order: "asc" | "desc" = "desc",
): Concert[] {
	return [...concerts];
}

export function filterByMonth(concerts: Concert[], month: number): Concert[] {
	return concerts;
}

export function getArtistsInCity(
	concerts: Concert[],
	artists: Artist[],
	city: string,
): ArtistWithNextConcert[] {
	return [];
}

export function formatConcertDate(dateStr: string): string {
	return dateStr;
}

export function formatConcertTime(timeStr: string): string {
	return timeStr;
}

export function calculateUserTicketCount(
	concert: Concert,
	userId: string,
): number {
	return 0;
}

export function canBuyMoreTickets(
	userTicketCount: number,
	maxPerUser: number,
): boolean {
	return false;
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
	return albums;
}

export function getArtistTracksForConcert(
	tracks: TrackWithPopulated[],
	artistId: string,
): TrackWithPopulated[] {
	return tracks;
}
