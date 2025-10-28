import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { PlaylistService } from '../services/playlist.service';
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

@Controller('playlist')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addToPlaylist(
    @Body() addToPlaylistDto: AddToPlaylistDto,
  ): Promise<AddToPlaylistResponse> {
    return this.playlistService.addToPlaylist(addToPlaylistDto);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async removeFromPlaylist(
    @Query() removeFromPlaylistDto: RemoveFromPlaylistDto,
  ): Promise<RemoveFromPlaylistResponse> {
    return this.playlistService.removeFromPlaylist(removeFromPlaylistDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getPlaylistSongs(
    @Query() getPlaylistSongsDto: GetPlaylistSongsDto,
  ): Promise<PlaylistSongsResponse> {
    return this.playlistService.getPlaylistSongs(getPlaylistSongsDto);
  }

  @Get('user')
  @HttpCode(HttpStatus.OK)
  async getUserPlaylists(
    @Query() getUserPlaylistsDto: GetUserPlaylistsDto,
  ): Promise<UserPlaylistsResponse> {
    return this.playlistService.getUserPlaylists(getUserPlaylistsDto);
  }
}
