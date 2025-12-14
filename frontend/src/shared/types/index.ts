export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	message?: string;
	error?: string;
	errors?: Array<{
		field: string;
		message: string;
	}>;
}

export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

export interface User {
	_id: string;
	email: string;
	username: string;
	displayName: string;
	avatarUrl?: string;
	createdAt: string;
	updatedAt: string;
}

export interface Artist {
	_id: string;
	name: string;
	bio?: string;
	imageUrl?: string;
	genres: string[];
	followerCount: number;
	createdAt: string;
	updatedAt: string;
}

export interface Album {
	_id: string;
	title: string;
	artistId: string;
	artist?: Artist;
	releaseDate: string;
	coverImageUrl?: string;
	totalTracks: number;
	createdAt: string;
	updatedAt: string;
}

export interface Track {
	_id: string;
	title: string;
	artistId: string;
	artist?: Artist;
	albumId: string;
	album?: Album;
	durationInSeconds: number;
	trackNumber: number;
	genre: string;
	playCount: number;
	coverImageUrl?: string;
	createdAt: string;
	updatedAt: string;
}

export interface Playlist {
	_id: string;
	name: string;
	description?: string;
	ownerId: string;
	owner?: User;
	trackIds: string[];
	tracks?: Track[];
	coverImageUrl?: string;
	isPublic: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface AuthTokens {
	accessToken: string;
	refreshToken?: string;
}

export interface LoginCredentials {
	email: string;
	password: string;
}

export interface RegisterData {
	email: string;
	username: string;
	password: string;
	displayName: string;
}

export interface SearchResults {
	artists: Artist[];
	albums: Album[];
	tracks: Track[];
	playlists: Playlist[];
}

export interface PlayerState {
	currentTrack: Track | null;
	queue: Track[];
	isPlaying: boolean;
	volume: number;
	progress: number;
	duration: number;
	repeat: "none" | "one" | "all";
	shuffle: boolean;
}
