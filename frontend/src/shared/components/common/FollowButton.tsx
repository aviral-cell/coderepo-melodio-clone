import { useState } from "react";
import type { JSX } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
	isFollowing: boolean;
	onToggle: () => void;
	isLoading?: boolean;
	className?: string;
}

export function FollowButton({
	isFollowing,
	onToggle,
	isLoading = false,
	className,
}: FollowButtonProps): JSX.Element {
	const [isHovered, setIsHovered] = useState(false);

	const showUnfollow = isFollowing && isHovered;

	function getLabel(): string {
		if (isLoading) return "";
		if (showUnfollow) return "Unfollow";
		if (isFollowing) return "Following";
		return "Follow";
	}

	return (
		<button
			data-testid="follow-button"
			type="button"
			disabled={isLoading}
			onClick={onToggle}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			className={cn(
				"rounded-full px-6 py-2 text-sm font-semibold transition-all",
				isFollowing
					? cn(
						"bg-melodio-green text-black",
						!isLoading && "hover:bg-red-500 hover:text-white",
					)
					: "border border-white/30 text-white hover:border-white hover:bg-white/10",
				isLoading && "cursor-not-allowed opacity-70",
				className,
			)}
			aria-label={isFollowing ? "Unfollow artist" : "Follow artist"}
		>
			{isLoading ? (
				<Loader2 className="h-4 w-4 animate-spin" />
			) : (
				getLabel()
			)}
		</button>
	);
}
