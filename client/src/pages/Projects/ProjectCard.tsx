import React from 'react';
import { Calendar, FileText, Pencil, Trash2, Eye } from 'lucide-react';
import type { Project, ProjectStatus } from '@shared/api.interface';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProjectCardProps {
  project: Project;
  formatDate: (date: string | null) => string;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onViewDetail: (project: Project) => void;
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

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  formatDate,
  onEdit,
  onDelete,
  onViewDetail,
}) => {
  return (
    <Card className="flex flex-col p-5">
      {/* 顶部：项目名 + 状态 */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-1 text-lg font-semibold text-slate-900">
          {project.name}
        </h3>
        <Badge className={`${statusColorMap[project.status]} shrink-0 border-0 font-normal`}>
          {statusLabelMap[project.status]}
        </Badge>
      </div>

      {/* 描述 */}
      <p className="mt-2 line-clamp-2 text-sm text-slate-600">
        {project.description || '暂无描述'}
      </p>

      {/* 时间范围 */}
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <Calendar className="size-3.5" />
        <span>
          {formatDate(project.startDate)} ~ {formatDate(project.endDate)}
        </span>
      </div>

      {/* 素材数量 */}
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
        <FileText className="size-3.5" />
        <span>关联素材</span>
      </div>

      {/* 底部操作 */}
      <div className="mt-auto flex gap-2 pt-4">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onViewDetail(project)}
        >
          <Eye className="mr-1 size-3.5" />
          详情
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onEdit(project)}
        >
          <Pencil className="mr-1 size-3.5" />
          编辑
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={() => onDelete(project.id)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </Card>
  );
};

export default ProjectCard;
