import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import type { DashboardStats, Material, TimelineItem, GrowthStats } from '@shared/api.interface';

@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(): Promise<DashboardStats> {
    return this.dashboardService.getStats();
  }

  @Get('recent-materials')
  async getRecentMaterials(@Query('limit') limit?: string): Promise<Material[]> {
    const limitNum = limit ? Number(limit) : 5;
    const safeLimit = Number.isFinite(limitNum) && limitNum > 0 ? limitNum : 5;
    return this.dashboardService.getRecentMaterials(Math.min(safeLimit, 50));
  }

  @Get('timeline')
  async getTimeline(@Query('limit') limit?: string): Promise<TimelineItem[]> {
    const limitNum = limit ? Number(limit) : 30;
    const safeLimit = Number.isFinite(limitNum) && limitNum > 0 ? limitNum : 30;
    return this.dashboardService.getTimeline(Math.min(safeLimit, 100));
  }

  @Get('growth')
  async getGrowth(): Promise<GrowthStats> {
    return this.dashboardService.getGrowthStats();
  }
}
