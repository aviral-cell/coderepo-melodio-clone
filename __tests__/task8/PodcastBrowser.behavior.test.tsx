// @ts-nocheck
/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";

import PodcastPage from "@/pages/PodcastPage";
import { PlayerProvider } from "@/shared/contexts/PlayerContext";
import { PlaylistProvider } from "@/shared/contexts/PlaylistContext";
import { ToastProvider } from "@/shared/hooks/useToast";

// ========== MOCKS ==========

jest.mock("@/shared/contexts/AuthContext", () => ({
	AuthProvider: ({ children }: { children: React.ReactNode }) => children,
	useAuth: () => ({
		user: { _id: "user-1", email: "test@hackerrank.com", name: "Test User" },
		isAuthenticated: true,
		isLoading: false,
		login: jest.fn(),
		register: jest.fn(),
		logout: jest.fn(),
	}),
}));

jest.mock("@/shared/contexts/SidebarContext", () => ({
	SidebarProvider: ({ children }: { children: React.ReactNode }) => children,
	useSidebar: () => ({
		isMobileSidebarOpen: false,
		toggleMobileSidebar: jest.fn(),
		closeMobileSidebar: jest.fn(),
	}),
}));

jest.mock("@/shared/utils", () => ({
	normalizeTracks: (tracks: any[]) => tracks,
	normalizeTrack: (track: any) => track,
	getImageUrl: (path: string | undefined | null) => path || "/melodio.svg",
	DEFAULT_IMAGE: "/melodio.svg",
	formatDuration: (seconds: number) => {
		const min = Math.floor(seconds / 60);
		const sec = seconds % 60;
		return `${min}:${sec.toString().padStart(2, "0")}`;
	},
	cn: (...inputs: any[]) => inputs.filter(Boolean).join(" "),
	formatNumber: (num: number) => num.toLocaleString(),
	capitalize: (str: string) => str.charAt(0).toUpperCase() + str.slice(1),
	getInitials: (name: string) =>
		name
			.split(" ")
			.map((n: string) => n[0])
			.join("")
			.toUpperCase(),
	preloadImages: jest.fn(),
}));

// ========== FACTORY FUNCTIONS ==========

function createPodcastTrack(overrides: Record<string, unknown> = {}) {
	return {
		_id: `track-${Math.random().toString(36).substring(2, 9)}`,
		title: "Podcast Episode",
		description: "Default episode description",
		durationInSeconds: 1800,
		trackNumber: 1,
		genre: "podcast",
		playCount: 1000,
		createdAt: "2024-01-20T00:00:00.000Z",
		updatedAt: "2024-01-20T00:00:00.000Z",
		coverImageUrl: "/cover.jpg",
		artistId: {
			_id: "artist-podcast-1",
			name: "Tech Talk Daily",
			imageUrl: "/artist.jpg",
		},
		albumId: {
			_id: "album-podcast-1",
			title: "Code & Coffee",
			coverImageUrl: "/cover.jpg",
		},
		...overrides,
	};
}

function createAlbum(overrides: Record<string, unknown> = {}) {
	return {
		_id: "album-podcast-1",
		title: "Code & Coffee",
		releaseDate: "2024-01-15",
		totalTracks: 5,
		coverImageUrl: "/cover.jpg",
		createdAt: "2024-01-15T00:00:00.000Z",
		updatedAt: "2024-01-15T00:00:00.000Z",
		artistId: {
			_id: "artist-podcast-1",
			name: "Tech Talk Daily",
			imageUrl: "/artist.jpg",
		},
		...overrides,
	};
}

// ========== MOCK DATA ==========

// Show 1: Code & Coffee (Tech Talk Daily) - 5 episodes, totalPlays=25000, latest=2024-01-25
const codeCoffeeEpisodes = [
	createPodcastTrack({
		_id: "track-cc-1",
		title: "Ep 1: Intro to TypeScript",
		description: "Learn the basics of TypeScript and why it matters for modern development.",
		durationInSeconds: 2000,
		trackNumber: 1,
		playCount: 5000,
		createdAt: "2024-01-21T00:00:00.000Z",
		artistId: { _id: "artist-podcast-1", name: "Tech Talk Daily", imageUrl: "/artist.jpg" },
		albumId: { _id: "album-podcast-1", title: "Code & Coffee", coverImageUrl: "/cover.jpg" },
	}),
	createPodcastTrack({
		_id: "track-cc-2",
		title: "Ep 2: React Patterns",
		description: "Deep dive into React patterns including hooks and composition.",
		durationInSeconds: 2200,
		trackNumber: 2,
		playCount: 5000,
		createdAt: "2024-01-22T00:00:00.000Z",
		artistId: { _id: "artist-podcast-1", name: "Tech Talk Daily", imageUrl: "/artist.jpg" },
		albumId: { _id: "album-podcast-1", title: "Code & Coffee", coverImageUrl: "/cover.jpg" },
	}),
	createPodcastTrack({
		_id: "track-cc-3",
		title: "Ep 3: Node.js Best Practices",
		description: "Best practices for Node.js server development and architecture.",
		durationInSeconds: 2500,
		trackNumber: 3,
		playCount: 5000,
		createdAt: "2024-01-23T00:00:00.000Z",
		artistId: { _id: "artist-podcast-1", name: "Tech Talk Daily", imageUrl: "/artist.jpg" },
		albumId: { _id: "album-podcast-1", title: "Code & Coffee", coverImageUrl: "/cover.jpg" },
	}),
	createPodcastTrack({
		_id: "track-cc-4",
		title: "Ep 4: Database Design",
		description: "Fundamentals of database design and schema modeling techniques.",
		durationInSeconds: 2300,
		trackNumber: 4,
		playCount: 5000,
		createdAt: "2024-01-24T00:00:00.000Z",
		artistId: { _id: "artist-podcast-1", name: "Tech Talk Daily", imageUrl: "/artist.jpg" },
		albumId: { _id: "album-podcast-1", title: "Code & Coffee", coverImageUrl: "/cover.jpg" },
	}),
	createPodcastTrack({
		_id: "track-cc-5",
		title: "Ep 5: CI/CD Pipelines",
		description: "Setting up continuous integration and deployment pipelines.",
		durationInSeconds: 2300,
		trackNumber: 5,
		playCount: 5000,
		createdAt: "2024-01-25T00:00:00.000Z",
		artistId: { _id: "artist-podcast-1", name: "Tech Talk Daily", imageUrl: "/artist.jpg" },
		albumId: { _id: "album-podcast-1", title: "Code & Coffee", coverImageUrl: "/cover.jpg" },
	}),
];
// totalDuration = 2000+2200+2500+2300+2300 = 11300s => 3h 8m
// totalPlays = 5*5000 = 25000
// latestEpisodeDate = 2024-01-25

