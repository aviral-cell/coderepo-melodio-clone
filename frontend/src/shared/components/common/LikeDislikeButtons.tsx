import { ThumbsUp, ThumbsDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { useLikedTracksContext } from "@/shared/contexts/LikedTracksContext";

interface LikeDislikeButtonsProps {
	trackId: string;
	size?: "sm" | "md";
}

export function LikeDislikeButtons({ trackId, size = "sm" }: LikeDislikeButtonsProps) {
	const { isLiked, isDisliked, toggleLike, toggleDislike } = useLikedTracksContext();

	const liked = isLiked(trackId);
	const disliked = isDisliked(trackId);

	const iconSize = size === "md" ? "h-5 w-5" : "h-4 w-4";
	const buttonSize = size === "md" ? "h-10 w-10" : "h-8 w-8";

	return (
		<div className="flex items-center gap-1">
			<Button
				variant="ghost"
				size="icon"
				className={cn(
					buttonSize,
					"rounded-full",
					liked
						? "text-melodio-green hover:text-melodio-green"
						: "text-melodio-text-subdued hover:text-white",
				)}
				onClick={(e) => {
					e.stopPropagation();
					toggleLike(trackId);
				}}
				aria-label={liked ? "Remove like" : "Like track"}
				data-testid="like-button"
			>
				<ThumbsUp
					className={iconSize}
					fill={liked ? "currentColor" : "none"}
				/>
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className={cn(
					buttonSize,
					"rounded-full",
					disliked
						? "text-red-500 hover:text-red-500"
						: "text-melodio-text-subdued hover:text-white",
				)}
				onClick={(e) => {
					e.stopPropagation();
					toggleDislike(trackId);
				}}
				aria-label={disliked ? "Remove dislike" : "Dislike track"}
				data-testid="dislike-button"
			>
				<ThumbsDown
					className={iconSize}
					fill={disliked ? "currentColor" : "none"}
				/>
			</Button>
		</div>
	);
}
