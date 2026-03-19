import type { LikedTrackItem } from "@/shared/services/track-like.service";

export type LikedSortOption = "recent" | "title" | "artist" | "duration";

export function sortLikedTracks(tracks: LikedTrackItem[], sortBy: LikedSortOption): LikedTrackItem[] {
	const sorted = [...tracks];

	switch (sortBy) {
		case "recent":
			sorted.sort((a, b) => new Date(b.likedAt || 0).getTime() - new Date(a.likedAt || 0).getTime());
			break;
		case "title":
			sorted.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
			break;
		case "artist":
			sorted.sort((a, b) => {
				const artistA = typeof a.artistId === "object" ? (a.artistId?.name ?? "") : "";
				const artistB = typeof b.artistId === "object" ? (b.artistId?.name ?? "") : "";
				return artistA.localeCompare(artistB);
			});
			break;
		case "duration":
			sorted.sort((a, b) => (a.durationInSeconds ?? 0) - (b.durationInSeconds ?? 0));
			break;
	}

	return sorted;
}