// Show 2: Startup Stories (Tech Talk Daily) - 5 episodes, totalPlays=15000, latest=2024-06-10
const startupStoriesEpisodes = [
	createPodcastTrack({
		_id: "track-ss-1",
		title: "Ep 1: From Idea to MVP",
		description: "How to turn your startup idea into a minimum viable product.",
		durationInSeconds: 2200,
		trackNumber: 1,
		playCount: 3000,
		createdAt: "2024-06-06T00:00:00.000Z",
		artistId: { _id: "artist-podcast-1", name: "Tech Talk Daily", imageUrl: "/artist.jpg" },
		albumId: { _id: "album-podcast-2", title: "Startup Stories", coverImageUrl: "/cover2.jpg" },
	}),
	createPodcastTrack({
		_id: "track-ss-2",
		title: "Ep 2: Fundraising 101",
		description: "Understanding seed rounds, series A, and venture capital basics.",
		durationInSeconds: 2400,
		trackNumber: 2,
		playCount: 3000,
		createdAt: "2024-06-07T00:00:00.000Z",
		artistId: { _id: "artist-podcast-1", name: "Tech Talk Daily", imageUrl: "/artist.jpg" },
		albumId: { _id: "album-podcast-2", title: "Startup Stories", coverImageUrl: "/cover2.jpg" },
	}),
	createPodcastTrack({
		_id: "track-ss-3",
		title: "Ep 3: Scaling a Team",
		description: "Strategies for building and scaling engineering teams effectively.",
		durationInSeconds: 2500,
		trackNumber: 3,
		playCount: 3000,
		createdAt: "2024-06-08T00:00:00.000Z",
		artistId: { _id: "artist-podcast-1", name: "Tech Talk Daily", imageUrl: "/artist.jpg" },
		albumId: { _id: "album-podcast-2", title: "Startup Stories", coverImageUrl: "/cover2.jpg" },
	}),
	createPodcastTrack({
		_id: "track-ss-4",
		title: "Ep 4: Product Market Fit",
		description: "Finding product market fit and validating your business model.",
		durationInSeconds: 2600,
		trackNumber: 4,
		playCount: 3000,
		createdAt: "2024-06-09T00:00:00.000Z",
		artistId: { _id: "artist-podcast-1", name: "Tech Talk Daily", imageUrl: "/artist.jpg" },
		albumId: { _id: "album-podcast-2", title: "Startup Stories", coverImageUrl: "/cover2.jpg" },
	}),
	createPodcastTrack({
		_id: "track-ss-5",
		title: "Ep 5: Exit Strategies",
		description: "When and how to exit, from acquisitions to IPOs.",
		durationInSeconds: 2400,
		trackNumber: 5,
		playCount: 3000,
		createdAt: "2024-06-10T00:00:00.000Z",
		artistId: { _id: "artist-podcast-1", name: "Tech Talk Daily", imageUrl: "/artist.jpg" },
		albumId: { _id: "album-podcast-2", title: "Startup Stories", coverImageUrl: "/cover2.jpg" },
	}),
];
// totalDuration = 2200+2400+2500+2600+2400 = 12100s => 3h 21m
// totalPlays = 5*3000 = 15000
// latestEpisodeDate = 2024-06-10

// Show 3: Behind the Album (Music Stories) - 5 episodes, totalPlays=40000, latest=2024-03-25
const behindTheAlbumEpisodes = [
	createPodcastTrack({
		_id: "track-bta-1",
		title: "Ep 1: Making of Thriller",
		description: "The making of the best-selling album of all time.",
		durationInSeconds: 2600,
		trackNumber: 1,
		playCount: 8000,
		createdAt: "2024-03-21T00:00:00.000Z",
		artistId: { _id: "artist-podcast-2", name: "Music Stories", imageUrl: "/artist2.jpg" },
		albumId: { _id: "album-podcast-3", title: "Behind the Album", coverImageUrl: "/cover3.jpg" },
	}),
	createPodcastTrack({
		_id: "track-bta-2",
		title: "Ep 2: Abbey Road Sessions",
		description: "Inside the legendary recording sessions at Abbey Road Studios.",
		durationInSeconds: 2800,
		trackNumber: 2,
		playCount: 8000,
		createdAt: "2024-03-22T00:00:00.000Z",
		artistId: { _id: "artist-podcast-2", name: "Music Stories", imageUrl: "/artist2.jpg" },
		albumId: { _id: "album-podcast-3", title: "Behind the Album", coverImageUrl: "/cover3.jpg" },
	}),
	createPodcastTrack({
		_id: "track-bta-3",
		title: "Ep 3: Born to Run Story",
		description: "The story behind Bruce Springsteen's iconic album.",
		durationInSeconds: 2900,
		trackNumber: 3,
		playCount: 8000,
		createdAt: "2024-03-23T00:00:00.000Z",
		artistId: { _id: "artist-podcast-2", name: "Music Stories", imageUrl: "/artist2.jpg" },
		albumId: { _id: "album-podcast-3", title: "Behind the Album", coverImageUrl: "/cover3.jpg" },
	}),
	createPodcastTrack({
		_id: "track-bta-4",
		title: "Ep 4: Dark Side of the Moon",
		description: "How Pink Floyd created their masterpiece concept album.",
		durationInSeconds: 2700,
		trackNumber: 4,
		playCount: 8000,
		createdAt: "2024-03-24T00:00:00.000Z",
		artistId: { _id: "artist-podcast-2", name: "Music Stories", imageUrl: "/artist2.jpg" },
		albumId: { _id: "album-podcast-3", title: "Behind the Album", coverImageUrl: "/cover3.jpg" },
	}),
	createPodcastTrack({
		_id: "track-bta-5",
		title: "Ep 5: Rumours Revisited",
		description: "Revisiting Fleetwood Mac's drama-fueled recording sessions.",
		durationInSeconds: 2800,
		trackNumber: 5,
		playCount: 8000,
		createdAt: "2024-03-25T00:00:00.000Z",
		artistId: { _id: "artist-podcast-2", name: "Music Stories", imageUrl: "/artist2.jpg" },
		albumId: { _id: "album-podcast-3", title: "Behind the Album", coverImageUrl: "/cover3.jpg" },
	}),
];
// totalDuration = 2600+2800+2900+2700+2800 = 13800s => 3h 50m
// totalPlays = 5*8000 = 40000
// latestEpisodeDate = 2024-03-25

// Show 4: Design Matters (Creative Minds) - 5 episodes, totalPlays=35000, latest=2024-05-13
const designMattersEpisodes = [
	createPodcastTrack({
		_id: "track-dm-1",
		title: "Ep 1: Design Thinking Basics",
		description: "Introduction to design thinking methodology.",
		durationInSeconds: 1800,
		trackNumber: 1,
		playCount: 7000,
		createdAt: "2024-05-01T00:00:00.000Z",
		artistId: { _id: "artist-podcast-3", name: "Creative Minds", imageUrl: "/artist3.jpg" },
		albumId: { _id: "album-podcast-4", title: "Design Matters", coverImageUrl: "/cover4.jpg" },
	}),
	createPodcastTrack({
		_id: "track-dm-2",
		title: "Ep 2: Color Theory in UX",
		description: "How color theory influences user experience and interface design.",
		durationInSeconds: 2100,
		trackNumber: 2,
		playCount: 7000,
		createdAt: "2024-05-04T00:00:00.000Z",
		artistId: { _id: "artist-podcast-3", name: "Creative Minds", imageUrl: "/artist3.jpg" },
		albumId: { _id: "album-podcast-4", title: "Design Matters", coverImageUrl: "/cover4.jpg" },
	}),
	createPodcastTrack({
		_id: "track-dm-3",
		title: "Ep 3: Typography Essentials",
		description: "Choosing the right typefaces for digital products.",
		durationInSeconds: 1900,
		trackNumber: 3,
		playCount: 7000,
		createdAt: "2024-05-07T00:00:00.000Z",
		artistId: { _id: "artist-podcast-3", name: "Creative Minds", imageUrl: "/artist3.jpg" },
		albumId: { _id: "album-podcast-4", title: "Design Matters", coverImageUrl: "/cover4.jpg" },
	}),
	createPodcastTrack({
		_id: "track-dm-4",
		title: "Ep 4: Prototyping Workflows",
		description: "Rapid prototyping techniques for faster iteration cycles.",
		durationInSeconds: 2000,
		trackNumber: 4,
		playCount: 7000,
		createdAt: "2024-05-10T00:00:00.000Z",
		artistId: { _id: "artist-podcast-3", name: "Creative Minds", imageUrl: "/artist3.jpg" },
		albumId: { _id: "album-podcast-4", title: "Design Matters", coverImageUrl: "/cover4.jpg" },
	}),
	createPodcastTrack({
		_id: "track-dm-5",
		title: "Ep 5: Accessibility in Design",
		description: "Building inclusive designs that work for everyone.",
		durationInSeconds: 2200,
		trackNumber: 5,
		playCount: 7000,
		createdAt: "2024-05-13T00:00:00.000Z",
		artistId: { _id: "artist-podcast-3", name: "Creative Minds", imageUrl: "/artist3.jpg" },
		albumId: { _id: "album-podcast-4", title: "Design Matters", coverImageUrl: "/cover4.jpg" },
	}),
];
// totalDuration = 1800+2100+1900+2000+2200 = 10000s => 2h 46m
// totalPlays = 5*7000 = 35000
// latestEpisodeDate = 2024-05-13

