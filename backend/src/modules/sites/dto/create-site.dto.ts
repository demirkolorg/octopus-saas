import { IsString, IsOptional, IsUrl, MinLength, MaxLength, IsEnum } from 'class-validator';
import { SiteType } from '@prisma/client';

export class CreateSiteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsUrl()
  url: string; // URL'den domain otomatik çıkarılacak

  @IsOptional()
  @IsString()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsEnum(SiteType)
  siteType?: SiteType;
}
