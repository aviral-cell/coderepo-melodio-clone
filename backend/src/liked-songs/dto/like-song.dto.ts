import { IsString, IsNotEmpty } from 'class-validator';

export class LikeSongDto {
  @IsString()
  @IsNotEmpty()
  songId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}
