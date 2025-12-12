import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/components/ui/button";

interface ErrorMessageProps {
	/** Error message to display */
	message: string;
	/** Optional retry callback */
	onRetry?: () => void;
	/** Additional CSS classes */
	className?: string;
}

/**
 * Error display component with icon and optional retry button
 */
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
