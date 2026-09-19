import { Type } from 'class-transformer';
import { IsString, IsOptional, IsArray, IsIn, ValidateIf } from 'class-validator';
import type { UpdateMaterialRequest, MaterialType } from '@shared/api.interface';

const MATERIAL_TYPES: MaterialType[] = ['meeting', 'note', 'progress', 'feedback', 'result'];

export class UpdateMaterialDto implements UpdateMaterialRequest {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @Type(() => String)
  @IsString()
  @IsIn(MATERIAL_TYPES)
  type?: MaterialType;

  @IsOptional()
  @IsString()
  @ValidateIf((_o, v) => v !== null)
  projectId?: string | null;

  @IsOptional()
  @IsString()
  materialDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
