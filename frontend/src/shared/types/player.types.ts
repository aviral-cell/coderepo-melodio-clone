import type { Artist, Album, Track } from "./index";

export interface TrackWithPopulated extends Omit<Track, "artistId" | "albumId" | "artist" | "album"> {
	artistId: Pick<Artist, "_id" | "name" | "imageUrl">;
	albumId: Pick<Album, "_id" | "title" | "coverImageUrl">;
}

export type RepeatMode = "off" | "all" | "one";

export interface PlayerState {
	currentTrack: TrackWithPopulated | null;
	queue: TrackWithPopulated[];
	originalQueue: TrackWithPopulated[];
	queueIndex: number;
	isPlaying: boolean;
	elapsedSeconds: number;
	shuffleEnabled: boolean;
	repeatMode: RepeatMode;
	volume: number;
	isQueueOpen: boolean;
}

export type PlayerAction =
	| { type: "PLAY_TRACK"; payload: TrackWithPopulated }
	| { type: "PLAY_TRACKS"; payload: { tracks: TrackWithPopulated[]; startIndex: number } }
	| { type: "PAUSE" }
	| { type: "RESUME" }
	| { type: "NEXT" }
	| { type: "PREVIOUS" }
	| { type: "SEEK"; payload: number }
	| { type: "ADD_TO_QUEUE"; payload: TrackWithPopulated }
	| { type: "REMOVE_FROM_QUEUE"; payload: number }
	| { type: "REORDER_QUEUE"; payload: { from: number; to: number } }
	| { type: "CLEAR_QUEUE" }
	| { type: "TOGGLE_SHUFFLE"; payload?: { shuffledQueue: TrackWithPopulated[] } }
	| { type: "TOGGLE_REPEAT" }
	| { type: "SET_VOLUME"; payload: number }
	| { type: "TICK" }
	| { type: "TOGGLE_QUEUE" };
