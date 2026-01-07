import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleService } from './articles.service';
import { Articles } from './interfaces/article.interface';

@Controller('articles')
export class ArticlesController {
  constructor(private articlesService: ArticleService) {}

  @Get()
  findAll(): Articles[] {
    return this.articlesService.findAll();
  }

  @Post()
  create(@Body() createArticleDto: CreateArticleDto): Articles | undefined {
    return this.articlesService.create(createArticleDto);
  }

  @Get(':title')
  findOne(@Param('title') title: string): Articles | undefined {
    console.log(title);
    return this.articlesService.findOne(title);
  }

  @Patch(':title')
  update(
    @Param('title') title: string,
    @Body() updateCatDto: UpdateArticleDto,
  ): Articles | null {
    return this.articlesService.update(title, updateCatDto);
  }

  @Delete(':title')
  remove(@Param('title') title: string): Articles[] {
    return this.articlesService.remove(title);
  }
}
