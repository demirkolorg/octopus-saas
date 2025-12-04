import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

// Konu oluştururken kelime eklemek için basit DTO
class GroupKeywordDto {
  @IsString()
  @MinLength(2, { message: 'Kelime en az 2 karakter olmalıdır' })
  @MaxLength(50, { message: 'Kelime en fazla 50 karakter olabilir' })
  keyword: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Açıklama en fazla 200 karakter olabilir' })
  description?: string;
}

export class CreateWatchGroupDto {
  @IsString()
  @MinLength(1, { message: 'Konu adı en az 1 karakter olmalıdır' })
  @MaxLength(50, { message: 'Konu adı en fazla 50 karakter olabilir' })
  name: string;

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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupKeywordDto)
  keywords?: GroupKeywordDto[];
}
