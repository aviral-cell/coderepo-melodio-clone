import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TrackDocument = HydratedDocument<Track>;

@Schema({ timestamps: true })
export class Track {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: Types.ObjectId, ref: 'Artist', required: true })
  artistId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Album', required: true })
  albumId: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  durationInSeconds: number;

  @Prop({ required: true, min: 1 })
  trackNumber: number;

  @Prop({ required: true, trim: true, lowercase: true })
  genre: string;

  @Prop({ default: 0, min: 0 })
  playCount: number;

  @Prop()
  coverImageUrl?: string;
}

export const TrackSchema = SchemaFactory.createForClass(Track);

TrackSchema.index({ artistId: 1 });
TrackSchema.index({ albumId: 1 });
TrackSchema.index({ genre: 1 });
TrackSchema.index({ title: 'text' });
TrackSchema.index({ playCount: -1 });
