import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useToast } from "@/shared/hooks/useToast";
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
	formatConcertDate,
	canBuyMoreTickets,
	getArtistAlbumsForConcert,
	getArtistTracksForConcert,
} from "@/shared/utils/concertUtils";

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
		() => sortConcertsByDate(upcomingConcerts, "asc"),
		[upcomingConcerts],
	);

	const filteredConcerts = useMemo(
		() => filterByMonth(sortedConcerts, selectedMonth),
		[sortedConcerts, selectedMonth],
	);

	const artistsInCity = useMemo(() => {
		return [];
	}, [concerts, artists, selectedCity]);

	const formattedDates = useMemo(() => {
		return new Map<string, string>();
	}, [concerts]);

	const formattedTimes = useMemo(() => {
		return new Map<string, string>();
	}, [concerts]);

	const handleMonthChange = useCallback((month: number) => {
		setSelectedMonth(0);
	}, []);

	const handleCityChange = useCallback((city: string | null) => {
		setSelectedCity(null);
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
	const { addToast } = useToast();
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
		return 0;
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
				body: JSON.stringify({ quantity: 1 }),
			});
			const data = await res.json();
			if (data.success) {
				setConcert(data.data.concert || data.data);
				setUserTickets(data.data.userTickets || []);
				setShowBuyDialog(false);
				setTicketQuantity(1);
				addToast({ type: "success", message: "Tickets purchased successfully!" });
			}
		} catch (_err) {
			addToast({ type: "error", message: "Failed to purchase tickets" });
		}
	}, [concert, userTicketCount, ticketQuantity, addToast]);

	const concertAlbums = useMemo(() => {
		if (!concert) return [];
		const artistId =
			typeof concert.artistId === "object"
				? concert.artistId.name
				: concert.artistId;
		return getArtistAlbumsForConcert(albums, artistId);
	}, [albums, concert]);

	const concertTracks = useMemo(() => {
		if (!concert) return [];
		const artistId =
			typeof concert.artistId === "object"
				? concert.artistId.name
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
				ticketCode: ticket.purchasedAt,
				concertName: `${artistName} at ${concert.venue}`,
				artistName,
				venue: concert.venue,
				date: formatConcertDate(concert.date),
			})),
		);
	}, [concert, userTickets]);

	const handleOpenBuyDialog = useCallback(() => {
		setShowBuyDialog(false);
		setTicketQuantity(1);
	}, []);

	const handleCloseBuyDialog = useCallback(() => {
		setShowBuyDialog(false);
	}, []);

	const handleOpenTicketsDialog = useCallback(() => {
		setShowTicketsDialog(false);
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
