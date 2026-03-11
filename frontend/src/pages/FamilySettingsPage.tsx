import { useState, useEffect, useCallback } from "react";
import {
	Users,
	UserPlus,
	Trash2,
	Mail,
	CheckCircle,
	XCircle,
} from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useToast } from "@/shared/hooks/useToast";
import { familyService } from "@/shared/services/family.service";
import { AddFamilyMemberModal } from "@/shared/components/common/AddFamilyMemberModal";
import type { FamilyMember } from "@/shared/types";

function formatDate(dateString: string): string {
	return new Date(dateString).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	});
}

export default function FamilySettingsPage() {
	const { user } = useAuth();
	const { addToast } = useToast();

	const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
	const [maxMembers, setMaxMembers] = useState(3);
	const [remainingSlots, setRemainingSlots] = useState(3);
	const [isLoading, setIsLoading] = useState(true);
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

	const isPrimaryAccount = user?.accountType !== "family_member";

	const fetchFamilyMembers = useCallback(async () => {
		try {
			const data = await familyService.getFamilyMembers();
			setFamilyMembers(data.familyMembers || []);
			setMaxMembers(data.maxMembers);
			setRemainingSlots(data.remainingSlots);
		} catch (error) {
			addToast({
				type: "error",
				message:
					error instanceof Error
						? error.message
						: "Failed to load family members",
			});
		} finally {
			setIsLoading(false);
		}
	}, [addToast]);

	useEffect(() => {
		fetchFamilyMembers();
	}, [fetchFamilyMembers]);

	const handleRemoveMember = useCallback(
		async (memberId: string) => {
			setRemovingMemberId(memberId);
			try {
				await familyService.removeFamilyMember(memberId);
				setFamilyMembers((prev) =>
					prev.filter((member) => member._id !== memberId)
				);
				setRemainingSlots((prev) => prev + 1);
				addToast({
					type: "success",
					message: "Family member removed successfully",
				});
			} catch (error) {
				addToast({
					type: "error",
					message:
						error instanceof Error
							? error.message
							: "Failed to remove family member",
				});
			} finally {
				setRemovingMemberId(null);
			}
		},
		[addToast]
	);

	const handleAddSuccess = useCallback(() => {
		setIsAddModalOpen(false);
		fetchFamilyMembers();
		addToast({
			type: "success",
			message: "Family member added successfully",
		});
	}, [fetchFamilyMembers, addToast]);

	if (isLoading) {
		return (
			<div className="p-6">
				<Skeleton className="mb-6 h-10 w-64" />
				<Skeleton className="h-96" />
			</div>
		);
	}

	const usedSlots = maxMembers - remainingSlots;

	return (
		<div className="p-6">
			<div className="mb-8">
				<h1
					className="text-3xl font-bold text-white"
					data-testid="family-settings-page-title"
				>
					Family Settings
				</h1>
				<p className="mt-2 text-melodio-text-subdued">
					Manage your family members
				</p>
			</div>

			<Card className="border-melodio-light-gray bg-melodio-dark-gray">
				<CardHeader>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<CardTitle className="flex items-center gap-2 text-white">
								<Users className="h-5 w-5" />
								Family Members
							</CardTitle>
							<CardDescription>
								{usedSlots} of {maxMembers} slots used
							</CardDescription>
						</div>
						{isPrimaryAccount && remainingSlots > 0 && (
							<Button
								onClick={() => setIsAddModalOpen(true)}
								className="w-full rounded-full bg-melodio-green text-black hover:bg-melodio-green/90 sm:w-auto"
								data-testid="family-add-member-btn"
							>
								<UserPlus className="mr-2 h-4 w-4" />
								Add Member
							</Button>
						)}
					</div>
				</CardHeader>
				<CardContent>
					{familyMembers.length === 0 ? (
						<div className="py-8 text-center">
							<Users className="mx-auto mb-3 h-10 w-10 text-melodio-text-subdued opacity-50" />
							<p className="mb-2 text-white">No family members yet</p>
							{isPrimaryAccount ? (
								<>
									<p className="mb-4 text-sm text-melodio-text-subdued">
										Add up to {maxMembers} family members to share your account
									</p>
									<Button
										onClick={() => setIsAddModalOpen(true)}
										className="rounded-full bg-melodio-green text-black hover:bg-melodio-green/90"
										data-testid="family-add-first-member-btn"
									>
										<UserPlus className="mr-2 h-4 w-4" />
										Add First Member
									</Button>
								</>
							) : (
								<p className="text-sm text-melodio-text-subdued">
									Only the primary account holder can manage family members
								</p>
							)}
						</div>
					) : (
						<div className="space-y-3">
							{familyMembers.map((member) => (
								<div
									key={member._id}
									className="flex flex-col gap-3 rounded-md bg-melodio-light-gray p-4 sm:flex-row sm:items-center sm:justify-between"
									data-testid={`family-member-${member._id}`}
								>
									<div className="flex items-center gap-3 min-w-0">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-melodio-green text-black">
											{member.displayName.charAt(0).toUpperCase()}
										</div>
										<div className="min-w-0">
											<p className="truncate font-medium text-white">
												{member.displayName}
											</p>
											<div className="flex items-center gap-2 text-sm text-melodio-text-subdued">
												<Mail className="h-3 w-3 shrink-0" />
												<span className="truncate">{member.email}</span>
											</div>
										</div>
									</div>
									<div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-4">
										<div className="flex items-center gap-3 sm:gap-4">
											<div className="flex items-center gap-1 text-sm">
												{member.isActive ? (
													<>
														<CheckCircle className="h-4 w-4 text-green-500" />
														<span className="text-green-500">Active</span>
													</>
												) : (
													<>
														<XCircle className="h-4 w-4 text-red-500" />
														<span className="text-red-500">Inactive</span>
													</>
												)}
											</div>
											<span className="text-xs text-melodio-text-subdued whitespace-nowrap">
												Added {formatDate(member.createdAt)}
											</span>
										</div>
										{isPrimaryAccount && (
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleRemoveMember(member._id)}
												disabled={removingMemberId === member._id}
												className="shrink-0 rounded-full text-red-400 hover:bg-red-500/10 hover:text-red-500"
												data-testid={`family-remove-member-${member._id}-btn`}
											>
												{removingMemberId === member._id ? (
													<span className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
												) : (
													<Trash2 className="h-4 w-4" />
												)}
											</Button>
										)}
									</div>
								</div>
							))}
						</div>
					)}

					{/* Remaining Slots Indicator */}
					{familyMembers.length > 0 && remainingSlots > 0 && (
						<div className="mt-4 text-center text-sm text-melodio-text-subdued">
							{remainingSlots} slot{remainingSlots !== 1 ? "s" : ""} remaining
						</div>
					)}

					{/* Max Members Reached */}
					{remainingSlots === 0 && (
						<div className="mt-4 rounded-md bg-melodio-light-gray/50 p-3 text-center text-sm text-melodio-text-subdued">
							Maximum family members reached ({maxMembers})
						</div>
					)}
				</CardContent>
			</Card>

			<AddFamilyMemberModal
				open={isAddModalOpen}
				onOpenChange={setIsAddModalOpen}
				onSuccess={handleAddSuccess}
			/>
		</div>
	);
}
