/**
 * Candidate Contract Surface - backend
 *
 * Knip entrypoint only. This file lists candidate-added backend exports.
 */

// Existing files with candidate-added named exports
export type {
	SwitchAccountResponse,
	UserResponse,
} from "../backend/src/features/auth/auth.service.js";

export {
	PlaylistError,
} from "../backend/src/features/playlists/playlists.service.js";

// Candidate-added shared files
export * from "../backend/src/shared/services/cache.service.js";

// Candidate-added feature files
export * from "../backend/src/features/artists/artist-follow.model.js";
export * from "../backend/src/features/artists/artist-interaction.controller.js";
export * from "../backend/src/features/artists/artist-interaction.routes.js";
export * from "../backend/src/features/artists/artist-interaction.service.js";
export * from "../backend/src/features/artists/artist-rating.model.js";

export * from "../backend/src/features/concerts/concert.model.js";
export * from "../backend/src/features/concerts/concerts.controller.js";
export * from "../backend/src/features/concerts/concerts.routes.js";
export * from "../backend/src/features/concerts/concerts.service.js";

export * from "../backend/src/features/family/family.controller.js";
export * from "../backend/src/features/family/family.dto.js";
export * from "../backend/src/features/family/family.routes.js";
export * from "../backend/src/features/family/family.service.js";

export * from "../backend/src/features/history/history.controller.js";
export * from "../backend/src/features/history/history.model.js";
export * from "../backend/src/features/history/history.routes.js";
export * from "../backend/src/features/history/history.service.js";

export * from "../backend/src/features/mixes/mix.model.js";
export * from "../backend/src/features/mixes/mixes.controller.js";
export * from "../backend/src/features/mixes/mixes.routes.js";
export * from "../backend/src/features/mixes/mixes.service.js";

export * from "../backend/src/features/payment/payment.controller.js";
export * from "../backend/src/features/payment/payment.dto.js";
export * from "../backend/src/features/payment/payment.model.js";
export * from "../backend/src/features/payment/payment.routes.js";
export * from "../backend/src/features/payment/payment.service.js";
export * from "../backend/src/features/payment/payment.types.js";

export * from "../backend/src/features/subscription/subscription.controller.js";
export * from "../backend/src/features/subscription/subscription.model.js";
export * from "../backend/src/features/subscription/subscription.routes.js";
export * from "../backend/src/features/subscription/subscription.service.js";
export * from "../backend/src/features/subscription/subscription.types.js";

export * from "../backend/src/features/tracks/track-like.controller.js";
export * from "../backend/src/features/tracks/track-like.model.js";
export * from "../backend/src/features/tracks/track-like.routes.js";
export * from "../backend/src/features/tracks/track-like.service.js";
export * from "../backend/src/features/tracks/track-like.types.js";
