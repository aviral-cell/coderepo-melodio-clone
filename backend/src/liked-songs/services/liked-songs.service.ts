import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LikeSongDto } from '../dto/like-song.dto';
import { GetLikedSongsDto } from '../dto/get-liked-songs.dto';
import { RemoveLikedSongDto } from '../dto/remove-liked-song.dto';
import {
  LikedSongsResponse,
  LikeSongResponse,
  RemoveLikedSongResponse,
} from '../interfaces/liked-songs.interface';

@Injectable()
export class LikedSongsService {
  constructor(private readonly prisma: PrismaService) {}

  async likeSong(likeSongDto: LikeSongDto): Promise<LikeSongResponse> {
    const { songId, userId } = likeSongDto;
console.log(userId)
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

    // Check if song is already liked
    const existingLike = await this.prisma.likedSong.findUnique({
      where: {
        userId_songId: {
          userId,
          songId,
        },
      },
    });

    if (existingLike) {
      throw new ConflictException('Song is already in your liked playlist');
    }

    // Add song to liked playlist
    const likedSong = await this.prisma.likedSong.create({
      data: {
        userId,
        songId,
      },
      include: {
        song: true,
      },
    });

    return {
      success: true,
      message: 'Song added to liked playlist successfully',
      data: likedSong,
    };
  }

  async removeLikedSong(
    removeLikedSongDto: RemoveLikedSongDto,
  ): Promise<RemoveLikedSongResponse> {
    const { songId, userId } = removeLikedSongDto;

    // Check if the liked song exists
    const likedSong = await this.prisma.likedSong.findUnique({
      where: {
        userId_songId: {
          userId,
          songId,
        },
      },
    });

    if (!likedSong) {
      throw new NotFoundException('Song not found in your liked playlist');
    }

    // Remove the song from liked playlist
    await this.prisma.likedSong.delete({
      where: {
        userId_songId: {
          userId,
          songId,
        },
      },
    });

    return {
      success: true,
      message: 'Song removed from liked playlist successfully',
    };
  }

  async getLikedSongs(
    getLikedSongsDto: GetLikedSongsDto,
  ): Promise<LikedSongsResponse> {
    const { userId, cursor, limit = 10 } = getLikedSongsDto;

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
      createdAt?: { lt: Date };
    } = {
      userId,
    };

    if (cursor) {
      whereClause.createdAt = {
        lt: new Date(cursor),
      };
    }

    // Get liked songs with cursor-based pagination
    const likedSongs = await this.prisma.likedSong.findMany({
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
    const hasMore = likedSongs.length > limit;
    const data = hasMore ? likedSongs.slice(0, limit) : likedSongs;

    // Get next cursor
    const nextCursor =
      hasMore && data.length > 0
        ? data[data.length - 1].createdAt.toISOString()
        : undefined;

    // Get total count of liked songs for this user
    const total = await this.prisma.likedSong.count({
      where: { userId },
    });

    return {
      data,
      nextCursor,
      hasMore,
      total,
    };
  }
}
