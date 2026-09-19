import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { materials, projects } from '@server/database/schema';
import { eq, and, like, desc, gte, lte, count, ilike } from 'drizzle-orm';
import type { Material, MaterialListResponse } from '@shared/api.interface';
import type { CreateMaterialDto } from './dto/create-material.dto';
import type { UpdateMaterialDto } from './dto/update-material.dto';
import type { ListMaterialsDto } from './dto/list-materials.dto';

@Injectable()
export class MaterialsService {
  private readonly logger = new Logger(MaterialsService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async list(query: ListMaterialsDto): Promise<MaterialListResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const conditions = [];
    if (query.type) conditions.push(eq(materials.type, query.type));
    if (query.projectId) conditions.push(eq(materials.projectId, query.projectId));
    if (query.dateFrom) conditions.push(gte(materials.materialDate, query.dateFrom));
    if (query.dateTo) conditions.push(lte(materials.materialDate, query.dateTo));
    if (query.keyword) {
      conditions.push(ilike(materials.title, `%${query.keyword}%`));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult, rows] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(materials)
        .where(where),
      this.db
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
        .where(where)
        .orderBy(desc(materials.materialDate), desc(materials.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const total = totalResult[0]?.count ?? 0;

    const items: Material[] = rows.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      type: row.type as Material['type'],
      projectId: row.projectId,
      projectName: row.projectName ?? null,
      materialDate: row.materialDate,
      tags: row.tags ?? [],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));

    return { items, total, page, pageSize };
  }

  async findOne(id: string): Promise<Material> {
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
      .where(eq(materials.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('素材不存在');
    }

    const row = rows[0];
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      type: row.type as Material['type'],
      projectId: row.projectId,
      projectName: row.projectName ?? null,
      materialDate: row.materialDate,
      tags: row.tags ?? [],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async create(dto: CreateMaterialDto): Promise<Material> {
    const inserted = await this.db
      .insert(materials)
      .values({
        title: dto.title,
        content: dto.content,
        type: dto.type,
        projectId: dto.projectId ?? null,
        materialDate: dto.materialDate,
        tags: dto.tags ?? [],
      })
      .returning({ id: materials.id });

    const id = inserted[0]?.id;
    if (!id) {
      throw new BadRequestException('创建素材失败');
    }

    return this.findOne(id);
  }

  async update(id: string, dto: UpdateMaterialDto): Promise<Material> {
    const patch: Partial<typeof materials.$inferInsert> = {};
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.content !== undefined) patch.content = dto.content;
    if (dto.type !== undefined) patch.type = dto.type;
    if (dto.projectId !== undefined) patch.projectId = dto.projectId;
    if (dto.materialDate !== undefined) patch.materialDate = dto.materialDate;
    if (dto.tags !== undefined) patch.tags = dto.tags;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    const updated = await this.db
      .update(materials)
      .set(patch)
      .where(eq(materials.id, id))
      .returning({ id: materials.id });

    if (updated.length === 0) {
      throw new NotFoundException('素材不存在');
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.db
      .delete(materials)
      .where(eq(materials.id, id))
      .returning({ id: materials.id });

    if (deleted.length === 0) {
      throw new NotFoundException('素材不存在');
    }
  }
}
