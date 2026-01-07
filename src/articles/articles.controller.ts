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
import { Article } from './schemas/article.schema';

@Controller('articles')
export class ArticlesController {
  constructor(private articlesService: ArticleService) {}

  @Get()
  async findAll(): Promise<Article[]> {
    return this.articlesService.findAll();
  }

  @Post()
  async create(@Body() createArticleDto: CreateArticleDto): Promise<Article> {
    return this.articlesService.create(createArticleDto);
  }

  @Get('/get-summary/:id')
  async getSummary(@Param('id') id: string): Promise<string> {
    return this.articlesService.getSummary(id);
  }

  @Get('by-title/:title')
  async findByTitle(@Param('title') title: string): Promise<Article> {
    return this.articlesService.findByTitle(title);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Article> {
    return this.articlesService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ): Promise<Article> {
    return this.articlesService.update(id, updateArticleDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Article> {
    return this.articlesService.remove(id);
  }
}
