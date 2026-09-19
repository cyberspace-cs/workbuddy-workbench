import React, { useEffect, useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import dayjs from 'dayjs';
import {
  Plus,
  CalendarDays,
  Trash2,
  Eye,
  Sparkles,
  FileText,
  Loader2,
} from 'lucide-react';

import { Button } from '@client/src/components/ui/button';
import { Card } from '@client/src/components/ui/card';
import { Badge } from '@client/src/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@client/src/components/ui/dialog';
import { Checkbox } from '@client/src/components/ui/checkbox';
import { Textarea } from '@client/src/components/ui/textarea';
import { ScrollArea } from '@client/src/components/ui/scroll-area';
import { Skeleton } from '@client/src/components/ui/skeleton';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@client/src/components/ui/empty';
import { Markdown } from '@client/src/components/ui/markdown';

import * as reportsApi from '@client/src/api/reports';
import * as materialsApi from '@client/src/api/materials';
import type { Report, Material, MaterialType } from '@shared/api.interface';
import { showConfirm } from '@lark-apaas/client-toolkit';

const typeLabels: Record<MaterialType, string> = {
  meeting: '会议纪要',
  note: '备注',
  progress: '项目进展',
  feedback: '反馈',
  result: '成果',
};

const typeColors: Record<MaterialType, string> = {
  meeting: 'bg-blue-100 text-blue-700',
  note: 'bg-slate-100 text-slate-700',
  progress: 'bg-emerald-100 text-emerald-700',
  feedback: 'bg-amber-100 text-amber-700',
  result: 'bg-purple-100 text-purple-700',
};

const MonthlyPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailReport, setDetailReport] = useState<Report | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [generateOpen, setGenerateOpen] = useState(false);
  const [periodStart, setPeriodStart] = useState(
    dayjs().startOf('month').format('YYYY-MM-DD'),
  );
  const [periodEnd, setPeriodEnd] = useState(
    dayjs().endOf('month').format('YYYY-MM-DD'),
  );
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [step, setStep] = useState<'select' | 'preview'>('select');

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportsApi.getList({ type: 'monthly', pageSize: 50 });
      setReports(res.items);
    } catch (err) {
      logger.error('fetch monthly reports failed', { err: String(err) });
      setError('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchMaterials = async () => {
    setMaterialsLoading(true);
    try {
      const res = await materialsApi.getList({
        dateFrom: periodStart,
        dateTo: periodEnd,
        pageSize: 100,
      });
      setMaterials(res.items);
    } catch (err) {
      logger.error('fetch materials failed', { err: String(err) });
    } finally {
      setMaterialsLoading(false);
    }
  };

  const handleOpenGenerate = () => {
    setStep('select');
    setSelectedIds([]);
    setGeneratedContent('');
    setGeneratedTitle('');
    setGenerateOpen(true);
    fetchMaterials();
  };

  const handleToggleMaterial = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleGenerate = async () => {
    if (selectedIds.length === 0) return;
    setGenerating(true);
    try {
      const report = await reportsApi.generateFromMaterials('monthly', selectedIds);
      setGeneratedContent(report.content);
      setGeneratedTitle(report.title);
      setStep('preview');
    } catch (err) {
      logger.error('generate monthly report failed', { err: String(err) });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedContent.trim()) return;
    try {
      await reportsApi.create({
        type: 'monthly',
        title: generatedTitle || `${periodStart} ~ ${periodEnd} 月报`,
        content: generatedContent,
        periodStart,
        periodEnd,
        materialIds: selectedIds,
      });
      setGenerateOpen(false);
      fetchReports();
    } catch (err) {
      logger.error('save monthly report failed', { err: String(err) });
    }
  };

  const handleViewDetail = async (id: string) => {
    setDetailOpen(true);
    setDetailReport(null);
    setDetailLoading(true);
    try {
      const report = await reportsApi.getDetail(id);
      setDetailReport(report);
    } catch (err) {
      logger.error('fetch report detail failed', { err: String(err) });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!await showConfirm('确定要删除这篇月报吗？')) return;
    try {
      await reportsApi.remove(id);
      fetchReports();
    } catch (err) {
      logger.error('delete report failed', { err: String(err) });
    }
  };

  const formatPeriod = (start: string, end: string) => {
    const s = dayjs(start);
    const e = dayjs(end);
    return `${s.year()}年${s.month() + 1}月${s.date()}日 - ${e.month() + 1}月${e.date()}日`;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            月报
            <span className="ml-2 text-base font-normal text-slate-500">
              {reports.length} 篇
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            汇总整月工作素材，系统梳理月度成果
          </p>
        </div>
        <Button onClick={handleOpenGenerate}>
          <Plus className="size-4" />
          生成月报
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-5 w-3/4 mb-3" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-3 w-1/3" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-sm text-red-500">{error}</div>
      ) : reports.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText className="size-6" />
            </EmptyMedia>
            <EmptyTitle>暂无月报</EmptyTitle>
            <EmptyDescription>从素材库选择素材，一键生成你的第一篇月报</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={handleOpenGenerate}>
              <Plus className="size-4" />
              生成月报
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2" data-ai-section-type="card-list">
          {reports.map((report) => (
            <Card key={report.id} className="p-5 flex flex-col gap-3">
              <h3 className="text-lg font-semibold text-slate-900 line-clamp-1">
                {report.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CalendarDays className="size-4" />
                <span>{formatPeriod(report.periodStart, report.periodEnd)}</span>
              </div>
              <div className="text-xs text-slate-400">
                创建于 {dayjs(report.createdAt).format('YYYY-MM-DD HH:mm')}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewDetail(report.id)}
                >
                  <Eye className="size-4" />
                  查看详情
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => handleDelete(report.id)}
                >
                  <Trash2 className="size-4" />
                  删除
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{detailReport?.title || '月报详情'}</DialogTitle>
            <DialogDescription>
              {detailReport &&
                formatPeriod(detailReport.periodStart, detailReport.periodEnd)}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            {detailLoading ? (
              <div className="space-y-3 py-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : detailReport ? (
              <div className="py-2">
                <Markdown className="prose-sm">{detailReport.content}</Markdown>
              </div>
            ) : null}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Generate Dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {step === 'select' ? '生成月报' : '预览与编辑'}
            </DialogTitle>
            <DialogDescription>
              {step === 'select'
                ? '选择周期和要汇总的素材，智能生成月报内容'
                : '检查生成内容，可编辑后保存'}
            </DialogDescription>
          </DialogHeader>

          {step === 'select' ? (
            <div className="flex-1 overflow-hidden flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">
                    开始日期
                  </label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">
                    结束日期
                  </label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="self-end"
                  onClick={fetchMaterials}
                >
                  刷新素材
                </Button>
              </div>

              <div className="text-sm text-slate-600">
                选择素材（{selectedIds.length}/{materials.length} 已选）
              </div>

              <ScrollArea className="flex-1 -mx-6 px-6 border-y border-slate-100 py-3">
                {materialsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : materials.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-500">
                    该周期内暂无素材
                  </div>
                ) : (
                  <div className="space-y-2">
                    {materials.map((m) => (
                      <div
                        key={m.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedIds.includes(m.id)
                            ? 'border-blue-300 bg-blue-50/50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                        onClick={() => handleToggleMaterial(m.id)}
                      >
                        <Checkbox checked={selectedIds.includes(m.id)} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate">
                            {m.title}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <Badge
                              className={typeColors[m.type]}
                              variant="secondary"
                            >
                              {typeLabels[m.type]}
                            </Badge>
                            <span>
                              {dayjs(m.materialDate).format('MM-DD')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">标题</label>
                <input
                  type="text"
                  value={generatedTitle}
                  onChange={(e) => setGeneratedTitle(e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium"
                />
              </div>
              <div className="flex-1 overflow-hidden flex flex-col">
                <label className="text-xs text-slate-500 mb-1 block">
                  内容（支持 Markdown）
                </label>
                <Textarea
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  className="flex-1 min-h-[300px] font-mono text-sm"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {step === 'select' ? (
              <>
                <Button variant="ghost" onClick={() => setGenerateOpen(false)}>
                  取消
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={selectedIds.length === 0 || generating}
                >
                  {generating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  {generating ? '生成中...' : '智能生成'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setStep('select')}>
                  返回选择
                </Button>
                <Button onClick={handleSave} disabled={!generatedContent.trim()}>
                  保存月报
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MonthlyPage;
