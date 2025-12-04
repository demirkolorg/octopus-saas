import { Type } from 'class-transformer';
import { IsArray, ValidateNested, IsString, MinLength, MaxLength, IsOptional, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class BulkKeywordItemDto {
  @IsString()
  @MinLength(2, { message: 'Kelime en az 2 karakter olmalıdır' })
  @MaxLength(50, { message: 'Kelime en fazla 50 karakter olabilir' })
  keyword: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Açıklama en fazla 200 karakter olabilir' })
  description?: string;
}

export class BulkCreateKeywordsDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'En az 1 kelime göndermelisiniz' })
  @ArrayMaxSize(50, { message: 'Tek seferde en fazla 50 kelime ekleyebilirsiniz' })
  @ValidateNested({ each: true })
  @Type(() => BulkKeywordItemDto)
  keywords: BulkKeywordItemDto[];
}
