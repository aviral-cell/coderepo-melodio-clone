import { useState, useCallback, useMemo } from "react";

import { useLikedTracksContext } from "@/shared/contexts/LikedTracksContext";
import { trackLikeService, type LikedTrackItem } from "@/shared/services/track-like.service";
import { sortLikedTracks, type LikedSortOption } from "@/shared/utils/likedTracksUtils";

export function useLikedTracks() {
	const context = useLikedTracksContext();

	const [tracks, setTracks] = useState<LikedTrackItem[]>([]);
	const [sortBy, setSortBy] = useState<LikedSortOption>("recent");
	const [isLoadingTracks, setIsLoadingTracks] = useState(false);
	const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

	const fetchLikedTracks = useCallback(async (page = 1) => {
		setIsLoadingTracks(true);
		try {
			const data = await trackLikeService.getLikedTracks({ page, limit: 7 });
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

	const goToPage = useCallback(
		async (page: number) => {
			if (page < 1 || page > pagination.totalPages) return;
			try {
				const data = await trackLikeService.getLikedTracks({ page, limit: 7 });
				setTracks(data.items);
				setPagination({
					page: data.page,
					totalPages: data.totalPages,
					total: data.total,
				});
			} catch {
			}
		},
		[pagination.totalPages],
	);

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
		pagination,
		fetchLikedTracks,
		goToPage,
	};
}
