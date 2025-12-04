import { IsString, IsUrl, IsOptional, IsInt, Min, Max, IsBoolean, IsUUID } from 'class-validator';

// DTO for previewing RSS feed
export class PreviewRssFeedDto {
  @IsUrl()
  feedUrl: string;
}

// DTO for creating RSS source
export class CreateRssSourceDto {
  @IsString()
  name: string;

  @IsUrl()
  url: string; // Site URL (for display)

  @IsUrl()
  feedUrl: string; // RSS feed URL

  @IsInt()
  @Min(60) // Minimum 1 minute
  @Max(86400) // Maximum 24 hours
  @IsOptional()
  refreshInterval?: number = 900; // Default 15 minutes

  // Content enrichment settings
  @IsBoolean()
  @IsOptional()
  enrichContent?: boolean = false;

  @IsString()
  @IsOptional()
  contentSelector?: string; // CSS selector for enrichment

  // Site and Category relations
  @IsOptional()
  @IsUUID()
  siteId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

// RSS preview result item
export class RssPreviewItem {
  title: string;
  link: string;
  pubDate?: string;
  summary?: string;
  imageUrl?: string;
  hasFullContent: boolean;
}

// RSS preview result
export class RssPreviewResultDto {
  valid: boolean;
  feedUrl: string;
  metadata: {
    title?: string;
    description?: string;
    link?: string;
    language?: string;
    imageUrl?: string;
  };
  sampleItems: RssPreviewItem[];
  itemCount: number;
  error?: string;
}
