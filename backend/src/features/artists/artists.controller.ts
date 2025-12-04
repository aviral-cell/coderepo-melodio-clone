import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../../shared/pipes/parse-object-id.pipe';
import { ArtistsService } from './artists.service';
import { ArtistQueryDto, ArtistSearchDto } from './dto/artist-query.dto';

@ApiTags('Artists')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('artists')
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all artists with pagination' })
  async findAll(@Query() queryDto: ArtistQueryDto) {
    return this.artistsService.findAll(queryDto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search artists by name' })
  async search(@Query() searchDto: ArtistSearchDto) {
    return this.artistsService.search(searchDto.q || '');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get artist by ID' })
  @ApiParam({ name: 'id', description: 'Artist ID (ObjectId)' })
  async findById(@Param('id', ParseObjectIdPipe) id: string) {
    return this.artistsService.findById(id);
  }

  // TODO: Add endpoint to get artist's tracks
  // TODO: Add endpoint to get artist's albums
}
