import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddToPlaylistDto } from '../dto/add-to-playlist.dto';
import { GetPlaylistSongsDto } from '../dto/get-playlist-songs.dto';
import { RemoveFromPlaylistDto } from '../dto/remove-from-playlist.dto';
import { GetUserPlaylistsDto } from '../dto/get-user-playlists.dto';
import {
  PlaylistSongsResponse,
  AddToPlaylistResponse,
  RemoveFromPlaylistResponse,
  UserPlaylistsResponse,
} from '../interfaces/playlist.interface';

@Injectable()
export class PlaylistService {
  constructor(private readonly prisma: PrismaService) {}

  async addToPlaylist(
    addToPlaylistDto: AddToPlaylistDto,
  ): Promise<AddToPlaylistResponse> {
    const { songId, userId, playlistName } = addToPlaylistDto;

    // Check if song exists
    const song = await this.prisma.song.findUnique({
      where: { id: songId },
    });

    if (!song) {
      throw new NotFoundException(`Song with ID ${songId} not found`);
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if song is already in this playlist
    const existingPlaylistEntry = await this.prisma.playlist.findUnique({
      where: {
        userId_songId_playlistName: {
          userId,
          songId,
          playlistName,
        },
      },
    });

    if (existingPlaylistEntry) {
      throw new ConflictException(
        `Song is already in your "${playlistName}" playlist`,
      );
    }

    // Add song to playlist
    const playlistEntry = await this.prisma.playlist.create({
      data: {
        userId,
        songId,
        playlistName,
      },
      include: {
        song: true,
      },
    });

    return {
      success: true,
      message: `Song added to "${playlistName}" playlist successfully`,
      data: playlistEntry,
    };
  }

  async removeFromPlaylist(
    removeFromPlaylistDto: RemoveFromPlaylistDto,
  ): Promise<RemoveFromPlaylistResponse> {
    const { songId, userId, playlistName } = removeFromPlaylistDto;

    // Check if the playlist entry exists
    const playlistEntry = await this.prisma.playlist.findUnique({
      where: {
        userId_songId_playlistName: {
          userId,
          songId,
          playlistName,
        },
      },
    });

    if (!playlistEntry) {
      throw new NotFoundException(
        `Song not found in your "${playlistName}" playlist`,
      );
    }

    // Remove the song from playlist
    await this.prisma.playlist.delete({
      where: {
        userId_songId_playlistName: {
          userId,
          songId,
          playlistName,
        },
      },
    });

    return {
      success: true,
      message: `Song removed from "${playlistName}" playlist successfully`,
    };
  }

  async getPlaylistSongs(
    getPlaylistSongsDto: GetPlaylistSongsDto,
  ): Promise<PlaylistSongsResponse> {
    const { userId, playlistName, cursor, limit = 10 } = getPlaylistSongsDto;

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Build where clause for cursor-based pagination
    const whereClause: {
      userId: string;
      playlistName: string;
      createdAt?: { lt: Date };
    } = {
      userId,
      playlistName,
    };

    if (cursor) {
      whereClause.createdAt = {
        lt: new Date(cursor),
      };
    }

    // Get playlist songs with cursor-based pagination
    const playlistSongs = await this.prisma.playlist.findMany({
      where: whereClause,
      take: limit + 1, // Take one extra to check if there are more
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        song: true,
      },
    });

    // Check if there are more results
    const hasMore = playlistSongs.length > limit;
    const data = hasMore ? playlistSongs.slice(0, limit) : playlistSongs;

    // Get next cursor
    const nextCursor =
      hasMore && data.length > 0
        ? data[data.length - 1].createdAt.toISOString()
        : undefined;

    // Get total count of songs in this playlist for this user
    const total = await this.prisma.playlist.count({
      where: { userId, playlistName },
    });

    return {
      data,
      nextCursor,
      hasMore,
      total,
    };
  }

  async getUserPlaylists(
    getUserPlaylistsDto: GetUserPlaylistsDto,
  ): Promise<UserPlaylistsResponse> {
    const { userId } = getUserPlaylistsDto;

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Get all unique playlists for the user with song counts
    const playlists = await this.prisma.playlist.groupBy({
      by: ['playlistName'],
      where: { userId },
      _count: {
        songId: true,
      },
      _min: {
        createdAt: true,
      },
      orderBy: {
        _min: {
          createdAt: 'desc',
        },
      },
    });

    // Transform the data to match our interface
    const userPlaylists = playlists.map((playlist) => ({
      playlistName: playlist.playlistName,
      songCount: playlist._count.songId,
      createdAt: playlist._min.createdAt!,
    }));

    return {
      data: userPlaylists,
      total: userPlaylists.length,
    };
  }
}
