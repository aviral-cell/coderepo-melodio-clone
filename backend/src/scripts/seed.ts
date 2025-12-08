/**
 * Database Seed Script
 *
 * This script populates the MongoDB database with sample data for development and testing.
 *
 * Run with: npm run seed
 *
 * Creates:
 * - 5 artists (one per genre: rock, pop, jazz, electronic, hip-hop)
 * - 10 albums (2 per artist)
 * - 30 tracks (3 per album, durations between 180-300 seconds)
 * - 2 test users with known credentials
 */

import * as dotenv from 'dotenv';
dotenv.config();

import * as bcrypt from 'bcryptjs';
import mongoose, { Schema, Document, Types } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/hackify_app";

interface IUser extends Document {
  email: string;
  username: string;
  passwordHash: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: true, trim: true },
    avatarUrl: { type: String },
  },
  { timestamps: true },
);

interface IArtist extends Document {
  name: string;
  bio?: string;
  imageUrl?: string;
  genres: string[];
  followerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ArtistSchema = new Schema<IArtist>(
  {
    name: { type: String, required: true, trim: true },
    bio: { type: String, trim: true },
    imageUrl: { type: String },
    genres: { type: [String], required: true, default: [] },
    followerCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

interface IAlbum extends Document {
  title: string;
  artistId: Types.ObjectId;
  releaseDate: Date;
  coverImageUrl?: string;
  totalTracks: number;
  createdAt: Date;
  updatedAt: Date;
}

const AlbumSchema = new Schema<IAlbum>(
  {
    title: { type: String, required: true, trim: true },
    artistId: { type: Schema.Types.ObjectId, ref: 'Artist', required: true },
    releaseDate: { type: Date, required: true },
    coverImageUrl: { type: String },
    totalTracks: { type: Number, required: true, min: 1 },
  },
  { timestamps: true },
);

interface ITrack extends Document {
  title: string;
  artistId: Types.ObjectId;
  albumId: Types.ObjectId;
  durationInSeconds: number;
  trackNumber: number;
  genre: string;
  playCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const TrackSchema = new Schema<ITrack>(
  {
    title: { type: String, required: true, trim: true },
    artistId: { type: Schema.Types.ObjectId, ref: 'Artist', required: true },
    albumId: { type: Schema.Types.ObjectId, ref: 'Album', required: true },
    durationInSeconds: { type: Number, required: true, min: 1 },
    trackNumber: { type: Number, required: true, min: 1 },
    genre: { type: String, required: true, trim: true, lowercase: true },
    playCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

const User = mongoose.model<IUser>('User', UserSchema);
const Artist = mongoose.model<IArtist>('Artist', ArtistSchema);
const Album = mongoose.model<IAlbum>('Album', AlbumSchema);
const Track = mongoose.model<ITrack>('Track', TrackSchema);

interface ArtistSeedData {
  name: string;
  genre: string;
  bio: string;
  albums: AlbumSeedData[];
}

interface AlbumSeedData {
  title: string;
  releaseDate: Date;
  tracks: TrackSeedData[];
}

interface TrackSeedData {
  title: string;
  durationInSeconds: number;
}

function randomDuration(): number {
  return Math.floor(Math.random() * (300 - 180 + 1)) + 180;
}

function getImageUrl(seed: string, size = 300): string {
  const encodedSeed = encodeURIComponent(seed.toLowerCase().replace(/\s+/g, '-'));
  return `https://picsum.photos/seed/${encodedSeed}/${size}/${size}`;
}

const artistsSeedData: ArtistSeedData[] = [
  {
    name: 'The Amplifiers',
    genre: 'rock',
    bio: 'A powerful rock band known for electrifying performances and anthemic songs.',
    albums: [
      {
        title: 'Electric Storm',
        releaseDate: new Date('2022-03-15'),
        tracks: [
          { title: 'Thunder Road', durationInSeconds: randomDuration() },
          { title: 'Lightning Strike', durationInSeconds: randomDuration() },
          { title: 'Storm Chaser', durationInSeconds: randomDuration() },
        ],
      },
      {
        title: 'Voltage',
        releaseDate: new Date('2023-07-20'),
        tracks: [
          { title: 'High Voltage', durationInSeconds: randomDuration() },
          { title: 'Power Surge', durationInSeconds: randomDuration() },
          { title: 'Circuit Breaker', durationInSeconds: randomDuration() },
        ],
      },
    ],
  },
  {
    name: 'Neon Dreams',
    genre: 'pop',
    bio: 'Chart-topping pop sensation with catchy hooks and unforgettable melodies.',
    albums: [
      {
        title: 'Starlight',
        releaseDate: new Date('2021-11-10'),
        tracks: [
          { title: 'Dancing in the Moonlight', durationInSeconds: randomDuration() },
          { title: 'Summer Nights', durationInSeconds: randomDuration() },
          { title: 'Heartbeat', durationInSeconds: randomDuration() },
        ],
      },
      {
        title: 'Glow',
        releaseDate: new Date('2023-02-14'),
        tracks: [
          { title: 'Radiant', durationInSeconds: randomDuration() },
          { title: 'Shine On', durationInSeconds: randomDuration() },
          { title: 'Golden Hour', durationInSeconds: randomDuration() },
        ],
      },
    ],
  },
  {
    name: 'Blue Note Quartet',
    genre: 'jazz',
    bio: 'Sophisticated jazz ensemble blending classic traditions with modern innovation.',
    albums: [
      {
        title: 'Midnight Sessions',
        releaseDate: new Date('2020-09-05'),
        tracks: [
          { title: 'Blue Velvet', durationInSeconds: randomDuration() },
          { title: 'Smooth Operator', durationInSeconds: randomDuration() },
          { title: 'Late Night Jazz', durationInSeconds: randomDuration() },
        ],
      },
      {
        title: 'Saxophone Dreams',
        releaseDate: new Date('2022-12-01'),
        tracks: [
          { title: 'Soulful Sax', durationInSeconds: randomDuration() },
          { title: 'Bebop Blues', durationInSeconds: randomDuration() },
          { title: 'Swing Time', durationInSeconds: randomDuration() },
        ],
      },
    ],
  },
  {
    name: 'Synthwave Collective',
    genre: 'electronic',
    bio: 'Retro-futuristic electronic producers creating immersive soundscapes.',
    albums: [
      {
        title: 'Digital Horizons',
        releaseDate: new Date('2021-06-18'),
        tracks: [
          { title: 'Neon City', durationInSeconds: randomDuration() },
          { title: 'Cyber Drive', durationInSeconds: randomDuration() },
          { title: 'Binary Sunset', durationInSeconds: randomDuration() },
        ],
      },
      {
        title: 'Retrowave',
        releaseDate: new Date('2023-04-22'),
        tracks: [
          { title: 'Arcade Nights', durationInSeconds: randomDuration() },
          { title: 'VHS Memories', durationInSeconds: randomDuration() },
          { title: 'Laser Grid', durationInSeconds: randomDuration() },
        ],
      },
    ],
  },
  {
    name: 'Urban Beats',
    genre: 'hip-hop',
    bio: 'Street-smart hip-hop collective delivering hard-hitting beats and clever lyrics.',
    albums: [
      {
        title: 'City Streets',
        releaseDate: new Date('2022-08-30'),
        tracks: [
          { title: 'Block Party', durationInSeconds: randomDuration() },
          { title: 'Concrete Jungle', durationInSeconds: randomDuration() },
          { title: 'Street Dreams', durationInSeconds: randomDuration() },
        ],
      },
      {
        title: 'Hustle Mode',
        releaseDate: new Date('2023-10-15'),
        tracks: [
          { title: 'Grind Time', durationInSeconds: randomDuration() },
          { title: 'Stack Paper', durationInSeconds: randomDuration() },
          { title: 'Rise Up', durationInSeconds: randomDuration() },
        ],
      },
    ],
  },
];

const testUsers = [
  {
    email: 'alex.morgan@hackify.com',
    password: 'password123',
    username: 'alexmorgan',
    displayName: 'Alex Morgan',
  },
  {
    email: 'jordan.casey@hackify.com',
    password: 'password123',
    username: 'jordancasey',
    displayName: 'Jordan Casey',
  },
];

async function clearDatabase(): Promise<void> {
  console.log('Clearing existing data...');

  await Promise.all([
    User.deleteMany({}),
    Artist.deleteMany({}),
    Album.deleteMany({}),
    Track.deleteMany({}),
  ]);

  console.log('Existing data cleared.');
}

async function seedArtistsAlbumsAndTracks(): Promise<{
  artistCount: number;
  albumCount: number;
  trackCount: number;
}> {
  let artistCount = 0;
  let albumCount = 0;
  let trackCount = 0;

  console.log('Creating artists, albums, and tracks...');

  for (const artistData of artistsSeedData) {
    const artist = await Artist.create({
      name: artistData.name,
      bio: artistData.bio,
      imageUrl: getImageUrl(`artist-${artistData.name}`),
      genres: [artistData.genre],
      followerCount: Math.floor(Math.random() * 100000),
    });
    artistCount++;
    console.log(`  Created artist: ${artist.name}`);

    for (const albumData of artistData.albums) {
      const album = await Album.create({
        title: albumData.title,
        artistId: artist._id,
        releaseDate: albumData.releaseDate,
        coverImageUrl: getImageUrl(`album-${albumData.title}`),
        totalTracks: albumData.tracks.length,
      });
      albumCount++;
      console.log(`    Created album: ${album.title}`);

      for (let i = 0; i < albumData.tracks.length; i++) {
        const trackData = albumData.tracks[i];
        await Track.create({
          title: trackData.title,
          artistId: artist._id,
          albumId: album._id,
          durationInSeconds: trackData.durationInSeconds,
          trackNumber: i + 1,
          genre: artistData.genre,
          playCount: Math.floor(Math.random() * 10000),
        });
        trackCount++;
      }
      console.log(`      Created ${albumData.tracks.length} tracks`);
    }
  }

  return { artistCount, albumCount, trackCount };
}

async function seedUsers(): Promise<number> {
  console.log('Creating test users...');

  const saltRounds = 10;
  let userCount = 0;

  for (const userData of testUsers) {
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);

    await User.create({
      email: userData.email,
      username: userData.username,
      passwordHash,
      displayName: userData.displayName,
    });

    userCount++;
    console.log(`  Created user: ${userData.username} (${userData.email})`);
  }

  return userCount;
}

async function seed(): Promise<void> {
  try {
    console.log('Connecting to MongoDB...');

    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    await clearDatabase();

    const { artistCount, albumCount, trackCount } =
      await seedArtistsAlbumsAndTracks();

    const userCount = await seedUsers();

    console.log('\n========================================');
    console.log('Seeding completed successfully!');
    console.log('========================================');
    console.log(`Artists created: ${artistCount}`);
    console.log(`Albums created: ${albumCount}`);
    console.log(`Tracks created: ${trackCount}`);
    console.log(`Users created: ${userCount}`);
    console.log('========================================');
    console.log('\nTest Users:');
    console.log('  Email: alex.morgan@hackify.com | Password: password123');
    console.log('  Email: jordan.casey@hackify.com | Password: password123');
    console.log('========================================\n');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

void seed();
