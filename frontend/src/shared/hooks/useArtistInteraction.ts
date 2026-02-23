import { useState, useEffect, useCallback, useMemo } from "react";
import { artistInteractionService } from "@/shared/services/artist-interaction.service";
import { formatRatingDisplay, formatFollowerCount } from "@/shared/utils/ratingUtils";

export function useArtistInteraction(artistId: string) {
	const [isFollowing, setIsFollowing] = useState(false);
	const [userRating, setUserRating] = useState(0);
	const [averageRating, setAverageRating] = useState(0);
	const [totalRatings, setTotalRatings] = useState(0);
	const [followerCount, setFollowerCount] = useState(0);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		async function fetchInteraction() {
			if (!artistId) return;
			setIsLoading(true);
			try {
				const data = await artistInteractionService.getInteraction(artistId);
				if (!cancelled) {
					setIsFollowing(data.isFollowing);
					setUserRating(data.userRating);
					setAverageRating(data.averageRating);
					setTotalRatings(data.totalRatings);
				}
			} catch {
				// Silently fail — interaction data is non-critical
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}

		fetchInteraction();
		return () => {
			cancelled = true;
		};
	}, [artistId]);

	const handleToggleFollow = useCallback(async () => {
		const prevFollowing = isFollowing;
		const prevCount = followerCount;
		setIsFollowing(!prevFollowing);
		setFollowerCount(prevFollowing ? Math.max(0, prevCount - 1) : prevCount + 1);
		try {
			const result = await artistInteractionService.toggleFollow(artistId);
			setIsFollowing(result.isFollowing);
			setFollowerCount(result.followerCount);
		} catch {
			setIsFollowing(prevFollowing);
			setFollowerCount(prevCount);
		}
	}, [artistId, isFollowing, followerCount]);

	const handleRate = useCallback(async (rating: number) => {
		const prevRating = userRating;
		const prevAvg = averageRating;
		const prevTotal = totalRatings;
		setUserRating(rating);
		try {
			const result = await artistInteractionService.rateArtist(artistId, rating);
			setUserRating(result.userRating);
			setAverageRating(result.averageRating);
			setTotalRatings(result.totalRatings);
		} catch {
			setUserRating(prevRating);
			setAverageRating(prevAvg);
			setTotalRatings(prevTotal);
		}
	}, [artistId, userRating, averageRating, totalRatings]);

	const formattedRating = useMemo(
		() => formatRatingDisplay(averageRating, totalRatings),
		[averageRating, totalRatings],
	);

	const formattedFollowers = useMemo(
		() => formatFollowerCount(followerCount),
		[followerCount],
	);

	return {
		isFollowing,
		userRating,
		averageRating,
		totalRatings,
		followerCount,
		isLoading,
		handleToggleFollow,
		handleRate,
		formattedRating,
		formattedFollowers,
	};
}
