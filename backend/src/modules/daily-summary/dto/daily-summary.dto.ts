import { IsOptional, IsDateString, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class GenerateSummaryDto {
  @IsOptional()
  @IsDateString()
  date?: string; // ISO date string, defaults to today

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isPartial?: boolean; // If true, generates mid-day summary
}

export class GetSummaryDto {
  @IsOptional()
  @IsDateString()
  date?: string;
}

export interface BulletPoint {
  category: string;
  text: string;
}

export interface CategoryStat {
  name: string;
  count: number;
  icon?: string;
  color?: string;
}

export interface SourceStat {
  name: string;
  count: number;
  domain?: string;
}

export interface DailySummaryResponse {
  id: string;
  date: Date;
  summary: string;
  bulletPoints: BulletPoint[] | null;
  articleCount: number;
  topCategories: CategoryStat[] | null;
  topSources: SourceStat[] | null;
  isPartial: boolean;
  generatedAt: Date;
  createdAt: Date;
}
