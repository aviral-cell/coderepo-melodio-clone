import { useState, useCallback, useMemo } from "react";

import { useLikedTracksContext } from "@/shared/contexts/LikedTracksContext";
import { trackLikeService, type LikedTrackItem } from "@/shared/services/track-like.service";
import { sortLikedTracks, type LikedSortOption } from "@/shared/utils/likedTracksUtils";

export function useLikedTracks() {
	const context = useLikedTracksContext();

	const [tracks, setTracks] = useState<LikedTrackItem[]>([]);
	const [sortBy, setSortBy] = useState<LikedSortOption>("recent");
	const [isLoadingTracks, setIsLoadingTracks] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

	const fetchLikedTracks = useCallback(async (page = 1) => {
		setIsLoadingTracks(true);
		try {
			const data = await trackLikeService.getLikedTracks({ page, limit: 20 });
			setTracks(data.items);
			setPagination({
				page: data.page,
				totalPages: data.totalPages,
				total: data.total,
			});
		} catch {
			setTracks([]);
		} finally {
			setIsLoadingTracks(false);
		}
	}, []);

	const loadMore = useCallback(async () => {
		if (pagination.page >= pagination.totalPages) return;
		setIsLoadingMore(true);
		try {
			const nextPage = pagination.page + 1;
			const data = await trackLikeService.getLikedTracks({ page: nextPage, limit: 20 });
			setTracks((prev) => [...prev, ...data.items]);
			setPagination({
				page: data.page,
				totalPages: data.totalPages,
				total: data.total,
			});
		} catch {
			// silently fail on load more
		} finally {
			setIsLoadingMore(false);
		}
	}, [pagination.page, pagination.totalPages]);

	const sortedTracks = useMemo(() => sortLikedTracks(tracks, sortBy), [tracks, sortBy]);

	const handleSortChange = useCallback((newSort: LikedSortOption) => {
		setSortBy(newSort);
	}, []);

	return {
		...context,
		tracks: sortedTracks,
		sortBy,
		handleSortChange,
		isLoadingTracks,
		isLoadingMore,
		pagination,
		fetchLikedTracks,
		loadMore,
	};
}
