import { useState, useEffect, useCallback } from "react";
import { CreditCard, CheckCircle, XCircle, Clock, RotateCcw } from "lucide-react";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useToast } from "@/shared/hooks/useToast";
import { paymentService } from "@/shared/services/payment.service";
import type { Payment, PaymentStatus } from "@/shared/types";

function formatDate(dateString: string): string {
	return new Date(dateString).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	});
}

function getStatusIcon(status: PaymentStatus) {
	switch (status) {
		case "completed":
			return <CheckCircle className="h-4 w-4 text-green-500" />;
		case "failed":
			return <XCircle className="h-4 w-4 text-red-500" />;
		case "pending":
			return <Clock className="h-4 w-4 text-yellow-500" />;
		case "refunded":
			return <RotateCcw className="h-4 w-4 text-blue-500" />;
		default:
			return null;
	}
}

function getStatusText(status: PaymentStatus): string {
	return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusColor(status: PaymentStatus): string {
	switch (status) {
		case "completed":
			return "text-green-500";
		case "failed":
			return "text-red-500";
		case "pending":
			return "text-yellow-500";
		case "refunded":
			return "text-blue-500";
		default:
			return "text-melodio-text-subdued";
	}
}

export function PaymentHistory() {
	const { addToast } = useToast();

	const [payments, setPayments] = useState<Payment[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const fetchPayments = useCallback(async () => {
		try {
			const data = await paymentService.getPaymentHistory();
			setPayments(data.payments || []);
		} catch (error) {
			addToast({
				type: "error",
				message:
					error instanceof Error
						? error.message
						: "Failed to load payment history",
			});
		} finally {
			setIsLoading(false);
		}
	}, [addToast]);

	useEffect(() => {
		fetchPayments();
	}, [fetchPayments]);

	if (isLoading) {
		return (
			<Card className="border-melodio-light-gray bg-melodio-dark-gray">
				<CardHeader>
					<Skeleton className="h-6 w-40" />
					<Skeleton className="h-4 w-60" />
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{Array.from({ length: 3 }).map((_, i) => (
							<Skeleton key={i} className="h-16 w-full" />
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="border-melodio-light-gray bg-melodio-dark-gray">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-white">
					<CreditCard className="h-5 w-5" />
					Payment History
				</CardTitle>
				<CardDescription>Your recent transactions</CardDescription>
			</CardHeader>
			<CardContent>
				{payments.length === 0 ? (
					<div className="py-8 text-center text-melodio-text-subdued">
						<CreditCard className="mx-auto mb-3 h-10 w-10 opacity-50" />
						<p>No payment history yet</p>
					</div>
				) : (
					<div className="space-y-3">
						{payments.map((payment) => (
							<div
								key={payment._id}
								className="flex items-center justify-between rounded-md bg-melodio-light-gray p-3"
								data-testid={`payment-history-item-${payment._id}`}
							>
								<div className="flex items-center gap-3">
									{getStatusIcon(payment.status)}
									<div>
										<p className="text-sm font-medium text-white">
											Premium Subscription
										</p>
										<p className="text-xs text-melodio-text-subdued">
											**** {payment.cardLast4} -{" "}
											{formatDate(payment.timestamp)}
										</p>
									</div>
								</div>
								<div className="text-right">
									<p className="text-sm font-medium text-white">
										${payment.amount.toFixed(2)}
									</p>
									<p
										className={`text-xs ${getStatusColor(payment.status)}`}
									>
										{getStatusText(payment.status)}
									</p>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
