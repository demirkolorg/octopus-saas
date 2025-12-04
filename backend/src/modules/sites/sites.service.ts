import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSiteDto, UpdateSiteDto } from './dto';

@Injectable()
export class SitesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * URL'den domain çıkarır
   */
  extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }

  /**
   * Domain'e göre site bul (sistem sitesi veya kullanıcı sitesi)
   */
  async findByDomain(domain: string, userId?: string) {
    return this.prisma.site.findFirst({
      where: {
        domain,
        OR: [
          { isSystem: true },
          ...(userId ? [{ userId }] : []),
        ],
      },
      include: {
        _count: {
          select: { sources: true },
        },
      },
    });
  }

  /**
   * Sadece sistem sitelerini listele
   */
  async findSystemSites() {
    return this.prisma.site.findMany({
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
   * Yeni site oluştur
   */
  async create(dto: CreateSiteDto, userId: string) {
    const domain = this.extractDomain(dto.url);

    // Aynı domain'de site var mı kontrol et (sistem sitesi veya kullanıcı sitesi)
    const existingSite = await this.findByDomain(domain, userId);
    if (existingSite) {
      if (existingSite.isSystem) {
        throw new ConflictException(`Bu domain için sistem sitesi mevcut: ${domain}`);
      }
      throw new ConflictException(`Bu domain için zaten bir site mevcut: ${domain}`);
    }

    return this.prisma.site.create({
      data: {
        name: dto.name,
        domain,
        logoUrl: dto.logoUrl,
        siteType: dto.siteType,
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
   * Site oluştur veya mevcut olanı döndür (kaynak ekleme akışı için)
   * Sistem sitesi varsa onu döndürür, yoksa kullanıcı sitesi oluşturur
   */
  async findOrCreate(dto: CreateSiteDto, userId: string) {
    const domain = this.extractDomain(dto.url);

    // Önce sistem sitesi var mı bak, sonra kullanıcı sitesi
    let site = await this.findByDomain(domain, userId);

    if (!site) {
      site = await this.prisma.site.create({
        data: {
          name: dto.name || domain,
          domain,
          logoUrl: dto.logoUrl,
          siteType: dto.siteType,
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

    return site;
  }

  /**
   * Kullanıcının erişebileceği tüm siteleri listele
   * Sistem siteleri + kullanıcının kendi siteleri
   */
  async findAll(userId: string) {
    return this.prisma.site.findMany({
      where: {
        OR: [
          { isSystem: true },      // Sistem siteleri (herkes görebilir)
          { userId: userId },       // Kullanıcının kendi siteleri
        ],
      },
      orderBy: [
        { isSystem: 'desc' },     // Sistem siteleri önce
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
   * Site detayı
   */
  async findOne(id: string, userId: string) {
    const site = await this.prisma.site.findUnique({
      where: { id },
      include: {
        sources: {
          orderBy: { createdAt: 'desc' },
          include: {
            category: true,
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

    if (!site) {
      throw new NotFoundException('Site bulunamadı');
    }

    // Kullanıcı bu siteye erişebilir mi?
    if (!site.isSystem && site.userId !== userId) {
      throw new ForbiddenException('Bu siteye erişim izniniz yok');
    }

    return site;
  }

  /**
   * Site güncelle (sadece kullanıcı siteleri)
   */
  async update(id: string, dto: UpdateSiteDto, userId: string) {
    const site = await this.prisma.site.findUnique({
      where: { id },
    });

    if (!site) {
      throw new NotFoundException('Site bulunamadı');
    }

    // Sistem siteleri güncellenemez
    if (site.isSystem) {
      throw new ForbiddenException('Sistem siteleri düzenlenemez');
    }

    // Sadece sahibi güncelleyebilir
    if (site.userId !== userId) {
      throw new ForbiddenException('Bu siteye erişim izniniz yok');
    }

    return this.prisma.site.update({
      where: { id },
      data: {
        name: dto.name,
        logoUrl: dto.logoUrl,
        siteType: dto.siteType,
      },
      include: {
        _count: {
          select: { sources: true },
        },
      },
    });
  }

  /**
   * Site sil (sadece kullanıcı siteleri)
   */
  async delete(id: string, userId: string) {
    const site = await this.prisma.site.findUnique({
      where: { id },
      include: {
        _count: {
          select: { sources: true },
        },
      },
    });

    if (!site) {
      throw new NotFoundException('Site bulunamadı');
    }

    // Sistem siteleri silinemez
    if (site.isSystem) {
      throw new ForbiddenException('Sistem siteleri silinemez');
    }

    // Sadece sahibi silebilir
    if (site.userId !== userId) {
      throw new ForbiddenException('Bu siteye erişim izniniz yok');
    }

    // Kaynakları olan site silinemesin
    if (site._count.sources > 0) {
      throw new ConflictException(
        `Bu sitenin ${site._count.sources} kaynağı bulunuyor. Önce kaynakları silmelisiniz.`,
      );
    }

    await this.prisma.site.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Domain'e göre site ara (kaynak ekleme sırasında kullanılır)
   */
  async searchByUrl(url: string, userId: string) {
    const domain = this.extractDomain(url);
    return this.findByDomain(domain, userId);
  }

  /**
   * Mevcut kaynakları sitelere migrate et
   * siteId'si olmayan tüm kaynakları alır, domain'e göre site oluşturur ve bağlar
   */
  async migrateSourcestoSites(userId: string) {
    // siteId'si olmayan kaynakları al
    const sourcesWithoutSite = await this.prisma.source.findMany({
      where: {
        userId,
        siteId: null,
      },
    });

    const results = {
      totalSources: sourcesWithoutSite.length,
      sitesCreated: 0,
      sourcesMigrated: 0,
      errors: [] as string[],
    };

    // Her kaynak için
    for (const source of sourcesWithoutSite) {
      try {
        const domain = this.extractDomain(source.url);

        // Site var mı kontrol et, yoksa oluştur
        let site = await this.findByDomain(domain, userId);

        if (!site) {
          site = await this.prisma.site.create({
            data: {
              name: domain,
              domain,
              userId,
            },
            include: {
              _count: {
                select: { sources: true },
              },
            },
          });
          results.sitesCreated++;
        }

        // Kaynağı site'a bağla
        await this.prisma.source.update({
          where: { id: source.id },
          data: { siteId: site.id },
        });
        results.sourcesMigrated++;
      } catch (error) {
        results.errors.push(
          `Failed to migrate source ${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    return results;
  }
}
