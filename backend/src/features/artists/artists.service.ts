import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Artist, ArtistDocument } from './schemas/artist.schema';
import { ArtistQueryDto } from './dto/artist-query.dto';
import { PaginatedResponse } from '../../shared/types';

@Injectable()
export class ArtistsService {
  constructor(@InjectModel(Artist.name) private artistModel: Model<ArtistDocument>) {}

  async findAll(queryDto: ArtistQueryDto): Promise<PaginatedResponse<ArtistDocument>> {
    const { page = 1, limit = 20 } = queryDto;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.artistModel
        .find()
        .skip(skip)
        .limit(limit)
        .sort({ followerCount: -1 })
        .exec(),
      this.artistModel.countDocuments().exec(),
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

  async findById(id: string): Promise<ArtistDocument> {
    const artist = await this.artistModel.findById(id).exec();
    if (!artist) {
      throw new NotFoundException(`Artist with ID ${id} not found`);
    }
    return artist;
  }

  async search(query: string, limit = 5): Promise<ArtistDocument[]> {
    if (!query) return [];

    return this.artistModel
      .find({ $text: { $search: query } })
      .limit(limit)
      .exec();
  }

  async incrementFollowerCount(id: string): Promise<ArtistDocument> {
    const artist = await this.artistModel
      .findByIdAndUpdate(id, { $inc: { followerCount: 1 } }, { new: true })
      .exec();

    if (!artist) {
      throw new NotFoundException(`Artist with ID ${id} not found`);
    }
    return artist;
  }

  async decrementFollowerCount(id: string): Promise<ArtistDocument> {
    const artist = await this.artistModel
      .findByIdAndUpdate(id, { $inc: { followerCount: -1 } }, { new: true })
      .exec();

    if (!artist) {
      throw new NotFoundException(`Artist with ID ${id} not found`);
    }
    return artist;
  }
}
