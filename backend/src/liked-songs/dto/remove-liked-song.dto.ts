import { IsString, IsNotEmpty } from 'class-validator';

export class RemoveLikedSongDto {
  @IsString()
  @IsNotEmpty()
  songId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}
