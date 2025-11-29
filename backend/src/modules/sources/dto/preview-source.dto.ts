import { IsString, IsUrl, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SelectorsDto {
  @IsString()
  listItem: string;

  @IsString()
  title: string;

  @IsString()
  link: string;

  @IsString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  summary?: string;
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
  date?: string;
  summary?: string;
}

export class PreviewResultDto {
  success: boolean;
  items: PreviewResultItem[];
  totalFound: number;
  error?: string;
}
