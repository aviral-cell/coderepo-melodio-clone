import { apiService } from "./api.service";

export interface Concert {
	_id: string;
	artistId: { _id: string; name: string; imageUrl: string; genres: string[] };
	venue: string;
	city: string;
	date: string;
	time: string;
	coverImage: string;
	maxTicketsPerUser: number;
	tickets: ConcertTicket[];
	createdAt: string;
	updatedAt: string;
}

export interface ConcertTicket {
	userId: string;
	quantity: number;
	ticketCodes: string[];
	purchasedAt: string;
}

export interface BuyTicketsResponse {
	concert: Concert;
	userTickets: ConcertTicket;
}

export const concertService = {
	async getAll(params?: { month?: number; city?: string }): Promise<Concert[]> {
		const queryParts: string[] = [];
		if (params?.month) queryParts.push(`month=${params.month}`);
		if (params?.city) queryParts.push(`city=${encodeURIComponent(params.city)}`);
		const query = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
		return apiService.get<Concert[]>(`/api/concerts${query}`);
	},

	async getById(id: string): Promise<Concert> {
		return apiService.get<Concert>(`/api/concerts/${id}`);
	},

	async buyTickets(concertId: string, quantity: number): Promise<BuyTicketsResponse> {
		return apiService.post<BuyTicketsResponse>(`/api/concerts/${concertId}/tickets`, { quantity });
	},

	async getUserTickets(concertId: string): Promise<ConcertTicket[]> {
		return apiService.get<ConcertTicket[]>(`/api/concerts/${concertId}/tickets`);
	},
};
