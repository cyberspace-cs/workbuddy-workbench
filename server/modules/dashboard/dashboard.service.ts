import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { materials, projects, reports } from '@server/database/schema';
import { eq, desc, count, gte, lt, sql, inArray, and } from 'drizzle-orm';
import type {
  DashboardStats,
  Material,
  TimelineItem,
  GrowthStats,
  MaterialType,
} from '@shared/api.interface';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async getStats(): Promise<DashboardStats> {
    try {
      const { weekStart, weekEnd } = this.getCurrentWeekRange();

      const [materialsResult, activeProjectsResult, weeklyReportsResult, monthlyReportsResult] =
        await Promise.all([
          this.db
            .select({ count: count() })
            .from(materials)
            .where(and(gte(materials.materialDate, weekStart), lt(materials.materialDate, weekEnd))),
          this.db.select({ count: count() }).from(projects).where(eq(projects.status, 'active')),
          this.db.select({ count: count() }).from(reports).where(eq(reports.type, 'weekly')),
          this.db.select({ count: count() }).from(reports).where(eq(reports.type, 'monthly')),
        ]);

      return {
        materialsThisWeek: materialsResult[0]?.count ?? 0,
        activeProjects: activeProjectsResult[0]?.count ?? 0,
        weeklyReports: weeklyReportsResult[0]?.count ?? 0,
        monthlyReports: monthlyReportsResult[0]?.count ?? 0,
      };
    } catch (error) {
      this.logger.error('获取概览统计失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async getRecentMaterials(limit: number): Promise<Material[]> {
    try {
      const rows = await this.db
        .select({
          id: materials.id,
          title: materials.title,
          content: materials.content,
          type: materials.type,
          projectId: materials.projectId,
          projectName: projects.name,
          materialDate: materials.materialDate,
          tags: materials.tags,
          createdAt: materials.createdAt,
          updatedAt: materials.updatedAt,
        })
        .from(materials)
        .leftJoin(projects, eq(materials.projectId, projects.id))
        .orderBy(desc(materials.materialDate))
        .limit(limit);

      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        type: row.type as MaterialType,
        projectId: row.projectId,
        projectName: row.projectName ?? null,
        materialDate: row.materialDate,
        tags: row.tags ?? [],
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }));
    } catch (error) {
      this.logger.error('获取最近素材失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async getTimeline(limit: number): Promise<TimelineItem[]> {
    try {
      // Query recent materials
      const materialRows = await this.db
        .select({
          id: materials.id,
          date: materials.materialDate,
          title: materials.title,
          content: materials.content,
          type: materials.type,
          projectId: materials.projectId,
          projectName: projects.name,
        })
        .from(materials)
        .leftJoin(projects, eq(materials.projectId, projects.id))
        .orderBy(desc(materials.materialDate))
        .limit(limit);

      // Query recent reports
      const reportRows = await this.db
        .select({
          id: reports.id,
          date: reports.periodStart,
          title: reports.title,
          content: reports.content,
          type: reports.type,
        })
        .from(reports)
        .orderBy(desc(reports.periodStart))
        .limit(limit);

      // Merge and sort in memory
      const materialItems: TimelineItem[] = materialRows.map((row) => ({
        id: row.id,
        date: row.date,
        title: row.title,
        content: this.truncateContent(row.content, 200),
        type: 'material',
        subType: row.type,
        projectName: row.projectName ?? null,
      }));

      const reportItems: TimelineItem[] = reportRows.map((row) => ({
        id: row.id,
        date: row.date,
        title: row.title,
        content: this.truncateContent(row.content, 200),
        type: 'report',
        subType: row.type,
        projectName: null,
      }));

      const merged = [...materialItems, ...reportItems].sort((a, b) => {
        if (a.date > b.date) return -1;
        if (a.date < b.date) return 1;
        return 0;
      });

      return merged.slice(0, limit);
    } catch (error) {
      this.logger.error('获取时间线失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async getGrowthStats(): Promise<GrowthStats> {
    try {
      const [byWeekData, byMonthData, byTypeData, projectData] = await Promise.all([
        this.getByWeek(),
        this.getByMonth(),
        this.getByType(),
        this.getProjectStats(),
      ]);

      return {
        byWeek: byWeekData,
        byMonth: byMonthData,
        byType: byTypeData,
        projectStats: projectData,
      };
    } catch (error) {
      this.logger.error('获取成长统计失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  private async getByWeek(): Promise<{ week: string; count: number }[]> {
    // Get last 8 weeks of material counts using date_trunc
    const result = await this.db.execute<{ week: string; count: string }>(sql`
      SELECT
        to_char(date_trunc('week', material_date::date), 'YYYY-MM-DD') AS week,
        COUNT(*) AS count
      FROM materials
      WHERE material_date >= date_trunc('week', CURRENT_DATE - interval '7 weeks')
      GROUP BY date_trunc('week', material_date::date)
      ORDER BY week DESC
      LIMIT 8
    `);

    const rows = result as unknown as Array<{ week: string; count: string }>;
    const dataMap = new Map<string, number>();
    for (const row of rows) {
      dataMap.set(row.week, Number(row.count));
    }

    const weeks: { week: string; count: number }[] = [];
    const today = new Date();
    const day = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const currentMonday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - day);

    for (let i = 7; i >= 0; i -= 1) {
      const d = new Date(currentMonday.getFullYear(), currentMonday.getMonth(), currentMonday.getDate() - i * 7);
      const weekStr = this.formatDate(d);
      weeks.push({
        week: weekStr,
        count: dataMap.get(weekStr) ?? 0,
      });
    }

    return weeks;
  }

  private async getByMonth(): Promise<{ month: string; count: number }[]> {
    const result = await this.db.execute<{ month: string; count: string }>(sql`
      SELECT
        to_char(date_trunc('month', material_date::date), 'YYYY-MM') AS month,
        COUNT(*) AS count
      FROM materials
      WHERE material_date >= date_trunc('month', CURRENT_DATE - interval '5 months')
      GROUP BY date_trunc('month', material_date::date)
      ORDER BY month DESC
      LIMIT 6
    `);

    const rows = result as unknown as Array<{ month: string; count: string }>;
    const dataMap = new Map<string, number>();
    for (const row of rows) {
      dataMap.set(row.month, Number(row.count));
    }

    // Generate last 6 months
    const months: { month: string; count: number }[] = [];
    const today = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        month: monthStr,
        count: dataMap.get(monthStr) ?? 0,
      });
    }

    return months;
  }

  private async getByType(): Promise<{ type: string; count: number }[]> {
    const result = await this.db
      .select({
        type: materials.type,
        count: count(),
      })
      .from(materials)
      .groupBy(materials.type)
      .orderBy(({ count: c }) => desc(c));

    return result.map((row) => ({
      type: row.type,
      count: row.count,
    }));
  }

  private async getProjectStats(): Promise<{ project: string; count: number }[]> {
    const result = await this.db
      .select({
        project: projects.name,
        count: count(),
      })
      .from(materials)
      .innerJoin(projects, eq(materials.projectId, projects.id))
      .groupBy(projects.name)
      .orderBy(({ count: c }) => desc(c))
      .limit(5);

    return result.map((row) => ({
      project: row.project,
      count: row.count,
    }));
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private getCurrentWeekRange(): { weekStart: string; weekEnd: string } {
    const now = new Date();
    const day = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
    const nextMonday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 7);

    return {
      weekStart: this.formatDate(monday),
      weekEnd: this.formatDate(nextMonday),
    };
  }

  private truncateContent(content: string, maxLen: number): string {
    if (!content) return '';
    const trimmed = content.trim();
    if (trimmed.length <= maxLen) return trimmed;
    return trimmed.slice(0, maxLen) + '…';
  }
}
