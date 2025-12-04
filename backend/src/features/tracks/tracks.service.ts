import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, Types } from 'mongoose';

import { Track, TrackDocument } from './schemas/track.schema';
import { TrackQueryDto } from './dto/track-query.dto';
import { PaginatedResponse } from '../../shared/types';

@Injectable()
export class TracksService {
  constructor(@InjectModel(Track.name) private trackModel: Model<TrackDocument>) {}

  async findAll(queryDto: TrackQueryDto): Promise<PaginatedResponse<TrackDocument>> {
    const { page = 1, limit = 20, genre, artistId, albumId } = queryDto;
    const skip = (page - 1) * limit;

    const filter: FilterQuery<Track> = {};
    if (genre) filter.genre = genre.toLowerCase();
    if (artistId) filter.artistId = new Types.ObjectId(artistId);
    if (albumId) filter.albumId = new Types.ObjectId(albumId);

    const [items, total] = await Promise.all([
      this.trackModel
        .find(filter)
        .populate('artistId', 'name imageUrl')
        .populate('albumId', 'title coverImageUrl')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.trackModel.countDocuments(filter).exec(),
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

  async findById(id: string): Promise<TrackDocument> {
    const track = await this.trackModel
      .findById(id)
      .populate('artistId', 'name imageUrl')
      .populate('albumId', 'title coverImageUrl')
      .exec();

    if (!track) {
      throw new NotFoundException(`Track with ID ${id} not found`);
    }
    return track;
  }

  async search(query: string, limit = 5): Promise<TrackDocument[]> {
    if (!query) return [];

    const normalizedQuery = query.toLowerCase();

    return this.trackModel
      .find({
        $or: [
          { $text: { $search: query } },
          { genre: normalizedQuery },
        ],
      })
      .populate('artistId', 'name imageUrl')
      .populate('albumId', 'title coverImageUrl')
      .limit(limit)
      .exec();
  }

  async incrementPlayCount(id: string): Promise<TrackDocument> {
    const track = await this.trackModel
      .findByIdAndUpdate(id, { $inc: { playCount: 1 } }, { new: true })
      .exec();

    if (!track) {
      throw new NotFoundException(`Track with ID ${id} not found`);
    }
    return track;
  }
}
