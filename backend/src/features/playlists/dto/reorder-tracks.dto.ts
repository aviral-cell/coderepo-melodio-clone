import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId } from 'class-validator';

export class ReorderTracksDto {
  @ApiProperty({
    description: 'Complete array of track IDs in new order',
    type: [String],
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  })
  @IsArray()
  @IsMongoId({ each: true })
  trackIds: string[];
}

export class AddTrackDto {
  @ApiProperty({
    description: 'Track ID to add',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  trackId: string;
}
