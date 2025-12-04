import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SearchQueryDto {
  @ApiProperty({ description: 'Search query', example: 'rock' })
  @IsString()
  @IsNotEmpty({ message: 'Search query is required' })
  @MinLength(1, { message: 'Search query must not be empty' })
  q: string;
}
