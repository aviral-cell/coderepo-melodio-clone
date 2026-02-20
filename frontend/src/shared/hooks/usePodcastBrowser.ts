import { useState, useEffect, useMemo, useCallback } from "react";
import { tracksService } from "@/shared/services";
import { albumsService } from "@/shared/services";
import { getImageUrl, preloadImages } from "@/shared/utils";
import type { TrackWithPopulated } from "@/shared/types/player.types";
import type { AlbumWithPopulated } from "@/shared/services/albums.service";
import { usePlayer } from "@/shared/contexts/PlayerContext";
import {
	type PodcastShow,
	groupEpisodesByShow,
	sortShowsByRecency,
	getTopShows,
	sortEpisodesByOrder,
	formatShowDuration,
	formatEpisodeDate,
	getUpNextEpisodes,
	preparePlaybackQueue,
	getEpisodePlaybackIndex,
	formatPlayCount,
	getEpisodeDescription,
} from "@/shared/utils/podcastUtils";

type EpisodeSortOrder = "default" | "latest" | "oldest";

interface UsePodcastBrowserReturn {
	shows: PodcastShow[];
	topShows: PodcastShow[];
	isLoading: boolean;
	error: string | null;
	selectedShow: PodcastShow | null;
	handleSelectShow: (show: PodcastShow) => void;
	handleBackToShows: () => void;
	showEpisodes: TrackWithPopulated[];
	formattedDuration: string;
	formattedEpisodeDates: Map<string, string>;
	formattedPlayCount: string;
	episodeSortOrder: EpisodeSortOrder;
	handleSortChange: (sort: EpisodeSortOrder) => void;
	selectedEpisode: TrackWithPopulated | null;
	handleSelectEpisode: (episode: TrackWithPopulated) => void;
	handleBackToShow: () => void;
	upNextEpisodes: TrackWithPopulated[];
	episodeDescription: string;
	handlePlayAll: () => void;
	handlePlayEpisode: (episode: TrackWithPopulated) => void;
	currentlyPlayingId: string | null;
	isPlaying: boolean;
	handlePauseEpisode: () => void;
}

export function usePodcastBrowser(): UsePodcastBrowserReturn {
	const { state, playTracks, togglePlayPause } = usePlayer();
	const [allTracks, setAllTracks] = useState<TrackWithPopulated[]>([]);
	const [albums, setAlbums] = useState<AlbumWithPopulated[]>([]);
	const [selectedShow, setSelectedShow] = useState<PodcastShow | null>(null);
	const [selectedEpisode, setSelectedEpisode] = useState<TrackWithPopulated | null>(null);
	const [episodeSortOrder, setEpisodeSortOrder] = useState<EpisodeSortOrder>("default");
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setIsLoading(true);
				const [tracksResponse, albumsResponse] = await Promise.all([
					tracksService.getAll({ limit: 100 }),
					albumsService.getAll({ limit: 50 }),
				]);
				const podcastTracks = tracksResponse.items.filter(
					(track: TrackWithPopulated) => track.genre === "podcast",
				);
				setAllTracks(podcastTracks);
				const normalizedAlbums = albumsResponse.items.map((album: any) => ({
					...album,
					artistId: album.artistId || album.artist,
				}));
				preloadImages(normalizedAlbums.map((a: any) => getImageUrl(a.coverImageUrl)));
				setAlbums(normalizedAlbums);
			} catch (err) {
				setError("Failed to load podcasts");
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();
	}, []);

	const shows = useMemo(() => {
		if (allTracks.length === 0 || albums.length === 0) return [];
		const grouped = groupEpisodesByShow(allTracks, albums);
		return sortShowsByRecency(grouped);
	}, [allTracks, albums]);

	const topShows = useMemo(() => getTopShows(shows, 5), [shows]);

	const showEpisodes = useMemo(() => {
		if (!selectedShow) return [];
		return sortEpisodesByOrder(selectedShow.episodes, episodeSortOrder);
	}, [selectedShow, episodeSortOrder]);

	const formattedDuration = useMemo(() => {
		if (!selectedShow) return "";
		return formatShowDuration(selectedShow.episodes);
	}, [selectedShow]);

	const formattedEpisodeDates = useMemo(() => {
		const dateMap = new Map<string, string>();
		if (!selectedShow) return dateMap;
		selectedShow.episodes.forEach((ep) => {
			dateMap.set(ep._id, formatEpisodeDate(ep.createdAt));
		});
		return dateMap;
	}, [selectedShow]);

	const upNextEpisodes = useMemo(() => {
		if (!selectedShow || !selectedEpisode) return [];
		return getUpNextEpisodes(selectedShow.episodes, selectedEpisode._id);
	}, [selectedShow, selectedEpisode]);

	const handlePlayAll = useCallback(() => {
		if (!selectedShow) return;
		const queue = preparePlaybackQueue(selectedShow.episodes);
		playTracks(queue, 0);
	}, [selectedShow, playTracks]);

	const handlePlayEpisode = useCallback(
		(episode: TrackWithPopulated) => {
			if (!selectedShow) return;
			const queue = preparePlaybackQueue(selectedShow.episodes);
			const index = getEpisodePlaybackIndex(selectedShow.episodes, episode._id);
			playTracks(queue, index);
		},
		[selectedShow, playTracks],
	);

	const formattedPlayCount = useMemo(() => {
		if (!selectedShow) return "";
		return formatPlayCount(selectedShow.totalPlays);
	}, [selectedShow]);

	const episodeDescription = useMemo(() => {
		if (!selectedEpisode || !selectedShow) return "";
		return getEpisodeDescription(selectedEpisode, selectedShow);
	}, [selectedEpisode, selectedShow]);

	const handleSelectShow = useCallback((show: PodcastShow) => {
		setSelectedShow(show);
		setSelectedEpisode(null);
		setEpisodeSortOrder("default");
	}, []);

	const handleBackToShows = useCallback(() => {
		setSelectedShow(null);
		setSelectedEpisode(null);
		setEpisodeSortOrder("default");
	}, []);

	const handleSelectEpisode = useCallback((episode: TrackWithPopulated) => {
		setSelectedEpisode(episode);
	}, []);

	const handleBackToShow = useCallback(() => {
		setSelectedEpisode(null);
	}, []);

	const handleSortChange = useCallback((sort: EpisodeSortOrder) => {
		setEpisodeSortOrder(sort);
	}, []);

	const currentlyPlayingId = state.currentTrack?._id || null;

	return {
		shows, topShows, isLoading, error,
		selectedShow, handleSelectShow, handleBackToShows,
		showEpisodes, formattedDuration, formattedEpisodeDates, formattedPlayCount,
		episodeSortOrder, handleSortChange,
		selectedEpisode, handleSelectEpisode, handleBackToShow,
		upNextEpisodes, episodeDescription,
		handlePlayAll, handlePlayEpisode, currentlyPlayingId,
		isPlaying: state.isPlaying,
		handlePauseEpisode: togglePlayPause,
	};
}
