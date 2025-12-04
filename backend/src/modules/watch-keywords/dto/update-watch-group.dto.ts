import { IsString, IsOptional, IsBoolean, MinLength, MaxLength, Matches } from 'class-validator';

export class UpdateWatchGroupDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Konu adı en az 2 karakter olmalıdır' })
  @MaxLength(50, { message: 'Konu adı en fazla 50 karakter olabilir' })
  name?: string;

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
}
