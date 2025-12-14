import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/components/ui/button";

interface ErrorMessageProps {
	message: string;
	onRetry?: () => void;
	className?: string;
}

export function ErrorMessage({
	message,
	onRetry,
	className,
}: ErrorMessageProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center py-8 text-center",
				className
			)}
			role="alert"
		>
			<AlertCircle className="h-10 w-10 text-destructive" />
			<p className="mt-4 text-sm text-melodio-text-subdued">{message}</p>
			{onRetry && (
				<Button
					variant="outline"
					size="sm"
					onClick={onRetry}
					className="mt-4"
				>
					Try Again
				</Button>
			)}
		</div>
	);
}
