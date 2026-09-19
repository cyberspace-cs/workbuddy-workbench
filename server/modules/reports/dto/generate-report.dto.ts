import { Type } from 'class-transformer';
import { IsString, IsArray, IsIn, IsNotEmpty } from 'class-validator';
import type { ReportType } from '@shared/api.interface';

export class GenerateReportDto {
  @Type(() => String)
  @IsString()
  @IsIn(['weekly', 'monthly'])
  type!: 'weekly' | 'monthly';

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  materialIds!: string[];
}
