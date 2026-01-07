import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ArticleDocument = Article & Document;

@Schema({
  timestamps: true,
})
export class Article {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  url: string;

  @Prop({ required: true })
  summary: string;
}

export const ArticleSchema = SchemaFactory.createForClass(Article);
