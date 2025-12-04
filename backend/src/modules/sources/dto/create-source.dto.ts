import { IsString, IsUrl, IsObject, IsOptional, IsInt, Min, Max, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { SelectorsDto } from './preview-source.dto';

export class CreateSourceDto {
  @IsString()
  name: string;

  @IsUrl()
  url: string;

  @ValidateNested()
  @Type(() => SelectorsDto)
  @IsObject()
  selectors: SelectorsDto;

  @IsInt()
  @Min(60) // Minimum 1 minute
  @Max(86400) // Maximum 24 hours
  @IsOptional()
  refreshInterval?: number = 900; // Default 15 minutes

  // Site ve Kategori ilişkileri
  @IsOptional()
  @IsUUID()
  siteId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
