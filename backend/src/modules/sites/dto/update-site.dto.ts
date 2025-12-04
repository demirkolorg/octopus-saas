import { IsString, IsOptional, IsUrl, MinLength, MaxLength, IsEnum } from 'class-validator';
import { SiteType } from '@prisma/client';

export class UpdateSiteDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsEnum(SiteType)
  siteType?: SiteType;
}
