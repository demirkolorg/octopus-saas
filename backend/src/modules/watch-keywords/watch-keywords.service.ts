import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateWatchKeywordDto,
  UpdateWatchKeywordDto,
  CreateWatchGroupDto,
  UpdateWatchGroupDto,
  BulkKeywordItemDto,
} from './dto';

@Injectable()
export class WatchKeywordsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Kullanıcının tüm takip kelimelerini getirir
   */
  async findAll(userId: string) {
    const keywords = await this.prisma.watchKeyword.findMany({
      where: { userId },
      include: {
        _count: {
          select: { matches: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Son eşleşme tarihini de ekle
    const keywordsWithStats = await Promise.all(
      keywords.map(async (keyword) => {
        const lastMatch = await this.prisma.articleWatchMatch.findFirst({
          where: { watchKeywordId: keyword.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        });

        return {
          ...keyword,
          matchCount: keyword._count.matches,
          lastMatchAt: lastMatch?.createdAt || null,
        };
      }),
    );

    return keywordsWithStats;
  }

  /**
   * Tek bir takip kelimesini getirir
   */
  async findOne(id: string, userId: string) {
    const keyword = await this.prisma.watchKeyword.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { matches: true },
        },
      },
    });

    if (!keyword) {
      throw new NotFoundException('Takip kelimesi bulunamadı');
    }

    return keyword;
  }

  /**
   * Yeni takip kelimesi oluşturur
   */
  async create(userId: string, dto: CreateWatchKeywordDto) {
    // Aynı kullanıcı için aynı kelime var mı kontrol et
    const existing = await this.prisma.watchKeyword.findFirst({
      where: {
        userId,
        keyword: {
          equals: dto.keyword,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw new ConflictException('Bu kelime zaten takip listesinde');
    }

    return this.prisma.watchKeyword.create({
      data: {
        userId,
        keyword: dto.keyword.trim(),
        description: dto.description?.trim(),
        color: dto.color || '#f59e0b',
        isActive: dto.isActive ?? true,
      },
    });
  }

  /**
   * Takip kelimesini günceller
   */
  async update(id: string, userId: string, dto: UpdateWatchKeywordDto) {
    // Kelime sahibi doğrula
    const keyword = await this.findOne(id, userId);

    // Eğer kelime değişiyorsa, yeni kelime zaten var mı kontrol et
    if (dto.keyword && dto.keyword.toLowerCase() !== keyword.keyword.toLowerCase()) {
      const existing = await this.prisma.watchKeyword.findFirst({
        where: {
          userId,
          keyword: {
            equals: dto.keyword,
            mode: 'insensitive',
          },
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('Bu kelime zaten takip listesinde');
      }
    }

    return this.prisma.watchKeyword.update({
      where: { id },
      data: {
        keyword: dto.keyword?.trim(),
        description: dto.description?.trim(),
        color: dto.color,
        isActive: dto.isActive,
      },
    });
  }

  /**
   * Takip kelimesini siler
   */
  async remove(id: string, userId: string) {
    // Kelime sahibi doğrula
    await this.findOne(id, userId);

    await this.prisma.watchKeyword.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Bir kelimeyle eşleşen haberleri getirir
   */
  async getMatches(id: string, userId: string, page = 1, limit = 20) {
    // Kelime sahibi doğrula
    await this.findOne(id, userId);

    const skip = (page - 1) * limit;

    const [matches, total] = await Promise.all([
      this.prisma.articleWatchMatch.findMany({
        where: { watchKeywordId: id },
        include: {
          article: {
            include: {
              source: {
                include: {
                  site: true,
                  category: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.articleWatchMatch.count({
        where: { watchKeywordId: id },
      }),
    ]);

    return {
      data: matches.map((m) => ({
        ...m.article,
        watchMatch: {
          id: m.id,
          confidence: m.confidence,
          reason: m.reason,
          createdAt: m.createdAt,
        },
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Tüm eşleşen haberleri getirir (tüm kelimeler için)
   */
  async getAllMatches(userId: string, page = 1, limit = 20, keywordId?: string) {
    const skip = (page - 1) * limit;

    // Kullanıcının kelimelerini bul
    const userKeywordIds = await this.prisma.watchKeyword.findMany({
      where: { userId },
      select: { id: true },
    });

    const keywordIds = userKeywordIds.map((k) => k.id);

    // Sadece belirli bir kelime için filtreleme yapılıyorsa ve o kelime kullanıcıya aitse
    const whereClause = keywordId && keywordIds.includes(keywordId)
      ? { watchKeywordId: keywordId }
      : { watchKeywordId: { in: keywordIds } };

    const [matches, total] = await Promise.all([
      this.prisma.articleWatchMatch.findMany({
        where: whereClause,
        include: {
          watchKeyword: true,
          article: {
            include: {
              source: {
                include: {
                  site: true,
                  category: true,
                },
              },
              watchMatches: {
                include: {
                  watchKeyword: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.articleWatchMatch.count({
        where: whereClause,
      }),
    ]);

    // Haberleri grupla (bir haber birden fazla kelimeyle eşleşebilir)
    const articlesMap = new Map();
    for (const match of matches) {
      if (!articlesMap.has(match.articleId)) {
        articlesMap.set(match.articleId, match.article);
      }
    }

    return {
      data: Array.from(articlesMap.values()),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Kullanıcının aktif kelimelerini getirir (AI analizi için)
   */
  async getActiveKeywords(userId: string) {
    return this.prisma.watchKeyword.findMany({
      where: {
        userId,
        isActive: true,
      },
    });
  }

  /**
   * Tüm aktif kelimeleri getirir (batch analiz için)
   */
  async getAllActiveKeywords() {
    return this.prisma.watchKeyword.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: { id: true, email: true },
        },
        group: {
          select: { id: true, name: true, description: true },
        },
      },
    });
  }

  // ========================================
  // WATCH GROUP METHODS
  // ========================================

  /**
   * Kullanıcının tüm takip gruplarını getirir
   */
  async findAllGroups(userId: string) {
    const groups = await this.prisma.watchGroup.findMany({
      where: { userId },
      include: {
        keywords: {
          include: {
            _count: {
              select: { matches: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Her grup için toplam eşleşme sayısını hesapla
    return groups.map((group) => ({
      ...group,
      keywords: group.keywords.map((k) => ({
        ...k,
        matchCount: k._count.matches,
      })),
      matchCount: group.keywords.reduce((sum, k) => sum + k._count.matches, 0),
    }));
  }

  /**
   * Tek bir takip grubunu getirir
   */
  async findOneGroup(id: string, userId: string) {
    const group = await this.prisma.watchGroup.findFirst({
      where: { id, userId },
      include: {
        keywords: {
          include: {
            _count: {
              select: { matches: true },
            },
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Takip grubu bulunamadı');
    }

    return {
      ...group,
      keywords: group.keywords.map((k) => ({
        ...k,
        matchCount: k._count.matches,
      })),
      matchCount: group.keywords.reduce((sum, k) => sum + k._count.matches, 0),
    };
  }

  /**
   * Yeni takip grubu oluşturur
   */
  async createGroup(userId: string, dto: CreateWatchGroupDto) {
    // Aynı isimde grup var mı kontrol et
    const existing = await this.prisma.watchGroup.findFirst({
      where: {
        userId,
        name: {
          equals: dto.name,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw new ConflictException('Bu isimde bir grup zaten mevcut');
    }

    // Grup oluştur
    const group = await this.prisma.watchGroup.create({
      data: {
        userId,
        name: dto.name.trim(),
        description: dto.description?.trim(),
        color: dto.color || '#f59e0b',
        isActive: dto.isActive ?? true,
      },
    });

    // Eğer kelimeler de gönderildiyse ekle
    if (dto.keywords && dto.keywords.length > 0) {
      for (const keywordDto of dto.keywords) {
        try {
          await this.prisma.watchKeyword.create({
            data: {
              userId,
              groupId: group.id,
              keyword: keywordDto.keyword.trim(),
              description: keywordDto.description?.trim(),
              color: dto.color || '#f59e0b',
              isActive: true,
            },
          });
        } catch {
          // Aynı kelime varsa atla
        }
      }
    }

    // Güncellenmiş grubu döndür
    return this.findOneGroup(group.id, userId);
  }

  /**
   * Takip grubunu günceller
   */
  async updateGroup(id: string, userId: string, dto: UpdateWatchGroupDto) {
    // Grup sahibi doğrula
    await this.findOneGroup(id, userId);

    // İsim değişiyorsa aynı isimde grup var mı kontrol et
    if (dto.name) {
      const existing = await this.prisma.watchGroup.findFirst({
        where: {
          userId,
          name: {
            equals: dto.name,
            mode: 'insensitive',
          },
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('Bu isimde bir grup zaten mevcut');
      }
    }

    await this.prisma.watchGroup.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        description: dto.description?.trim(),
        color: dto.color,
        isActive: dto.isActive,
      },
    });

    return this.findOneGroup(id, userId);
  }

  /**
   * Takip grubunu siler (kelimeleri de siler)
   */
  async removeGroup(id: string, userId: string) {
    // Grup sahibi doğrula
    await this.findOneGroup(id, userId);

    await this.prisma.watchGroup.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Gruba kelime ekler
   */
  async addKeywordToGroup(groupId: string, userId: string, dto: CreateWatchKeywordDto) {
    // Grup sahibi doğrula
    const group = await this.findOneGroup(groupId, userId);

    // Aynı kullanıcı için aynı kelime var mı kontrol et
    const existing = await this.prisma.watchKeyword.findFirst({
      where: {
        userId,
        keyword: {
          equals: dto.keyword,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw new ConflictException('Bu kelime zaten takip listesinde');
    }

    return this.prisma.watchKeyword.create({
      data: {
        userId,
        groupId,
        keyword: dto.keyword.trim(),
        description: dto.description?.trim(),
        color: group.color, // Grup rengini kullan
        isActive: dto.isActive ?? true,
      },
    });
  }

  /**
   * Gruptan kelime çıkarır (kelimeyi siler)
   */
  async removeKeywordFromGroup(groupId: string, keywordId: string, userId: string) {
    // Grup sahibi doğrula
    await this.findOneGroup(groupId, userId);

    // Kelime bu gruba ait mi kontrol et
    const keyword = await this.prisma.watchKeyword.findFirst({
      where: { id: keywordId, groupId, userId },
    });

    if (!keyword) {
      throw new NotFoundException('Kelime bu grupta bulunamadı');
    }

    await this.prisma.watchKeyword.delete({
      where: { id: keywordId },
    });

    return { success: true };
  }

  /**
   * Gruba toplu kelime ekler
   */
  async addBulkKeywordsToGroup(
    groupId: string,
    userId: string,
    keywords: BulkKeywordItemDto[],
  ) {
    // Grup sahibi doğrula
    const group = await this.findOneGroup(groupId, userId);

    // Kullanıcının mevcut kelimelerini al (case-insensitive kontrol için)
    const existingKeywords = await this.prisma.watchKeyword.findMany({
      where: { userId },
      select: { keyword: true },
    });
    const existingKeywordSet = new Set(
      existingKeywords.map((k) => k.keyword.toLowerCase()),
    );

    const results = {
      added: [] as string[],
      skipped: [] as string[],
    };

    for (const item of keywords) {
      const normalizedKeyword = item.keyword.trim().toLowerCase();

      // Zaten varsa atla
      if (existingKeywordSet.has(normalizedKeyword)) {
        results.skipped.push(item.keyword.trim());
        continue;
      }

      try {
        await this.prisma.watchKeyword.create({
          data: {
            userId,
            groupId,
            keyword: item.keyword.trim(),
            description: item.description?.trim(),
            color: group.color,
            isActive: true,
          },
        });
        results.added.push(item.keyword.trim());
        existingKeywordSet.add(normalizedKeyword);
      } catch {
        results.skipped.push(item.keyword.trim());
      }
    }

    return results;
  }
}
