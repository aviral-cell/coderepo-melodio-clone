/**
 * Candidate Contract Surface — backend
 *
 * Knip entrypoint only. This file marks candidate-facing exports as intentionally
 * reachable from a single root-level contract surface.
 */

// History
export { historyService } from "../backend/src/features/history/history.service.js";
export type {
	TrackResponse as HistoryTrackResponse,
	RecentlyPlayedResponse,
} from "../backend/src/features/history/history.service.js";
export { historyController } from "../backend/src/features/history/history.controller.js";
export { historyRoutes } from "../backend/src/features/history/history.routes.js";
export {
	PlayHistory,
	type IPlayHistory,
	type IPlayHistoryDocument,
} from "../backend/src/features/history/history.model.js";

// Playlists
export {
	playlistsService,
	PlaylistError,
	type TrackInPlaylistResponse,
	type PlaylistResponse,
} from "../backend/src/features/playlists/playlists.service.js";
export { playlistsController } from "../backend/src/features/playlists/playlists.controller.js";
export { playlistRoutes } from "../backend/src/features/playlists/playlists.routes.js";
export {
	Playlist,
	type IPlaylist,
	type IPlaylistDocument,
} from "../backend/src/features/playlists/playlist.model.js";

// Tracks
export { tracksService } from "../backend/src/features/tracks/tracks.service.js";
export type {
	TrackResponse as TracksTrackResponse,
	PaginatedTracksResponse,
} from "../backend/src/features/tracks/tracks.service.js";
export { tracksController } from "../backend/src/features/tracks/tracks.controller.js";
export { trackRoutes } from "../backend/src/features/tracks/tracks.routes.js";
export { Track, type ITrack, type ITrackDocument } from "../backend/src/features/tracks/track.model.js";
export {
	TrackLike,
	type ITrackLike,
	type ITrackLikeDocument,
} from "../backend/src/features/tracks/track-like.model.js";

// Track like/dislike
export { trackLikeService } from "../backend/src/features/tracks/track-like.service.js";
export { trackLikeController } from "../backend/src/features/tracks/track-like.controller.js";
export { trackLikeRoutes } from "../backend/src/features/tracks/track-like.routes.js";
export type {
	LikeActionResult,
	LikeStatusResult,
	LikedIdsResult,
	LikedTrackResponse,
} from "../backend/src/features/tracks/track-like.types.js";

// Subscription
export { subscriptionService } from "../backend/src/features/subscription/subscription.service.js";
export { subscriptionController } from "../backend/src/features/subscription/subscription.controller.js";
export { subscriptionRoutes } from "../backend/src/features/subscription/subscription.routes.js";
export { SubscriptionPlan } from "../backend/src/features/subscription/subscription.types.js";
export type {
	SubscriptionResponse,
	ISubscription,
	CreateSubscriptionDto,
	UpdateSubscriptionDto,
} from "../backend/src/features/subscription/subscription.types.js";

// Family
export { familyService } from "../backend/src/features/family/family.service.js";
export { familyController } from "../backend/src/features/family/family.controller.js";
export { familyRoutes } from "../backend/src/features/family/family.routes.js";
export type { FamilyMemberResponse } from "../backend/src/features/family/family.service.js";
export type {
	FamilyMemberDto,
	FamilyMemberValidationError,
} from "../backend/src/features/family/family.dto.js";

// Artist interaction
export { artistInteractionService } from "../backend/src/features/artists/artist-interaction.service.js";
export { artistInteractionController } from "../backend/src/features/artists/artist-interaction.controller.js";
export { artistInteractionRoutes } from "../backend/src/features/artists/artist-interaction.routes.js";
export type {
	ToggleFollowResult,
	RateArtistResult,
	ArtistInteractionResult,
} from "../backend/src/features/artists/artist-interaction.service.js";

// Payment
export { paymentService } from "../backend/src/features/payment/payment.service.js";
export { paymentController } from "../backend/src/features/payment/payment.controller.js";
export { paymentRoutes } from "../backend/src/features/payment/payment.routes.js";
export type { PaymentValidationError } from "../backend/src/features/payment/payment.dto.js";
export type {
	CardDetails as PaymentCardDetails,
	PaymentResponse as PaymentApiResponse,
	ProcessCardPaymentRequest,
	ProcessCardPaymentResponse,
	PaymentStatus,
	CreatePaymentDto,
	UpdatePaymentDto,
	IPayment,
} from "../backend/src/features/payment/payment.types.js";

// Auth
export { authService } from "../backend/src/features/auth/auth.service.js";
export type {
	RegisterData,
	LoginData,
	AuthResponse,
	SwitchAccountResponse,
	UserResponse,
} from "../backend/src/features/auth/auth.service.js";

// Mixes
export { mixesService } from "../backend/src/features/mixes/mixes.service.js";
export { mixesController } from "../backend/src/features/mixes/mixes.controller.js";
export { mixRoutes } from "../backend/src/features/mixes/mixes.routes.js";
export type {
	TrackInMixResponse,
	MixResponse,
	CreateMixInput,
} from "../backend/src/features/mixes/mixes.service.js";
