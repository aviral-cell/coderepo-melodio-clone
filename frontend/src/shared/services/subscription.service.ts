import { apiService } from "./api.service";
import type { Subscription } from "../types";

export const subscriptionService = {
	async getSubscription(): Promise<Subscription> {
		return apiService.get<Subscription>("/api/subscription");
	},
};
