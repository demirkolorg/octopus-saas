import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WatchKeywordsService } from './watch-keywords.service';
import { WatchAnalyzerService } from './watch-analyzer.service';
import {
  CreateWatchGroupDto,
  UpdateWatchGroupDto,
  CreateWatchKeywordDto,
  BulkCreateKeywordsDto,
} from './dto';

@Controller('watch-groups')
@UseGuards(JwtAuthGuard)
export class WatchGroupsController {
  constructor(
    private readonly watchKeywordsService: WatchKeywordsService,
    private readonly watchAnalyzerService: WatchAnalyzerService,
  ) {}

  /**
   * Kullanıcının tüm takip gruplarını getirir
   * GET /watch-groups
   */
  @Get()
  async findAllGroups(@CurrentUser('id') userId: string) {
    return this.watchKeywordsService.findAllGroups(userId);
  }

  /**
   * Tek bir takip grubunu getirir
   * GET /watch-groups/:id
   */
  @Get(':id')
  async findOneGroup(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.watchKeywordsService.findOneGroup(id, userId);
  }

  /**
   * Yeni takip grubu oluşturur
   * POST /watch-groups
   */
  @Post()
  async createGroup(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWatchGroupDto,
  ) {
    const group = await this.watchKeywordsService.createGroup(userId, dto);

    // Eğer kelimeler eklendiyse, geçmiş haberler için analiz başlat
    if (group.keywords && group.keywords.length > 0) {
      for (const keyword of group.keywords) {
        this.watchAnalyzerService.reanalyzeForKeyword(keyword.id, 100).catch(() => {
          // Ignore errors, analysis continues in background
        });
      }
    }

    return group;
  }

  /**
   * Takip grubunu günceller
   * PATCH /watch-groups/:id
   */
  @Patch(':id')
  async updateGroup(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateWatchGroupDto,
  ) {
    return this.watchKeywordsService.updateGroup(id, userId, dto);
  }

  /**
   * Takip grubunu siler
   * DELETE /watch-groups/:id
   */
  @Delete(':id')
  async removeGroup(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.watchKeywordsService.removeGroup(id, userId);
  }

  /**
   * Gruba kelime ekler
   * POST /watch-groups/:id/keywords
   */
  @Post(':id/keywords')
  async addKeywordToGroup(
    @Param('id') groupId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWatchKeywordDto,
  ) {
    const keyword = await this.watchKeywordsService.addKeywordToGroup(
      groupId,
      userId,
      dto,
    );

    // Trigger background analysis for existing articles
    this.watchAnalyzerService.reanalyzeForKeyword(keyword.id, 100).catch(() => {
      // Ignore errors, analysis continues in background
    });

    return keyword;
  }

  /**
   * Gruba toplu kelime ekler (CSV formatında)
   * POST /watch-groups/:id/keywords/bulk
   */
  @Post(':id/keywords/bulk')
  async addBulkKeywordsToGroup(
    @Param('id') groupId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: BulkCreateKeywordsDto,
  ) {
    const result = await this.watchKeywordsService.addBulkKeywordsToGroup(
      groupId,
      userId,
      dto.keywords,
    );

    // Eklenen kelimeler için arka planda analiz başlat
    if (result.added.length > 0) {
      // Yeni eklenen kelimelerin ID'lerini al
      const addedKeywords = await this.watchKeywordsService.findAllGroups(userId);
      const group = addedKeywords.find((g) => g.id === groupId);
      if (group) {
        for (const keyword of group.keywords) {
          if (result.added.includes(keyword.keyword)) {
            this.watchAnalyzerService.reanalyzeForKeyword(keyword.id, 100).catch(() => {
              // Ignore errors
            });
          }
        }
      }
    }

    return result;
  }

  /**
   * Gruptan kelime çıkarır
   * DELETE /watch-groups/:groupId/keywords/:keywordId
   */
  @Delete(':groupId/keywords/:keywordId')
  async removeKeywordFromGroup(
    @Param('groupId') groupId: string,
    @Param('keywordId') keywordId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.watchKeywordsService.removeKeywordFromGroup(
      groupId,
      keywordId,
      userId,
    );
  }
}
