import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/shared/contexts/AuthContext";
import { tracksService, albumsService, artistsService } from "@/shared/services";
import type { AlbumWithPopulated } from "@/shared/services/albums.service";
import type { TrackWithPopulated } from "@/shared/types/player.types";
import type { Artist } from "@/shared/types";
import {
	type Concert,
	type ConcertTicket,
	type ArtistWithNextConcert,
	type TicketDisplayItem,
	getUpcomingConcerts,
	sortConcertsByDate,
	filterByMonth,
	getArtistsInCity,
	formatConcertDate,
	formatConcertTime,
	calculateUserTicketCount,
	canBuyMoreTickets,
	getArtistAlbumsForConcert,
	getArtistTracksForConcert,
} from "@/shared/utils/concertUtils";

// ===== useConcertListing =====

interface UseConcertListingReturn {
	concerts: Concert[];
	artists: Artist[];
	sortedConcerts: Concert[];
	filteredConcerts: Concert[];
	artistsInCity: ArtistWithNextConcert[];
	formattedDates: Map<string, string>;
	formattedTimes: Map<string, string>;
	selectedMonth: number;
	selectedCity: string | null;
	isLoading: boolean;
	error: string | null;
	handleMonthChange: (month: number) => void;
	handleCityChange: (city: string | null) => void;
}

export function useConcertListing(): UseConcertListingReturn {
	const [concerts, setConcerts] = useState<Concert[]>([]);
	const [artists, setArtists] = useState<Artist[]>([]);
	const [selectedMonth, setSelectedMonth] = useState<number>(0);
	const [selectedCity, setSelectedCity] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setIsLoading(true);
				setError(null);
				const [concertsRes, artistsRes] = await Promise.all([
					fetch("/api/concerts", {
						headers: {
							Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
						},
					}).then((r) => r.json()),
					artistsService.getAll({ limit: 100 }),
				]);
				setConcerts(concertsRes.data || []);
				setArtists(artistsRes.items);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to load concerts",
				);
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();
	}, []);

	const upcomingConcerts = useMemo(
		() => getUpcomingConcerts(concerts),
		[concerts],
	);

	const sortedConcerts = useMemo(
		() => sortConcertsByDate(upcomingConcerts, "desc"),
		[upcomingConcerts],
	);

	const filteredConcerts = useMemo(
		() => filterByMonth(sortedConcerts, selectedMonth),
		[sortedConcerts, selectedMonth],
	);

	const artistsInCity = useMemo(() => {
		if (selectedCity) {
			return getArtistsInCity(concerts, artists, selectedCity);
		}
		const artistMap = new Map<string, { date: string; concertId: string }>();
		for (const concert of concerts) {
			const artistId =
				typeof concert.artistId === "object"
					? concert.artistId._id
					: concert.artistId;
			const existing = artistMap.get(artistId);
			if (!existing || new Date(concert.date) < new Date(existing.date)) {
				artistMap.set(artistId, { date: concert.date, concertId: concert._id });
			}
		}
		const result: ArtistWithNextConcert[] = [];
		for (const [artistId, { date, concertId }] of artistMap) {
			const artist = artists.find((a) => a._id === artistId);
			if (artist) {
				result.push({ artist, nextConcertDate: date, nextConcertId: concertId });
			}
		}
		return result;
	}, [concerts, artists, selectedCity]);

	const formattedDates = useMemo(() => {
		const dateMap = new Map<string, string>();
		for (const concert of concerts) {
			dateMap.set(concert._id, formatConcertDate(concert.date));
		}
		return dateMap;
	}, [concerts]);

	const formattedTimes = useMemo(() => {
		const timeMap = new Map<string, string>();
		for (const concert of concerts) {
			timeMap.set(concert._id, formatConcertTime(concert.time));
		}
		return timeMap;
	}, [concerts]);

	const handleMonthChange = useCallback((month: number) => {
		setSelectedMonth(month);
	}, []);

	const handleCityChange = useCallback((city: string | null) => {
		setSelectedCity(city);
	}, []);

	return {
		concerts,
		artists,
		sortedConcerts,
		filteredConcerts,
		artistsInCity,
		formattedDates,
		formattedTimes,
		selectedMonth,
		selectedCity,
		isLoading,
		error,
		handleMonthChange,
		handleCityChange,
	};
}

// ===== useConcertDetail =====

interface UseConcertDetailReturn {
	concert: Concert | null;
	userTicketCount: number;
	ticketQuantity: number;
	showBuyDialog: boolean;
	showTicketsDialog: boolean;
	userTickets: ConcertTicket[];
	concertAlbums: AlbumWithPopulated[];
	concertTracks: TrackWithPopulated[];
	ticketDisplayData: TicketDisplayItem[];
	isLoading: boolean;
	error: string | null;
	handleBuyTickets: () => Promise<void>;
	handleOpenBuyDialog: () => void;
	handleCloseBuyDialog: () => void;
	handleOpenTicketsDialog: () => void;
	handleCloseTicketsDialog: () => void;
	handleQuantityChange: (qty: number) => void;
}

