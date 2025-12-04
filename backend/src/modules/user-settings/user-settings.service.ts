import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface UpdateSettingsDto {
  emailDigestEnabled?: boolean;
  emailDigestTime?: string;
  emailDigestTimezone?: string;
  notifyOnNewArticles?: boolean;
  notifyOnErrors?: boolean;
}

@Injectable()
export class UserSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get user settings (create default if not exists)
   */
  async get(userId: string) {
    let settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.userSettings.create({
        data: { userId },
      });
    }

    return settings;
  }

  /**
   * Update user settings
   */
  async update(userId: string, data: UpdateSettingsDto) {
    // Ensure settings exist
    await this.get(userId);

    return this.prisma.userSettings.update({
      where: { userId },
      data,
    });
  }

  /**
   * Reset settings to default
   */
  async reset(userId: string) {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    if (settings) {
      return this.prisma.userSettings.update({
        where: { userId },
        data: {
          emailDigestEnabled: true,
          emailDigestTime: '08:00',
          emailDigestTimezone: 'Europe/Istanbul',
          notifyOnNewArticles: false,
          notifyOnErrors: true,
        },
      });
    }

    return this.prisma.userSettings.create({
      data: { userId },
    });
  }
}
