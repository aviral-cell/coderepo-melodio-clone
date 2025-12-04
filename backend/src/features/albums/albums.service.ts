import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';

import { Album, AlbumDocument } from './schemas/album.schema';
import { AlbumQueryDto } from './dto/album-query.dto';
import { PaginatedResponse } from '../../shared/types';

@Injectable()
export class AlbumsService {
  constructor(@InjectModel(Album.name) private albumModel: Model<AlbumDocument>) {}

  async findAll(queryDto: AlbumQueryDto): Promise<PaginatedResponse<AlbumDocument>> {
    const { page = 1, limit = 20, artistId } = queryDto;
    const skip = (page - 1) * limit;

    const filter: FilterQuery<Album> = {};
    if (artistId) filter.artistId = artistId;

    const [items, total] = await Promise.all([
      this.albumModel
        .find(filter)
        .populate('artistId', 'name imageUrl')
        .skip(skip)
        .limit(limit)
        .sort({ releaseDate: -1 })
        .exec(),
      this.albumModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<AlbumDocument> {
    const album = await this.albumModel
      .findById(id)
      .populate('artistId', 'name imageUrl')
      .exec();

    if (!album) {
      throw new NotFoundException(`Album with ID ${id} not found`);
    }
    return album;
  }

  async search(query: string, limit = 5): Promise<AlbumDocument[]> {
    if (!query) return [];

    return this.albumModel
      .find({ $text: { $search: query } })
      .populate('artistId', 'name imageUrl')
      .limit(limit)
      .exec();
  }

  async findByArtistId(artistId: string): Promise<AlbumDocument[]> {
    return this.albumModel
      .find({ artistId })
      .sort({ releaseDate: -1 })
      .exec();
  }
}
