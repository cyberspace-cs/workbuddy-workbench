import { Type } from 'class-transformer';
import { IsString, IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';
import type { MaterialListParams, MaterialType } from '@shared/api.interface';

const MATERIAL_TYPES: MaterialType[] = ['meeting', 'note', 'progress', 'feedback', 'result'];

export class ListMaterialsDto implements MaterialListParams {
  @IsOptional()
  @Type(() => String)
  @IsString()
  @IsIn(MATERIAL_TYPES)
  type?: MaterialType;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number = 10;
}
