import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Kullanıcının erişebileceği tüm kategorileri listele
   * Sistem kategorileri + kullanıcının kendi kategorileri
   */
  async findAll(userId: string) {
    return this.prisma.category.findMany({
      where: {
        OR: [
          { isSystem: true },      // Sistem kategorileri (herkes görebilir)
          { userId: userId },       // Kullanıcının kendi kategorileri
        ],
      },
      orderBy: [
        { isSystem: 'desc' },     // Sistem kategorileri önce
        { name: 'asc' },
      ],
      include: {
        _count: {
          select: { sources: true },
        },
      },
    });
  }

  /**
   * Sadece sistem kategorilerini listele
   */
  async findSystemCategories() {
    return this.prisma.category.findMany({
      where: { isSystem: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { sources: true },
        },
      },
    });
  }

  /**
   * Yeni kullanıcı kategorisi oluştur
   */
  async create(dto: CreateCategoryDto, userId: string) {
    // Aynı isimde kategori var mı kontrol et (kullanıcı kategorileri arasında)
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        userId,
        name: dto.name,
      },
    });

    if (existingCategory) {
      throw new ConflictException(`"${dto.name}" adında bir kategoriniz zaten mevcut`);
    }

    // Sistem kategorisiyle aynı isimde olmasın
    const systemCategory = await this.prisma.category.findFirst({
      where: {
        isSystem: true,
        name: dto.name,
      },
    });

    if (systemCategory) {
      throw new ConflictException(`"${dto.name}" bir sistem kategorisidir, farklı bir isim seçin`);
    }

    return this.prisma.category.create({
      data: {
        name: dto.name,
        icon: dto.icon,
        color: dto.color,
        isSystem: false,
        userId,
      },
      include: {
        _count: {
          select: { sources: true },
        },
      },
    });
  }

  /**
   * Kategori detayı
   */
  async findOne(id: string, userId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        sources: {
          orderBy: { createdAt: 'desc' },
          include: {
            site: true,
            _count: {
              select: { articles: true },
            },
          },
        },
        _count: {
          select: { sources: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Kategori bulunamadı');
    }

    // Kullanıcı bu kategoriye erişebilir mi?
    if (!category.isSystem && category.userId !== userId) {
      throw new ForbiddenException('Bu kategoriye erişim izniniz yok');
    }

    return category;
  }

  /**
   * Kategori güncelle (sadece kullanıcı kategorileri)
   */
  async update(id: string, dto: UpdateCategoryDto, userId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Kategori bulunamadı');
    }

    // Sistem kategorileri güncellenemez
    if (category.isSystem) {
      throw new ForbiddenException('Sistem kategorileri düzenlenemez');
    }

    // Sadece sahibi güncelleyebilir
    if (category.userId !== userId) {
      throw new ForbiddenException('Bu kategoriye erişim izniniz yok');
    }

    // İsim değişiyorsa aynı isimde başka kategori var mı kontrol et
    if (dto.name && dto.name !== category.name) {
      const existingCategory = await this.prisma.category.findFirst({
        where: {
          userId,
          name: dto.name,
          id: { not: id },
        },
      });

      if (existingCategory) {
        throw new ConflictException(`"${dto.name}" adında bir kategoriniz zaten mevcut`);
      }

      // Sistem kategorisiyle aynı isimde olmasın
      const systemCategory = await this.prisma.category.findFirst({
        where: {
          isSystem: true,
          name: dto.name,
        },
      });

      if (systemCategory) {
        throw new ConflictException(`"${dto.name}" bir sistem kategorisidir, farklı bir isim seçin`);
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        icon: dto.icon,
        color: dto.color,
      },
      include: {
        _count: {
          select: { sources: true },
        },
      },
    });
  }

  /**
   * Kategori sil (sadece kullanıcı kategorileri)
   */
  async delete(id: string, userId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { sources: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Kategori bulunamadı');
    }

    // Sistem kategorileri silinemez
    if (category.isSystem) {
      throw new ForbiddenException('Sistem kategorileri silinemez');
    }

    // Sadece sahibi silebilir
    if (category.userId !== userId) {
      throw new ForbiddenException('Bu kategoriye erişim izniniz yok');
    }

    // Kaynakları olan kategori silinemesin
    if (category._count.sources > 0) {
      throw new ConflictException(
        `Bu kategorinin ${category._count.sources} kaynağı bulunuyor. Önce kaynakları silmelisiniz veya başka kategoriye taşımalısınız.`,
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { success: true };
  }
}
