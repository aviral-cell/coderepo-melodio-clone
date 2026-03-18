import { useState, useEffect, useMemo } from "react";
import { tracksService, albumsService, artistsService } from "@/shared/services";
import type { TrackWithPopulated } from "@/shared/types/player.types";
import type { Artist } from "@/shared/types";
import type { AlbumWithPopulated } from "@/shared/services/albums.service";
import { shuffleArray } from "@/shared/utils/playerUtils";
import {
	getNewThisWeek,
	getPopularInLanguage,
	getPopularInGenre,
	getTracksByEra,
	getTopArtists,
} from "@/shared/utils/discoveryUtils";

interface UseDiscoveryReturn {
	allTracks: TrackWithPopulated[];
	artists: Artist[];
	newThisWeek: TrackWithPopulated[];
	popularByLanguage: TrackWithPopulated[];
	popularByGenre: TrackWithPopulated[];
	tracksByEra: TrackWithPopulated[];
	topArtists: Artist[];
	selectedLanguage: string | null;
	setSelectedLanguage: (lang: string | null) => void;
	selectedGenre: string | null;
	setSelectedGenre: (genre: string | null) => void;
	selectedEra: string | null;
	setSelectedEra: (era: string | null) => void;
	isLoading: boolean;
	error: string | null;
}

export function useDiscovery(): UseDiscoveryReturn {
	const [allTracks, setAllTracks] = useState<TrackWithPopulated[]>([]);
	const [albums, setAlbums] = useState<AlbumWithPopulated[]>([]);
	const [artists, setArtists] = useState<Artist[]>([]);
	const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
	const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
	const [selectedEra, setSelectedEra] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setIsLoading(true);
				setError(null);
				const [tracksRes, albumsRes, artistsRes] = await Promise.all([
					tracksService.getAll({ limit: 100 }),
					albumsService.getAll({ limit: 100 }),
					artistsService.getAll({ limit: 100 }),
				]);
				setAllTracks(tracksRes.items);
				setAlbums(albumsRes.items);
				setArtists(artistsRes.items);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to load discovery data");
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();
	}, []);

	const albumDateMap = useMemo(() => {
		const map: Record<string, string> = {};
		for (const album of albums) {
			map[album._id] = album.releaseDate;
		}
		return map;
	}, [albums]);

	const nonPodcastTracks = useMemo(() => {
		return allTracks.filter((t) => t.genre !== "podcast");
	}, [allTracks]);

	const newThisWeek = useMemo(() => {
		return shuffleArray(getNewThisWeek(nonPodcastTracks));
	}, [nonPodcastTracks]);

	const popularByLanguage = useMemo(() => {
		if (selectedLanguage) {
			return shuffleArray(getPopularInLanguage(nonPodcastTracks, selectedLanguage, 100));
		}
		return shuffleArray([...nonPodcastTracks].sort((a, b) => b.playCount - a.playCount));
	}, [nonPodcastTracks, selectedLanguage]);

	const popularByGenre = useMemo(() => {
		if (selectedGenre) {
			return shuffleArray(getPopularInGenre(nonPodcastTracks, selectedGenre, 100));
		}
		return shuffleArray([...nonPodcastTracks].sort((a, b) => b.playCount - a.playCount));
	}, [nonPodcastTracks, selectedGenre]);

	const tracksByEra = useMemo(() => {
		if (selectedEra) {
			return shuffleArray(getTracksByEra(nonPodcastTracks, selectedEra, albumDateMap));
		}
		return shuffleArray([...nonPodcastTracks].sort((a, b) => b.playCount - a.playCount));
	}, [nonPodcastTracks, selectedEra, albumDateMap]);

	const topArtists = useMemo(() => {
		return getTopArtists(artists, 10);
	}, [artists]);

	return {
		allTracks,
		artists,
		newThisWeek,
		popularByLanguage,
		popularByGenre,
		tracksByEra,
		topArtists,
		selectedLanguage,
		setSelectedLanguage,
		selectedGenre,
		setSelectedGenre,
		selectedEra,
		setSelectedEra,
		isLoading,
		error,
	};
}
