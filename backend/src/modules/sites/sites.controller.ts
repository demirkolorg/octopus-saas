import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { SitesService } from './sites.service';
import { CreateSiteDto, UpdateSiteDto } from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  /**
   * Yeni site oluştur
   */
  @Post()
  async create(@Body() dto: CreateSiteDto, @CurrentUser('id') userId: string) {
    return this.sitesService.create(dto, userId);
  }

  /**
   * Site oluştur veya mevcut olanı döndür
   */
  @Post('find-or-create')
  async findOrCreate(@Body() dto: CreateSiteDto, @CurrentUser('id') userId: string) {
    return this.sitesService.findOrCreate(dto, userId);
  }

  /**
   * URL'den site ara
   */
  @Get('search')
  async searchByUrl(@Query('url') url: string, @CurrentUser('id') userId: string) {
    return this.sitesService.searchByUrl(url, userId);
  }

  /**
   * Tüm siteleri listele
   */
  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    return this.sitesService.findAll(userId);
  }

  /**
   * Site detayı
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.sitesService.findOne(id, userId);
  }

  /**
   * Site güncelle
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSiteDto, @CurrentUser('id') userId: string) {
    return this.sitesService.update(id, dto, userId);
  }

  /**
   * Site sil
   */
  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.sitesService.delete(id, userId);
  }

  /**
   * Mevcut kaynakları sitelere migrate et
   * POST /sites/migrate-sources
   */
  @Post('migrate-sources')
  async migrateSources(@CurrentUser('id') userId: string) {
    return this.sitesService.migrateSourcestoSites(userId);
  }
}
