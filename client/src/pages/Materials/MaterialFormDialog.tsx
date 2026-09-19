import React, { useEffect, useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import type { Material, MaterialType, Project } from '@shared/api.interface';
import * as materialsApi from '@/api/materials';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import dayjs from 'dayjs';

interface MaterialFormDialogProps {
  open: boolean;
  editingMaterial: Material | null;
  projects: Project[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const TYPE_OPTIONS: { value: MaterialType; label: string }[] = [
  { value: 'meeting', label: '会议纪要' },
  { value: 'note', label: '备注' },
  { value: 'progress', label: '项目进展' },
  { value: 'feedback', label: '反馈' },
  { value: 'result', label: '项目结果' },
];

const MaterialFormDialog: React.FC<MaterialFormDialogProps> = ({
  open,
  editingMaterial,
  projects,
  onOpenChange,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<MaterialType>('note');
  const [projectId, setProjectId] = useState<string>('');
  const [materialDate, setMaterialDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (editingMaterial) {
        setTitle(editingMaterial.title);
        setContent(editingMaterial.content);
        setType(editingMaterial.type);
        setProjectId(editingMaterial.projectId || '');
        setMaterialDate(dayjs(editingMaterial.materialDate).format('YYYY-MM-DD'));
        setTagsInput(editingMaterial.tags?.join(', ') || '');
      } else {
        setTitle('');
        setContent('');
        setType('note');
        setProjectId('');
        setMaterialDate(dayjs().format('YYYY-MM-DD'));
        setTagsInput('');
      }
      setErrors({});
    }
  }, [open, editingMaterial]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = '请输入标题';
    if (!content.trim()) newErrors.content = '请输入内容';
    if (!materialDate) newErrors.materialDate = '请选择日期';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const payload = {
        title: title.trim(),
        content: content.trim(),
        type,
        projectId: projectId || null,
        materialDate,
        tags,
      };
      if (editingMaterial) {
        await materialsApi.update(editingMaterial.id, payload);
        toast.success('更新成功');
      } else {
        await materialsApi.create(payload);
        toast.success('创建成功');
      }
      onSuccess();
    } catch (err) {
      logger.error('提交素材失败', err as Error);
      toast.error(editingMaterial ? '更新失败' : '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingMaterial ? '编辑素材' : '新建素材'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">标题 <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入标题"
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="type">类型 <span className="text-red-500">*</span></Label>
            <Select value={type} onValueChange={(v) => setType(v as MaterialType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="content">内容 <span className="text-red-500">*</span></Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请输入内容..."
              rows={5}
            />
            {errors.content && <p className="text-xs text-red-500">{errors.content}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date">日期 <span className="text-red-500">*</span></Label>
              <Input
                id="date"
                type="date"
                value={materialDate}
                onChange={(e) => setMaterialDate(e.target.value)}
              />
              {errors.materialDate && (
                <p className="text-xs text-red-500">{errors.materialDate}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="project">关联项目</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="不关联" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">不关联</SelectItem>
                  {projects.map((p: Project) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tags">标签</Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="多个标签用逗号分隔，如：重要, 待跟进"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? '提交中...' : editingMaterial ? '保存修改' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialFormDialog;