export function useConcertDetail(concertId: string): UseConcertDetailReturn {
	const { user } = useAuth();
	const userId = user?._id || "";

	const [concert, setConcert] = useState<Concert | null>(null);
	const [albums, setAlbums] = useState<AlbumWithPopulated[]>([]);
	const [tracks, setTracks] = useState<TrackWithPopulated[]>([]);
	const [userTickets, setUserTickets] = useState<ConcertTicket[]>([]);
	const [ticketQuantity, setTicketQuantity] = useState(1);
	const [showBuyDialog, setShowBuyDialog] = useState(false);
	const [showTicketsDialog, setShowTicketsDialog] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setIsLoading(true);
				setError(null);
				const token = localStorage.getItem("accessToken");
				const headers = { Authorization: `Bearer ${token}` };

				const [concertRes, albumsRes, tracksRes, ticketsRes] =
					await Promise.all([
						fetch(`/api/concerts/${concertId}`, { headers }).then((r) =>
							r.json(),
						),
						albumsService.getAll({ limit: 100 }),
						tracksService.getAll({ limit: 100 }),
						fetch(`/api/concerts/${concertId}/tickets`, { headers }).then(
							(r) => r.json(),
						),
					]);

				setConcert(concertRes.data || null);
				setAlbums(albumsRes.items);
				setTracks(tracksRes.items);
				setUserTickets(ticketsRes.data || []);
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Failed to load concert details",
				);
			} finally {
				setIsLoading(false);
			}
		};
		if (concertId) fetchData();
	}, [concertId]);

	const userTicketCount = useMemo(() => {
		if (!concert) return 0;
		return calculateUserTicketCount(concert, userId);
	}, [concert, userId]);

	const handleBuyTickets = useCallback(async () => {
		if (!concert) return;
		if (!canBuyMoreTickets(userTicketCount, concert.maxTicketsPerUser)) return;
		try {
			const token = localStorage.getItem("accessToken");
			const res = await fetch(`/api/concerts/${concert._id}/tickets`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ quantity: ticketQuantity }),
			});
			const data = await res.json();
			if (data.success) {
				setConcert(data.data.concert || data.data);
				setUserTickets(data.data.userTickets || []);
				setShowBuyDialog(false);
				setTicketQuantity(1);
			}
		} catch (_err) {
			// silently handle
		}
	}, [concert, userTicketCount, ticketQuantity]);

	const concertAlbums = useMemo(() => {
		if (!concert) return [];
		const artistId =
			typeof concert.artistId === "object"
				? concert.artistId._id
				: concert.artistId;
		return getArtistAlbumsForConcert(albums, artistId);
	}, [albums, concert]);

	const concertTracks = useMemo(() => {
		if (!concert) return [];
		const artistId =
			typeof concert.artistId === "object"
				? concert.artistId._id
				: concert.artistId;
		return getArtistTracksForConcert(tracks, artistId);
	}, [tracks, concert]);

	const ticketDisplayData = useMemo(() => {
		if (!concert || !userTickets.length) return [];
		const artistName =
			typeof concert.artistId === "object"
				? concert.artistId.name
				: "Unknown Artist";
		return userTickets.flatMap((ticket) =>
			ticket.ticketCodes.map((code) => ({
				ticketCode: code,
				concertName: `${artistName} at ${concert.venue}`,
				artistName,
				venue: concert.venue,
				date: formatConcertDate(concert.date),
			})),
		);
	}, [concert, userTickets]);

	const handleOpenBuyDialog = useCallback(() => {
		setShowBuyDialog(true);
		setTicketQuantity(1);
	}, []);

	const handleCloseBuyDialog = useCallback(() => {
		setShowBuyDialog(false);
	}, []);

	const handleOpenTicketsDialog = useCallback(() => {
		setShowTicketsDialog(true);
	}, []);

	const handleCloseTicketsDialog = useCallback(() => {
		setShowTicketsDialog(false);
	}, []);

	const handleQuantityChange = useCallback((qty: number) => {
		setTicketQuantity(qty);
	}, []);

	return {
		concert,
		userTicketCount,
		ticketQuantity,
		showBuyDialog,
		showTicketsDialog,
		userTickets,
		concertAlbums,
		concertTracks,
		ticketDisplayData,
		isLoading,
		error,
		handleBuyTickets,
		handleOpenBuyDialog,
		handleCloseBuyDialog,
		handleOpenTicketsDialog,
		handleCloseTicketsDialog,
		handleQuantityChange,
	};
}
