import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/components/ui/button";

interface EmptyStateProps {
	icon?: LucideIcon;
	title: string;
	description?: string;
	actionLabel?: string;
	onAction?: () => void;
	className?: string;
}

export function EmptyState({
	icon: Icon = Inbox,
	title,
	description,
	actionLabel,
	onAction,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center py-12 text-center",
				className
			)}
		>
			<div className="flex h-16 w-16 items-center justify-center rounded-full bg-melodio-light-gray">
				<Icon className="h-8 w-8 text-melodio-text-subdued" />
			</div>
			<h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
			{description && (
				<p className="mt-2 max-w-sm text-sm text-melodio-text-subdued">
					{description}
				</p>
			)}
			{actionLabel && onAction && (
				<Button onClick={onAction} className="mt-6 rounded-full">
					{actionLabel}
				</Button>
			)}
		</div>
	);
}
