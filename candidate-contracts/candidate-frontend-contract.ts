/**
 * Candidate Contract Surface - frontend direct exports
 *
 * Knip entrypoint only. This file lists candidate-added frontend exports that
 * are not legacy barrel re-exports.
 */

// Existing files with candidate-added named exports
export type {
	SwitchAccountInput,
	SwitchAccountResponse,
} from "../frontend/src/shared/services/auth.service";

export type {
	AccountType,
	SubscriptionPlan,
	SubscriptionStatus,
	Subscription,
	PaymentStatus,
	Payment,
	CardDetails,
	FamilyMember,
	FamilyMembersResponse,
} from "../frontend/src/shared/types/index";

// Candidate-added hook files
export * from "../frontend/src/shared/hooks/useArtistInteraction";
export * from "../frontend/src/shared/hooks/useConcerts";
export * from "../frontend/src/shared/hooks/useDiscovery";
export * from "../frontend/src/shared/hooks/useLikedTracks";
export * from "../frontend/src/shared/hooks/useMixCreator";
export * from "../frontend/src/shared/hooks/useMoodMixer";
export * from "../frontend/src/shared/hooks/usePodcastBrowser";

// Candidate-added service files
export * from "../frontend/src/shared/services/artist-interaction.service";
export * from "../frontend/src/shared/services/concert.service";
export * from "../frontend/src/shared/services/family.service";
export * from "../frontend/src/shared/services/history.service";
export * from "../frontend/src/shared/services/mix.service";
export * from "../frontend/src/shared/services/payment.service";
export * from "../frontend/src/shared/services/subscription.service";
export * from "../frontend/src/shared/services/track-like.service";

// Candidate-added utility files
export * from "../frontend/src/shared/utils/concertUtils";
export * from "../frontend/src/shared/utils/discoveryUtils";
export * from "../frontend/src/shared/utils/history.utils";
export * from "../frontend/src/shared/utils/imageUtils";
export * from "../frontend/src/shared/utils/likedTracksUtils";
export * from "../frontend/src/shared/utils/mixUtils";
export * from "../frontend/src/shared/utils/moodUtils";
export * from "../frontend/src/shared/utils/podcastUtils";
export * from "../frontend/src/shared/utils/ratingUtils";

// Candidate-added barrel re-exports from existing files
export {
	type SwitchAccountInput,
	type SwitchAccountResponse,
	subscriptionService,
	paymentService,
	type PaymentRequest,
	type PaymentResponse,
	type PaymentHistoryResponse,
	familyService,
	type AddFamilyMemberInput,
	type AddFamilyMemberResponse,
	historyService,
	type RecentlyPlayedTrack,
	type RecentlyPlayedResponse,
	mixService,
	type Mix,
	type MixDetail,
	type CreateMixInput,
	concertService,
	type Concert,
	type ConcertTicket,
	type BuyTicketsResponse,
	artistInteractionService,
	trackLikeService,
	type LikeStatusResponse,
	type LikeActionResponse,
	type LikedIdsResponse,
	type LikedTrackItem,
	type LikedTracksResponse,
} from "../frontend/src/shared/services/index";

export {
	DEFAULT_IMAGE,
	preloadImages,
	getImageUrl,
	configureImageBaseUrl,
	toTrackWithPopulated,
	roundToHalfStar,
	getStarState,
	formatRatingDisplay,
	formatFollowerCount,
	sortLikedTracks,
	getLikedTrackStats,
	isTrackLiked,
	isTrackDisliked,
	getReactionForTrack,
	type LikedSortOption,
} from "../frontend/src/shared/utils/index";

export {
	useArtistInteraction,
	useLikedTracks,
} from "../frontend/src/shared/hooks/index";
