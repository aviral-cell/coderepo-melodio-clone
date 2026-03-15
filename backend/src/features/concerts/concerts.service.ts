import mongoose from "mongoose";
import { Concert, IConcert, IConcertTicket } from "./concert.model.js";

export class ConcertError extends Error {
	statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.statusCode = statusCode;
		this.name = "ConcertError";
	}
}

interface PopulatedArtist {
	_id: mongoose.Types.ObjectId;
	name: string;
	image_url?: string;
	genres: string[];
}

interface LeanConcert extends Omit<IConcert, "artist_id"> {
	_id: mongoose.Types.ObjectId;
	artist_id: PopulatedArtist;
}

interface LeanConcertRaw extends IConcert {
	_id: mongoose.Types.ObjectId;
}

interface ConcertTicketResponse {
	userId: string;
	quantity: number;
	ticketCodes: string[];
	purchasedAt: Date;
}

interface ConcertResponse {
	_id: string;
	artistId: {
		_id: string;
		name: string;
		imageUrl?: string;
		genres: string[];
	};
	venue: string;
	city: string;
	date: Date;
	time: string;
	coverImage: string;
	maxTicketsPerUser: number;
	tickets: ConcertTicketResponse[];
	createdAt: Date;
	updatedAt: Date;
}

function transformTicket(ticket: IConcertTicket): ConcertTicketResponse {
	return {
		userId: ticket.user_id.toString(),
		quantity: ticket.quantity,
		ticketCodes: ticket.ticket_codes,
		purchasedAt: ticket.purchased_at,
	};
}

function transformConcert(concert: LeanConcert): ConcertResponse {
	const artist = concert.artist_id;

	return {
		_id: concert._id.toString(),
		artistId: {
			_id: artist?._id?.toString() ?? "",
			name: artist?.name ?? "",
			imageUrl: artist?.image_url,
			genres: artist?.genres ?? [],
		},
		venue: concert.venue,
		city: concert.city,
		date: concert.date,
		time: concert.time,
		coverImage: concert.cover_image,
		maxTicketsPerUser: concert.max_tickets_per_user,
		tickets: (concert.tickets || []).map((t) => transformTicket(t)),
		createdAt: concert.created_at,
		updatedAt: concert.updated_at,
	};
}

export const concertsService = {
	async getUpcoming(
		month?: number,
		city?: string,
	): Promise<ConcertResponse[]> {
		const filter: Record<string, unknown> = {
			date: { $gt: new Date() },
		};

		if (city) {
			filter.city = city;
		}

		if (month && month >= 1 && month <= 12) {
			const year = new Date().getUTCFullYear();
			const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
			const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

			filter.date = {
				$gt: new Date(),
				$gte: startOfMonth,
				$lte: endOfMonth,
			};
		}

		const concerts = await Concert.find(filter)
			.populate<{ artist_id: PopulatedArtist }>({
				path: "artist_id",
				select: "name image_url genres",
			})
			.sort({ date: 1 })
			.lean<LeanConcert[]>()
			.exec();

		return concerts.map((concert) => transformConcert(concert));
	},

	async getById(concertId: string): Promise<ConcertResponse | null> {
		const concert = await Concert.findById(concertId)
			.populate<{ artist_id: PopulatedArtist }>({
				path: "artist_id",
				select: "name image_url genres",
			})
			.lean<LeanConcert | null>()
			.exec();

		if (!concert) {
			return null;
		}

		return transformConcert(concert);
	},

	async buyTickets(
		concertId: string,
		userId: string,
		quantity: number,
	): Promise<{ concert: ConcertResponse; userTickets: ConcertTicketResponse[] }> {
		const concert = await Concert.findById(concertId)
			.lean<LeanConcertRaw | null>()
			.exec();

		if (!concert) {
			throw new ConcertError("Concert not found", 404);
		}

		const userTickets = concert.tickets.filter(
			(t) => t.user_id.toString() === userId,
		);
		const currentCount = userTickets.reduce((sum, t) => sum + t.quantity, 0);

		if (currentCount + quantity > concert.max_tickets_per_user) {
			throw new ConcertError(
				`Cannot exceed ${concert.max_tickets_per_user} tickets per user. You already have ${currentCount} tickets.`,
				400,
			);
		}

		const ticketCodes: string[] = [];
		const suffix = concertId.slice(-4);
		for (let i = 0; i < quantity; i++) {
			const random = Math.random().toString(16).slice(2, 8);
			ticketCodes.push(`CONC-${suffix}-${random}`);
		}

		const ticketEntry: IConcertTicket = {
			user_id: new mongoose.Types.ObjectId(userId),
			quantity,
			ticket_codes: ticketCodes,
			purchased_at: new Date(),
		};

		const updatedConcert = await Concert.findByIdAndUpdate(
			concertId,
			{ $push: { tickets: ticketEntry } },
			{ new: true },
		)
			.populate<{ artist_id: PopulatedArtist }>({
				path: "artist_id",
				select: "name image_url genres",
			})
			.lean<LeanConcert | null>()
			.exec();

		if (!updatedConcert) {
			throw new ConcertError("Failed to update concert", 500);
		}

		const updatedUserTickets = updatedConcert.tickets
			.filter((t) => t.user_id.toString() === userId)
			.map((t) => transformTicket(t));

		return {
			concert: transformConcert(updatedConcert),
			userTickets: updatedUserTickets,
		};
	},

	async getUserTickets(
		concertId: string,
		userId: string,
	): Promise<ConcertTicketResponse[]> {
		const concert = await Concert.findById(concertId)
			.lean<LeanConcertRaw | null>()
			.exec();

		if (!concert) {
			throw new ConcertError("Concert not found", 404);
		}

		const userTickets = concert.tickets.filter(
			(t) => t.user_id.toString() === userId,
		);

		return userTickets.map((t) => transformTicket(t));
	},
};
