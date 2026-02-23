import { useState } from "react";
import type { JSX } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStarState } from "@/shared/utils/ratingUtils";

interface HalfStarRatingProps {
	value?: number;
	onChange?: (value: number) => void;
	disabled?: boolean;
	size?: "sm" | "md" | "lg";
	className?: string;
}

const SIZE_MAP: Record<string, string> = {
	sm: "w-4 h-4",
	md: "w-6 h-6",
	lg: "w-8 h-8",
};

const SIZE_PX: Record<string, number> = {
	sm: 16,
	md: 24,
	lg: 32,
};

export function HalfStarRating({
	value = 0,
	onChange,
	disabled = false,
	size = "md",
	className,
}: HalfStarRatingProps): JSX.Element {
	const [hoverValue, setHoverValue] = useState<number | null>(null);

	const displayValue = hoverValue ?? value;
	const isInteractive = !disabled && !!onChange;
	const sizeClass = SIZE_MAP[size];

	function handleMouseEnterHalf(starIndex: number): void {
		if (!isInteractive) return;
		setHoverValue(starIndex - 0.5);
	}

	function handleMouseEnterFull(starIndex: number): void {
		if (!isInteractive) return;
		setHoverValue(starIndex);
	}

	function handleMouseLeave(): void {
		if (!isInteractive) return;
		setHoverValue(null);
	}

	function handleClickHalf(starIndex: number): void {
		if (!isInteractive) return;
		onChange!(starIndex - 0.5);
	}

	function handleClickFull(starIndex: number): void {
		if (!isInteractive) return;
		onChange!(starIndex);
	}

	function renderStar(starIndex: number): JSX.Element {
		const state = getStarState(starIndex, displayValue);

		return (
			<span
				key={starIndex}
				className={cn("relative inline-flex", isInteractive && "cursor-pointer")}
				style={{ width: SIZE_PX[size], height: SIZE_PX[size] }}
			>
				<Star className={cn(sizeClass, "absolute inset-0 text-gray-500")} />
				{(state === "full" || state === "half") && (
					<span
						className="absolute inset-0 overflow-hidden"
						style={{ width: state === "half" ? "50%" : "100%" }}
					>
						<Star className={cn(sizeClass, "fill-yellow-400 text-yellow-400")} />
					</span>
				)}

				<span className="absolute inset-0 flex">
					<span
						className="h-full w-1/2"
						onMouseEnter={() => handleMouseEnterHalf(starIndex)}
						onClick={() => handleClickHalf(starIndex)}
						role="button"
						tabIndex={isInteractive ? 0 : -1}
						aria-label={`Rate ${starIndex - 0.5} stars`}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								handleClickHalf(starIndex);
							}
						}}
					/>
					<span
						className="h-full w-1/2"
						onMouseEnter={() => handleMouseEnterFull(starIndex)}
						onClick={() => handleClickFull(starIndex)}
						role="button"
						tabIndex={isInteractive ? 0 : -1}
						aria-label={`Rate ${starIndex} stars`}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								handleClickFull(starIndex);
							}
						}}
					/>
				</span>
			</span>
		);
	}

	return (
		<div
			data-testid="rating-input"
			className={cn("inline-flex items-center gap-0.5", className)}
			onMouseLeave={handleMouseLeave}
			role="group"
			aria-label={`Rating: ${value} out of 5 stars`}
		>
			{[1, 2, 3, 4, 5].map(renderStar)}
		</div>
	);
}
