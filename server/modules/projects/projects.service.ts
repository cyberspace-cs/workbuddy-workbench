import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { projects, materials } from '@server/database/schema';
import { eq, and, desc, ilike } from 'drizzle-orm';
import type { Project, Material } from '@shared/api.interface';
import type { CreateProjectDto } from './dto/create-project.dto';
import type { UpdateProjectDto } from './dto/update-project.dto';
import type { ProjectListParams } from '@shared/api.interface';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async list(query: ProjectListParams): Promise<Project[]> {
    const conditions = [];
    if (query.status) conditions.push(eq(projects.status, query.status));
    if (query.keyword) {
      conditions.push(ilike(projects.name, `%${query.keyword}%`));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select()
      .from(projects)
      .where(where)
      .orderBy(desc(projects.createdAt));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? null,
      status: row.status as Project['status'],
      startDate: row.startDate ?? null,
      endDate: row.endDate ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async findOne(id: string): Promise<Project> {
    const rows = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('项目不存在');
    }

    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description ?? null,
      status: row.status as Project['status'],
      startDate: row.startDate ?? null,
      endDate: row.endDate ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async listMaterials(projectId: string): Promise<Material[]> {
    const project = await this.db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (project.length === 0) {
      throw new NotFoundException('项目不存在');
    }

    const rows = await this.db
      .select()
      .from(materials)
      .where(eq(materials.projectId, projectId))
      .orderBy(desc(materials.materialDate), desc(materials.createdAt));

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      type: row.type as Material['type'],
      projectId: row.projectId,
      projectName: null,
      materialDate: row.materialDate,
      tags: row.tags ?? [],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async create(dto: CreateProjectDto): Promise<Project> {
    const inserted = await this.db
      .insert(projects)
      .values({
        name: dto.name,
        description: dto.description ?? null,
        status: dto.status,
        startDate: dto.startDate ?? null,
        endDate: dto.endDate ?? null,
      })
      .returning({ id: projects.id });

    const id = inserted[0]?.id;
    if (!id) {
      throw new BadRequestException('创建项目失败');
    }

    return this.findOne(id);
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const patch: Partial<typeof projects.$inferInsert> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.startDate !== undefined) patch.startDate = dto.startDate;
    if (dto.endDate !== undefined) patch.endDate = dto.endDate;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    const updated = await this.db
      .update(projects)
      .set(patch)
      .where(eq(projects.id, id))
      .returning({ id: projects.id });

    if (updated.length === 0) {
      throw new NotFoundException('项目不存在');
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning({ id: projects.id });

    if (deleted.length === 0) {
      throw new NotFoundException('项目不存在');
    }
  }
}
