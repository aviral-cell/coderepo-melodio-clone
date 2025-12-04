import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../../shared/pipes/parse-object-id.pipe';
import { AlbumsService } from './albums.service';
import { AlbumQueryDto, AlbumSearchDto } from './dto/album-query.dto';

@ApiTags('Albums')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('albums')
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all albums with pagination' })
  async findAll(@Query() queryDto: AlbumQueryDto) {
    return this.albumsService.findAll(queryDto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search albums by title' })
  async search(@Query() searchDto: AlbumSearchDto) {
    return this.albumsService.search(searchDto.q || '');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get album by ID with tracks' })
  @ApiParam({ name: 'id', description: 'Album ID (ObjectId)' })
  async findById(@Param('id', ParseObjectIdPipe) id: string) {
    // TODO: Also return tracks for this album
    return this.albumsService.findById(id);
  }
}
