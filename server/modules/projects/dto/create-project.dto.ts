import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import type { CreateProjectRequest, ProjectStatus } from '@shared/api.interface';

const PROJECT_STATUSES: ProjectStatus[] = ['planning', 'active', 'completed', 'paused'];

export class CreateProjectDto implements CreateProjectRequest {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => String)
  @IsString()
  @IsIn(PROJECT_STATUSES)
  status!: ProjectStatus;

  @IsOptional()
  @IsString()
  startDate?: string | null;

  @IsOptional()
  @IsString()
  endDate?: string | null;
}
