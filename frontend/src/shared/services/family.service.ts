import { apiService } from "./api.service";
import type { FamilyMembersResponse } from "../types";

export interface AddFamilyMemberInput {
	name: string;
	email: string;
	age?: number;
}

export interface AddFamilyMemberResponse {
	_id: string;
	email: string;
	displayName: string;
	username: string;
	accountType: "family_member";
	primaryAccountId: string;
	isActive: boolean;
	subscriptionStatus: string;
	createdAt: string;
}

export const familyService = {
	async getFamilyMembers(): Promise<FamilyMembersResponse> {
		return apiService.get<FamilyMembersResponse>("/api/family");
	},

	async addFamilyMember(
		input: AddFamilyMemberInput
	): Promise<AddFamilyMemberResponse> {
		return apiService.post<AddFamilyMemberResponse>("/api/family", input);
	},

	async removeFamilyMember(memberId: string): Promise<void> {
		await apiService.delete(`/api/family/${memberId}`);
	},
};
