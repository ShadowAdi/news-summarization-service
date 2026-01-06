import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArticlesController } from './articles/articles.controller';

@Module({
  imports: [],
  controllers: [AppController, ArticlesController],
  providers: [AppService],
})
export class AppModule {}
