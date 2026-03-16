/**
 * Candidate Contract Surface — frontend
 *
 * Knip entrypoint only. This file marks candidate-facing exports as intentionally
 * reachable from a single root-level contract surface.
 */

// Task utilities
export {
	DEFAULT_CONFIG,
	FILTER_OPTIONS,
	MIX_LIMIT,
	STEP_ORDER,
	getUniqueArtists,
	scoreTrack,
	generateMix,
	getMixTitle,
	getMixCoverImages,
	type MixConfig,
	type MixStep,
	type Variety,
	type Discovery,
} from "../frontend/src/shared/utils/mixUtils";

export {
	MOOD_GENRE_MAP,
	MOOD_IMAGES,
	getTracksForMood,
	getTracksGroupedByMood,
	getMoodImage,
	getMoodDescription,
} from "../frontend/src/shared/utils/moodUtils";

export {
	CONCERT_CITIES,
	MAX_TICKETS_PER_USER,
	getUpcomingConcerts,
	getUniqueCities,
	getMonthOptions,
	sortConcertsByDate,
	filterByMonth,
	getArtistsInCity,
	formatConcertDate,
	formatConcertTime,
	calculateUserTicketCount,
	canBuyMoreTickets,
	generateTicketCodes,
	getArtistAlbumsForConcert,
	getArtistTracksForConcert,
	type Concert,
	type ConcertTicket,
	type ArtistWithNextConcert,
	type TicketDisplayItem,
} from "../frontend/src/shared/utils/concertUtils";

export {
	GENRE_LANGUAGE_MAP,
	GENRE_DISPLAY_NAMES,
	ERA_RANGES,
	AVAILABLE_LANGUAGES,
	AVAILABLE_GENRES,
	AVAILABLE_ERAS,
	getGenreDisplayName,
	getTrackLanguage,
	getNewThisWeek,
	getPopularInLanguage,
	getPopularInGenre,
	getTracksByEra,
	getTopArtists,
	formatLanguageLabel,
} from "../frontend/src/shared/utils/discoveryUtils";

export {
	groupEpisodesByShow,
	calculateShowDuration,
	sortShowsByRecency,
	formatEpisodeDuration,
	getTopShows,
	sortEpisodesByOrder,
	formatShowDuration,
	formatEpisodeDate,
	getUpNextEpisodes,
	preparePlaybackQueue,
	getEpisodePlaybackIndex,
	formatPlayCount,
	getEpisodeDescription,
	type PodcastShow,
} from "../frontend/src/shared/utils/podcastUtils";

export {
	sortLikedTracks,
	getLikedTrackStats,
	isTrackLiked,
	isTrackDisliked,
	getReactionForTrack,
	type LikedSortOption,
} from "../frontend/src/shared/utils/likedTracksUtils";

// Task hooks
export { useMixCreator } from "../frontend/src/shared/hooks/useMixCreator";
export type { UseMixCreatorReturn } from "../frontend/src/shared/hooks/useMixCreator";
export { useMoodMixer } from "../frontend/src/shared/hooks/useMoodMixer";
export { useConcertListing, useConcertDetail } from "../frontend/src/shared/hooks/useConcerts";
export { usePlaylistOperations } from "../frontend/src/shared/hooks/usePlaylistOperations";
export { useSearch } from "../frontend/src/shared/hooks/useSearch";
export { useDiscovery } from "../frontend/src/shared/hooks/useDiscovery";
export { usePodcastBrowser } from "../frontend/src/shared/hooks/usePodcastBrowser";
export { useLikedTracks } from "../frontend/src/shared/hooks/useLikedTracks";
export { useArtistInteraction } from "../frontend/src/shared/hooks/useArtistInteraction";

// Shared app barrels intentionally exposed to candidates/tasks
export * from "../frontend/src/shared/services/index";
export type { PlaylistWithTracks } from "../frontend/src/shared/services/playlist.service";
export * from "../frontend/src/shared/utils/index";
export * from "../frontend/src/shared/types/index";
export type { TrackWithPopulated } from "../frontend/src/shared/types/player.types";
