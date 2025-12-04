import { IsString, IsUrl, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SelectorsDto {
  // List page selectors
  @IsString()
  listItem: string; // Selector for repeating list items (link is auto-detected)

  // Detail page selectors (all required)
  @IsString()
  title: string; // Selector for article title

  @IsString()
  date: string; // Selector for article date

  @IsString()
  content: string; // Selector for article content

  @IsString()
  summary: string; // Selector for article summary/spot

  @IsString()
  image: string; // Selector for article main image
}

export class PreviewSourceDto {
  @IsUrl()
  url: string;

  @ValidateNested()
  @Type(() => SelectorsDto)
  @IsObject()
  selectors: SelectorsDto;
}

export class PreviewResultItem {
  title: string;
  link: string;
  date: string;
  content: string;
  summary: string;
  image: string;
}

export class PreviewResultDto {
  success: boolean;
  items: PreviewResultItem[];
  totalFound: number;
  error?: string;
}
