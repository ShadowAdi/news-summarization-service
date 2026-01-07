import { Injectable } from '@nestjs/common';
import { Articles } from './interfaces/article.interface';

@Injectable()
export class ArticleService {
  private readonly articles: Articles[] = [];

  create(article: Articles) {
    this.articles.push(article);
    return this.articles.find((a) => a.title === article.title);
  }

  findAll(): Articles[] {
    return this.articles;
  }

  findOne(title: string) {
    return this.articles.find((article) => article.title === title);
  }

  remove(title: string) {
    return this.articles.filter((article) => article.title === title);
  }

  update(title: string, updateArticle: Partial<Articles>) {
    const article = this.articles.find((article) => article.title === title);
    if (!article) {
      return null;
    }
    Object.assign(article, updateArticle);
    return article;
  }
}
