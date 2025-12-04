import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AlbumDocument = HydratedDocument<Album>;

@Schema({ timestamps: true })
export class Album {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: Types.ObjectId, ref: 'Artist', required: true })
  artistId: Types.ObjectId;

  @Prop({ required: true })
  releaseDate: Date;

  @Prop()
  coverImageUrl?: string;

  @Prop({ required: true, min: 1 })
  totalTracks: number;
}

export const AlbumSchema = SchemaFactory.createForClass(Album);

AlbumSchema.index({ artistId: 1 });
AlbumSchema.index({ title: 'text' });
AlbumSchema.index({ releaseDate: -1 });
