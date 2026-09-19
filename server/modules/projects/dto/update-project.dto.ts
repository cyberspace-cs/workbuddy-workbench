import { Type } from 'class-transformer';
import { IsString, IsOptional, IsIn } from 'class-validator';
import type { UpdateProjectRequest, ProjectStatus } from '@shared/api.interface';

const PROJECT_STATUSES: ProjectStatus[] = ['planning', 'active', 'completed', 'paused'];

export class UpdateProjectDto implements UpdateProjectRequest {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => String)
  @IsString()
  @IsIn(PROJECT_STATUSES)
  status?: ProjectStatus;

  @IsOptional()
  @IsString()
  startDate?: string | null;

  @IsOptional()
  @IsString()
  endDate?: string | null;
}
