import * as dotenv from "dotenv";
dotenv.config();

import * as bcrypt from "bcryptjs";
import mongoose, { Types } from "mongoose";
import { User } from "../features/users/user.model.js";
import { Artist } from "../features/artists/artist.model.js";
import { Album } from "../features/albums/album.model.js";
import { Track } from "../features/tracks/track.model.js";
import { Playlist } from "../features/playlists/playlist.model.js";
import { Subscription } from "../features/subscription/subscription.model.js";
import { SubscriptionPlan } from "../features/subscription/subscription.types.js";
import { Mix } from "../features/mixes/mix.model.js";
import { Concert } from "../features/concerts/concert.model.js";
import { initConfig } from "../shared/config/index.js";

const config = initConfig();

interface ArtistSeedData {
	name: string;
	genre: string;
	bio: string;
	imageUrl: string;
	albums: AlbumSeedData[];
}

interface AlbumSeedData {
	title: string;
	releaseDate: Date;
	coverImageUrl: string;
	tracks: TrackSeedData[];
}

interface TrackSeedData {
	title: string;
	durationInSeconds: number;
	coverImageUrl: string;
	description?: string;
	playCount?: number;
	createdAt?: Date;
}

function randomDuration(): number {
	return Math.floor(Math.random() * (300 - 180 + 1)) + 180;
}

