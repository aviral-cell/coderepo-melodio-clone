import { apiService } from "./api.service";

interface LikeStatusResponse {
	status: "like" | "dislike" | null;
}

interface LikeActionResponse {
	status: "like" | "dislike" | null;
	trackId: string;
}

interface LikedIdsResponse {
	likedIds: string[];
	dislikedIds: string[];
}

interface LikedTrackItem {
	_id: string;
	title: string;
	durationInSeconds: number;
	trackNumber: number;
	genre: string;
	playCount: number;
	coverImageUrl?: string;
	description?: string;
	createdAt: string;
	updatedAt: string;
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
	likedAt: string;
}

interface LikedTracksResponse {
	items: LikedTrackItem[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export type { LikedTrackItem };

export const trackLikeService = {
	likeTrack: (trackId: string): Promise<LikeActionResponse> =>
		apiService.post<LikeActionResponse>(`/api/tracks/${trackId}/like`),

	dislikeTrack: (trackId: string): Promise<LikeActionResponse> =>
		apiService.post<LikeActionResponse>(`/api/tracks/${trackId}/dislike`),

	removeReaction: (trackId: string): Promise<LikeActionResponse> =>
		apiService.delete<LikeActionResponse>(`/api/tracks/${trackId}/like`),

	getLikedTracks: (params?: { page?: number; limit?: number }): Promise<LikedTracksResponse> => {
		const query = new URLSearchParams();
		if (params?.page) query.set("page", params.page.toString());
		if (params?.limit) query.set("limit", params.limit.toString());
		const qs = query.toString();
		return apiService.get<LikedTracksResponse>(`/api/tracks/liked${qs ? `?${qs}` : ""}`);
	},

	getLikeStatus: (trackId: string): Promise<LikeStatusResponse> =>
		apiService.get<LikeStatusResponse>(`/api/tracks/${trackId}/like-status`),

	getLikedIds: (): Promise<LikedIdsResponse> =>
		apiService.get<LikedIdsResponse>("/api/tracks/liked/ids"),
};
