import { apiService } from "./api.service";

interface InteractionResponse {
	isFollowing: boolean;
	userRating: number;
	averageRating: number;
	totalRatings: number;
}

interface FollowResponse {
	isFollowing: boolean;
	followerCount: number;
}

interface RateResponse {
	userRating: number;
	averageRating: number;
	totalRatings: number;
}

export const artistInteractionService = {
	async getInteraction(artistId: string): Promise<InteractionResponse> {
		return apiService.get<InteractionResponse>(`/api/artists/${artistId}/interaction`);
	},

	async toggleFollow(artistId: string): Promise<FollowResponse> {
		return apiService.post<FollowResponse>(`/api/artists/${artistId}/follow`);
	},

	async rateArtist(artistId: string, rating: number): Promise<RateResponse> {
		return apiService.post<RateResponse>(`/api/artists/${artistId}/rate`, { rating });
	},
};
