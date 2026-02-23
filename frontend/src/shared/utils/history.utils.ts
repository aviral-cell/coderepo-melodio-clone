import type { TrackWithPopulated } from "@/shared/types/player.types";
import type { RecentlyPlayedTrack } from "@/shared/services/history.service";

export function toTrackWithPopulated(track: RecentlyPlayedTrack): TrackWithPopulated {
	return {
		_id: track.id,
		title: track.title,
		durationInSeconds: track.durationInSeconds,
		coverImageUrl: track.coverImageUrl,
		trackNumber: 0,
		genre: "",
		playCount: 0,
		createdAt: "",
		updatedAt: "",
		artistId: {
			_id: track.artist.id,
			name: track.artist.name,
		},
		albumId: {
			_id: track.album.id,
			title: track.album.title,
			coverImageUrl: track.coverImageUrl,
		},
	};
}
