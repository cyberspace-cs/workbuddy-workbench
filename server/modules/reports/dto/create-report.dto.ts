import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsArray, IsOptional, IsIn } from 'class-validator';
import type { CreateReportRequest, ReportType } from '@shared/api.interface';

export class CreateReportDto implements CreateReportRequest {
  @Type(() => String)
  @IsString()
  @IsIn(['weekly', 'monthly', 'quarterly'])
  type!: ReportType;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsNotEmpty()
  periodStart!: string;

  @IsString()
  @IsNotEmpty()
  periodEnd!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  materialIds?: string[];
}
