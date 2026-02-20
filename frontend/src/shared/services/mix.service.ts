import { apiService } from "./api.service";
import type { TrackWithPopulated } from "../types/player.types";
import type { MixConfig } from "../utils/mixUtils";
import { normalizeTracks } from "../utils";

export interface Mix {
	_id: string;
	title: string;
	artistIds: string[];
	config: MixConfig;
	trackIds: string[];
	coverImages: string[];
	trackCount: number;
	createdAt: string;
}

export interface MixDetail extends Omit<Mix, "trackIds"> {
	trackIds: TrackWithPopulated[];
}

export interface CreateMixInput {
	title: string;
	artistIds: string[];
	config: MixConfig;
	trackIds: string[];
	coverImages: string[];
}

class MixService {
	async create(data: CreateMixInput): Promise<Mix> {
		return apiService.post<Mix>("/api/mixes", data);
	}

	async getAll(): Promise<Mix[]> {
		return apiService.get<Mix[]>("/api/mixes");
	}

	async getById(id: string): Promise<MixDetail> {
		const response = await apiService.get<any>("/api/mixes/" + id);
		return {
			...response,
			trackIds: response.tracks
				? (normalizeTracks(response.tracks) as TrackWithPopulated[])
				: [],
		};
	}

	async rename(id: string, title: string): Promise<Mix> {
		return apiService.patch<Mix>("/api/mixes/" + id, { title });
	}

	async delete(id: string): Promise<void> {
		await apiService.delete("/api/mixes/" + id);
	}
}

export const mixService = new MixService();
