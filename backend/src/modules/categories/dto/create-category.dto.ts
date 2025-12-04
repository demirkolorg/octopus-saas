import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string; // Lucide icon name: "newspaper", "trending-up", "heart"

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Renk hex formatında olmalıdır (örn: #ef4444)' })
  color?: string; // Hex color: "#ef4444"
}
