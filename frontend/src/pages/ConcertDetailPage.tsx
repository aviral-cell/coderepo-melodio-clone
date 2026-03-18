import { useRef, type JSX } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, Minus, Ticket } from "lucide-react";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogDescription,
} from "@/shared/components/ui/dialog";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselPrevious,
	CarouselNext,
} from "@/shared/components/ui/carousel";
import { AppImage } from "@/shared/components/common/AppImage";
import { AlbumCard } from "@/shared/components/common/AlbumCard";
import { TrackCard } from "@/shared/components/common/TrackCard";
import { getImageUrl } from "@/shared/utils";
import { useConcertDetail } from "@/shared/hooks/useConcerts";
import { formatConcertDate, formatConcertTime } from "@/shared/utils/concertUtils";
import type { TrackWithPopulated } from "@/shared/types/player.types";

interface TrackCarouselProps {
	tracks: TrackWithPopulated[];
	testIdPrefix: string;
}

function TrackCarousel({ tracks, testIdPrefix }: TrackCarouselProps): JSX.Element {
	const scrollRef = useRef<HTMLDivElement>(null);

	const scroll = (direction: "left" | "right") => {
		if (scrollRef.current) {
			const scrollAmount = scrollRef.current.clientWidth * 0.8;
			scrollRef.current.scrollBy({
				left: direction === "left" ? -scrollAmount : scrollAmount,
				behavior: "smooth",
			});
		}
	};

	const pairs: TrackWithPopulated[][] = [];
	for (let i = 0; i < tracks.length; i += 2) {
		pairs.push(tracks.slice(i, i + 2));
	}

	return (
		<div className="relative">
			<div className="absolute -top-10 right-0 flex gap-1">
				<button
					type="button"
					aria-label="Scroll tracks left"
					onClick={() => scroll("left")}
					className="rounded-full p-1.5 text-melodio-text-subdued transition-colors hover:bg-melodio-dark-gray hover:text-white"
				>
					<ChevronLeft className="h-5 w-5" />
				</button>
				<button
					type="button"
					aria-label="Scroll tracks right"
					onClick={() => scroll("right")}
					className="rounded-full p-1.5 text-melodio-text-subdued transition-colors hover:bg-melodio-dark-gray hover:text-white"
				>
					<ChevronRight className="h-5 w-5" />
				</button>
			</div>

			<div
				ref={scrollRef}
				className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
				style={{ scrollSnapType: "x mandatory" }}
			>
				{pairs.map((pair, colIdx) => (
					<div
						key={colIdx}
						className="shrink-0 w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] md:w-[calc(25%-12px)] lg:w-[calc(14.285%-12px)] flex flex-col gap-4"
						style={{ scrollSnapAlign: "start" }}
					>
						{pair.map((track) => (
							<div key={track._id} data-testid={`${testIdPrefix}-${track._id}`}>
								<TrackCard track={track} />
							</div>
						))}
					</div>
				))}
			</div>
		</div>
	);
}