// Show 5: Data Science Daily (Tech Talk Daily) - 5 episodes, totalPlays=30000, latest=2024-08-21
const dataScienceDailyEpisodes = [
	createPodcastTrack({
		_id: "track-dsd-1",
		title: "Ep 1: Intro to Machine Learning",
		description: "A beginner-friendly overview of machine learning concepts.",
		durationInSeconds: 2400,
		trackNumber: 1,
		playCount: 6000,
		createdAt: "2024-08-09T00:00:00.000Z",
		artistId: { _id: "artist-podcast-1", name: "Tech Talk Daily", imageUrl: "/artist.jpg" },
		albumId: { _id: "album-podcast-5", title: "Data Science Daily", coverImageUrl: "/cover5.jpg" },
	}),
	createPodcastTrack({
		_id: "track-dsd-2",
		title: "Ep 2: Data Wrangling with Python",
		description: "Cleaning and transforming data using pandas and NumPy.",
		durationInSeconds: 2600,
		trackNumber: 2,
		playCount: 6000,
		createdAt: "2024-08-12T00:00:00.000Z",
		artistId: { _id: "artist-podcast-1", name: "Tech Talk Daily", imageUrl: "/artist.jpg" },
		albumId: { _id: "album-podcast-5", title: "Data Science Daily", coverImageUrl: "/cover5.jpg" },
	}),
	createPodcastTrack({
		_id: "track-dsd-3",
		title: "Ep 3: Neural Networks Explained",
		description: "Understanding how neural networks learn and make predictions.",
		durationInSeconds: 2500,
		trackNumber: 3,
		playCount: 6000,
		createdAt: "2024-08-15T00:00:00.000Z",
		artistId: { _id: "artist-podcast-1", name: "Tech Talk Daily", imageUrl: "/artist.jpg" },
		albumId: { _id: "album-podcast-5", title: "Data Science Daily", coverImageUrl: "/cover5.jpg" },
	}),
	createPodcastTrack({
		_id: "track-dsd-4",
		title: "Ep 4: Data Visualization Best Practices",
		description: "Creating impactful charts and dashboards for stakeholders.",
		durationInSeconds: 2300,
		trackNumber: 4,
		playCount: 6000,
		createdAt: "2024-08-18T00:00:00.000Z",
		artistId: { _id: "artist-podcast-1", name: "Tech Talk Daily", imageUrl: "/artist.jpg" },
		albumId: { _id: "album-podcast-5", title: "Data Science Daily", coverImageUrl: "/cover5.jpg" },
	}),
	createPodcastTrack({
		_id: "track-dsd-5",
		title: "Ep 5: Ethics in AI",
		description: "Exploring ethical considerations in artificial intelligence development.",
		durationInSeconds: 2200,
		trackNumber: 5,
		playCount: 6000,
		createdAt: "2024-08-21T00:00:00.000Z",
		artistId: { _id: "artist-podcast-1", name: "Tech Talk Daily", imageUrl: "/artist.jpg" },
		albumId: { _id: "album-podcast-5", title: "Data Science Daily", coverImageUrl: "/cover5.jpg" },
	}),
];
// totalDuration = 2400+2600+2500+2300+2200 = 12000s => 3h 20m
// totalPlays = 5*6000 = 30000
// latestEpisodeDate = 2024-08-21

// Show 6: The Indie Hacker (Startup Radio) - 5 episodes, totalPlays=20000, latest=2024-07-27
const theIndieHackerEpisodes = [
	createPodcastTrack({
		_id: "track-ih-1",
		title: "Ep 1: Building in Public",
		description: "The benefits and risks of sharing your startup journey openly.",
		durationInSeconds: 2100,
		trackNumber: 1,
		playCount: 4000,
		createdAt: "2024-07-15T00:00:00.000Z",
		artistId: { _id: "artist-podcast-4", name: "Startup Radio", imageUrl: "/artist4.jpg" },
		albumId: { _id: "album-podcast-6", title: "The Indie Hacker", coverImageUrl: "/cover6.jpg" },
	}),
	createPodcastTrack({
		_id: "track-ih-2",
		title: "Ep 2: Solo Founder Life",
		description: "Managing every aspect of a business as a solo entrepreneur.",
		durationInSeconds: 2300,
		trackNumber: 2,
		playCount: 4000,
		createdAt: "2024-07-18T00:00:00.000Z",
		artistId: { _id: "artist-podcast-4", name: "Startup Radio", imageUrl: "/artist4.jpg" },
		albumId: { _id: "album-podcast-6", title: "The Indie Hacker", coverImageUrl: "/cover6.jpg" },
	}),
	createPodcastTrack({
		_id: "track-ih-3",
		title: "Ep 3: Revenue Before Funding",
		description: "Why bootstrapping can be a better path than seeking investment.",
		durationInSeconds: 2000,
		trackNumber: 3,
		playCount: 4000,
		createdAt: "2024-07-21T00:00:00.000Z",
		artistId: { _id: "artist-podcast-4", name: "Startup Radio", imageUrl: "/artist4.jpg" },
		albumId: { _id: "album-podcast-6", title: "The Indie Hacker", coverImageUrl: "/cover6.jpg" },
	}),
	createPodcastTrack({
		_id: "track-ih-4",
		title: "Ep 4: Marketing on a Budget",
		description: "Effective marketing strategies when you have limited resources.",
		durationInSeconds: 2200,
		trackNumber: 4,
		playCount: 4000,
		createdAt: "2024-07-24T00:00:00.000Z",
		artistId: { _id: "artist-podcast-4", name: "Startup Radio", imageUrl: "/artist4.jpg" },
		albumId: { _id: "album-podcast-6", title: "The Indie Hacker", coverImageUrl: "/cover6.jpg" },
	}),
	createPodcastTrack({
		_id: "track-ih-5",
		title: "Ep 5: Scaling Without a Team",
		description: "Automation and outsourcing strategies for solo founders.",
		durationInSeconds: 2400,
		trackNumber: 5,
		playCount: 4000,
		createdAt: "2024-07-27T00:00:00.000Z",
		artistId: { _id: "artist-podcast-4", name: "Startup Radio", imageUrl: "/artist4.jpg" },
		albumId: { _id: "album-podcast-6", title: "The Indie Hacker", coverImageUrl: "/cover6.jpg" },
	}),
];
// totalDuration = 2100+2300+2000+2200+2400 = 11000s => 3h 3m
// totalPlays = 5*4000 = 20000
// latestEpisodeDate = 2024-07-27

