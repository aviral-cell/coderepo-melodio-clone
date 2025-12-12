export { apiService } from "./api.service";
export {
	authService,
	type LoginInput,
	type RegisterInput,
	type AuthResponse,
} from "./auth.service";
export { searchService, type SearchResult } from "./search.service";
export {
	playlistsService,
	playlistService,
	type CreatePlaylistInput,
	type UpdatePlaylistInput,
} from "./playlist.service";
export {
	tracksService,
	type TrackQueryParams,
} from "./tracks.service";
export {
	albumsService,
	albumService,
	type AlbumWithPopulated,
	type AlbumQueryParams,
} from "./albums.service";
export {
	artistsService,
	artistService,
	type ArtistWithAlbums,
	type ArtistQueryParams,
} from "./artists.service";
