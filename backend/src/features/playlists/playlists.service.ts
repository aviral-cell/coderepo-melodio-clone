import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Playlist, PlaylistDocument } from './schemas/playlist.schema';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';

@Injectable()
export class PlaylistsService {
  constructor(
    @InjectModel(Playlist.name) private playlistModel: Model<PlaylistDocument>,
  ) {}

  async findByOwnerId(ownerId: string): Promise<PlaylistDocument[]> {
    return this.playlistModel
      .find({ ownerId: new Types.ObjectId(ownerId) })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async findById(id: string, userId?: string): Promise<PlaylistDocument> {
    const playlist = await this.playlistModel
      .findById(id)
      .populate({
        path: 'trackIds',
        populate: [
          { path: 'artistId', select: 'name imageUrl' },
          { path: 'albumId', select: 'title coverImageUrl' },
        ],
      })
      .exec();

    if (!playlist) {
      throw new NotFoundException(`Playlist with ID ${id} not found`);
    }

    // Check if user can access private playlist
    if (!playlist.isPublic && userId && playlist.ownerId.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this playlist');
    }

    return playlist;
  }

  async create(
    createPlaylistDto: CreatePlaylistDto,
    ownerId: string,
  ): Promise<PlaylistDocument> {
    const playlist = new this.playlistModel({
      ...createPlaylistDto,
      ownerId: new Types.ObjectId(ownerId),
    });
    return playlist.save();
  }

  async update(
    id: string,
    updatePlaylistDto: UpdatePlaylistDto,
    userId: string,
  ): Promise<PlaylistDocument> {
    const playlist = await this.playlistModel.findById(id).exec();

    if (!playlist) {
      throw new NotFoundException(`Playlist with ID ${id} not found`);
    }

    if (playlist.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own playlists');
    }

    Object.assign(playlist, updatePlaylistDto);
    return playlist.save();
  }

  async delete(id: string, userId: string): Promise<void> {
    const playlist = await this.playlistModel.findById(id).exec();

    if (!playlist) {
      throw new NotFoundException(`Playlist with ID ${id} not found`);
    }

    if (playlist.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own playlists');
    }

    await this.playlistModel.findByIdAndDelete(id).exec();
  }

  async addTrack(
    playlistId: string,
    trackId: string,
    userId: string,
  ): Promise<PlaylistDocument> {
    const playlist = await this.playlistModel.findById(playlistId).exec();

    if (!playlist) {
      throw new NotFoundException(`Playlist with ID ${playlistId} not found`);
    }

    if (playlist.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only modify your own playlists');
    }

    const trackObjectId = new Types.ObjectId(trackId);

    // Don't add duplicate tracks
    if (!playlist.trackIds.some((id) => id.equals(trackObjectId))) {
      playlist.trackIds.push(trackObjectId);
      await playlist.save();
    }

    return playlist;
  }

  async removeTrack(
    playlistId: string,
    trackId: string,
    userId: string,
  ): Promise<PlaylistDocument> {
    const playlist = await this.playlistModel.findById(playlistId).exec();

    if (!playlist) {
      throw new NotFoundException(`Playlist with ID ${playlistId} not found`);
    }

    if (playlist.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only modify your own playlists');
    }

    const trackObjectId = new Types.ObjectId(trackId);
    playlist.trackIds = playlist.trackIds.filter(
      (id) => !id.equals(trackObjectId),
    );
    return playlist.save();
  }

  async reorderTracks(
    playlistId: string,
    trackIds: string[],
    userId: string,
  ): Promise<PlaylistDocument> {
    const playlist = await this.playlistModel.findById(playlistId).exec();

    if (!playlist) {
      throw new NotFoundException(`Playlist with ID ${playlistId} not found`);
    }

    if (playlist.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only modify your own playlists');
    }

    playlist.trackIds = trackIds.map((id) => new Types.ObjectId(id));
    return playlist.save();
  }
}
