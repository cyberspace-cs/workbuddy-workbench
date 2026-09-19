import React, { useEffect, useState, useCallback } from 'react';
import { Plus, FolderKanban } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import * as projectsApi from '@/api/projects';
import type { Project, ProjectStatus } from '@shared/api.interface';
import { Button } from '@/components/ui/button';
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
import ProjectCard from './ProjectCard';
import ProjectFormDialog from './ProjectFormDialog';
import ProjectDetailDialog from './ProjectDetailDialog';

const STATUS_TABS: { value: ProjectStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '进行中' },
  { value: 'planning', label: '规划中' },
  { value: 'completed', label: '已完成' },
];

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [detailProject, setDetailProject] = useState<Project | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : undefined;
      const list = await projectsApi.getList(params);
      setProjects(list);
    } catch (err) {
      logger.error('获取项目列表失败', err as Error);
      toast.error('获取项目列表失败');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = () => {
    setEditingProject(null);
    setDialogOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await projectsApi.remove(deleteId);
      toast.success('删除成功');
      setDeleteId(null);
      fetchProjects();
    } catch (err) {
      logger.error('删除项目失败', err as Error);
      toast.error('删除失败');
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmitSuccess = () => {
    setDialogOpen(false);
    setEditingProject(null);
    fetchProjects();
  };

  const handleViewDetail = (project: Project) => {
    setDetailProject(project);
  };

  const formatDate = (dateStr: string | null) =>
    dateStr ? dayjs(dateStr).format('YYYY-MM-DD') : '—';

  return (
    <div className="space-y-6">
      {/* 顶部工具栏 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">项目管理</h1>
          <p className="mt-1 text-sm text-slate-500">共 {projects.length} 个项目</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-1 size-4" />
          新建项目
        </Button>
      </div>

      {/* 状态筛选 Tab */}
      <div className="flex gap-1 rounded-xl bg-white p-1 shadow-sm">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 项目列表 */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : projects.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderKanban className="size-6" />
            </EmptyMedia>
            <EmptyTitle>暂无项目</EmptyTitle>
            <EmptyDescription>点击右上角「新建项目」开始创建</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
          data-ai-section-type="card-list"
        >
          {projects.map((p: Project) => (
            <ProjectCard
              key={p.id}
              project={p}
              formatDate={formatDate}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onViewDetail={handleViewDetail}
            />
          ))}
        </div>
      )}

      {/* 新建/编辑弹窗 */}
      <ProjectFormDialog
        open={dialogOpen}
        editingProject={editingProject}
        onOpenChange={setDialogOpen}
        onSuccess={handleSubmitSuccess}
      />

      {/* 详情弹窗 */}
      {detailProject && (
        <ProjectDetailDialog
          project={detailProject}
          open={!!detailProject}
          onOpenChange={(open) => !open && setDetailProject(null)}
          formatDate={formatDate}
        />
      )}

      {/* 删除确认 */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              删除项目后，项目下的素材关联将被解除，素材本身不会被删除。确定要删除吗？
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

export default ProjectsPage;
