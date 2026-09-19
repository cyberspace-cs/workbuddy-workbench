import { Type } from 'class-transformer';
import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator';
import type { ReportListParams, ReportType } from '@shared/api.interface';

export class ListReportsDto implements ReportListParams {
  @IsOptional()
  @Type(() => String)
  @IsString()
  @IsIn(['weekly', 'monthly', 'quarterly'])
  type?: ReportType;

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
