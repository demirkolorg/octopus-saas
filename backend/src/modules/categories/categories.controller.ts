import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * Tüm kategorileri listele (sistem + kullanıcı kategorileri)
   */
  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    return this.categoriesService.findAll(userId);
  }

  /**
   * Yeni kullanıcı kategorisi oluştur
   */
  @Post()
  async create(@Body() dto: CreateCategoryDto, @CurrentUser('id') userId: string) {
    return this.categoriesService.create(dto, userId);
  }

  /**
   * Kategori detayı
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.categoriesService.findOne(id, userId);
  }

  /**
   * Kategori güncelle (sadece kullanıcı kategorileri)
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto, @CurrentUser('id') userId: string) {
    return this.categoriesService.update(id, dto, userId);
  }

  /**
   * Kategori sil (sadece kullanıcı kategorileri)
   */
  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.categoriesService.delete(id, userId);
  }
}
