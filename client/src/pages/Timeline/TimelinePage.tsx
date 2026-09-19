import React, { useEffect, useMemo, useState } from 'react';
import {
  GitBranch,
  FileText,
  CalendarDays,
  MessageSquare,
  StickyNote,
  TrendingUp,
  MessageCircle,
  Trophy,
  Inbox,
  ChevronDown,
} from 'lucide-react';
import dayjs from 'dayjs';
import { logger } from '@lark-apaas/client-toolkit/logger';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';

import * as dashboardApi from '@/api/dashboard';
import type { TimelineItem } from '@shared/api.interface';

type FilterType = 'all' | 'material' | 'report';

const typeIconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  meeting: MessageSquare,
  note: StickyNote,
  progress: TrendingUp,
  feedback: MessageCircle,
  result: Trophy,
  weekly: CalendarDays,
  monthly: CalendarDays,
  quarterly: CalendarDays,
};

const typeLabelMap: Record<string, string> = {
  meeting: '会议纪要',
  note: '备注',
  progress: '项目进展',
  feedback: '反馈',
  result: '项目结果',
  weekly: '周报',
  monthly: '月报',
  quarterly: '季报',
};

const typeBadgeClassMap: Record<string, string> = {
  meeting: 'bg-blue-100 text-blue-700 border-transparent',
  note: 'bg-slate-100 text-slate-700 border-transparent',
  progress: 'bg-emerald-100 text-emerald-700 border-transparent',
  feedback: 'bg-amber-100 text-amber-700 border-transparent',
  result: 'bg-purple-100 text-purple-700 border-transparent',
  weekly: 'bg-blue-100 text-blue-700 border-transparent',
  monthly: 'bg-purple-100 text-purple-700 border-transparent',
  quarterly: 'bg-amber-100 text-amber-700 border-transparent',
};

const materialSubTypes = [
  { value: 'all', label: '全部' },
  { value: 'meeting', label: '会议纪要' },
  { value: 'note', label: '备注' },
  { value: 'progress', label: '项目进展' },
  { value: 'feedback', label: '反馈' },
  { value: 'result', label: '项目结果' },
];

const formatDateGroup = (dateStr: string): string => {
  const d = dayjs(dateStr);
  const weekdayMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${d.month() + 1}月${d.date()}日 ${weekdayMap[d.day()]}`;
};

const TimelinePage: React.FC = () => {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [subType, setSubType] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await dashboardApi.getTimeline(30);
        setItems(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : '加载失败';
        logger.error('Timeline load failed', { error: msg });
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item: TimelineItem) => {
      if (filterType !== 'all' && item.type !== filterType) return false;
      if (filterType === 'material' && subType !== 'all' && item.subType !== subType) return false;
      return true;
    });
  }, [items, filterType, subType]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, TimelineItem[]> = {};
    for (const item of filteredItems) {
      const dateKey = dayjs(item.date).format('YYYY-MM-DD');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    }
    const sortedKeys = Object.keys(groups).sort((a: string, b: string) =>
      dayjs(b).valueOf() - dayjs(a).valueOf()
    );
    return sortedKeys.map((date: string) => ({
      date,
      items: groups[date],
    }));
  }, [filteredItems]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox className="size-6" />
            </EmptyMedia>
            <EmptyTitle>加载失败</EmptyTitle>
            <EmptyDescription>{error}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <GitBranch size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">时间线</h1>
            <p className="text-sm text-slate-500">按时间回顾你的工作足迹</p>
          </div>
        </div>
      </div>

      {/* 筛选栏 */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">类型：</span>
            <div className="flex rounded-lg bg-slate-100 p-1">
              {[
                { value: 'all', label: '全部' },
                { value: 'material', label: '素材' },
                { value: 'report', label: '报告' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setFilterType(opt.value as FilterType);
                  }}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    filterType === opt.value
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {filterType === 'material' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">素材类型：</span>
              <div className="flex flex-wrap gap-2">
                {materialSubTypes.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSubType(opt.value)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      subType === opt.value
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 时间线主体 */}
      {loading ? (
        <div className="space-y-6">
          {[0, 1, 2].map((i: number) => (
            <div key={i} className="space-y-3">
              <div className="h-5 w-24 animate-pulse rounded bg-slate-200" />
              <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      ) : groupedItems.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox className="size-6" />
            </EmptyMedia>
            <EmptyTitle>暂无记录</EmptyTitle>
            <EmptyDescription>时间线还是空的，快去添加素材吧</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="relative">
          {/* 时间轴竖线 */}
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-200" />

          <div className="space-y-8">
            {groupedItems.map((group) => (
              <div key={group.date} className="relative">
                {/* 日期标签 */}
                <div className="mb-4 flex items-center gap-3">
                  <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                    <FileText size={12} />
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {formatDateGroup(group.date)}
                  </span>
                </div>

                {/* 当日内容列表 */}
                <div className="ml-9 space-y-3">
                  {group.items.map((item: TimelineItem) => {
                    const Icon =
                      typeIconMap[item.subType] || typeIconMap[item.type] || FileText;
                    const isExpanded = expandedId === item.id;
                    return (
                      <Card
                        key={item.id}
                        className="cursor-pointer p-5 transition-all hover:border-blue-200 hover:shadow-md"
                        onClick={() => toggleExpand(item.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              item.type === 'report'
                                ? 'bg-purple-50 text-purple-600'
                                : 'bg-blue-50 text-blue-600'
                            }`}
                          >
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge
                                className={
                                  typeBadgeClassMap[item.subType] ||
                                  'bg-slate-100 text-slate-700 border-transparent'
                                }
                              >
                                {typeLabelMap[item.subType] || item.subType}
                              </Badge>
                              {item.projectName && (
                                <span className="text-xs text-slate-500">
                                  {item.projectName}
                                </span>
                              )}
                            </div>
                            <h3 className="mt-2 text-sm font-semibold text-slate-900">
                              {item.title}
                            </h3>
                            <p
                              className={`mt-2 text-sm text-slate-600 ${
                                isExpanded ? '' : 'line-clamp-2'
                              }`}
                            >
                              {item.content}
                            </p>
                            {!isExpanded && item.content.length > 60 && (
                              <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                                <span>展开全文</span>
                                <ChevronDown size={12} />
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelinePage;