// Show 7: DevOps Decoded (Tech Talk Daily) - 5 episodes, totalPlays=10000, latest=2024-10-17
const devOpsDecodedEpisodes = [
	createPodcastTrack({
		_id: "track-dd-1",
		title: "Ep 1: Containers 101",
		description: "Getting started with Docker and containerization fundamentals.",
		durationInSeconds: 2000,
		trackNumber: 1,
		playCount: 2000,
		createdAt: "2024-10-05T00:00:00.000Z",
		artistId: { _id: "artist-podcast-1", name: "Tech Talk Daily", imageUrl: "/artist.jpg" },
		albumId: { _id: "album-podcast-7", title: "DevOps Decoded", coverImageUrl: "/cover7.jpg" },
	}),
	createPodcastTrack({
		_id: "track-dd-2",
		title: "Ep 2: Kubernetes Deep Dive",
		description: "Orchestrating containers at scale with Kubernetes.",
		durationInSeconds: 2300,
		trackNumber: 2,
		playCount: 2000,
		createdAt: "2024-10-08T00:00:00.000Z",
		artistId: { _id: "artist-podcast-1", name: "Tech Talk Daily", imageUrl: "/artist.jpg" },
		albumId: { _id: "album-podcast-7", title: "DevOps Decoded", coverImageUrl: "/cover7.jpg" },
	}),
	createPodcastTrack({
		_id: "track-dd-3",
		title: "Ep 3: Infrastructure as Code",
		description: "Managing cloud infrastructure with Terraform and Pulumi.",
		durationInSeconds: 2100,
		trackNumber: 3,
		playCount: 2000,
		createdAt: "2024-10-11T00:00:00.000Z",
		artistId: { _id: "artist-podcast-1", name: "Tech Talk Daily", imageUrl: "/artist.jpg" },
		albumId: { _id: "album-podcast-7", title: "DevOps Decoded", coverImageUrl: "/cover7.jpg" },
	}),
	createPodcastTrack({
		_id: "track-dd-4",
		title: "Ep 4: Monitoring and Alerting",
		description: "Setting up observability with Prometheus and Grafana.",
		durationInSeconds: 2200,
		trackNumber: 4,
		playCount: 2000,
		createdAt: "2024-10-14T00:00:00.000Z",
		artistId: { _id: "artist-podcast-1", name: "Tech Talk Daily", imageUrl: "/artist.jpg" },
		albumId: { _id: "album-podcast-7", title: "DevOps Decoded", coverImageUrl: "/cover7.jpg" },
	}),
	createPodcastTrack({
		_id: "track-dd-5",
		title: "Ep 5: GitOps Workflows",
		description: "Implementing GitOps for continuous deployment pipelines.",
		durationInSeconds: 2400,
		trackNumber: 5,
		playCount: 2000,
		createdAt: "2024-10-17T00:00:00.000Z",
		artistId: { _id: "artist-podcast-1", name: "Tech Talk Daily", imageUrl: "/artist.jpg" },
		albumId: { _id: "album-podcast-7", title: "DevOps Decoded", coverImageUrl: "/cover7.jpg" },
	}),
];
// totalDuration = 2000+2300+2100+2200+2400 = 11000s => 3h 3m
// totalPlays = 5*2000 = 10000
// latestEpisodeDate = 2024-10-17

// Show 8: Music Theory 101 (Music Stories) - 5 episodes, totalPlays=5000, latest=2024-11-13
const musicTheory101Episodes = [
	createPodcastTrack({
		_id: "track-mt-1",
		title: "Ep 1: Scales and Modes",
		description: "Understanding major, minor, and modal scales in music.",
		durationInSeconds: 1700,
		trackNumber: 1,
		playCount: 1000,
		createdAt: "2024-11-01T00:00:00.000Z",
		artistId: { _id: "artist-podcast-2", name: "Music Stories", imageUrl: "/artist2.jpg" },
		albumId: { _id: "album-podcast-8", title: "Music Theory 101", coverImageUrl: "/cover8.jpg" },
	}),
	createPodcastTrack({
		_id: "track-mt-2",
		title: "Ep 2: Chord Progressions",
		description: "How chord progressions shape the emotion of a song.",
		durationInSeconds: 1900,
		trackNumber: 2,
		playCount: 1000,
		createdAt: "2024-11-04T00:00:00.000Z",
		artistId: { _id: "artist-podcast-2", name: "Music Stories", imageUrl: "/artist2.jpg" },
		albumId: { _id: "album-podcast-8", title: "Music Theory 101", coverImageUrl: "/cover8.jpg" },
	}),
	createPodcastTrack({
		_id: "track-mt-3",
		title: "Ep 3: Rhythm and Time Signatures",
		description: "Exploring different time signatures and rhythmic patterns.",
		durationInSeconds: 2000,
		trackNumber: 3,
		playCount: 1000,
		createdAt: "2024-11-07T00:00:00.000Z",
		artistId: { _id: "artist-podcast-2", name: "Music Stories", imageUrl: "/artist2.jpg" },
		albumId: { _id: "album-podcast-8", title: "Music Theory 101", coverImageUrl: "/cover8.jpg" },
	}),
	createPodcastTrack({
		_id: "track-mt-4",
		title: "Ep 4: Harmony and Counterpoint",
		description: "The art of combining multiple melodic lines in composition.",
		durationInSeconds: 2100,
		trackNumber: 4,
		playCount: 1000,
		createdAt: "2024-11-10T00:00:00.000Z",
		artistId: { _id: "artist-podcast-2", name: "Music Stories", imageUrl: "/artist2.jpg" },
		albumId: { _id: "album-podcast-8", title: "Music Theory 101", coverImageUrl: "/cover8.jpg" },
	}),
	createPodcastTrack({
		_id: "track-mt-5",
		title: "Ep 5: Songwriting Fundamentals",
		description: "Putting theory into practice with songwriting techniques.",
		durationInSeconds: 2300,
		trackNumber: 5,
		playCount: 1000,
		createdAt: "2024-11-13T00:00:00.000Z",
		artistId: { _id: "artist-podcast-2", name: "Music Stories", imageUrl: "/artist2.jpg" },
		albumId: { _id: "album-podcast-8", title: "Music Theory 101", coverImageUrl: "/cover8.jpg" },
	}),
];
// totalDuration = 1700+1900+2000+2100+2300 = 10000s => 2h 46m
// totalPlays = 5*1000 = 5000
// latestEpisodeDate = 2024-11-13

