import { useState, useEffect, useCallback } from "react";
import { Crown, Check, Calendar, CreditCard, RefreshCw, Users } from "lucide-react";

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
import { subscriptionService } from "@/shared/services/subscription.service";
import { PaymentModal } from "@/shared/components/common/PaymentModal";
import { PaymentHistory } from "@/shared/components/common/PaymentHistory";
import type { Subscription } from "@/shared/types";

const PREMIUM_PRICE = 9.99;

const PREMIUM_FEATURES = [
	"Unlimited playlists",
	"Ad-free listening",
	"Higher audio quality",
	"Offline mode",
];

const FREE_FEATURES = [
	"Up to 7 playlists",
	"Ads between tracks",
	"Standard audio quality",
];

function formatDate(dateString: string): string {
	return new Date(dateString).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
		timeZone: "UTC",
	});
}

export default function SubscriptionPage() {
	const { refreshUser } = useAuth();
	const { addToast } = useToast();

	const [subscription, setSubscription] = useState<Subscription | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

	const fetchSubscription = useCallback(async () => {
		try {
			const data = await subscriptionService.getSubscription();
			setSubscription(data);
		} catch (error) {
			addToast({
				type: "error",
				message:
					error instanceof Error
						? error.message
						: "Failed to load subscription",
			});
		} finally {
			setIsLoading(false);
		}
	}, [addToast]);

	useEffect(() => {
		fetchSubscription();
	}, [fetchSubscription]);

	const handlePaymentSuccess = useCallback(async () => {
		setIsPaymentModalOpen(false);
		await fetchSubscription();
		await refreshUser();
		addToast({
			type: "success",
			message: "Welcome to Premium! Enjoy your new benefits.",
		});
	}, [fetchSubscription, refreshUser, addToast]);

	const isPremium = subscription?.plan === "premium";
	const isFamilyMember = subscription?.isFamilyMember === true;

	if (isLoading) {
		return (
			<div className="p-6">
				<Skeleton className="mb-6 h-10 w-64" />
				<div className="grid gap-6 md:grid-cols-2">
					<Skeleton className="h-96" />
					<Skeleton className="h-96" />
				</div>
			</div>
		);
	}

	return (
		<div className="p-6">
			<div className="mb-8">
				<h1
					className="text-3xl font-bold text-white"
					data-testid="subscription-page-title"
				>
					Subscription
				</h1>
				<p className="mt-2 text-melodio-text-subdued">
					Manage your Melodio subscription
				</p>
			</div>

			{isFamilyMember && (
				<Card
					className="mb-6 border-melodio-green bg-gradient-to-r from-melodio-dark-gray to-melodio-light-gray"
					data-testid="family-member-subscription-banner"
				>
					<CardContent className="flex items-center gap-4 py-4">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-melodio-green/20">
							<Users className="h-5 w-5 text-melodio-green" />
						</div>
						<div>
							<h3 className="font-medium text-white">Family Plan Member</h3>
							<p className="text-sm text-melodio-text-subdued">
								You're enjoying benefits from your family's subscription plan.
							</p>
						</div>
					</CardContent>
				</Card>
			)}

			<div className="grid gap-6 md:grid-cols-2">
				{/* Current Plan Card */}
				<Card className="flex flex-col border-melodio-light-gray bg-melodio-dark-gray">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-white">
							{isPremium ? (
								<>
									<Crown className="h-5 w-5 text-yellow-500" />
									Premium Plan
								</>
							) : (
								"Free Plan"
							)}
						</CardTitle>
						<CardDescription>
							{isPremium
								? `$${PREMIUM_PRICE}/month`
								: "Limited features"}
						</CardDescription>
					</CardHeader>
					<CardContent className="flex-1">
						<div className="flex h-full flex-col space-y-4">
							{isPremium && subscription ? (
								<>
									<div className="space-y-3">
										<div className="flex items-center gap-2 text-sm text-melodio-text-subdued">
											<Calendar className="h-4 w-4" />
											<span>
												Started: {formatDate(subscription.startDate)}
											</span>
										</div>
										{subscription.endDate && (
											<div className="flex items-center gap-2 text-sm text-melodio-text-subdued">
												<CreditCard className="h-4 w-4" />
												<span>
													Next billing: {formatDate(subscription.endDate)}
												</span>
											</div>
										)}
										<div className="flex items-center gap-2 text-sm text-melodio-text-subdued">
											<RefreshCw className="h-4 w-4" />
											<span>
												Auto-renewal:{" "}
												{subscription.autoRenew ? "Enabled" : "Disabled"}
											</span>
										</div>
									</div>

									<div className="mt-6">
										<h4 className="mb-3 text-sm font-medium text-white">
											Your Premium Benefits
										</h4>
										<ul className="space-y-2">
											{PREMIUM_FEATURES.map((feature) => (
												<li
													key={feature}
													className="flex items-center gap-2 text-sm text-melodio-text-subdued"
												>
													<Check className="h-4 w-4 text-melodio-green" />
													{feature}
												</li>
											))}
										</ul>
									</div>
								</>
							) : (
								<>
									<ul className="space-y-2">
										{FREE_FEATURES.map((feature) => (
											<li
												key={feature}
												className="flex items-center gap-2 text-sm text-melodio-text-subdued"
											>
												<Check className="h-4 w-4" />
												{feature}
											</li>
										))}
									</ul>

									{isFamilyMember ? (
										<p className="mt-6 text-sm text-melodio-text-subdued">
											Contact your family plan owner to upgrade to Premium.
										</p>
									) : (
										<Button
											className="mt-auto w-full rounded-full bg-melodio-green text-black hover:bg-melodio-green/90"
											onClick={() => setIsPaymentModalOpen(true)}
											data-testid="subscription-upgrade-btn"
										>
											<Crown className="mr-2 h-4 w-4" />
											Upgrade to Premium - ${PREMIUM_PRICE}/mo
										</Button>
									)}
								</>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Premium Benefits Card (for free users) / Payment History (for premium) */}
				{!isPremium && !isFamilyMember ? (
					<Card className="flex flex-col border-melodio-green bg-gradient-to-br from-melodio-dark-gray to-melodio-light-gray">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-white">
								<Crown className="h-5 w-5 text-melodio-green" />
								Go Premium
							</CardTitle>
							<CardDescription>
								Unlock all features for just ${PREMIUM_PRICE}/month
							</CardDescription>
						</CardHeader>
						<CardContent className="flex-1 flex flex-col">
							<ul className="space-y-3">
								{PREMIUM_FEATURES.map((feature) => (
									<li
										key={feature}
										className="flex items-center gap-2 text-sm text-white"
									>
										<Check className="h-4 w-4 text-melodio-green" />
										{feature}
									</li>
								))}
							</ul>

							<Button
								className="mt-auto w-full rounded-full bg-melodio-green text-black hover:bg-melodio-green/90"
								onClick={() => setIsPaymentModalOpen(true)}
								data-testid="subscription-upgrade-premium-btn"
							>
								Get Premium Now
							</Button>
						</CardContent>
					</Card>
				) : !isPremium && isFamilyMember ? (
					<Card className="border-melodio-light-gray bg-melodio-dark-gray">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-white">
								<Users className="h-5 w-5 text-melodio-green" />
								Family Plan
							</CardTitle>
							<CardDescription>
								Your subscription is managed by your family plan owner
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-melodio-text-subdued">
								As a family member, your subscription benefits are determined by
								the primary account holder. Contact them to upgrade to Premium
								and enjoy enhanced features for the whole family.
							</p>
						</CardContent>
					</Card>
				) : (
					<PaymentHistory />
				)}
			</div>

			<PaymentModal
				open={isPaymentModalOpen}
				onOpenChange={setIsPaymentModalOpen}
				onSuccess={handlePaymentSuccess}
				price={PREMIUM_PRICE}
			/>
		</div>
	);
}
