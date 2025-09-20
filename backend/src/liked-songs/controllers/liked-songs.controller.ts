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
import { LikedSongsService } from '../services/liked-songs.service';
import { LikeSongDto } from '../dto/like-song.dto';
import { GetLikedSongsDto } from '../dto/get-liked-songs.dto';
import { RemoveLikedSongDto } from '../dto/remove-liked-song.dto';
import {
  LikedSongsResponse,
  LikeSongResponse,
  RemoveLikedSongResponse,
} from '../interfaces/liked-songs.interface';

@Controller('liked')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class LikedSongsController {
  constructor(private readonly likedSongsService: LikedSongsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async likeSong(@Body() likeSongDto: LikeSongDto): Promise<LikeSongResponse> {
    return this.likedSongsService.likeSong(likeSongDto);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async removeLikedSong(
    @Query() removeLikedSongDto: RemoveLikedSongDto,
  ): Promise<RemoveLikedSongResponse> {
    return this.likedSongsService.removeLikedSong(removeLikedSongDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getLikedSongs(
    @Query() getLikedSongsDto: GetLikedSongsDto,
  ): Promise<LikedSongsResponse> {
    return this.likedSongsService.getLikedSongs(getLikedSongsDto);
  }
}
