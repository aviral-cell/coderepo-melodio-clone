export function getStarState(starIndex: number, displayValue: number): "full" | "half" | "empty" {
	if (displayValue >= starIndex) return "full";
	if (displayValue >= starIndex - 0.5) return "half";
	return "empty";
}

export function formatRatingDisplay(avg: number, total: number): string {
	if (total === 0) return "No ratings yet";
	return `${avg.toFixed(1)} (${total} ${total === 1 ? "rating" : "ratings"})`;
}

export function formatFollowerCount(count: number): string {
	if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
	if (count >= 1_000) return `${(count / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
	return count.toString();
}
