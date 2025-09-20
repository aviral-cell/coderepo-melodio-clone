import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { SearchService } from '../services/search.service';
import { SearchSongsDto } from '../dto/search-songs.dto';
import { SearchSongsResponse } from '../interfaces/search.interface';

@Controller('search')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async searchSongs(
    @Query() searchSongsDto: SearchSongsDto,
  ): Promise<SearchSongsResponse> {
    return this.searchService.searchSongs(searchSongsDto);
  }
}