// Non-podcast music tracks (genre: "rock") - should NOT appear
const musicTracks = [
	createPodcastTrack({
		_id: "track-music-1",
		title: "Thunder Road",
		genre: "rock",
		durationInSeconds: 180,
		trackNumber: 1,
		playCount: 1000,
		createdAt: "2022-03-15T00:00:00.000Z",
		artistId: { _id: "artist-music-1", name: "The Amplifiers", imageUrl: "/artist-music.jpg" },
		albumId: { _id: "album-music-1", title: "Electric Storm", coverImageUrl: "/cover-music.jpg" },
	}),
	createPodcastTrack({
		_id: "track-music-2",
		title: "Highway Lights",
		genre: "rock",
		durationInSeconds: 200,
		trackNumber: 2,
		playCount: 1000,
		createdAt: "2022-03-15T00:00:00.000Z",
		artistId: { _id: "artist-music-1", name: "The Amplifiers", imageUrl: "/artist-music.jpg" },
		albumId: { _id: "album-music-1", title: "Electric Storm", coverImageUrl: "/cover-music.jpg" },
	}),
	createPodcastTrack({
		_id: "track-music-3",
		title: "Neon Nights",
		genre: "rock",
		durationInSeconds: 170,
		trackNumber: 3,
		playCount: 1000,
		createdAt: "2022-03-15T00:00:00.000Z",
		artistId: { _id: "artist-music-1", name: "The Amplifiers", imageUrl: "/artist-music.jpg" },
		albumId: { _id: "album-music-1", title: "Electric Storm", coverImageUrl: "/cover-music.jpg" },
	}),
	createPodcastTrack({
		_id: "track-music-4",
		title: "Voltage",
		genre: "rock",
		durationInSeconds: 190,
		trackNumber: 4,
		playCount: 1000,
		createdAt: "2022-03-15T00:00:00.000Z",
		artistId: { _id: "artist-music-1", name: "The Amplifiers", imageUrl: "/artist-music.jpg" },
		albumId: { _id: "album-music-1", title: "Electric Storm", coverImageUrl: "/cover-music.jpg" },
	}),
	createPodcastTrack({
		_id: "track-music-5",
		title: "Overdriven",
		genre: "rock",
		durationInSeconds: 160,
		trackNumber: 5,
		playCount: 1000,
		createdAt: "2022-03-15T00:00:00.000Z",
		artistId: { _id: "artist-music-1", name: "The Amplifiers", imageUrl: "/artist-music.jpg" },
		albumId: { _id: "album-music-1", title: "Electric Storm", coverImageUrl: "/cover-music.jpg" },
	}),
];

const allTracks = [
	...codeCoffeeEpisodes,
	...startupStoriesEpisodes,
	...behindTheAlbumEpisodes,
	...designMattersEpisodes,
	...dataScienceDailyEpisodes,
	...theIndieHackerEpisodes,
	...devOpsDecodedEpisodes,
	...musicTheory101Episodes,
	...musicTracks,
];

const allAlbums = [
	createAlbum({
		_id: "album-podcast-1",
		title: "Code & Coffee",
		releaseDate: "2024-01-15",
		totalTracks: 5,
		coverImageUrl: "/cover.jpg",
		artistId: { _id: "artist-podcast-1", name: "Tech Talk Daily", imageUrl: "/artist.jpg" },
	}),
	createAlbum({
		_id: "album-podcast-2",
		title: "Startup Stories",
		releaseDate: "2024-06-01",
		totalTracks: 5,
		coverImageUrl: "/cover2.jpg",
		artistId: { _id: "artist-podcast-1", name: "Tech Talk Daily", imageUrl: "/artist.jpg" },
	}),
	createAlbum({
		_id: "album-podcast-3",
		title: "Behind the Album",
		releaseDate: "2024-03-15",
		totalTracks: 5,
		coverImageUrl: "/cover3.jpg",
		artistId: { _id: "artist-podcast-2", name: "Music Stories", imageUrl: "/artist2.jpg" },
	}),
	createAlbum({
		_id: "album-podcast-4",
		title: "Design Matters",
		releaseDate: "2024-04-15",
		totalTracks: 5,
		coverImageUrl: "/cover4.jpg",
		artistId: { _id: "artist-podcast-3", name: "Creative Minds", imageUrl: "/artist3.jpg" },
	}),
	createAlbum({
		_id: "album-podcast-5",
		title: "Data Science Daily",
		releaseDate: "2024-08-01",
		totalTracks: 5,
		coverImageUrl: "/cover5.jpg",
		artistId: { _id: "artist-podcast-1", name: "Tech Talk Daily", imageUrl: "/artist.jpg" },
	}),
	createAlbum({
		_id: "album-podcast-6",
		title: "The Indie Hacker",
		releaseDate: "2024-07-01",
		totalTracks: 5,
		coverImageUrl: "/cover6.jpg",
		artistId: { _id: "artist-podcast-4", name: "Startup Radio", imageUrl: "/artist4.jpg" },
	}),
	createAlbum({
		_id: "album-podcast-7",
		title: "DevOps Decoded",
		releaseDate: "2024-10-01",
		totalTracks: 5,
		coverImageUrl: "/cover7.jpg",
		artistId: { _id: "artist-podcast-1", name: "Tech Talk Daily", imageUrl: "/artist.jpg" },
	}),
	createAlbum({
		_id: "album-podcast-8",
		title: "Music Theory 101",
		releaseDate: "2024-11-01",
		totalTracks: 5,
		coverImageUrl: "/cover8.jpg",
		artistId: { _id: "artist-podcast-2", name: "Music Stories", imageUrl: "/artist2.jpg" },
	}),
	createAlbum({
		_id: "album-music-1",
		title: "Electric Storm",
		releaseDate: "2022-03-01",
		totalTracks: 5,
		coverImageUrl: "/cover-music.jpg",
		artistId: { _id: "artist-music-1", name: "The Amplifiers", imageUrl: "/artist-music.jpg" },
	}),
];

const mockTracksResponse = {
	items: allTracks,
	total: allTracks.length,
	page: 1,
	limit: 100,
	totalPages: 1,
	hasNext: false,
	hasPrev: false,
};

const mockAlbumsResponse = {
	items: allAlbums,
	total: allAlbums.length,
	page: 1,
	limit: 50,
	totalPages: 1,
	hasNext: false,
	hasPrev: false,
};

// ========== TEST WRAPPER ==========

function TestWrapper({ children }: { children: React.ReactNode }) {
	return (
		<MemoryRouter initialEntries={["/podcasts"]}>
			<ToastProvider>
				<PlayerProvider>
					<PlaylistProvider>{children}</PlaylistProvider>
				</PlayerProvider>
			</ToastProvider>
		</MemoryRouter>
	);
}

function renderPodcastPage() {
	return render(
		<TestWrapper>
			<PodcastPage />
		</TestWrapper>,
	);
}

// ========== FETCH MOCK HELPERS ==========

function setupSuccessFetch(mockFetch: jest.Mock) {
	mockFetch.mockImplementation((url: string) => {
		if (url.includes("/api/tracks")) {
			return Promise.resolve({
				ok: true,
				status: 200,
				headers: new Headers({ "content-type": "application/json" }),
				json: () => Promise.resolve({ success: true, data: mockTracksResponse }),
			});
		}
		if (url.includes("/api/albums")) {
			return Promise.resolve({
				ok: true,
				status: 200,
				headers: new Headers({ "content-type": "application/json" }),
				json: () => Promise.resolve({ success: true, data: mockAlbumsResponse }),
			});
		}
		return Promise.resolve({
			ok: true,
			status: 200,
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve({ success: true, data: [] }),
		});
	});
}

// ========== SETUP / TEARDOWN ==========

const originalFetch = global.fetch;
const originalLocation = window.location;

let mockFetch: jest.Mock;

