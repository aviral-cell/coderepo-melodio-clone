import { IsString, IsNotEmpty } from 'class-validator';

export class GetUserPlaylistsDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}


