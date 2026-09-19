import React, { useEffect, useState } from 'react';
import { Calendar, FileText } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import dayjs from 'dayjs';
import type { Material, Project, ProjectStatus, MaterialType } from '@shared/api.interface';
import * as projectsApi from '@/api/projects';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';

interface ProjectDetailDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formatDate: (date: string | null) => string;
}

const statusColorMap: Record<ProjectStatus, string> = {
  planning: 'bg-slate-100 text-slate-600',
  active: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-amber-100 text-amber-700',
};

const statusLabelMap: Record<ProjectStatus, string> = {
  planning: '规划中',
  active: '进行中',
  completed: '已完成',
  paused: '已暂停',
};

const typeColorMap: Record<MaterialType, string> = {
  meeting: 'bg-blue-100 text-blue-700',
  note: 'bg-slate-100 text-slate-700',
  progress: 'bg-emerald-100 text-emerald-700',
  feedback: 'bg-amber-100 text-amber-700',
  result: 'bg-purple-100 text-purple-700',
};

const typeLabelMap: Record<MaterialType, string> = {
  meeting: '会议纪要',
  note: '备注',
  progress: '项目进展',
  feedback: '反馈',
  result: '项目结果',
};

const ProjectDetailDialog: React.FC<ProjectDetailDialogProps> = ({
  project,
  open,
  onOpenChange,
  formatDate,
}) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && project?.id) {
      const fetchMaterials = async () => {
        setLoading(true);
        try {
          const list = await projectsApi.getMaterials(project.id);
          setMaterials(list);
        } catch (err) {
          logger.error('获取项目素材失败', err as Error);
        } finally {
          setLoading(false);
        }
      };
      fetchMaterials();
    }
  }, [open, project?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-xl">{project.name}</DialogTitle>
            <Badge className={`${statusColorMap[project.status]} border-0 font-normal`}>
              {statusLabelMap[project.status]}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5" />
              {formatDate(project.startDate)} ~ {formatDate(project.endDate)}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="size-3.5" />
              {materials.length} 条素材
            </span>
          </div>
        </DialogHeader>

        {/* 描述 */}
        <div className="rounded-lg bg-slate-50 p-4">
          <p className="text-sm text-slate-700 whitespace-pre-wrap">
            {project.description || '暂无描述'}
          </p>
        </div>

        {/* 关联素材列表 */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-900">关联素材</h4>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : materials.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText className="size-5" />
                </EmptyMedia>
                <EmptyTitle>暂无关联素材</EmptyTitle>
                <EmptyDescription>前往素材库创建并关联到该项目</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {materials.map((m: Material) => (
                <div
                  key={m.id}
                  className="flex items-start gap-3 rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50"
                >
                  <Badge
                    className={`${typeColorMap[m.type]} shrink-0 border-0 font-normal`}
                  >
                    {typeLabelMap[m.type]}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-900">
                      {m.title}
                    </div>
                    <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                      {m.content}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {dayjs(m.materialDate).format('MM-DD')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetailDialog;