describe("Podcast Browser", () => {
	beforeAll(() => {
		delete window.location;
		window.location = {
			...originalLocation,
			protocol: "http:",
			host: "localhost:3000",
			hostname: "localhost",
			port: "3000",
			pathname: "/",
			search: "",
			hash: "",
			href: "http://localhost:3000/",
			origin: "http://localhost:3000",
		} as Location;
	});

	afterAll(() => {
		window.location = originalLocation;
	});

	beforeEach(() => {
		mockFetch = jest.fn();
		global.fetch = mockFetch;
		localStorage.setItem("accessToken", "test-token");
	});

	afterEach(() => {
		global.fetch = originalFetch;
		localStorage.clear();
		jest.clearAllMocks();
	});

	// ========== BROWSE VIEW ==========

	describe("Browse View", () => {
		describe("Show Sorting", () => {
			it("should sort all shows by newest episode date with most recent first", async () => {
				setupSuccessFetch(mockFetch);

				renderPodcastPage();

				await waitFor(() => {
					expect(screen.getByTestId("podcast-shows")).toBeInTheDocument();
				});

				const allShowsSection = screen.getByTestId("podcast-shows");
				const showTitles = within(allShowsSection).getAllByText(
					/Code & Coffee|Startup Stories|Behind the Album|Design Matters|Data Science Daily|The Indie Hacker|DevOps Decoded|Music Theory 101/,
				);

				// Sorted by latest episode date (most recent first):
				// Music Theory 101 (Nov 13), DevOps Decoded (Oct 17), Data Science Daily (Aug 21),
				// The Indie Hacker (Jul 27), Startup Stories (Jun 10), Design Matters (May 13),
				// Behind the Album (Mar 25), Code & Coffee (Jan 25)
				expect(showTitles[0]).toHaveTextContent("Music Theory 101");
				expect(showTitles[1]).toHaveTextContent("DevOps Decoded");
				expect(showTitles[2]).toHaveTextContent("Data Science Daily");
				expect(showTitles[3]).toHaveTextContent("The Indie Hacker");
				expect(showTitles[4]).toHaveTextContent("Startup Stories");
				expect(showTitles[5]).toHaveTextContent("Design Matters");
				expect(showTitles[6]).toHaveTextContent("Behind the Album");
				expect(showTitles[7]).toHaveTextContent("Code & Coffee");
			});
		});

		describe("Duration Display", () => {
			it("should format show duration with hours and minutes for Code & Coffee", async () => {
				setupSuccessFetch(mockFetch);

				renderPodcastPage();

				await waitFor(() => {
					expect(screen.getByTestId("podcast-shows")).toBeInTheDocument();
				});

				// Code & Coffee totalDuration = 11300s => 3h 8m
				const codeCoffeeDuration = screen.getByTestId("podcast-show-duration-album-podcast-1");
				expect(codeCoffeeDuration).toHaveTextContent("3h 8m");
			});

			it("should format show duration correctly for Behind the Album", async () => {
				setupSuccessFetch(mockFetch);

				renderPodcastPage();

				await waitFor(() => {
					expect(screen.getByTestId("podcast-shows")).toBeInTheDocument();
				});

				// Behind the Album totalDuration = 13800s => 3h 50m
				const behindAlbumDuration = screen.getByTestId("podcast-show-duration-album-podcast-3");
				expect(behindAlbumDuration).toHaveTextContent("3h 50m");
			});

			it("should format show duration correctly for Design Matters", async () => {
				setupSuccessFetch(mockFetch);

				renderPodcastPage();

				await waitFor(() => {
					expect(screen.getByTestId("podcast-shows")).toBeInTheDocument();
				});

				// Design Matters totalDuration = 10000s => 2h 46m
				const designMattersDuration = screen.getByTestId("podcast-show-duration-album-podcast-4");
				expect(designMattersDuration).toHaveTextContent("2h 46m");
			});
		});

		describe("Top Shows", () => {
			it("should display exactly 5 shows in the top shows section", async () => {
				setupSuccessFetch(mockFetch);

				renderPodcastPage();

				await waitFor(() => {
					expect(screen.getByTestId("podcast-top-shows")).toBeInTheDocument();
				});

				const topShowsSection = screen.getByTestId("podcast-top-shows");
				const topShowCards = within(topShowsSection).getAllByText(
					/Code & Coffee|Startup Stories|Behind the Album|Design Matters|Data Science Daily|The Indie Hacker|DevOps Decoded|Music Theory 101/,
				);

				expect(topShowCards).toHaveLength(5);
			});

			it("should sort top shows by total play count in descending order", async () => {
				setupSuccessFetch(mockFetch);

				renderPodcastPage();

				await waitFor(() => {
					expect(screen.getByTestId("podcast-top-shows")).toBeInTheDocument();
				});

				const topShowsSection = screen.getByTestId("podcast-top-shows");
				const topShowCards = within(topShowsSection).getAllByText(
					/Code & Coffee|Startup Stories|Behind the Album|Design Matters|Data Science Daily|The Indie Hacker|DevOps Decoded|Music Theory 101/,
				);

				// Sorted by totalPlays desc: Behind the Album (40K), Design Matters (35K),
				// Data Science Daily (30K), Code & Coffee (25K), The Indie Hacker (20K)
				expect(topShowCards[0]).toHaveTextContent("Behind the Album");
				expect(topShowCards[1]).toHaveTextContent("Design Matters");
				expect(topShowCards[2]).toHaveTextContent("Data Science Daily");
				expect(topShowCards[3]).toHaveTextContent("Code & Coffee");
				expect(topShowCards[4]).toHaveTextContent("The Indie Hacker");
			});
		});

	});

	// ========== SHOW DETAIL VIEW ==========

	describe("Show Detail View", () => {
		describe("Episode Ordering", () => {
			it("should display episodes sorted by track number in ascending order by default", async () => {
				const user = userEvent.setup();
				setupSuccessFetch(mockFetch);

				renderPodcastPage();

				await waitFor(() => {
					expect(screen.queryByTestId("podcast-loading")).not.toBeInTheDocument();
				});

				await user.click(screen.getByTestId("podcast-show-album-podcast-1"));

				await waitFor(() => {
					expect(screen.getByTestId("podcast-selected-show")).toBeInTheDocument();
				});

				const episodesSection = screen.getByTestId("podcast-episodes");
				const episodeElements = within(episodesSection).getAllByTestId(/^podcast-episode-track-cc-/);

				expect(episodeElements).toHaveLength(5);
				expect(episodeElements[0]).toHaveAttribute("data-testid", "podcast-episode-track-cc-1");
				expect(episodeElements[1]).toHaveAttribute("data-testid", "podcast-episode-track-cc-2");
				expect(episodeElements[2]).toHaveAttribute("data-testid", "podcast-episode-track-cc-3");
				expect(episodeElements[3]).toHaveAttribute("data-testid", "podcast-episode-track-cc-4");
				expect(episodeElements[4]).toHaveAttribute("data-testid", "podcast-episode-track-cc-5");
			});

			it("should sort episodes newest first when latest sort is selected", async () => {
				const user = userEvent.setup();
				setupSuccessFetch(mockFetch);

				renderPodcastPage();

				await waitFor(() => {
					expect(screen.queryByTestId("podcast-loading")).not.toBeInTheDocument();
				});

				await user.click(screen.getByTestId("podcast-show-album-podcast-1"));

				await waitFor(() => {
					expect(screen.getByTestId("podcast-selected-show")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("podcast-sort-latest"));

				const episodesSection = screen.getByTestId("podcast-episodes");
				const episodeElements = within(episodesSection).getAllByTestId(/^podcast-episode-track-cc-/);

				// Newest first by createdAt: cc-5 (Jan 25), cc-4 (Jan 24), cc-3 (Jan 23), cc-2 (Jan 22), cc-1 (Jan 21)
				expect(episodeElements[0]).toHaveAttribute("data-testid", "podcast-episode-track-cc-5");
				expect(episodeElements[1]).toHaveAttribute("data-testid", "podcast-episode-track-cc-4");
				expect(episodeElements[2]).toHaveAttribute("data-testid", "podcast-episode-track-cc-3");
				expect(episodeElements[3]).toHaveAttribute("data-testid", "podcast-episode-track-cc-2");
				expect(episodeElements[4]).toHaveAttribute("data-testid", "podcast-episode-track-cc-1");
			});

			it("should sort episodes oldest first when oldest sort is selected", async () => {
				const user = userEvent.setup();
				setupSuccessFetch(mockFetch);

				renderPodcastPage();

				await waitFor(() => {
					expect(screen.queryByTestId("podcast-loading")).not.toBeInTheDocument();
				});

				await user.click(screen.getByTestId("podcast-show-album-podcast-1"));

				await waitFor(() => {
					expect(screen.getByTestId("podcast-selected-show")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("podcast-sort-oldest"));

				const episodesSection = screen.getByTestId("podcast-episodes");
				const episodeElements = within(episodesSection).getAllByTestId(/^podcast-episode-track-cc-/);

				// Oldest first by createdAt: cc-1 (Jan 21), cc-2 (Jan 22), cc-3 (Jan 23), cc-4 (Jan 24), cc-5 (Jan 25)
				expect(episodeElements[0]).toHaveAttribute("data-testid", "podcast-episode-track-cc-1");
				expect(episodeElements[1]).toHaveAttribute("data-testid", "podcast-episode-track-cc-2");
				expect(episodeElements[2]).toHaveAttribute("data-testid", "podcast-episode-track-cc-3");
				expect(episodeElements[3]).toHaveAttribute("data-testid", "podcast-episode-track-cc-4");
				expect(episodeElements[4]).toHaveAttribute("data-testid", "podcast-episode-track-cc-5");
			});
		});

		describe("Show Duration", () => {
			it("should display formatted total duration as 3h 8m for Code & Coffee in show detail", async () => {
				const user = userEvent.setup();
				setupSuccessFetch(mockFetch);

				renderPodcastPage();

				await waitFor(() => {
					expect(screen.queryByTestId("podcast-loading")).not.toBeInTheDocument();
				});

				await user.click(screen.getByTestId("podcast-show-album-podcast-1"));

				await waitFor(() => {
					expect(screen.getByTestId("podcast-selected-show")).toBeInTheDocument();
				});

				const durationElement = screen.getByTestId("podcast-show-detail-duration");
				expect(durationElement).toHaveTextContent("3h 8m");
			});

			it("should display formatted total duration for Behind the Album in show detail", async () => {
				const user = userEvent.setup();
				setupSuccessFetch(mockFetch);

				renderPodcastPage();

				await waitFor(() => {
					expect(screen.queryByTestId("podcast-loading")).not.toBeInTheDocument();
				});

				await user.click(screen.getByTestId("podcast-show-album-podcast-3"));

				await waitFor(() => {
					expect(screen.getByTestId("podcast-selected-show")).toBeInTheDocument();
				});

				// Behind the Album totalDuration = 13800s => 3h 50m
				const durationElement = screen.getByTestId("podcast-show-detail-duration");
				expect(durationElement).toHaveTextContent("3h 50m");
			});
		});

		describe("Episode Dates", () => {
			it("should format episode dates with abbreviated month name for first episode", async () => {
				const user = userEvent.setup();
				setupSuccessFetch(mockFetch);

				renderPodcastPage();

				await waitFor(() => {
					expect(screen.queryByTestId("podcast-loading")).not.toBeInTheDocument();
				});

				await user.click(screen.getByTestId("podcast-show-album-podcast-1"));

				await waitFor(() => {
					expect(screen.getByTestId("podcast-selected-show")).toBeInTheDocument();
				});

				expect(screen.getByTestId("podcast-episode-date-track-cc-1")).toHaveTextContent("Jan 21, 2024");
			});

			it("should format episode dates with abbreviated month name for last episode", async () => {
				const user = userEvent.setup();
				setupSuccessFetch(mockFetch);

				renderPodcastPage();

				await waitFor(() => {
					expect(screen.queryByTestId("podcast-loading")).not.toBeInTheDocument();
				});

				await user.click(screen.getByTestId("podcast-show-album-podcast-1"));

				await waitFor(() => {
					expect(screen.getByTestId("podcast-selected-show")).toBeInTheDocument();
				});

				expect(screen.getByTestId("podcast-episode-date-track-cc-5")).toHaveTextContent("Jan 25, 2024");
			});

			it("should format episode dates correctly for a different month", async () => {
				const user = userEvent.setup();
				setupSuccessFetch(mockFetch);

				renderPodcastPage();

				await waitFor(() => {
					expect(screen.queryByTestId("podcast-loading")).not.toBeInTheDocument();
				});

				await user.click(screen.getByTestId("podcast-show-album-podcast-2"));

				await waitFor(() => {
					expect(screen.getByTestId("podcast-selected-show")).toBeInTheDocument();
				});

				// Startup Stories Ep 1: 2024-06-06 => "Jun 6, 2024"
				expect(screen.getByTestId("podcast-episode-date-track-ss-1")).toHaveTextContent("Jun 6, 2024");
			});
		});

		describe("Play Count Display", () => {
			it("should display formatted play count as 25K for Code & Coffee", async () => {
				const user = userEvent.setup();
				setupSuccessFetch(mockFetch);

				renderPodcastPage();

				await waitFor(() => {
					expect(screen.queryByTestId("podcast-loading")).not.toBeInTheDocument();
				});

				await user.click(screen.getByTestId("podcast-show-album-podcast-1"));

				await waitFor(() => {
					expect(screen.getByTestId("podcast-selected-show")).toBeInTheDocument();
				});

				const playCountElement = screen.getByTestId("podcast-show-detail-play-count");
				expect(playCountElement).toHaveTextContent("25K");
			});

			it("should display formatted play count as 40K for Behind the Album", async () => {
				const user = userEvent.setup();
				setupSuccessFetch(mockFetch);

				renderPodcastPage();

				await waitFor(() => {
					expect(screen.queryByTestId("podcast-loading")).not.toBeInTheDocument();
				});

				await user.click(screen.getByTestId("podcast-show-album-podcast-3"));

				await waitFor(() => {
					expect(screen.getByTestId("podcast-selected-show")).toBeInTheDocument();
				});

				const playCountElement = screen.getByTestId("podcast-show-detail-play-count");
				expect(playCountElement).toHaveTextContent("40K");
			});

			it("should display formatted play count as 5K for Music Theory 101", async () => {
				const user = userEvent.setup();
				setupSuccessFetch(mockFetch);

				renderPodcastPage();

				await waitFor(() => {
					expect(screen.queryByTestId("podcast-loading")).not.toBeInTheDocument();
				});

				await user.click(screen.getByTestId("podcast-show-album-podcast-8"));

				await waitFor(() => {
					expect(screen.getByTestId("podcast-selected-show")).toBeInTheDocument();
				});

				const playCountElement = screen.getByTestId("podcast-show-detail-play-count");
				expect(playCountElement).toHaveTextContent("5K");
			});
		});
	});

	// ========== EPISODE DETAIL VIEW ==========

	describe("Episode Detail View", () => {
		describe("Episode Description", () => {
			it("should display the episode description text for first episode", async () => {
				const user = userEvent.setup();
				setupSuccessFetch(mockFetch);

				renderPodcastPage();

				await waitFor(() => {
					expect(screen.queryByTestId("podcast-loading")).not.toBeInTheDocument();
				});

				await user.click(screen.getByTestId("podcast-show-album-podcast-1"));

				await waitFor(() => {
					expect(screen.getByTestId("podcast-selected-show")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("podcast-episode-track-cc-1"));

				await waitFor(() => {
					expect(screen.getByTestId("podcast-selected-episode")).toBeInTheDocument();
				});

				const descriptionElement = screen.getByTestId("podcast-episode-description");
				expect(descriptionElement).toHaveTextContent(
					"Learn the basics of TypeScript and why it matters for modern development.",
				);
			});

			it("should display the episode description text for a different episode", async () => {
				const user = userEvent.setup();
				setupSuccessFetch(mockFetch);

				renderPodcastPage();

				await waitFor(() => {
					expect(screen.queryByTestId("podcast-loading")).not.toBeInTheDocument();
				});

				await user.click(screen.getByTestId("podcast-show-album-podcast-1"));

				await waitFor(() => {
					expect(screen.getByTestId("podcast-selected-show")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("podcast-episode-track-cc-3"));

				await waitFor(() => {
					expect(screen.getByTestId("podcast-selected-episode")).toBeInTheDocument();
				});

				const descriptionElement = screen.getByTestId("podcast-episode-description");
				expect(descriptionElement).toHaveTextContent(
					"Best practices for Node.js server development and architecture.",
				);
			});
		});

		describe("Up Next Episodes", () => {
			it("should show episodes after the selected episode in up next section", async () => {
				const user = userEvent.setup();
				setupSuccessFetch(mockFetch);

				renderPodcastPage();

				await waitFor(() => {
					expect(screen.queryByTestId("podcast-loading")).not.toBeInTheDocument();
				});

				await user.click(screen.getByTestId("podcast-show-album-podcast-1"));

				await waitFor(() => {
					expect(screen.getByTestId("podcast-selected-show")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("podcast-episode-track-cc-2"));

				await waitFor(() => {
					expect(screen.getByTestId("podcast-selected-episode")).toBeInTheDocument();
				});

				// Up Next should contain episodes AFTER the selected one (Ep 3, 4, 5)
				const upNextSection = screen.getByTestId("podcast-up-next");
				expect(within(upNextSection).getByTestId("podcast-up-next-episode-track-cc-3")).toBeInTheDocument();
				expect(within(upNextSection).getByTestId("podcast-up-next-episode-track-cc-4")).toBeInTheDocument();
				expect(within(upNextSection).getByTestId("podcast-up-next-episode-track-cc-5")).toBeInTheDocument();

				// Episodes 1 and 2 should NOT appear in up-next
				expect(within(upNextSection).queryByTestId("podcast-up-next-episode-track-cc-1")).not.toBeInTheDocument();
				expect(within(upNextSection).queryByTestId("podcast-up-next-episode-track-cc-2")).not.toBeInTheDocument();
			});

			it("should show no up next episodes when the last episode is selected", async () => {
				const user = userEvent.setup();
				setupSuccessFetch(mockFetch);

				renderPodcastPage();

				await waitFor(() => {
					expect(screen.queryByTestId("podcast-loading")).not.toBeInTheDocument();
				});

				await user.click(screen.getByTestId("podcast-show-album-podcast-1"));

				await waitFor(() => {
					expect(screen.getByTestId("podcast-selected-show")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("podcast-episode-track-cc-5"));

				await waitFor(() => {
					expect(screen.getByTestId("podcast-selected-episode")).toBeInTheDocument();
				});

				// Last episode has no up-next
				const upNextSection = screen.getByTestId("podcast-up-next");
				expect(within(upNextSection).queryByTestId(/podcast-up-next-episode/)).not.toBeInTheDocument();
			});

			it("should show all remaining episodes when the first episode is selected", async () => {
				const user = userEvent.setup();
				setupSuccessFetch(mockFetch);

				renderPodcastPage();

				await waitFor(() => {
					expect(screen.queryByTestId("podcast-loading")).not.toBeInTheDocument();
				});

				await user.click(screen.getByTestId("podcast-show-album-podcast-1"));

				await waitFor(() => {
					expect(screen.getByTestId("podcast-selected-show")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("podcast-episode-track-cc-1"));

				await waitFor(() => {
					expect(screen.getByTestId("podcast-selected-episode")).toBeInTheDocument();
				});

				// First episode selected → up-next should have episodes 2, 3, 4, 5
				const upNextSection = screen.getByTestId("podcast-up-next");
				expect(within(upNextSection).getByTestId("podcast-up-next-episode-track-cc-2")).toBeInTheDocument();
				expect(within(upNextSection).getByTestId("podcast-up-next-episode-track-cc-3")).toBeInTheDocument();
				expect(within(upNextSection).getByTestId("podcast-up-next-episode-track-cc-4")).toBeInTheDocument();
				expect(within(upNextSection).getByTestId("podcast-up-next-episode-track-cc-5")).toBeInTheDocument();

				// Episode 1 should NOT appear
				expect(within(upNextSection).queryByTestId("podcast-up-next-episode-track-cc-1")).not.toBeInTheDocument();
			});
		});
	});

	// ========== PLAYBACK ==========

	describe("Playback", () => {
		describe("Play All", () => {
			it("should start playback from first episode when clicking Play All", async () => {
				const user = userEvent.setup();
				setupSuccessFetch(mockFetch);

				renderPodcastPage();

				await waitFor(() => {
					expect(screen.queryByTestId("podcast-loading")).not.toBeInTheDocument();
				});

				await user.click(screen.getByTestId("podcast-show-album-podcast-1"));

				await waitFor(() => {
					expect(screen.getByTestId("podcast-selected-show")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("podcast-play-all"));

				await waitFor(() => {
					expect(screen.getByTestId("podcast-now-playing-track-cc-1")).toBeInTheDocument();
				});
			});
		});

		describe("Play Single Episode", () => {
			it("should play the correct episode when clicking play on episode 3", async () => {
				const user = userEvent.setup();
				setupSuccessFetch(mockFetch);

				renderPodcastPage();

				await waitFor(() => {
					expect(screen.queryByTestId("podcast-loading")).not.toBeInTheDocument();
				});

				await user.click(screen.getByTestId("podcast-show-album-podcast-1"));

				await waitFor(() => {
					expect(screen.getByTestId("podcast-selected-show")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("podcast-play-episode-track-cc-3"));

				await waitFor(() => {
					expect(screen.getByTestId("podcast-now-playing-track-cc-3")).toBeInTheDocument();
				});
			});

			it("should play the correct episode when clicking play on the last episode", async () => {
				const user = userEvent.setup();
				setupSuccessFetch(mockFetch);

				renderPodcastPage();

				await waitFor(() => {
					expect(screen.queryByTestId("podcast-loading")).not.toBeInTheDocument();
				});

				await user.click(screen.getByTestId("podcast-show-album-podcast-1"));

				await waitFor(() => {
					expect(screen.getByTestId("podcast-selected-show")).toBeInTheDocument();
				});

				await user.click(screen.getByTestId("podcast-play-episode-track-cc-5"));

				await waitFor(() => {
					expect(screen.getByTestId("podcast-now-playing-track-cc-5")).toBeInTheDocument();
				});
			});
		});
	});
});
