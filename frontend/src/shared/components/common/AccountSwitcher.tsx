import { useState, useEffect, useCallback } from "react";
import { Users, UserCircle } from "lucide-react";

import {
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuItem,
} from "@/shared/components/ui/dropdown-menu";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useToast } from "@/shared/hooks/useToast";
import { familyService } from "@/shared/services/family.service";
import type { FamilyMember } from "@/shared/types";

interface SwitchableAccount {
	_id: string;
	displayName: string;
	email: string;
	type: "primary" | "family_member";
}

export function AccountSwitcher() {
	const { user, switchAccount } = useAuth();
	const { addToast } = useToast();

	const [accounts, setAccounts] = useState<SwitchableAccount[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isSwitching, setIsSwitching] = useState(false);

	const isPrimary = user?.accountType !== "family_member";

	const fetchSwitchableAccounts = useCallback(async () => {
		if (!isPrimary) {
			setAccounts([]);
			return;
		}

		setIsLoading(true);
		try {
			const data = await familyService.getFamilyMembers();
			const familyAccounts: SwitchableAccount[] = (
				data.familyMembers || []
			).map((member: FamilyMember) => ({
				_id: member._id,
				displayName: member.displayName,
				email: member.email,
				type: "family_member" as const,
			}));
			setAccounts(familyAccounts);
		} catch {
			setAccounts([]);
		} finally {
			setIsLoading(false);
		}
	}, [isPrimary]);

	useEffect(() => {
		fetchSwitchableAccounts();
	}, [fetchSwitchableAccounts]);

	const handleSwitchAccount = useCallback(
		async (targetUserId: string, displayName: string) => {
			if (isSwitching) return;

			setIsSwitching(true);
			try {
				await switchAccount(targetUserId);
				addToast({
					type: "success",
					message: `Switched to ${displayName}`,
				});
			} catch (error) {
				addToast({
					type: "error",
					message:
						error instanceof Error
							? error.message
							: "Failed to switch account",
				});
			} finally {
				setIsSwitching(false);
			}
		},
		[isSwitching, switchAccount, addToast]
	);

	if (!isPrimary && user?.primaryAccountId) {
		return (
			<DropdownMenuSub>
				<DropdownMenuSubTrigger
					className="text-melodio-text-subdued hover:bg-melodio-light-gray hover:text-white focus:bg-melodio-light-gray focus:text-white"
					data-testid="account-switcher-trigger"
				>
					<Users className="mr-2 h-4 w-4" />
					Switch Account
				</DropdownMenuSubTrigger>
				<DropdownMenuSubContent className="border-melodio-light-gray bg-melodio-dark-gray">
					<DropdownMenuItem
						onClick={() =>
							handleSwitchAccount(user.primaryAccountId!, "Primary Account")
						}
						disabled={isSwitching}
						className="text-melodio-text-subdued hover:bg-melodio-light-gray hover:text-white focus:bg-melodio-light-gray focus:text-white"
						data-testid="account-switch-to-primary-btn"
					>
						<UserCircle className="mr-2 h-4 w-4" />
						<span>Switch to Primary Account</span>
					</DropdownMenuItem>
				</DropdownMenuSubContent>
			</DropdownMenuSub>
		);
	}

	if (accounts.length === 0) {
		return null;
	}

	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger
				className="text-melodio-text-subdued hover:bg-melodio-light-gray hover:text-white focus:bg-melodio-light-gray focus:text-white"
				data-testid="account-switcher-trigger"
			>
				<Users className="mr-2 h-4 w-4" />
				Switch Account
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent className="border-melodio-light-gray bg-melodio-dark-gray">
				{isLoading ? (
					<DropdownMenuItem
						disabled
						className="text-melodio-text-subdued"
					>
						Loading...
					</DropdownMenuItem>
				) : (
					accounts.map((account) => (
						<DropdownMenuItem
							key={account._id}
							onClick={() =>
								handleSwitchAccount(account._id, account.displayName)
							}
							disabled={isSwitching}
							className="text-melodio-text-subdued hover:bg-melodio-light-gray hover:text-white focus:bg-melodio-light-gray focus:text-white"
							data-testid={`account-switch-to-${account._id}-btn`}
						>
							<div className="flex items-center gap-2">
								<div className="flex h-6 w-6 items-center justify-center rounded-full bg-melodio-green text-xs text-black">
									{account.displayName.charAt(0).toUpperCase()}
								</div>
								<div className="flex flex-col">
									<span className="text-sm">{account.displayName}</span>
									<span className="text-xs text-melodio-text-subdued">
										{account.email}
									</span>
								</div>
							</div>
						</DropdownMenuItem>
					))
				)}
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
}
