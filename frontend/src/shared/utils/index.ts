import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}

/**
 * Format duration from seconds to mm:ss format
 */
export function formatDuration(seconds: number): string {
	const totalSeconds = Math.floor(seconds);
	const minutes = Math.floor(totalSeconds / 60);
	const remainingSeconds = totalSeconds % 60;
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/**
 * Format a number with commas for thousands
 */
export function formatNumber(num: number): string {
	return new Intl.NumberFormat("en-US").format(num);
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date | string): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	}).format(d);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return text.slice(0, maxLength - 3) + "...";
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
	func: T,
	wait: number,
): (...args: Parameters<T>) => void {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	return (...args: Parameters<T>) => {
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
		}
		timeoutId = setTimeout(() => func(...args), wait);
	};
}

/**
 * Generate a random ID
 */
export function generateId(): string {
	return Math.random().toString(36).substring(2, 11);
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array)
 */
export function isEmpty(value: unknown): boolean {
	if (value === null || value === undefined) return true;
	if (typeof value === "string") return value.trim() === "";
	if (Array.isArray(value)) return value.length === 0;
	if (typeof value === "object") return Object.keys(value).length === 0;
	return false;
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(str: string): string {
	if (!str) return str;
	return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
	return name
		.split(" ")
		.map((word) => word[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

/**
 * Backend API track response format
 */
interface BackendTrackResponse {
	id: string;
	title: string;
	artist: {
		id: string;
		name: string;
		imageUrl?: string;
	};
	album: {
		id: string;
		title: string;
		coverImageUrl?: string;
	};
	durationInSeconds: number;
	trackNumber: number;
	genre: string;
	playCount: number;
	coverImageUrl?: string;
	createdAt: string;
	updatedAt: string;
}

/**
 * Frontend normalized track format
 */
interface NormalizedTrack {
	_id: string;
	title: string;
	artistId: {
		_id: string;
		name: string;
		imageUrl?: string;
	};
	albumId: {
		_id: string;
		title: string;
		coverImageUrl?: string;
	};
	durationInSeconds: number;
	trackNumber: number;
	genre: string;
	playCount: number;
	coverImageUrl?: string;
	createdAt: string;
	updatedAt: string;
}

/**
 * Normalize a track from backend API response format to frontend format
 * Converts: id -> _id, artist -> artistId, album -> albumId
 */
export function normalizeTrack(track: BackendTrackResponse): NormalizedTrack {
	return {
		_id: track.id,
		title: track.title,
		artistId: {
			_id: track.artist.id,
			name: track.artist.name,
			imageUrl: track.artist.imageUrl,
		},
		albumId: {
			_id: track.album.id,
			title: track.album.title,
			coverImageUrl: track.album.coverImageUrl,
		},
		durationInSeconds: track.durationInSeconds,
		trackNumber: track.trackNumber,
		genre: track.genre,
		playCount: track.playCount,
		coverImageUrl: track.coverImageUrl,
		createdAt: track.createdAt,
		updatedAt: track.updatedAt,
	};
}

/**
 * Normalize an array of tracks from backend format
 */
export function normalizeTracks(tracks: BackendTrackResponse[]): NormalizedTrack[] {
	return tracks.map(normalizeTrack);
}
