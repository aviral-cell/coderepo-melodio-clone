import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchSongsDto } from '../dto/search-songs.dto';
import { SearchSongsResponse } from '../interfaces/search.interface';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchSongs(
    searchSongsDto: SearchSongsDto,
  ): Promise<SearchSongsResponse> {
    const { q, limit = 10, offset = 0 } = searchSongsDto;

    if (!q.trim()) {
      throw new BadRequestException('Search query cannot be empty');
    }

    // Search songs by title, artist, or album using case-insensitive search
    const whereClause = {
      OR: [
        {
          title: {
            contains: q,
            mode: 'insensitive' as const,
          },
        },
        {
          artist: {
            contains: q,
            mode: 'insensitive' as const,
          },
        },
        {
          album: {
            contains: q,
            mode: 'insensitive' as const,
          },
        },
      ],
    };

    // Get total count for pagination
    const total = await this.prisma.song.count({
      where: whereClause,
    });

    // Get songs with pagination
    const songs = await this.prisma.song.findMany({
      where: whereClause,
      skip: offset,
      take: limit,
      orderBy: {
        playCount: 'desc', // Order by popularity
      },
    });

    const totalPages = Math.ceil(total / limit);
    const page = Math.floor(offset / limit) + 1;

    return {
      data: songs,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
