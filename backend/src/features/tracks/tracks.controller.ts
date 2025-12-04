import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../../shared/pipes/parse-object-id.pipe';
import { TracksService } from './tracks.service';
import { TrackQueryDto, SearchQueryDto } from './dto/track-query.dto';

@ApiTags('Tracks')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('tracks')
export class TracksController {
  constructor(private readonly tracksService: TracksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tracks with pagination' })
  async findAll(@Query() queryDto: TrackQueryDto) {
    return this.tracksService.findAll(queryDto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search tracks by title' })
  async search(@Query() searchDto: SearchQueryDto) {
    return this.tracksService.search(searchDto.q || '');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get track by ID' })
  @ApiParam({ name: 'id', description: 'Track ID (ObjectId)' })
  async findById(@Param('id', ParseObjectIdPipe) id: string) {
    return this.tracksService.findById(id);
  }

  @Post(':id/play')
  @ApiOperation({ summary: 'Log a play event for a track' })
  @ApiParam({ name: 'id', description: 'Track ID (ObjectId)' })
  async logPlay(@Param('id', ParseObjectIdPipe) id: string) {
    // TODO: Also create listening history entry
    return this.tracksService.incrementPlayCount(id);
  }
}
