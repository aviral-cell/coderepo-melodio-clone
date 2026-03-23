import mongoose from "mongoose";
import { PopulatedArtist, PopulatedAlbum } from "./tracks.service.js";

export interface LikeActionResult {
	status: "like" | "dislike" | null;
	trackId: string;
}

export interface LikeStatusResult {
	status: "like" | "dislike" | null;
}

export interface LikedTrackResponse {
	_id: string;
	title: string;
	durationInSeconds: number;
	trackNumber: number;
	genre: string;
	playCount: number;
	coverImageUrl?: string;
	description: string;
	createdAt: Date;
	updatedAt: Date;
	artistId: {
		_id: string;
		name: string;
		imageUrl?: string;
	};
	albumId: {
		_id: string;
		title: string;
		coverImageUrl?: string;
	};
	likedAt: Date;
}

export interface PopulatedTrackLike {
	_id: mongoose.Types.ObjectId;
	user_id: mongoose.Types.ObjectId;
	track_id: {
		_id: mongoose.Types.ObjectId;
		title: string;
		duration_in_seconds: number;
		track_number: number;
		genre: string;
		play_count: number;
		cover_image_url?: string;
		description: string;
		created_at: Date;
		updated_at: Date;
		artist_id: PopulatedArtist | null;
		album_id: PopulatedAlbum | null;
	} | null;
	type: "like" | "dislike";
	created_at: Date;
	updated_at: Date;
}
