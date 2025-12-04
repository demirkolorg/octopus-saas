import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DailySummaryService } from './daily-summary.service';
import { GenerateSummaryDto, GetSummaryDto } from './dto/daily-summary.dto';

@Controller('daily-summary')
@UseGuards(JwtAuthGuard)
export class DailySummaryController {
  constructor(private readonly dailySummaryService: DailySummaryService) {}

  /**
   * Get summary for a specific date
   * GET /daily-summary?date=2024-01-15
   */
  @Get()
  async getSummary(
    @CurrentUser('id') userId: string,
    @Query() query: GetSummaryDto,
  ) {
    const summary = await this.dailySummaryService.getSummary(
      userId,
      query.date,
      false,
    );

    return { data: summary };
  }

  /**
   * Get partial (mid-day) summary for today
   * GET /daily-summary/partial
   */
  @Get('partial')
  async getPartialSummary(@CurrentUser('id') userId: string) {
    const summary = await this.dailySummaryService.getSummary(
      userId,
      undefined,
      true,
    );

    return { data: summary };
  }

  /**
   * Get list of all summaries (for calendar view)
   * GET /daily-summary/list?startDate=2024-01-01&endDate=2024-01-31
   */
  @Get('list')
  async getSummaries(
    @CurrentUser('id') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const summaries = await this.dailySummaryService.getSummaries(
      userId,
      startDate,
      endDate,
    );

    return { data: summaries };
  }

  /**
   * Generate full day summary (for past dates or manual trigger at end of day)
   * POST /daily-summary/generate?date=2024-01-15
   */
  @Post('generate')
  async generateSummary(
    @CurrentUser('id') userId: string,
    @Query() query: GenerateSummaryDto,
  ) {
    const summary = await this.dailySummaryService.generateSummary(
      userId,
      query.date,
      false,
    );

    return { data: summary };
  }

  /**
   * Generate partial summary (mid-day manual trigger)
   * POST /daily-summary/generate/partial
   */
  @Post('generate/partial')
  async generatePartialSummary(@CurrentUser('id') userId: string) {
    const summary = await this.dailySummaryService.generateSummary(
      userId,
      undefined,
      true,
    );

    return { data: summary };
  }
}