export default function ConcertDetailPage(): JSX.Element {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const concertId = id || "";

	const {
		concert,
		userTicketCount,
		ticketQuantity,
		showBuyDialog,
		showTicketsDialog,
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
	} = useConcertDetail(concertId);

	const albumsScrollRef = useRef<HTMLDivElement>(null);

	const scrollAlbums = (direction: "left" | "right") => {
		if (albumsScrollRef.current) {
			const scrollAmount = albumsScrollRef.current.clientWidth * 0.8;
			albumsScrollRef.current.scrollBy({
				left: direction === "left" ? -scrollAmount : scrollAmount,
				behavior: "smooth",
			});
		}
	};

	if (isLoading) {
		return (
			<div className="p-6" data-testid="concert-detail-page">
				<div data-testid="concert-detail-loading" className="space-y-6">
					<Skeleton className="h-8 w-32 rounded" />
					<Skeleton className="h-64 w-full rounded-lg" />
					<div className="space-y-2">
						<Skeleton className="h-6 w-48 rounded" />
						<Skeleton className="h-4 w-32 rounded" />
						<Skeleton className="h-4 w-24 rounded" />
					</div>
				</div>
			</div>
		);
	}

	if (error || !concert) {
		return (
			<div className="p-6" data-testid="concert-detail-page">
				<div
					data-testid="concert-detail-error"
					className="py-12 text-center text-red-400"
				>
					<p>{error || "Concert not found"}</p>
				</div>
			</div>
		);
	}

	const artistName =
		typeof concert.artistId === "object" ? concert.artistId.name : "Unknown Artist";
	const artistImage =
		typeof concert.artistId === "object" ? concert.artistId.imageUrl : undefined;
	const formattedDate = formatConcertDate(concert.date);
	const formattedTime = formatConcertTime(concert.time);
	const maxTickets = concert.maxTicketsPerUser;
	const availableTickets = maxTickets - userTicketCount;

	const [month, day] = formattedDate.split(" ");

	return (
		<div className="p-6" data-testid="concert-detail-page">
			<Button
				variant="ghost"
				className="mb-4 rounded-full text-melodio-text-subdued hover:text-white"
				onClick={() => navigate("/concerts")}
				data-testid="concert-detail-back"
			>
				<ChevronLeft className="mr-2 h-4 w-4" />
				Back to concerts
			</Button>

			{/* Concert Info Section */}
			<div className="mb-8 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
				<div className="relative h-56 w-56 shrink-0 overflow-hidden rounded-lg shadow-2xl sm:h-64 sm:w-64">
					<AppImage
						src={getImageUrl(concert.coverImage || artistImage)}
						alt={`${artistName} at ${concert.venue}`}
						className="h-full w-full object-cover"
						data-testid="concert-detail-cover"
					/>
					<div
						data-testid="concert-detail-date-badge"
						className="absolute top-2 left-2 min-w-[3rem] rounded-lg bg-black/80 px-2.5 py-1.5 text-center backdrop-blur-sm"
					>
						<div className="text-[10px] font-semibold uppercase tracking-wider text-melodio-green">
							{month}
						</div>
						<div className="text-xl font-bold leading-none text-white">
							{day}
						</div>
					</div>
				</div>

				<div className="flex flex-col items-center sm:items-start">
					<span className="mb-1 text-xs font-medium uppercase tracking-wider text-melodio-green">
						Live Concert
					</span>
					<h2
						data-testid="concert-detail-artist"
						className="mb-2 text-center text-2xl font-bold text-white sm:text-left"
					>
						{artistName}
					</h2>
					<p
						data-testid="concert-detail-venue"
						className="mb-1 text-sm text-melodio-text-subdued"
					>
						{concert.venue}
					</p>
					<p
						data-testid="concert-detail-city"
						className="mb-3 text-sm text-melodio-text-subdued"
					>
						{concert.city}
					</p>
					<div className="mb-4 flex items-center gap-4 text-sm text-melodio-text-subdued">
						<span data-testid="concert-detail-date">{formattedDate}</span>
						<span className="text-melodio-text-subdued/40">|</span>
						<span data-testid="concert-detail-time">{formattedTime}</span>
					</div>

					<p
						data-testid="concert-detail-ticket-count"
						className="mb-4 text-sm font-medium text-white"
					>
						{userTicketCount}/{maxTickets} tickets
					</p>

					<div className="flex items-center gap-3">
						{userTicketCount < maxTickets && (
							<Button
								data-testid="concert-detail-buy-btn"
								onClick={handleOpenBuyDialog}
								className="rounded-full bg-melodio-green text-black hover:brightness-110"
							>
								<Ticket className="mr-2 h-4 w-4" />
								Buy Tickets
							</Button>
						)}

						{userTicketCount > 0 && (
							<Button
								data-testid="concert-detail-view-tickets-btn"
								variant="outline"
								className="rounded-full"
								onClick={handleOpenTicketsDialog}
							>
								View My Tickets
							</Button>
						)}
					</div>
				</div>
			</div>

			{/* Albums Section */}
			{concertAlbums.length > 0 && (
				<section className="mb-8" data-testid="concert-detail-albums">
					<div className="relative mb-4">
						<h2 className="text-xl font-semibold text-white">
							Albums by {artistName}
						</h2>
						<div className="absolute -top-1 right-0 flex gap-1">
							<button
								type="button"
								aria-label="Scroll albums left"
								onClick={() => scrollAlbums("left")}
								className="rounded-full p-1.5 text-melodio-text-subdued transition-colors hover:bg-melodio-dark-gray hover:text-white"
							>
								<ChevronLeft className="h-5 w-5" />
							</button>
							<button
								type="button"
								aria-label="Scroll albums right"
								onClick={() => scrollAlbums("right")}
								className="rounded-full p-1.5 text-melodio-text-subdued transition-colors hover:bg-melodio-dark-gray hover:text-white"
							>
								<ChevronRight className="h-5 w-5" />
							</button>
						</div>
					</div>
					<div
						ref={albumsScrollRef}
						className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
						style={{ scrollSnapType: "x mandatory" }}
					>
						{concertAlbums.map((album) => (
							<div
								key={album._id}
								data-testid={`concert-detail-album-${album._id}`}
								className="shrink-0 w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] md:w-[calc(25%-12px)] lg:w-[calc(14.285%-12px)]"
								style={{ scrollSnapAlign: "start" }}
							>
								<AlbumCard album={album} />
							</div>
						))}
					</div>
				</section>
			)}

			{/* Tracks Section */}
			{concertTracks.length > 0 && (
				<section className="mb-8" data-testid="concert-detail-tracks">
					<div className="relative mb-4">
						<h2 className="text-xl font-semibold text-white">
							Tracks by {artistName}
						</h2>
					</div>
					<TrackCarousel tracks={concertTracks} testIdPrefix="concert-detail-track" />
				</section>
			)}

			{/* Buy Ticket Dialog */}
			<Dialog open={showBuyDialog} onOpenChange={(open) => { if (!open) handleCloseBuyDialog(); }}>
				<DialogContent
					data-testid="concert-buy-dialog"
					className="border-melodio-light-gray bg-melodio-dark-gray sm:max-w-md"
				>
					<DialogHeader>
						<DialogTitle className="text-white">Buy Tickets</DialogTitle>
						<DialogDescription className="text-melodio-text-subdued">
							{artistName} at {concert.venue}
						</DialogDescription>
					</DialogHeader>

					<div className="flex flex-col items-center gap-4 py-4">
						<div className="flex items-center gap-4">
							<button
								data-testid="concert-buy-decrement"
								type="button"
								onClick={() => handleQuantityChange(Math.max(1, ticketQuantity - 1))}
								disabled={ticketQuantity <= 1}
								className="flex h-10 w-10 items-center justify-center rounded-full bg-melodio-light-gray text-white transition-colors hover:bg-melodio-green hover:text-black disabled:opacity-50"
							>
								<Minus className="h-4 w-4" />
							</button>
							<span
								data-testid="concert-buy-quantity"
								className="min-w-[3rem] text-center text-2xl font-bold text-white"
							>
								{ticketQuantity}
							</span>
							<button
								data-testid="concert-buy-increment"
								type="button"
								onClick={() => handleQuantityChange(Math.min(availableTickets, ticketQuantity + 1))}
								disabled={ticketQuantity >= availableTickets}
								className="flex h-10 w-10 items-center justify-center rounded-full bg-melodio-light-gray text-white transition-colors hover:bg-melodio-green hover:text-black disabled:opacity-50"
							>
								<Plus className="h-4 w-4" />
							</button>
						</div>
						<p
							data-testid="concert-buy-available"
							className="text-sm text-melodio-text-subdued"
						>
							Available: {availableTickets} tickets remaining
						</p>
					</div>

					<DialogFooter>
						<Button
							data-testid="concert-buy-confirm"
							onClick={handleBuyTickets}
							className="w-full rounded-full bg-melodio-green text-black hover:brightness-110"
						>
							Confirm Purchase
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* View Tickets Dialog */}
			<Dialog open={showTicketsDialog} onOpenChange={(open) => { if (!open) handleCloseTicketsDialog(); }}>
				<DialogContent
					data-testid="concert-tickets-dialog"
					className="border-melodio-light-gray bg-melodio-dark-gray sm:max-w-md"
				>
					<DialogHeader>
						<DialogTitle className="text-white">My Tickets</DialogTitle>
						<DialogDescription className="text-melodio-text-subdued">
							{artistName} at {concert.venue}
						</DialogDescription>
					</DialogHeader>

					<div className="py-4" data-testid="concert-ticket-carousel">
						<Carousel
							opts={{ align: "start" }}
							className="w-full"
						>
							<CarouselContent className="-ml-3">
								{ticketDisplayData.map((ticket) => (
									<CarouselItem
										key={ticket.ticketCode}
										data-testid={`concert-ticket-${ticket.ticketCode}`}
										className="basis-full pl-3"
									>
										<div className="rounded-lg border border-melodio-light-gray bg-melodio-black p-4">
											<div className="mb-2 flex items-center gap-2">
												<Ticket className="h-4 w-4 text-melodio-green" />
												<span className="font-mono text-sm font-semibold text-melodio-green">
													{ticket.ticketCode}
												</span>
											</div>
											<p className="text-sm font-medium text-white">
												{ticket.concertName}
											</p>
											<p className="text-xs text-melodio-text-subdued">
												{ticket.artistName}
											</p>
											<div className="mt-2 flex items-center gap-2 text-xs text-melodio-text-subdued">
												<span>{ticket.venue}</span>
												<span className="text-melodio-text-subdued/40">&middot;</span>
												<span>{ticket.date}</span>
											</div>
										</div>
									</CarouselItem>
								))}
							</CarouselContent>
							<div className="mt-3 flex justify-center gap-3">
								<CarouselPrevious className="static h-9 w-9 translate-y-0 rounded-full border-melodio-light-gray bg-melodio-dark-gray text-white hover:bg-melodio-light-gray hover:text-white" />
								<CarouselNext className="static h-9 w-9 translate-y-0 rounded-full border-melodio-light-gray bg-melodio-dark-gray text-white hover:bg-melodio-light-gray hover:text-white" />
							</div>
						</Carousel>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
