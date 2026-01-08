/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Article, ArticleDocument } from './schemas/article.schema';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { SummaryResponseDto } from './dto/summary-response.dto';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { OpenRouter } from '@openrouter/sdk';
import { SarvamAIClient } from 'sarvamai';

@Injectable()
export class ArticleService {
  private openai: OpenRouter;
  private saravamai: SarvamAIClient;

  constructor(
    @InjectModel(Article.name) private articleModel: Model<ArticleDocument>,
  ) {
    try {
      this.openai = new OpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY || '',
      });
      this.saravamai = new SarvamAIClient({
        apiSubscriptionKey:
          process.env.NEWS_SUMMARIZATION_SARVAMA_API_KEY || '',
      });
    } catch (error) {
      throw new Error(`Failed to initialize OpenAI client: ${error}`);
    }
  }

  async create(createArticleDto: CreateArticleDto): Promise<Article> {
    const createdArticle = new this.articleModel(createArticleDto);
    return createdArticle.save();
  }

  async findAll(): Promise<Article[]> {
    return this.articleModel.find().exec();
  }

  async findOne(id: string): Promise<Article> {
    const article = await this.articleModel.findById(id).exec();
    if (!article) {
      throw new NotFoundException(`Article with ID "${id}" not found`);
    }
    return article;
  }

  async findByTitle(title: string): Promise<Article> {
    const article = await this.articleModel.findOne({ title }).exec();
    if (!article) {
      throw new NotFoundException(`Article with title "${title}" not found`);
    }
    return article;
  }

  async update(
    id: string,
    updateArticleDto: UpdateArticleDto,
  ): Promise<Article> {
    const updatedArticle = await this.articleModel
      .findByIdAndUpdate(id, updateArticleDto, { new: true })
      .exec();

    if (!updatedArticle) {
      throw new NotFoundException(`Article with ID "${id}" not found`);
    }
    return updatedArticle;
  }

  async getSummary(id: string): Promise<string> {
    const article = await this.articleModel.findById(id).exec();
    if (!article) {
      throw new NotFoundException(`Article with ID "${id}" not found`);
    }

    try {
      // Extract content from the URL
      const content = await this.extractContentFromUrl(article.url);

      if (!content) {
        throw new Error('Unable to extract content from the provided URL');
      }

      // Generate summary using OpenRouter
      const summary = await this.generateSummary(content);

      console.log('update summary ', summary);

      // Update the article with the generated summary
      await this.articleModel.findByIdAndUpdate(id, { summary });

      return summary;
    } catch (error) {
      throw new Error(`Failed to generate summary: ${error}`);
    }
  }

  private async extractContentFromUrl(url: string): Promise<string> {
    try {
      const response = await axios.get<string>(url, {
        timeout: 10000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      const $ = cheerio.load(response.data);

      // Remove unwanted elements
      $(
        'script, style, nav, footer, header, aside, .advertisement, .ads',
      ).remove();

      // Try to extract main content using common selectors
      let content = '';
      const contentSelectors = [
        'article',
        '.article-content',
        '.post-content',
        '.entry-content',
        '.content',
        'main',
        '.main-content',
      ];

      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          content = element.text().trim();
          if (content.length > 500) {
            // Ensure we have substantial content
            break;
          }
        }
      }

      // Fallback: extract all paragraph text
      if (!content || content.length < 500) {
        content = $('p')
          .map((_, el) => $(el).text().trim())
          .get()
          .join(' ');
      }

      // Clean up the content
      content = content.replace(/\s+/g, ' ').trim();

      // Limit content length to avoid token limits (approximately 3000 characters)
      if (content.length > 3000) {
        content = content.substring(0, 3000) + '...';
      }

      return content;
    } catch (error) {
      throw new Error(`Failed to extract content from URL: ${error}`);
    }
  }

  private async generateSummary(content: string): Promise<string> {
    console.log('generateSummary called');
    console.log('WHICH_ONE =', process.env.WHICH_ONE);
    try {
      if (!this.openai) {
        throw new Error('OpenAI client not initialized');
      }

      if (!this.saravamai) {
        throw new Error('SarvamAI client not initialized');
      }

      const prompt = `Please summarize the following news article in 60-80 words. Maintain the original language of the article (do not translate). Provide a concise, informative summary that captures the main points:\n\n${content}`;

      let completion;
      let summary: string | [{ type: string; text: string }];
      if (process.env.WHICH_ONE === 'sarvama') {
        console.log(`Saravam is getting called`);
        completion = await this.saravamai.chat.completions({
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.5,
          top_p: 1,
          max_tokens: 1000,
        });
        console.log(
          `Saravam Response ${completion.choices[0].message.content}`,
        );
        summary = completion.choices[0].message.content as string;
      } else {
        console.log(`Saravam is not getting called`);

        return '';
      }
      // } else {
      //   completion = await this.openai.chat.send({
      //     model: 'deepseek/deepseek-v3.2',
      //     messages: [
      //       {
      //         role: 'user',
      //         content: prompt,
      //       },
      //     ],
      //     stream: false,
      //   });
      //   summary = completion.choices[0].message.content as string;
      // }

      if (!summary) {
        throw new Error('No summary generated from OpenRouter');
      }

      let summaryText: string;
      if (typeof summary === 'string') {
        summaryText = summary;
        console.log(`Saravam text ${summaryText}`);
      } else if (Array.isArray(summary)) {
        // Extract text from content items array
        const contentArray = summary as Array<{ type: string; text: string }>;
        summaryText = contentArray
          .filter((item) => item.type === 'text')
          .map((item) => item.text)
          .join(' ');
      } else {
        throw new Error('Unexpected summary format from OpenRouter');
      }

      return summaryText;
    } catch (error) {
      throw new Error(
        `Failed to generate summary with OpenRouter: ${error.message}`,
      );
    }
  }

  async getSummaryWithDetails(id: string): Promise<SummaryResponseDto> {
    const summary = await this.getSummary(id);
    const article = await this.articleModel.findById(id).exec();
    if (!article) {
      throw new NotFoundException(`Article with ID "${id}" not found`);
    }

    return {
      id: article._id.toString(),
      title: article.title,
      url: article.url,
      summary: summary,
    };
  }

  async remove(id: string): Promise<Article> {
    const deletedArticle = await this.articleModel.findByIdAndDelete(id).exec();
    if (!deletedArticle) {
      throw new NotFoundException(`Article with ID "${id}" not found`);
    }
    return deletedArticle;
  }
}
