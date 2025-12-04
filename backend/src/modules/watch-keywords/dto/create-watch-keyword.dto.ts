import { IsString, IsOptional, IsBoolean, IsUUID, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateWatchKeywordDto {
  @IsString()
  @MinLength(2, { message: 'Kelime en az 2 karakter olmalıdır' })
  @MaxLength(50, { message: 'Kelime en fazla 50 karakter olabilir' })
  keyword: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Açıklama en fazla 200 karakter olabilir' })
  description?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Geçerli bir hex renk kodu giriniz (örn: #f59e0b)' })
  color?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUUID('4', { message: 'Geçerli bir grup ID giriniz' })
  groupId?: string;
}
