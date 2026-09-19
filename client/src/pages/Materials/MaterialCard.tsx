import React, { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2, Calendar, FolderKanban } from 'lucide-react';
import type { Material, MaterialType } from '@shared/api.interface';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface MaterialCardProps {
  material: Material;
  formatDate: (date: string) => string;
  onEdit: (material: Material) => void;
  onDelete: (id: string) => void;
}

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

const MaterialCard: React.FC<MaterialCardProps> = ({ material, formatDate, onEdit, onDelete }) => {
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <>
      <Card
        className="group relative cursor-pointer p-5 transition-shadow hover:shadow-md"
        onClick={() => setDetailOpen(true)}
      >
        {/* 右上角操作 */}
        <div
          className="absolute right-3 top-3"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="size-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(material)}>
                <Pencil className="mr-2 size-4" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(material.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 size-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 类型标签 */}
        <Badge className={`${typeColorMap[material.type]} border-0 font-normal`}>
          {typeLabelMap[material.type]}
        </Badge>

        {/* 标题 */}
        <h3 className="mt-3 line-clamp-1 text-base font-semibold text-slate-900">
          {material.title}
        </h3>

        {/* 内容预览 */}
        <p className="mt-2 line-clamp-3 text-sm text-slate-600">
          {material.content}
        </p>

        {/* 底部信息 */}
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar className="size-3.5" />
            {formatDate(material.materialDate)}
          </span>
          {material.projectName && (
            <span className="flex items-center gap-1">
              <FolderKanban className="size-3.5" />
              {material.projectName}
            </span>
          )}
        </div>

        {/* 标签 */}
        {material.tags && material.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {material.tags.slice(0, 3).map((tag: string) => (
              <span
                key={tag}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* 详情弹窗 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <Badge className={`${typeColorMap[material.type]} border-0 font-normal`}>
                {typeLabelMap[material.type]}
              </Badge>
              <span className="text-xs text-slate-500">
                {formatDate(material.materialDate)}
              </span>
            </div>
            <DialogTitle className="text-xl">{material.title}</DialogTitle>
            <DialogDescription className="flex items-center gap-1 text-slate-500">
              {material.projectName && (
                <>
                  <FolderKanban className="size-3.5" />
                  {material.projectName}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm text-slate-700">
            {material.content}
          </div>
          {material.tags && material.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {material.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MaterialCard;
