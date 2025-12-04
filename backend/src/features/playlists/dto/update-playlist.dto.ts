import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsBoolean, IsUrl } from 'class-validator';

export class UpdatePlaylistDto {
  @ApiPropertyOptional({ description: 'Playlist name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Playlist description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Cover image URL' })
  @IsOptional()
  @IsUrl()
  coverImageUrl?: string;

  @ApiPropertyOptional({ description: 'Whether playlist is public' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
