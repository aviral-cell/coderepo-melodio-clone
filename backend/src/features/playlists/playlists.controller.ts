import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../../shared/pipes/parse-object-id.pipe';
import { CurrentUser, JwtPayload } from '../../shared/decorators/current-user.decorator';
import { PlaylistsService } from './playlists.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { ReorderTracksDto, AddTrackDto } from './dto/reorder-tracks.dto';

@ApiTags('Playlists')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all playlists owned by current user' })
  async findUserPlaylists(@CurrentUser() user: JwtPayload) {
    return this.playlistsService.findByOwnerId(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get playlist by ID with populated tracks' })
  @ApiParam({ name: 'id', description: 'Playlist ID (ObjectId)' })
  async findById(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.playlistsService.findById(id, user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new playlist' })
  @ApiResponse({ status: 201, description: 'Playlist created successfully' })
  async create(
    @Body() createPlaylistDto: CreatePlaylistDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.playlistsService.create(createPlaylistDto, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update playlist details' })
  @ApiParam({ name: 'id', description: 'Playlist ID (ObjectId)' })
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updatePlaylistDto: UpdatePlaylistDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.playlistsService.update(id, updatePlaylistDto, user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a playlist' })
  @ApiParam({ name: 'id', description: 'Playlist ID (ObjectId)' })
  async delete(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.playlistsService.delete(id, user.userId);
  }

  @Post(':id/tracks')
  @ApiOperation({ summary: 'Add a track to playlist' })
  @ApiParam({ name: 'id', description: 'Playlist ID (ObjectId)' })
  async addTrack(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() addTrackDto: AddTrackDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.playlistsService.addTrack(id, addTrackDto.trackId, user.userId);
  }

  @Delete(':id/tracks/:trackId')
  @ApiOperation({ summary: 'Remove a track from playlist' })
  @ApiParam({ name: 'id', description: 'Playlist ID (ObjectId)' })
  @ApiParam({ name: 'trackId', description: 'Track ID (ObjectId)' })
  async removeTrack(
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('trackId', ParseObjectIdPipe) trackId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.playlistsService.removeTrack(id, trackId, user.userId);
  }

  @Patch(':id/reorder')
  @ApiOperation({ summary: 'Reorder tracks in playlist' })
  @ApiParam({ name: 'id', description: 'Playlist ID (ObjectId)' })
  async reorderTracks(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() reorderDto: ReorderTracksDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.playlistsService.reorderTracks(id, reorderDto.trackIds, user.userId);
  }
}
