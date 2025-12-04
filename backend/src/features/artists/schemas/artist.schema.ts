import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ArtistDocument = HydratedDocument<Artist>;

@Schema({ timestamps: true })
export class Artist {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  bio?: string;

  @Prop()
  imageUrl?: string;

  @Prop({ type: [String], required: true, default: [] })
  genres: string[];

  @Prop({ default: 0, min: 0 })
  followerCount: number;
}

export const ArtistSchema = SchemaFactory.createForClass(Artist);

ArtistSchema.index({ name: 'text' });
ArtistSchema.index({ followerCount: -1 });
