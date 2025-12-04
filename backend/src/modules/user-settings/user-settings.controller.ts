import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserSettingsService } from './user-settings.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('settings')
export class UserSettingsController {
  constructor(private readonly userSettingsService: UserSettingsService) {}

  /**
   * Get user settings
   * GET /settings
   */
  @Get()
  async get(@CurrentUser('id') userId: string) {
    return this.userSettingsService.get(userId);
  }

  /**
   * Update user settings
   * PUT /settings
   */
  @Put()
  async update(
    @CurrentUser('id') userId: string,
    @Body() body: {
      emailDigestEnabled?: boolean;
      emailDigestTime?: string;
      emailDigestTimezone?: string;
      notifyOnNewArticles?: boolean;
      notifyOnErrors?: boolean;
    },
  ) {
    return this.userSettingsService.update(userId, body);
  }

  /**
   * Reset settings to default
   * POST /settings/reset
   */
  @Post('reset')
  @HttpCode(HttpStatus.OK)
  async reset(@CurrentUser('id') userId: string) {
    return this.userSettingsService.reset(userId);
  }
}
