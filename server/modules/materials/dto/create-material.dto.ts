import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsIn } from 'class-validator';
import type { CreateMaterialRequest, MaterialType } from '@shared/api.interface';

const MATERIAL_TYPES: MaterialType[] = ['meeting', 'note', 'progress', 'feedback', 'result'];

export class CreateMaterialDto implements CreateMaterialRequest {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  content!: string;

  @Type(() => String)
  @IsString()
  @IsIn(MATERIAL_TYPES)
  type!: MaterialType;

  @IsOptional()
  @IsString()
  projectId?: string | null;

  @IsString()
  @IsNotEmpty()
  materialDate!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
