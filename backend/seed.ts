import { PrismaClient } from '@prisma/client';

const prisma: PrismaClient = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Spotify clone database...');

  // Create users with manual IDs
  const user1 = await prisma.user.upsert({
    where: { email: 'hackerrank@example.com' },
    update: {},
    create: {
      id: 'user_001',
      email: 'hackerrank@example.com',
      username: 'hackerrank_music',
      firstName: 'George',
      lastName: 'Chen',
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      isActive: true,
    },
  });

  // Create songs
  const songs = [
    {
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      album: 'A Night at the Opera',
      genre: 'Rock',
      duration: 355,
      releaseDate: new Date('1975-10-31'),
      audioUrl: 'https://example.com/audio/bohemian-rhapsody.mp3',
      imageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
      isExplicit: false,
      playCount: 1500000,
    },
    {
      title: 'Imagine',
      artist: 'John Lennon',
      album: 'Imagine',
      genre: 'Pop',
      duration: 183,
      releaseDate: new Date('1971-09-09'),
      audioUrl: 'https://example.com/audio/imagine.mp3',
      imageUrl:
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
      isExplicit: false,
      playCount: 1200000,
    },
    {
      title: 'Hotel California',
      artist: 'Eagles',
      album: 'Hotel California',
      genre: 'Rock',
      duration: 391,
      releaseDate: new Date('1976-12-08'),
      audioUrl: 'https://example.com/audio/hotel-california.mp3',
      imageUrl:
        'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop',
      isExplicit: false,
      playCount: 1800000,
    },
    {
      title: 'Billie Jean',
      artist: 'Michael Jackson',
      album: 'Thriller',
      genre: 'Pop',
      duration: 294,
      releaseDate: new Date('1983-01-02'),
      audioUrl: 'https://example.com/audio/billie-jean.mp3',
      imageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
      isExplicit: false,
      playCount: 2000000,
    },
    {
      title: "Sweet Child O' Mine",
      artist: "Guns N' Roses",
      album: 'Appetite for Destruction',
      genre: 'Rock',
      duration: 356,
      releaseDate: new Date('1987-06-21'),
      audioUrl: 'https://example.com/audio/sweet-child-o-mine.mp3',
      imageUrl:
        'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop',
      isExplicit: true,
      playCount: 1600000,
    },
    {
      title: 'Like a Rolling Stone',
      artist: 'Bob Dylan',
      album: 'Highway 61 Revisited',
      genre: 'Folk Rock',
      duration: 366,
      releaseDate: new Date('1965-07-20'),
      audioUrl: 'https://example.com/audio/like-a-rolling-stone.mp3',
      imageUrl:
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
      isExplicit: false,
      playCount: 1400000,
    },
    {
      title: 'Smells Like Teen Spirit',
      artist: 'Nirvana',
      album: 'Nevermind',
      genre: 'Grunge',
      duration: 301,
      releaseDate: new Date('1991-09-10'),
      audioUrl: 'https://example.com/audio/smells-like-teen-spirit.mp3',
      imageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
      isExplicit: true,
      playCount: 1700000,
    },
    {
      title: "What's Going On",
      artist: 'Marvin Gaye',
      album: "What's Going On",
      genre: 'Soul',
      duration: 232,
      releaseDate: new Date('1971-01-20'),
      audioUrl: 'https://example.com/audio/whats-going-on.mp3',
      imageUrl:
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
      isExplicit: false,
      playCount: 1100000,
    },
    {
      title: 'Stairway to Heaven',
      artist: 'Led Zeppelin',
      album: 'Led Zeppelin IV',
      genre: 'Rock',
      duration: 482,
      releaseDate: new Date('1971-11-08'),
      audioUrl: 'https://example.com/audio/stairway-to-heaven.mp3',
      imageUrl:
        'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop',
      isExplicit: false,
      playCount: 1900000,
    },
    {
      title: 'Respect',
      artist: 'Aretha Franklin',
      album: 'I Never Loved a Man the Way I Love You',
      genre: 'Soul',
      duration: 147,
      releaseDate: new Date('1967-04-09'),
      audioUrl: 'https://example.com/audio/respect.mp3',
      imageUrl:
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
      isExplicit: false,
      playCount: 1300000,
    },
    {
      title: 'Good Vibrations',
      artist: 'The Beach Boys',
      album: 'Smiley Smile',
      genre: 'Pop',
      duration: 216,
      releaseDate: new Date('1966-10-10'),
      audioUrl: 'https://example.com/audio/good-vibrations.mp3',
      imageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
      isExplicit: false,
      playCount: 1000000,
    },
    {
      title: 'Johnny B. Goode',
      artist: 'Chuck Berry',
      album: 'Chuck Berry Is on Top',
      genre: 'Rock and Roll',
      duration: 161,
      releaseDate: new Date('1958-03-31'),
      audioUrl: 'https://example.com/audio/johnny-b-goode.mp3',
      imageUrl:
        'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop',
      isExplicit: false,
      playCount: 900000,
    },
  ];

  const createdSongs: { id: string }[] = [];
  for (const songData of songs) {
    const song = await prisma.song.create({
      data: songData,
    });
    createdSongs.push(song);
  }

  // Create playlist relationships
  const playlists = [
    // Liked Songs playlist
    {
      userId: user1.id,
      songId: createdSongs[0]?.id,
      playlistName: 'Liked Songs',
    },
    {
      userId: user1.id,
      songId: createdSongs[1]?.id,
      playlistName: 'Liked Songs',
    },
    {
      userId: user1.id,
      songId: createdSongs[2]?.id,
      playlistName: 'Liked Songs',
    },
    {
      userId: user1.id,
      songId: createdSongs[3]?.id,
      playlistName: 'Liked Songs',
    },
    {
      userId: user1.id,
      songId: createdSongs[4]?.id,
      playlistName: 'Liked Songs',
    },
    {
      userId: user1.id,
      songId: createdSongs[5]?.id,
      playlistName: 'Liked Songs',
    },
    {
      userId: user1.id,
      songId: createdSongs[6]?.id,
      playlistName: 'Liked Songs',
    },
    {
      userId: user1.id,
      songId: createdSongs[7]?.id,
      playlistName: 'Liked Songs',
    },
    {
      userId: user1.id,
      songId: createdSongs[8]?.id,
      playlistName: 'Liked Songs',
    },
    {
      userId: user1.id,
      songId: createdSongs[9]?.id,
      playlistName: 'Liked Songs',
    },
    {
      userId: user1.id,
      songId: createdSongs[10]?.id,
      playlistName: 'Liked Songs',
    },
    {
      userId: user1.id,
      songId: createdSongs[11]?.id,
      playlistName: 'Liked Songs',
    },
    // Rock Classics playlist
    {
      userId: user1.id,
      songId: createdSongs[0]?.id,
      playlistName: 'Gym Playlist',
    },
    {
      userId: user1.id,
      songId: createdSongs[2]?.id,
      playlistName: 'Gym Playlist',
    },
    {
      userId: user1.id,
      songId: createdSongs[4]?.id,
      playlistName: 'Gym Playlist',
    },
    {
      userId: user1.id,
      songId: createdSongs[5]?.id,
      playlistName: 'Gym Playlist',
    },
    {
      userId: user1.id,
      songId: createdSongs[6]?.id,
      playlistName: 'Gym Playlist',
    },
    {
      userId: user1.id,
      songId: createdSongs[8]?.id,
      playlistName: 'Gym Playlist',
    },
    {
      userId: user1.id,
      songId: createdSongs[11]?.id,
      playlistName: 'Gym Playlist',
    },
    // Late Night Drive playlist
    {
      userId: user1.id,
      songId: createdSongs[1]?.id,
      playlistName: 'Late Night Drive',
    },
    {
      userId: user1.id,
      songId: createdSongs[3]?.id,
      playlistName: 'Late Night Drive',
    },
    {
      userId: user1.id,
      songId: createdSongs[10]?.id,
      playlistName: 'Late Night Drive',
    },
    // Heartbreak playlist
    {
      userId: user1.id,
      songId: createdSongs[2]?.id,
      playlistName: 'Heartbreak',
    },
    {
      userId: user1.id,
      songId: createdSongs[7]?.id,
      playlistName: 'Heartbreak',
    },
    {
      userId: user1.id,
      songId: createdSongs[8]?.id,
      playlistName: 'Heartbreak',
    },
    {
      userId: user1.id,
      songId: createdSongs[5]?.id,
      playlistName: 'Heartbreak',
    },
    {
      userId: user1.id,
      songId: createdSongs[6]?.id,
      playlistName: 'Heartbreak',
    },
    // Party Jam playlist
    {
      userId: user1.id,
      songId: createdSongs[2]?.id,
      playlistName: 'Party Jam',
    },
    {
      userId: user1.id,
      songId: createdSongs[7]?.id,
      playlistName: 'Party Jam',
    },
    {
      userId: user1.id,
      songId: createdSongs[8]?.id,
      playlistName: 'Party Jam',
    },
    {
      userId: user1.id,
      songId: createdSongs[5]?.id,
      playlistName: 'Party Jam',
    },
    {
      userId: user1.id,
      songId: createdSongs[6]?.id,
      playlistName: 'Party Jam',
    },
  ].filter((playlist) => playlist.songId); // Filter out any undefined songIds

  await prisma.playlist.createMany({
    data: playlists,
  });

  console.log('✅ Spotify clone database seeded successfully!');
  console.log(`👥 Created 1 users`);
  console.log(`🎵 Created ${createdSongs.length} songs`);
  console.log(`📝 Created ${playlists.length} playlist entries`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
