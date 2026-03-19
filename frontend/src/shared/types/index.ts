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

export type AccountType = "primary" | "family_member";
export type SubscriptionPlan = "free" | "premium";
export type SubscriptionStatus = "free" | "premium";

export interface User {
	_id: string;
	email: string;
	username: string;
	displayName: string;
	avatarUrl?: string;
	accountType?: AccountType;
	primaryAccountId?: string;
	isActive?: boolean;
	subscriptionStatus?: SubscriptionStatus;
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
	description?: string;
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

export interface Subscription {
	_id: string;
	userId: string;
	plan: SubscriptionPlan;
	startDate: string;
	endDate: string | null;
	autoRenew: boolean;
	createdAt: string;
	updatedAt: string;
	isFamilyMember?: boolean;
	primaryAccountId?: string | null;
}

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface Payment {
	_id: string;
	userId: string;
	amount: number;
	status: PaymentStatus;
	cardLast4: string;
	idempotencyKey: string | null;
	timestamp: string;
	createdAt: string;
	updatedAt: string;
}

export interface CardDetails {
	cardNumber: string;
	expiryMonth: string;
	expiryYear: string;
	cvv: string;
}

export interface FamilyMember {
	_id: string;
	displayName: string;
	email: string;
	isActive: boolean;
	createdAt: string;
}

export interface FamilyMembersResponse {
	familyMembers: FamilyMember[];
	maxMembers: number;
	remainingSlots: number;
}
