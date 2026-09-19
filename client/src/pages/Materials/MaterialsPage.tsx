import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import * as materialsApi from '@/api/materials';
import * as projectsApi from '@/api/projects';
import type { Material, MaterialType, Project } from '@shared/api.interface';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import MaterialCard from './MaterialCard';
import MaterialFormDialog from './MaterialFormDialog';

const MATERIAL_TYPES: { value: MaterialType | 'all'; label: string }[] = [
  { value: 'all', label: '全部类型' },
  { value: 'meeting', label: '会议纪要' },
  { value: 'note', label: '备注' },
  { value: 'progress', label: '项目进展' },
  { value: 'feedback', label: '反馈' },
  { value: 'result', label: '项目结果' },
];

const PAGE_SIZE = 10;

const MaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<MaterialType | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize: PAGE_SIZE,
        ...(keyword ? { keyword } : {}),
        ...(typeFilter !== 'all' ? { type: typeFilter } : {}),
        ...(projectFilter !== 'all' ? { projectId: projectFilter } : {}),
      };
      const res = await materialsApi.getList(params);
      setMaterials(res.items);
      setTotal(res.total);
    } catch (err) {
      logger.error('获取素材列表失败', err as Error);
      toast.error('获取素材列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, keyword, typeFilter, projectFilter]);

  const fetchProjects = useCallback(async () => {
    try {
      const list = await projectsApi.getList();
      setProjects(list);
    } catch (err) {
      logger.error('获取项目列表失败', err as Error);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
    setPage(1);
  };

  const handleTypeChange = (value: string) => {
    setTypeFilter(value as MaterialType | 'all');
    setPage(1);
  };

  const handleProjectChange = (value: string) => {
    setProjectFilter(value);
    setPage(1);
  };

  const handleCreate = () => {
    setEditingMaterial(null);
    setDialogOpen(true);
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await materialsApi.remove(deleteId);
      toast.success('删除成功');
      setDeleteId(null);
      fetchMaterials();
    } catch (err) {
      logger.error('删除素材失败', err as Error);
      toast.error('删除失败');
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmitSuccess = () => {
    setDialogOpen(false);
    setEditingMaterial(null);
    fetchMaterials();
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const formatDate = (dateStr: string) => dayjs(dateStr).format('YYYY-MM-DD');

  return (
    <div className="space-y-6">
      {/* 顶部工具栏 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">我的素材库</h1>
          <p className="mt-1 text-sm text-slate-500">共 {total} 条素材</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-1 size-4" />
          新建素材
        </Button>
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="搜索标题或内容..."
            value={keyword}
            onChange={handleSearch}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="类型筛选" />
          </SelectTrigger>
          <SelectContent>
            {MATERIAL_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={projectFilter} onValueChange={handleProjectChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="项目筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部项目</SelectItem>
            {projects.map((p: Project) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 素材列表 */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : materials.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search className="size-6" />
            </EmptyMedia>
            <EmptyTitle>暂无素材</EmptyTitle>
            <EmptyDescription>点击右上角「新建素材」开始记录</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" data-ai-section-type="card-list">
          {materials.map((m: Material) => (
            <MaterialCard
              key={m.id}
              material={m}
              formatDate={formatDate}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* 分页 */}
      {total > 0 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-disabled={page <= 1}
                className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p: number) => (
              <PaginationItem key={p}>
                <PaginationLink isActive={p === page} onClick={() => setPage(p)}>
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-disabled={page >= totalPages}
                className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* 新建/编辑弹窗 */}
      <MaterialFormDialog
        open={dialogOpen}
        editingMaterial={editingMaterial}
        projects={projects}
        onOpenChange={setDialogOpen}
        onSuccess={handleSubmitSuccess}
      />

      {/* 删除确认 */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              删除后无法恢复，确定要删除这条素材吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600"
              disabled={deleting}
            >
              {deleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MaterialsPage;
