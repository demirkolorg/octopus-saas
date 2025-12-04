import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WatchKeywordsService } from './watch-keywords.service';
import { WatchAnalyzerService } from './watch-analyzer.service';
import { CreateWatchKeywordDto, UpdateWatchKeywordDto } from './dto';

@Controller('watch-keywords')
@UseGuards(JwtAuthGuard)
export class WatchKeywordsController {
  constructor(
    private readonly watchKeywordsService: WatchKeywordsService,
    private readonly watchAnalyzerService: WatchAnalyzerService,
  ) {}

  /**
   * Kullanıcının tüm takip kelimelerini getirir
   * GET /watch-keywords
   */
  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    return this.watchKeywordsService.findAll(userId);
  }

  /**
   * Tüm eşleşen haberleri getirir (tüm kelimeler için)
   * GET /watch-keywords/matches
   */
  @Get('matches')
  async getAllMatches(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('keywordId') keywordId?: string,
  ) {
    return this.watchKeywordsService.getAllMatches(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      keywordId,
    );
  }

  /**
   * Tek bir takip kelimesini getirir
   * GET /watch-keywords/:id
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.watchKeywordsService.findOne(id, userId);
  }

  /**
   * Bir kelimeyle eşleşen haberleri getirir
   * GET /watch-keywords/:id/matches
   */
  @Get(':id/matches')
  async getMatches(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.watchKeywordsService.getMatches(
      id,
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  /**
   * Yeni takip kelimesi oluşturur ve geçmiş haberleri analiz eder
   * POST /watch-keywords
   */
  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWatchKeywordDto,
  ) {
    const keyword = await this.watchKeywordsService.create(userId, dto);

    // Trigger background analysis for existing articles
    this.watchAnalyzerService.reanalyzeForKeyword(keyword.id, 100).catch(() => {
      // Ignore errors, analysis continues in background
    });

    return keyword;
  }

  /**
   * Bir kelime için mevcut haberleri yeniden analiz eder
   * POST /watch-keywords/:id/reanalyze
   */
  @Post(':id/reanalyze')
  async reanalyze(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    // Verify ownership
    await this.watchKeywordsService.findOne(id, userId);

    const matchCount = await this.watchAnalyzerService.reanalyzeForKeyword(id, 100);

    return { success: true, matchCount };
  }

  /**
   * Takip kelimesini günceller
   * PATCH /watch-keywords/:id
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateWatchKeywordDto,
  ) {
    return this.watchKeywordsService.update(id, userId, dto);
  }

  /**
   * Takip kelimesini siler
   * DELETE /watch-keywords/:id
   */
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.watchKeywordsService.remove(id, userId);
  }
}
