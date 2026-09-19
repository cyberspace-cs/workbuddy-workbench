import React, { useEffect, useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import {
  FileText,
  FolderKanban,
  Newspaper,
  Flame,
  Trophy,
  Sparkles,
  Target,
  Star,
} from 'lucide-react';

import { Card } from '@client/src/components/ui/card';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { Badge } from '@client/src/components/ui/badge';

import * as dashboardApi from '@client/src/api/dashboard';
import type { GrowthStats } from '@shared/api.interface';

const TYPE_COLORS: Record<string, string> = {
  meeting: '#3b82f6',
  note: '#64748b',
  progress: '#10b981',
  feedback: '#f59e0b',
  result: '#a855f7',
};

const TYPE_LABELS: Record<string, string> = {
  meeting: '会议纪要',
  note: '备注',
  progress: '项目进展',
  feedback: '反馈',
  result: '成果',
};

const baseGrid = {
  left: '3%',
  right: '4%',
  bottom: '10%',
  containLabel: true,
};

const baseTooltip = { trigger: 'axis' as const };

const GrowthPage: React.FC = () => {
  const [stats, setStats] = useState<GrowthStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await dashboardApi.getGrowthStats();
        setStats(data);
      } catch (err) {
        logger.error('fetch growth stats failed', { err: String(err) });
        setError('加载失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Overview metrics (computed from stats)
  const totalMaterials = stats
    ? stats.byMonth.reduce((sum, m) => sum + m.count, 0)
    : 0;
  const totalProjects = stats?.projectStats.length ?? 0;
  const totalWeeklyReports = 0; // Not in current stats
  const streakDays = 0; // Not in current stats; mock friendly value not available

  const milestones = [
    {
      icon: <Sparkles className="size-5" />,
      color: 'bg-blue-100 text-blue-600',
      title: '第一篇素材',
      desc: '开启工作沉淀之旅',
      date: '第 1 天',
    },
    {
      icon: <Target className="size-5" />,
      color: 'bg-emerald-100 text-emerald-600',
      title: '第一个项目',
      desc: '完成项目搭建与素材关联',
      date: '第 3 天',
    },
    {
      icon: <Newspaper className="size-5" />,
      color: 'bg-amber-100 text-amber-600',
      title: '第 1 篇周报',
      desc: '首次智能生成周报',
      date: '第 7 天',
    },
    {
      icon: <Flame className="size-5" />,
      color: 'bg-red-100 text-red-600',
      title: '连续记录 7 天',
      desc: '养成每日记录习惯',
      date: '第 14 天',
    },
    {
      icon: <Trophy className="size-5" />,
      color: 'bg-purple-100 text-purple-600',
      title: '第 10 篇周报',
      desc: '两个半月的坚持',
      date: '里程碑',
    },
    {
      icon: <Star className="size-5" />,
      color: 'bg-pink-100 text-pink-600',
      title: '素材突破 100 篇',
      desc: '知识沉淀初现成效',
      date: '里程碑',
    },
  ];

  // Line chart: weekly trend
  const weeklyOption: EChartsOption = {
    tooltip: baseTooltip,
    grid: baseGrid,
    xAxis: {
      type: 'category',
      data: stats?.byWeek.map((w) => w.week) ?? [],
      axisLabel: { fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 11 },
      splitLine: { lineStyle: { type: 'dashed' } },
    },
    series: [
      {
        type: 'line',
        data: stats?.byWeek.map((w) => w.count) ?? [],
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#2563eb', width: 2 },
        itemStyle: { color: '#2563eb' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(37, 99, 235, 0.2)' },
              { offset: 1, color: 'rgba(37, 99, 235, 0)' },
            ],
          },
        },
      },
    ],
  };

  // Pie chart: type distribution
  const pieOption: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const p = params as { name: string; value: number; percent: number };
        return `${TYPE_LABELS[p.name] || p.name}: ${p.value} (${p.percent}%)`;
      },
    },
    legend: {
      type: 'scroll',
      bottom: 0,
      formatter: (name: string) => TYPE_LABELS[name] || name,
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '65%'],
        center: ['50%', '42%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: { label: { show: false } },
        data:
          stats?.byType.map((t) => ({
            name: t.type,
            value: t.count,
            itemStyle: { color: TYPE_COLORS[t.type] || '#64748b' },
          })) ?? [],
      },
    ],
  };

  // Horizontal bar: project ranking (top 5)
  const projectOption: EChartsOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '8%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { fontSize: 11 },
      splitLine: { lineStyle: { type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: stats?.projectStats.slice(0, 5).map((p) => p.project).reverse() ?? [],
      axisLabel: { fontSize: 11, width: 80, overflow: 'truncate' },
    },
    series: [
      {
        type: 'bar',
        data: stats?.projectStats.slice(0, 5).map((p) => p.count).reverse() ?? [],
        barWidth: 16,
        itemStyle: {
          color: '#2563eb',
          borderRadius: [0, 4, 4, 0],
        },
        label: {
          show: true,
          position: 'right',
          fontSize: 11,
          formatter: (p) => `${p.value}`,
        },
      },
    ],
  };

  // Bar chart: monthly trend
  const monthlyOption: EChartsOption = {
    tooltip: baseTooltip,
    grid: baseGrid,
    xAxis: {
      type: 'category',
      data: stats?.byMonth.map((m) => m.month) ?? [],
      axisLabel: { fontSize: 11 },
      boundaryGap: true,
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 11 },
      splitLine: { lineStyle: { type: 'dashed' } },
    },
    series: [
      {
        type: 'bar',
        data: stats?.byMonth.map((m) => m.count) ?? [],
        barWidth: 24,
        itemStyle: {
          color: '#60a5fa',
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };

  const statCards = [
    {
      icon: <FileText className="size-5" />,
      color: 'bg-blue-100 text-blue-600',
      label: '累计素材数',
      value: totalMaterials,
    },
    {
      icon: <FolderKanban className="size-5" />,
      color: 'bg-emerald-100 text-emerald-600',
      label: '累计项目数',
      value: totalProjects,
    },
    {
      icon: <Newspaper className="size-5" />,
      color: 'bg-amber-100 text-amber-600',
      label: '累计周报数',
      value: totalWeeklyReports,
    },
    {
      icon: <Flame className="size-5" />,
      color: 'bg-red-100 text-red-600',
      label: '连续记录天数',
      value: streakDays,
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">成长沉淀</h1>
        <p className="mt-1 text-sm text-slate-500">
          看看你一路走来的工作足迹
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-500 mb-4">{error}</div>
      )}

      {/* Overview Cards */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        data-ai-section-type="card-stat"
      >
        {loading
          ? statCards.map((_, i) => (
              <Card key={i} className="p-5">
                <Skeleton className="h-10 w-10 rounded-lg mb-3" />
                <Skeleton className="h-6 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </Card>
            ))
          : statCards.map((card, i) => (
              <Card key={i} className="p-5">
                <div
                  className={`size-10 rounded-lg flex items-center justify-center mb-3 ${card.color}`}
                >
                  {card.icon}
                </div>
                <div className="text-2xl font-semibold text-slate-900">
                  {card.value}
                </div>
                <div className="text-xs text-slate-500 mt-1">{card.label}</div>
              </Card>
            ))}
      </div>

      {/* Charts Row 1: Weekly Trend + Type Distribution */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card className="p-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            素材产出趋势
          </h3>
          {loading ? (
            <Skeleton className="h-[300px] w-full rounded-lg" />
          ) : stats?.byWeek.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-slate-400">
              暂无数据
            </div>
          ) : (
            <ReactECharts
              option={weeklyOption}
              theme="ud"
              className="h-[300px] w-full"
            />
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            素材类型分布
          </h3>
          {loading ? (
            <Skeleton className="h-[300px] w-full rounded-lg" />
          ) : stats?.byType.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-slate-400">
              暂无数据
            </div>
          ) : (
            <ReactECharts
              option={pieOption}
              theme="ud"
              className="h-[300px] w-full"
            />
          )}
        </Card>
      </div>

      {/* Charts Row 2: Project Ranking + Monthly Bar */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card className="p-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            项目贡献排行
          </h3>
          {loading ? (
            <Skeleton className="h-[300px] w-full rounded-lg" />
          ) : stats?.projectStats.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-slate-400">
              暂无数据
            </div>
          ) : (
            <ReactECharts
              option={projectOption}
              theme="ud"
              className="h-[300px] w-full"
            />
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            月度产出对比
          </h3>
          {loading ? (
            <Skeleton className="h-[300px] w-full rounded-lg" />
          ) : stats?.byMonth.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-slate-400">
              暂无数据
            </div>
          ) : (
            <ReactECharts
              option={monthlyOption}
              theme="ud"
              className="h-[300px] w-full"
            />
          )}
        </Card>
      </div>

      {/* Milestones */}
      <Card className="p-5">
        <h3 className="text-lg font-semibold text-slate-900 mb-5">
          成长里程碑
        </h3>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-2 bottom-2 w-px bg-slate-200" />
          <div className="space-y-5">
            {milestones.map((m, i) => (
              <div key={i} className="flex items-start gap-4 relative">
                <div
                  className={`size-10 rounded-full flex items-center justify-center z-10 ${m.color}`}
                >
                  {m.icon}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900">
                      {m.title}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {m.date}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GrowthPage;
