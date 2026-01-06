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

@Controller('articles')
export class ArticlesController {
  @Get()
  findAll(): string {
    return 'This is to get Articles';
  }

  @Post()
  create(@Body() createArticleDto: CreateArticleDto): string {
    return 'This action adds a new articles';
  }

  @Get(':id')
  findOne(@Param() params: Record<string, string>): string {
    console.log(params.id);
    return `This action returns a #${params.id} article`;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCatDto: UpdateArticleDto) {
    return `This action updates an #${id} article`;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return `This action removes a #${id} article`;
  }
}
