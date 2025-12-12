import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
	/** Optional text to display below the spinner */
	text?: string;
	/** Size of the spinner */
	size?: "sm" | "md" | "lg";
	/** Additional CSS classes */
	className?: string;
}

const sizeClasses = {
	sm: "h-4 w-4",
	md: "h-6 w-6",
	lg: "h-10 w-10",
} as const;

/**
 * Centered loading spinner with optional text
 */
export function LoadingSpinner({
	text,
	size = "md",
	className,
}: LoadingSpinnerProps) {
	return (
		<div
			className={cn("flex flex-col items-center justify-center py-8", className)}
			role="status"
			aria-label={text || "Loading"}
		>
			<Loader2
				className={cn(
					"animate-spin text-hackify-text-subdued",
					sizeClasses[size]
				)}
			/>
			{text && (
				<p className="mt-3 text-sm text-hackify-text-subdued">{text}</p>
			)}
		</div>
	);
}
