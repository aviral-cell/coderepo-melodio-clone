import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, IsBoolean } from 'class-validator';

export class CreatePlaylistDto {
  @ApiProperty({ description: 'Playlist name', example: 'My Awesome Playlist' })
  @IsString()
  @IsNotEmpty({ message: 'Playlist name is required' })
  @MaxLength(100, { message: 'Playlist name must not exceed 100 characters' })
  name: string;

  @ApiPropertyOptional({ description: 'Playlist description' })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  @ApiPropertyOptional({ description: 'Whether playlist is public', default: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
