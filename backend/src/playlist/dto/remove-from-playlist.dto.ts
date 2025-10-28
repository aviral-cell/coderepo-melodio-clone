import { IsString, IsNotEmpty } from 'class-validator';

export class RemoveFromPlaylistDto {
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