const artistsSeedData: ArtistSeedData[] = [
	{
		name: "The Amplifiers",
		genre: "rock",
		bio: "A powerful rock band known for electrifying performances and anthemic songs.",
		imageUrl: "/images/artists/the-amplifiers.jpg",
		albums: [
			{
				title: "Electric Storm",
				releaseDate: new Date("2012-03-15"),
				coverImageUrl: "/images/albums/electric-storm.jpg",
				tracks: [
					{ title: "Thunder Road", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/thunder-road.jpg" },
					{ title: "Lightning Strike", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/lightning-strike.jpg" },
					{ title: "Storm Chaser", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/storm-chaser.jpg" },
					{ title: "Electric Rain", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/electric-rain.jpg" },
					{ title: "Voltage Drop", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/voltage-drop.jpg" },
				],
			},
			{
				title: "Voltage",
				releaseDate: new Date("2023-07-20"),
				coverImageUrl: "/images/albums/voltage.jpg",
				tracks: [
					{ title: "High Voltage", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/high-voltage.jpg" },
					{ title: "Power Surge", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/power-surge.jpg" },
					{ title: "Circuit Breaker", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/circuit-breaker.jpg" },
					{ title: "Amp It Up", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/amp-it-up.jpg" },
					{ title: "Wired", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/wired.jpg" },
				],
			},
		],
	},
	{
		name: "Neon Dreams",
		genre: "pop",
		bio: "Chart-topping pop sensation with catchy hooks and unforgettable melodies.",
		imageUrl: "/images/artists/neon-dreams.jpg",
		albums: [
			{
				title: "Starlight",
				releaseDate: new Date("2015-11-10"),
				coverImageUrl: "/images/albums/starlight.jpg",
				tracks: [
					{ title: "Dancing in the Moonlight", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/dancing-in-the-moonlight.jpg" },
					{ title: "Summer Nights", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/summer-nights.jpg" },
					{ title: "Heartbeat", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/heartbeat.jpg" },
					{ title: "Cosmic Love", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/cosmic-love.jpg" },
					{ title: "Stargazer", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/stargazer.jpg" },
				],
			},
			{
				title: "Glow",
				releaseDate: new Date("2023-02-14"),
				coverImageUrl: "/images/albums/glow.jpg",
				tracks: [
					{ title: "Radiant", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/radiant.jpg" },
					{ title: "Shine On", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/shine-on.jpg" },
					{ title: "Golden Hour", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/golden-hour.jpg" },
					{ title: "Luminous", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/luminous.jpg" },
					{ title: "Firefly", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/firefly.jpg" },
				],
			},
		],
	},
	{
		name: "Blue Note Quartet",
		genre: "jazz",
		bio: "Sophisticated jazz ensemble blending classic traditions with modern innovation.",
		imageUrl: "/images/artists/blue-note-quartet.jpg",
		albums: [
			{
				title: "Midnight Sessions",
				releaseDate: new Date("1995-09-05"),
				coverImageUrl: "/images/albums/midnight-sessions.jpg",
				tracks: [
					{ title: "Blue Velvet", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/blue-velvet.jpg" },
					{ title: "Smooth Operator", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/smooth-operator.jpg" },
					{ title: "Late Night Jazz", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/late-night-jazz.jpg" },
					{ title: "Moonlit Serenade", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/moonlit-serenade.jpg" },
					{ title: "Twilight Groove", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/twilight-groove.jpg" },
				],
			},
			{
				title: "Saxophone Dreams",
				releaseDate: new Date("1987-05-22"),
				coverImageUrl: "/images/albums/saxophone-dreams.jpg",
				tracks: [
					{ title: "Soulful Sax", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/soulful-sax.jpg" },
					{ title: "Bebop Blues", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/bebop-blues.jpg" },
					{ title: "Swing Time", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/swing-time.jpg" },
					{ title: "Jazz Fusion", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/jazz-fusion.jpg" },
					{ title: "Cool Breeze", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/cool-breeze.jpg" },
				],
			},
		],
	},
	{
		name: "Synthwave Collective",
		genre: "electronic",
		bio: "Retro-futuristic electronic producers creating immersive soundscapes.",
		imageUrl: "/images/artists/synthwave-collective.jpg",
		albums: [
			{
				title: "Digital Horizons",
				releaseDate: new Date("2003-06-18"),
				coverImageUrl: "/images/albums/digital-horizons.jpg",
				tracks: [
					{ title: "Neon City", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/neon-city.jpg" },
					{ title: "Cyber Drive", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/cyber-drive.jpg" },
					{ title: "Binary Sunset", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/binary-sunset.jpg" },
					{ title: "Data Stream", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/data-stream.jpg" },
					{ title: "Pixel Dreams", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/pixel-dreams.jpg" },
				],
			},
			{
				title: "Retrowave",
				releaseDate: new Date("2023-04-22"),
				coverImageUrl: "/images/albums/retrowave.jpg",
				tracks: [
					{ title: "Arcade Nights", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/arcade-nights.jpg" },
					{ title: "VHS Memories", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/vhs-memories.jpg" },
					{ title: "Laser Grid", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/laser-grid.jpg" },
					{ title: "Synth Runner", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/synth-runner.jpg" },
					{ title: "Chrome Future", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/chrome-future.jpg" },
				],
			},
		],
	},
	{
		name: "Urban Beats",
		genre: "hip-hop",
		bio: "Street-smart hip-hop collective delivering hard-hitting beats and clever lyrics.",
		imageUrl: "/images/artists/urban-beats.jpg",
		albums: [
			{
				title: "City Streets",
				releaseDate: new Date("2005-08-30"),
				coverImageUrl: "/images/albums/city-streets.jpg",
				tracks: [
					{ title: "Block Party", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/block-party.jpg" },
					{ title: "Concrete Jungle", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/concrete-jungle.jpg" },
					{ title: "Street Dreams", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/street-dreams.jpg" },
					{ title: "Hood Anthem", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/hood-anthem.jpg" },
					{ title: "Night Rider", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/night-rider.jpg" },
				],
			},
			{
				title: "Hustle Mode",
				releaseDate: new Date("2023-10-15"),
				coverImageUrl: "/images/albums/hustle-mode.jpg",
				tracks: [
					{ title: "Grind Time", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/grind-time.jpg" },
					{ title: "Stack Paper", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/stack-paper.jpg" },
					{ title: "Rise Up", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/rise-up.jpg" },
					{ title: "Money Moves", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/money-moves.jpg" },
					{ title: "Boss Level", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/boss-level.jpg" },
				],
			},
		],
	},
	{
		name: "Velvet Grooves",
		genre: "r-and-b",
		bio: "Soulful R&B group blending classic Motown vibes with modern production and smooth vocal harmonies.",
		imageUrl: "/images/artists/velvet-grooves.jpg",
		albums: [
			{
				title: "Soul Sessions",
				releaseDate: new Date("1998-06-20"),
				coverImageUrl: "/images/albums/soul-sessions.jpg",
				tracks: [
					{ title: "Silk and Satin", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/silk-and-satin.jpg" },
					{ title: "Velvet Night", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/velvet-night.jpg" },
					{ title: "Soul Fire", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/soul-fire.jpg" },
					{ title: "Golden Touch", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/golden-touch.jpg" },
					{ title: "Midnight Groove", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/midnight-groove.jpg" },
				],
			},
			{
				title: "Midnight Velvet",
				releaseDate: new Date("2023-09-15"),
				coverImageUrl: "/images/albums/midnight-velvet.jpg",
				tracks: [
					{ title: "After Hours", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/after-hours.jpg" },
					{ title: "Purple Rain Dance", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/purple-rain-dance.jpg" },
					{ title: "Smooth Criminal Love", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/smooth-criminal-love.jpg" },
					{ title: "City Lights Serenade", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/city-lights-serenade.jpg" },
					{ title: "Velvet Dreams", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/velvet-dreams.jpg" },
				],
			},
		],
	},
	{
		name: "Pacific Symphony",
		genre: "classical",
		bio: "Award-winning American orchestral ensemble performing both timeless classical masterworks and bold contemporary compositions.",
		imageUrl: "/images/artists/pacific-symphony.jpg",
		albums: [
			{
				title: "Heritage Suite",
				releaseDate: new Date("1985-03-10"),
				coverImageUrl: "/images/albums/heritage-suite.jpg",
				tracks: [
					{ title: "American Overture", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/american-overture.jpg" },
					{ title: "Prairie Winds", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/prairie-winds.jpg" },
					{ title: "Liberty March", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/liberty-march.jpg" },
					{ title: "Mountain Echoes", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/mountain-echoes.jpg" },
					{ title: "Frontier Fanfare", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/frontier-fanfare.jpg" },
				],
			},
			{
				title: "American Concerto",
				releaseDate: new Date("2022-11-05"),
				coverImageUrl: "/images/albums/american-concerto.jpg",
				tracks: [
					{ title: "New World Rising", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/new-world-rising.jpg" },
					{ title: "Skyline Sonata", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/skyline-sonata.jpg" },
					{ title: "Metropolitan Suite", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/metropolitan-suite.jpg" },
					{ title: "Coastal Prelude", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/coastal-prelude.jpg" },
					{ title: "Stars and Stripes Rhapsody", durationInSeconds: randomDuration(), coverImageUrl: "/images/tracks/stars-and-stripes-rhapsody.jpg" },
				],
			},
		],
	},
	{
		name: "Tech Talk Daily",
		genre: "podcast",
		bio: "A daily podcast covering the latest in technology, software development, and innovation.",
		imageUrl: "/images/artists/tech-talk-daily.jpg",
		albums: [
			{
				title: "Code & Coffee",
				releaseDate: new Date("2024-01-15"),
				coverImageUrl: "/images/albums/code-and-coffee.jpg",
				tracks: [
					{ title: "Ep 1: The Rise of TypeScript", durationInSeconds: 1800, coverImageUrl: "/images/tracks/ep-1-the-rise-of-typescript.jpg", description: "Learn the basics of TypeScript and why it matters for modern web development." },
					{ title: "Ep 2: React vs Vue in 2024", durationInSeconds: 2400, coverImageUrl: "/images/tracks/ep-2-react-vs-vue-in-2024.jpg", description: "A head-to-head comparison of React and Vue, exploring strengths, weaknesses, and community trends." },
					{ title: "Ep 3: AI in Software Development", durationInSeconds: 2100, coverImageUrl: "/images/tracks/ep-3-ai-in-software-development.jpg", description: "How artificial intelligence is transforming the way developers write, test, and deploy code." },
					{ title: "Ep 4: Cloud Native Architecture", durationInSeconds: 1500, coverImageUrl: "/images/tracks/ep-4-cloud-native-architecture.jpg", description: "An introduction to cloud native principles, containers, and microservices for scalable applications." },
					{ title: "Ep 5: The Future of Web Assembly", durationInSeconds: 3600, coverImageUrl: "/images/tracks/ep-5-the-future-of-web-assembly.jpg", description: "Exploring WebAssembly and its potential to reshape browser-based and server-side computing." },
				],
			},
			{
				title: "Startup Stories",
				releaseDate: new Date("2024-06-01"),
				coverImageUrl: "/images/albums/startup-stories.jpg",
				tracks: [
					{ title: "Ep 1: From Garage to IPO", durationInSeconds: 2700, coverImageUrl: "/images/tracks/ep-1-from-garage-to-ipo.jpg", description: "The inspiring journey of a startup that grew from a small garage project to a successful public offering." },
					{ title: "Ep 2: Bootstrapping vs Venture Capital", durationInSeconds: 1800, coverImageUrl: "/images/tracks/ep-2-bootstrapping-vs-venture-capital.jpg", description: "Weighing the trade-offs between self-funding your startup and raising venture capital." },
					{ title: "Ep 3: Scaling to a Million Users", durationInSeconds: 3200, coverImageUrl: "/images/tracks/ep-3-scaling-to-a-million-users.jpg", description: "Practical strategies and hard lessons learned while scaling infrastructure and teams to support rapid growth." },
					{ title: "Ep 4: The Pivot That Saved Us", durationInSeconds: 2000, coverImageUrl: "/images/tracks/ep-4-the-pivot-that-saved-us.jpg", description: "A candid look at how recognizing a failing strategy and pivoting early saved a company from shutting down." },
					{ title: "Ep 5: Building Remote Teams", durationInSeconds: 2400, coverImageUrl: "/images/tracks/ep-5-building-remote-teams.jpg", description: "Best practices for hiring, managing, and retaining talent in a fully distributed remote team." },
				],
			},
			{
				title: "Data Science Daily",
				releaseDate: new Date("2024-08-10"),
				coverImageUrl: "/images/albums/data-science-daily.jpg",
				tracks: [
					{ title: "Ep 1: Introduction to Machine Learning", durationInSeconds: 2400, coverImageUrl: "/images/tracks/ep-1-introduction-to-machine-learning.jpg", playCount: 6000, createdAt: new Date("2024-08-10"), description: "A beginner-friendly overview of machine learning concepts, algorithms, and real-world applications." },
					{ title: "Ep 2: Python for Data Analysis", durationInSeconds: 1800, coverImageUrl: "/images/tracks/ep-2-python-for-data-analysis.jpg", playCount: 6000, createdAt: new Date("2024-08-12"), description: "How Python and its ecosystem of libraries became the go-to language for data analysis and visualization." },
					{ title: "Ep 3: Deep Learning Demystified", durationInSeconds: 3000, coverImageUrl: "/images/tracks/ep-3-deep-learning-demystified.jpg", playCount: 6000, createdAt: new Date("2024-08-15"), description: "Breaking down neural networks, backpropagation, and the key ideas powering deep learning breakthroughs." },
					{ title: "Ep 4: Big Data Infrastructure", durationInSeconds: 2700, coverImageUrl: "/images/tracks/ep-4-big-data-infrastructure.jpg", playCount: 6000, createdAt: new Date("2024-08-18"), description: "An overview of distributed computing frameworks like Spark and Hadoop for processing massive datasets." },
					{ title: "Ep 5: Ethics in AI and Data", durationInSeconds: 2100, coverImageUrl: "/images/tracks/ep-5-ethics-in-ai-and-data.jpg", playCount: 6000, createdAt: new Date("2024-08-21"), description: "Examining the ethical challenges of bias, privacy, and accountability in artificial intelligence systems." },
				],
			},
			{
				title: "DevOps Decoded",
				releaseDate: new Date("2024-10-05"),
				coverImageUrl: "/images/albums/devops-decoded.jpg",
				tracks: [
					{ title: "Ep 1: What Is DevOps Really?", durationInSeconds: 1500, coverImageUrl: "/images/tracks/ep-1-what-is-devops-really.jpg", playCount: 2000, createdAt: new Date("2024-10-05"), description: "Cutting through the buzzwords to explain what DevOps culture, practices, and tools actually look like." },
					{ title: "Ep 2: CI/CD Pipelines from Scratch", durationInSeconds: 2400, coverImageUrl: "/images/tracks/ep-2-cicd-pipelines-from-scratch.jpg", playCount: 2000, createdAt: new Date("2024-10-08"), description: "A step-by-step guide to building continuous integration and deployment pipelines for modern applications." },
					{ title: "Ep 3: Containers and Kubernetes 101", durationInSeconds: 3600, coverImageUrl: "/images/tracks/ep-3-containers-and-kubernetes-101.jpg", playCount: 2000, createdAt: new Date("2024-10-11"), description: "Understanding container orchestration with Kubernetes and why it has become the industry standard." },
					{ title: "Ep 4: Infrastructure as Code", durationInSeconds: 2100, coverImageUrl: "/images/tracks/ep-4-infrastructure-as-code.jpg", playCount: 2000, createdAt: new Date("2024-10-14"), description: "How tools like Terraform and Pulumi let teams manage cloud infrastructure through declarative code." },
					{ title: "Ep 5: Monitoring and Observability", durationInSeconds: 1800, coverImageUrl: "/images/tracks/ep-5-monitoring-and-observability.jpg", playCount: 2000, createdAt: new Date("2024-10-17"), description: "The difference between monitoring and observability, and how to implement both effectively in production." },
				],
			},
		],
	},
	{
		name: "Music Stories",
		genre: "podcast",
		bio: "Behind-the-scenes stories from the music industry, artist interviews, and album deep dives.",
		imageUrl: "/images/artists/music-stories.jpg",
		albums: [
			{
				title: "Behind the Album",
				releaseDate: new Date("2024-03-20"),
				coverImageUrl: "/images/albums/behind-the-album.jpg",
				tracks: [
					{ title: "Ep 1: The Making of Dark Side of the Moon", durationInSeconds: 3600, coverImageUrl: "/images/tracks/ep-1-the-making-of-dark-side-of-the-moon.jpg", description: "An in-depth look at the creative process behind Pink Floyd's legendary album and its lasting cultural impact." },
					{ title: "Ep 2: How Thriller Changed Pop Music", durationInSeconds: 2700, coverImageUrl: "/images/tracks/ep-2-how-thriller-changed-pop-music.jpg", description: "Exploring how Michael Jackson's Thriller redefined pop music production, marketing, and global reach." },
					{ title: "Ep 3: The Story Behind Bohemian Rhapsody", durationInSeconds: 3000, coverImageUrl: "/images/tracks/ep-3-the-story-behind-bohemian-rhapsody.jpg", description: "The untold story of how Queen crafted one of rock's most ambitious and unconventional singles." },
					{ title: "Ep 4: Nirvana and the Grunge Revolution", durationInSeconds: 2400, coverImageUrl: "/images/tracks/ep-4-nirvana-and-the-grunge-revolution.jpg", description: "How Nirvana's raw sound and cultural attitude sparked the grunge movement and changed rock forever." },
					{ title: "Ep 5: The Evolution of Hip-Hop Production", durationInSeconds: 2100, coverImageUrl: "/images/tracks/ep-5-the-evolution-of-hip-hop-production.jpg", description: "Tracing the evolution of hip-hop beats from early sampling techniques to modern digital production." },
				],
			},
			{
				title: "Music Theory 101",
				releaseDate: new Date("2024-11-01"),
				coverImageUrl: "/images/albums/music-theory-101.jpg",
				tracks: [
					{ title: "Ep 1: Understanding Scales and Keys", durationInSeconds: 1800, coverImageUrl: "/images/tracks/ep-1-understanding-scales-and-keys.jpg", playCount: 1000, createdAt: new Date("2024-11-01"), description: "A foundational guide to major and minor scales, key signatures, and how they shape every piece of music." },
					{ title: "Ep 2: Chord Progressions Explained", durationInSeconds: 2400, coverImageUrl: "/images/tracks/ep-2-chord-progressions-explained.jpg", playCount: 1000, createdAt: new Date("2024-11-04"), description: "How chords are built and combined into progressions that drive the emotional arc of a song." },
					{ title: "Ep 3: Rhythm and Time Signatures", durationInSeconds: 1500, coverImageUrl: "/images/tracks/ep-3-rhythm-and-time-signatures.jpg", playCount: 1000, createdAt: new Date("2024-11-07"), description: "Exploring how different time signatures and rhythmic patterns create the feel and groove of music." },
					{ title: "Ep 4: The Art of Melody Writing", durationInSeconds: 2100, coverImageUrl: "/images/tracks/ep-4-the-art-of-melody-writing.jpg", playCount: 1000, createdAt: new Date("2024-11-10"), description: "Techniques for crafting memorable melodies, from motif development to contour and phrasing." },
					{ title: "Ep 5: Harmony and Counterpoint", durationInSeconds: 3000, coverImageUrl: "/images/tracks/ep-5-harmony-and-counterpoint.jpg", playCount: 1000, createdAt: new Date("2024-11-13"), description: "An introduction to harmonic structure and the classical art of writing independent musical lines." },
				],
			},
		],
	},
	{
		name: "Creative Minds",
		genre: "podcast",
		bio: "A podcast network exploring design, creativity, and the intersection of art and technology.",
		imageUrl: "/images/artists/creative-minds.jpg",
		albums: [
			{
				title: "Design Matters",
				releaseDate: new Date("2024-05-01"),
				coverImageUrl: "/images/albums/design-matters.jpg",
				tracks: [
					{ title: "Ep 1: The Principles of Good Design", durationInSeconds: 2400, coverImageUrl: "/images/tracks/ep-1-the-principles-of-good-design.jpg", playCount: 7000, createdAt: new Date("2024-05-01"), description: "Exploring timeless design principles from Dieter Rams to modern product thinking and user experience." },
					{ title: "Ep 2: Color Theory in Practice", durationInSeconds: 1800, coverImageUrl: "/images/tracks/ep-2-color-theory-in-practice.jpg", playCount: 7000, createdAt: new Date("2024-05-04"), description: "How designers use color psychology and theory to create compelling visual experiences across media." },
					{ title: "Ep 3: Typography That Speaks", durationInSeconds: 2100, coverImageUrl: "/images/tracks/ep-3-typography-that-speaks.jpg", playCount: 7000, createdAt: new Date("2024-05-07"), description: "The art and science of choosing typefaces that communicate tone, hierarchy, and brand personality." },
					{ title: "Ep 4: UX Research Methods", durationInSeconds: 3000, coverImageUrl: "/images/tracks/ep-4-ux-research-methods.jpg", playCount: 7000, createdAt: new Date("2024-05-10"), description: "A practical guide to user research techniques including interviews, usability tests, and survey design." },
					{ title: "Ep 5: Designing for Accessibility", durationInSeconds: 2700, coverImageUrl: "/images/tracks/ep-5-designing-for-accessibility.jpg", playCount: 7000, createdAt: new Date("2024-05-13"), description: "Why inclusive design matters and how to build products that work for people of all abilities." },
				],
			},
		],
	},
	{
		name: "Startup Radio",
		genre: "podcast",
		bio: "Independent podcasts covering entrepreneurship, bootstrapping, and the indie business journey.",
		imageUrl: "/images/artists/startup-radio.jpg",
		albums: [
			{
				title: "The Indie Hacker",
				releaseDate: new Date("2024-07-15"),
				coverImageUrl: "/images/albums/the-indie-hacker.jpg",
				tracks: [
					{ title: "Ep 1: Building in Public", durationInSeconds: 2100, coverImageUrl: "/images/tracks/ep-1-building-in-public.jpg", playCount: 4000, createdAt: new Date("2024-07-15"), description: "The benefits and risks of sharing your startup journey openly and how transparency builds trust." },
					{ title: "Ep 2: Finding Your First 100 Customers", durationInSeconds: 1500, coverImageUrl: "/images/tracks/ep-2-finding-your-first-100-customers.jpg", playCount: 4000, createdAt: new Date("2024-07-18"), description: "Practical strategies for acquiring your earliest customers without a marketing budget or brand recognition." },
					{ title: "Ep 3: Revenue Before Funding", durationInSeconds: 2700, coverImageUrl: "/images/tracks/ep-3-revenue-before-funding.jpg", playCount: 4000, createdAt: new Date("2024-07-21"), description: "Why focusing on revenue from day one can build a more sustainable business than chasing venture capital." },
					{ title: "Ep 4: Solo Founder Survival Guide", durationInSeconds: 3600, coverImageUrl: "/images/tracks/ep-4-solo-founder-survival-guide.jpg", playCount: 4000, createdAt: new Date("2024-07-24"), description: "Mental health, time management, and prioritization tactics for founders building companies alone." },
					{ title: "Ep 5: Scaling Without a Team", durationInSeconds: 1200, coverImageUrl: "/images/tracks/ep-5-scaling-without-a-team.jpg", playCount: 4000, createdAt: new Date("2024-07-27"), description: "Leveraging automation, no-code tools, and strategic outsourcing to grow without full-time hires." },
				],
			},
		],
	},
];

const testUsers = [
	{
		email: "alex.morgan@melodio.com",
		password: "password123",
		username: "alexmorgan",
		displayName: "Alex Morgan",
	},
	{
		email: "jordan.casey@melodio.com",
		password: "password123",
		username: "jordancasey",
		displayName: "Jordan Casey",
	},
];

async function clearDatabase(): Promise<void> {
	console.log("Clearing existing data...");

	await Promise.all([
		User.deleteMany({}),
		Artist.deleteMany({}),
		Album.deleteMany({}),
		Track.deleteMany({}),
		Playlist.deleteMany({}),
		Subscription.deleteMany({}),
		Mix.deleteMany({}),
		Concert.deleteMany({}),
	]);

	console.log("Existing data cleared.");
}

async function seedArtistsAlbumsAndTracks(): Promise<{
	artistCount: number;
	albumCount: number;
	trackCount: number;
}> {
	let artistCount = 0;
	let albumCount = 0;
	let trackCount = 0;

	console.log("Creating artists, albums, and tracks...");

	for (const artistData of artistsSeedData) {
		const artist = await Artist.create({
			name: artistData.name,
			bio: artistData.bio,
			image_url: artistData.imageUrl,
			genres: [artistData.genre],
			follower_count: Math.floor(Math.random() * 100000),
		});
		artistCount++;
		console.log(`  Created artist: ${artist.name}`);

		for (const albumData of artistData.albums) {
			const album = await Album.create({
				title: albumData.title,
				artist_id: artist._id,
				release_date: albumData.releaseDate,
				cover_image_url: albumData.coverImageUrl,
				total_tracks: albumData.tracks.length,
			});
			albumCount++;
			console.log(`    Created album: ${album.title}`);

			for (let i = 0; i < albumData.tracks.length; i++) {
				const trackData = albumData.tracks[i]!;
				await Track.create({
					title: trackData.title,
					artist_id: artist._id,
					album_id: album._id,
					duration_in_seconds: trackData.durationInSeconds,
					track_number: i + 1,
					genre: artistData.genre,
					play_count: trackData.playCount ?? Math.floor(Math.random() * 10000),
					cover_image_url: trackData.coverImageUrl,
					...(trackData.description && { description: trackData.description }),
					...(trackData.createdAt && { created_at: trackData.createdAt }),
				});
				trackCount++;
			}
			console.log(`      Created ${albumData.tracks.length} tracks`);
		}
	}

	return { artistCount, albumCount, trackCount };
}

async function seedUsers(): Promise<{ userCount: number; subscriptionCount: number }> {
	console.log("Creating test users...");

	const saltRounds = 10;
	let userCount = 0;
	let subscriptionCount = 0;

	for (const userData of testUsers) {
		const passwordHash = await bcrypt.hash(userData.password, saltRounds);

		const user = await User.create({
			email: userData.email,
			username: userData.username,
			password_hash: passwordHash,
			display_name: userData.displayName,
		});

		userCount++;
		console.log(`  Created user: ${userData.username} (${userData.email})`);

		await Subscription.create({
			user_id: user._id,
			plan: SubscriptionPlan.FREE,
			start_date: new Date(),
			end_date: null,
			auto_renew: false,
		});

		subscriptionCount++;
		console.log(`    Created subscription for user: ${userData.username}`);
	}

	return { userCount, subscriptionCount };
}

async function seedPlaylists(): Promise<number> {
	console.log("Creating playlists...");

	const owner = await User.findOne({ email: "alex.morgan@melodio.com" });
	if (!owner) {
		console.log("  Warning: No user found for playlist ownership");
		return 0;
	}

	const tracks = await Track.find({}).limit(6);
	if (tracks.length < 6) {
		console.log(`  Warning: Only ${tracks.length} tracks found`);
	}

	const trackIds = tracks.map((track) => track._id as Types.ObjectId);

	const playlist = await Playlist.create({
		name: "Playlist 1",
		description: "A curated mix of various tracks",
		owner_id: owner._id,
		track_ids: trackIds,
		cover_image_url: "/images/playlists/playlist-1.jpg",
		is_public: true,
	});

	console.log(`  Created playlist: ${playlist.name} (${trackIds.length} tracks)`);

	return 1;
}

async function seedMixes(): Promise<number> {
	console.log("Creating mixes...");

	const owner = await User.findOne({ email: "alex.morgan@melodio.com" });
	if (!owner) {
		console.log("  Warning: No user found for mix ownership");
		return 0;
	}

	const rockArtist = await Artist.findOne({ name: "The Amplifiers" });
	const jazzArtist = await Artist.findOne({ name: "Blue Note Quartet" });

	if (!rockArtist || !jazzArtist) {
		console.log("  Warning: Required artists not found for seeding mixes");
		return 0;
	}

	const rockTracks = await Track.find({ artist_id: rockArtist._id })
		.limit(10)
		.select("_id");
	const jazzTracks = await Track.find({ artist_id: jazzArtist._id })
		.limit(10)
		.select("_id");

	const trackIds = [
		...rockTracks.map((t) => t._id as Types.ObjectId),
		...jazzTracks.map((t) => t._id as Types.ObjectId),
	];

	const mix = await Mix.create({
		user_id: owner._id,
		title: `${rockArtist.name} and ${jazzArtist.name} mix`,
		artist_ids: [rockArtist._id.toString(), jazzArtist._id.toString()],
		config: {
			variety: "medium",
			discovery: "blend",
			filters: [],
		},
		track_ids: trackIds,
		cover_images: [
			rockArtist.image_url ?? "",
			jazzArtist.image_url ?? "",
		].filter(Boolean),
		track_count: trackIds.length,
	});

	console.log(`  Created mix: ${mix.title} (${trackIds.length} tracks)`);

	return 1;
}

function toVenueSlug(venue: string): string {
	return venue
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-");
}

async function seedConcerts(): Promise<number> {
	console.log("Creating concerts...");

	const concertData = [
		{ city: "New York", artistName: "The Amplifiers", venue: "Madison Square Garden", date: "2026-03-15", time: "19:30" },
		{ city: "New York", artistName: "Blue Note Quartet", venue: "Blue Note Jazz Club", date: "2026-05-22", time: "20:00" },
		{ city: "New York", artistName: "Urban Beats", venue: "Barclays Center", date: "2026-07-10", time: "19:00" },
		{ city: "New York", artistName: "Pacific Symphony", venue: "Carnegie Hall", date: "2026-10-05", time: "19:30" },
		{ city: "Las Vegas", artistName: "Neon Dreams", venue: "T-Mobile Arena", date: "2026-04-12", time: "21:00" },
		{ city: "Las Vegas", artistName: "Synthwave Collective", venue: "The Venetian Theatre", date: "2026-06-28", time: "20:00" },
		{ city: "Las Vegas", artistName: "Velvet Grooves", venue: "MGM Grand Garden", date: "2026-08-15", time: "21:00" },
		{ city: "Las Vegas", artistName: "The Amplifiers", venue: "Allegiant Stadium", date: "2026-11-20", time: "19:00" },
		{ city: "Los Angeles", artistName: "Urban Beats", venue: "The Forum", date: "2026-03-08", time: "19:00" },
		{ city: "Los Angeles", artistName: "Neon Dreams", venue: "Hollywood Bowl", date: "2026-06-05", time: "20:00" },
		{ city: "Los Angeles", artistName: "Pacific Symphony", venue: "Walt Disney Concert Hall", date: "2026-09-18", time: "19:30" },
		{ city: "Los Angeles", artistName: "Velvet Grooves", venue: "Crypto.com Arena", date: "2026-12-12", time: "20:00" },
		{ city: "Chicago", artistName: "Blue Note Quartet", venue: "Chicago Theatre", date: "2026-04-25", time: "19:30" },
		{ city: "Chicago", artistName: "Synthwave Collective", venue: "United Center", date: "2026-07-30", time: "20:00" },
		{ city: "Chicago", artistName: "The Amplifiers", venue: "Soldier Field", date: "2026-10-22", time: "18:00" },
		{ city: "Miami", artistName: "Neon Dreams", venue: "Kaseya Center", date: "2026-05-03", time: "20:00" },
		{ city: "Miami", artistName: "Urban Beats", venue: "Hard Rock Stadium", date: "2026-08-08", time: "19:00" },
		{ city: "Miami", artistName: "Velvet Grooves", venue: "Bayfront Park Amphitheater", date: "2026-11-14", time: "19:30" },
	];

	let concertCount = 0;

	for (const data of concertData) {
		const artist = await Artist.findOne({ name: data.artistName });
		if (!artist) {
			console.log(`  Warning: Artist "${data.artistName}" not found, skipping concert at ${data.venue}`);
			continue;
		}

		const venueSlug = toVenueSlug(data.venue);

		await Concert.create({
			artist_id: artist._id,
			venue: data.venue,
			city: data.city,
			date: new Date(data.date),
			time: data.time,
			cover_image: `/images/concerts/${venueSlug}.jpg`,
			max_tickets_per_user: 6,
			tickets: [],
		});

		concertCount++;
	}

	console.log(`  Created ${concertCount} concerts`);
	return concertCount;
}

async function seed(): Promise<void> {
	try {
		console.log("Connecting to MongoDB...");
		await mongoose.connect(config.mongodbUri);
		console.log("Connected to MongoDB");

		await clearDatabase();

		const { artistCount, albumCount, trackCount } = await seedArtistsAlbumsAndTracks();

		const { userCount, subscriptionCount } = await seedUsers();

		const playlistCount = await seedPlaylists();

		const mixCount = await seedMixes();

		const concertCount = await seedConcerts();

		console.log("\n========================================");
		console.log("Seeding completed successfully!");
		console.log("========================================");
		console.log(`Artists created: ${artistCount}`);
		console.log(`Albums created: ${albumCount}`);
		console.log(`Tracks created: ${trackCount}`);
		console.log(`Users created: ${userCount}`);
		console.log(`Subscriptions created: ${subscriptionCount}`);
		console.log(`Playlists created: ${playlistCount}`);
		console.log(`Mixes created: ${mixCount}`);
		console.log(`Concerts created: ${concertCount}`);
		console.log("========================================");
		console.log("\nTest Users:");
		console.log("  Email: alex.morgan@melodio.com | Password: password123");
		console.log("  Email: jordan.casey@melodio.com | Password: password123");
		console.log("========================================\n");
	} catch (error) {
		console.error("Seeding failed:", error);
		process.exit(1);
	} finally {
		await mongoose.disconnect();
		console.log("Disconnected from MongoDB");
	}
}

void seed();
