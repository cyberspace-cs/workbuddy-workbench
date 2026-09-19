import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { reports, materials, projects } from '@server/database/schema';
import { eq, desc, count, inArray, and } from 'drizzle-orm';
import type { Report, ReportListResponse, ReportType } from '@shared/api.interface';
import type { CreateReportDto } from './dto/create-report.dto';
import type { GenerateReportDto } from './dto/generate-report.dto';

const TYPE_LABELS: Record<string, string> = {
  meeting: '会议纪要',
  note: '备注',
  progress: '项目进展',
  feedback: '反馈',
  result: '成果',
};

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async list(params: { type?: ReportType; page: number; pageSize: number }): Promise<ReportListResponse> {
    const { type, page, pageSize } = params;
    const offset = (page - 1) * pageSize;

    try {
      const whereCondition = type ? eq(reports.type, type) : undefined;

      const [itemsResult, totalResult] = await Promise.all([
        this.db
          .select()
          .from(reports)
          .where(whereCondition)
          .orderBy(desc(reports.periodStart))
          .limit(pageSize)
          .offset(offset),
        this.db
          .select({ count: count() })
          .from(reports)
          .where(whereCondition),
      ]);

      const total = totalResult[0]?.count ?? 0;
      const items: Report[] = itemsResult.map((row) => ({
        id: row.id,
        type: row.type as ReportType,
        title: row.title,
        content: row.content,
        periodStart: row.periodStart,
        periodEnd: row.periodEnd,
        materialIds: row.materialIds ?? [],
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }));

      return { items, total, page, pageSize };
    } catch (error) {
      this.logger.error('获取报告列表失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async findOne(id: string): Promise<Report> {
    try {
      const rows = await this.db.select().from(reports).where(eq(reports.id, id)).limit(1);
      if (rows.length === 0) {
        throw new NotFoundException('报告不存在');
      }
      const row = rows[0];
      return {
        id: row.id,
        type: row.type as ReportType,
        title: row.title,
        content: row.content,
        periodStart: row.periodStart,
        periodEnd: row.periodEnd,
        materialIds: row.materialIds ?? [],
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`获取报告详情失败 id=${id}`, error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async create(dto: CreateReportDto): Promise<Report> {
    try {
      const rows = await this.db
        .insert(reports)
        .values({
          type: dto.type,
          title: dto.title,
          content: dto.content,
          periodStart: dto.periodStart,
          periodEnd: dto.periodEnd,
          materialIds: dto.materialIds ?? [],
        })
        .returning();

      const row = rows[0];
      return {
        id: row.id,
        type: row.type as ReportType,
        title: row.title,
        content: row.content,
        periodStart: row.periodStart,
        periodEnd: row.periodEnd,
        materialIds: row.materialIds ?? [],
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    } catch (error) {
      this.logger.error('创建报告失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const rows = await this.db.delete(reports).where(eq(reports.id, id)).returning({ id: reports.id });
      if (rows.length === 0) {
        throw new NotFoundException('报告不存在');
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`删除报告失败 id=${id}`, error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async generate(dto: GenerateReportDto): Promise<Report> {
    const { type, materialIds: matIds } = dto;

    try {
      if (matIds.length === 0) {
        const today = new Date();
        const periodStart = today.toISOString().slice(0, 10);
        const periodEnd = periodStart;
        return this.create({
          type,
          title: type === 'weekly' ? '本周工作总结' : '本月工作总结',
          content: type === 'weekly' ? '# 本周工作总结\n\n暂无素材。' : '# 本月工作总结\n\n暂无素材。',
          periodStart,
          periodEnd,
          materialIds: [],
        });
      }

      // Query all selected materials
      const materialRows = await this.db
        .select()
        .from(materials)
        .where(inArray(materials.id, matIds));

      if (materialRows.length === 0) {
        throw new NotFoundException('未找到指定的素材');
      }

      // Collect project IDs and query project names
      const projectIds = materialRows
        .map((m) => m.projectId)
        .filter((pid): pid is string => pid !== null);

      const projectRows = projectIds.length > 0
        ? await this.db.select().from(projects).where(inArray(projects.id, projectIds))
        : [];

      const projectMap = new Map<string, string>();
      for (const p of projectRows) {
        projectMap.set(p.id, p.name);
      }

      // Determine period range from materials
      const dates = materialRows.map((m) => m.materialDate).sort();
      const periodStart = dates[0];
      const periodEnd = dates[dates.length - 1];

      // Generate markdown content
      const content = this.buildMarkdown(type, materialRows, projectMap);

      const title = type === 'weekly'
        ? `周报 ${periodStart} ~ ${periodEnd}`
        : `月报 ${periodStart} ~ ${periodEnd}`;

      return this.create({
        type,
        title,
        content,
        periodStart,
        periodEnd,
        materialIds: materialRows.map((m) => m.id),
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('生成报告失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  private buildMarkdown(
    type: 'weekly' | 'monthly',
    materialRows: Array<{
      id: string;
      title: string;
      content: string;
      type: string;
      projectId: string | null;
      materialDate: string;
    }>,
    projectMap: Map<string, string>,
  ): string {
    const heading = type === 'weekly' ? '# 本周工作总结' : '# 本月工作总结';
    const lines: string[] = [heading, ''];

    // Group by project
    const byProject = new Map<string | null, typeof materialRows>();
    for (const m of materialRows) {
      const key = m.projectId ?? null;
      const list = byProject.get(key) ?? [];
      list.push(m);
      byProject.set(key, list);
    }

    // 项目进展 section
    lines.push('## 项目进展');
    lines.push('');
    if (byProject.size === 0) {
      lines.push('暂无项目进展记录。');
      lines.push('');
    } else {
      for (const [projectId, mats] of byProject) {
        if (projectId === null && mats.length > 0) continue; // ungrouped go to "其他"
        const projectName = projectId ? projectMap.get(projectId) ?? '未知项目' : '未分类';
        lines.push(`### ${projectName}`);
        lines.push('');
        for (const m of mats) {
          const typeLabel = TYPE_LABELS[m.type] ?? m.type;
          lines.push(`- **${m.title}**（${typeLabel}，${m.materialDate}）`);
          if (m.content) {
            const trimmed = m.content.trim();
            if (trimmed) {
              const summary = trimmed.length > 200 ? trimmed.slice(0, 200) + '…' : trimmed;
              for (const line of summary.split('\n')) {
                lines.push(`  > ${line}`);
              }
            }
          }
        }
        lines.push('');
      }
    }

    // 会议纪要 section (meeting type materials, including unassigned ones)
    const meetings = materialRows.filter((m) => m.type === 'meeting');
    lines.push('## 会议纪要');
    lines.push('');
    if (meetings.length === 0) {
      lines.push('暂无会议纪要。');
    } else {
      for (const m of meetings) {
        const pName = m.projectId ? projectMap.get(m.projectId) : null;
        const prefix = pName ? `[${pName}] ` : '';
        lines.push(`### ${prefix}${m.title}`);
        lines.push(`日期：${m.materialDate}`);
        lines.push('');
        if (m.content) {
          lines.push(m.content);
        }
        lines.push('');
      }
    }

    // 重要反馈 section (feedback type)
    const feedbacks = materialRows.filter((m) => m.type === 'feedback');
    lines.push('## 重要反馈');
    lines.push('');
    if (feedbacks.length === 0) {
      lines.push('暂无重要反馈。');
    } else {
      for (const m of feedbacks) {
        const pName = m.projectId ? projectMap.get(m.projectId) : null;
        const prefix = pName ? `[${pName}] ` : '';
        lines.push(`- **${prefix}${m.title}**（${m.materialDate}）`);
        if (m.content) {
          const trimmed = m.content.trim();
          if (trimmed) {
            const summary = trimmed.length > 150 ? trimmed.slice(0, 150) + '…' : trimmed;
            for (const line of summary.split('\n')) {
              lines.push(`  > ${line}`);
            }
          }
        }
      }
    }
    lines.push('');

    // 其他记录 section (无项目归属且非会议/非反馈的素材)
    const otherRecords = materialRows.filter(
      (m) => m.projectId === null && !['meeting', 'feedback'].includes(m.type),
    );

    lines.push('## 其他记录');
    lines.push('');
    if (otherRecords.length === 0) {
      lines.push('暂无其他记录。');
    } else {
      for (const m of otherRecords) {
        const typeLabel = TYPE_LABELS[m.type] ?? m.type;
        lines.push(`- **${m.title}**（${typeLabel}，${m.materialDate}）`);
        if (m.content) {
          const trimmed = m.content.trim();
          if (trimmed) {
            const summary = trimmed.length > 150 ? trimmed.slice(0, 150) + '…' : trimmed;
            for (const line of summary.split('\n')) {
              lines.push(`  > ${line}`);
            }
          }
        }
      }
    }
    lines.push('');

    return lines.join('\n');
  }
}
