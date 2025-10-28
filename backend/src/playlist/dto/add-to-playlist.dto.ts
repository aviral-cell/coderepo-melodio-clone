import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AddToPlaylistDto {
  @IsString()
  @IsNotEmpty()
  songId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  playlistName: string;
}
