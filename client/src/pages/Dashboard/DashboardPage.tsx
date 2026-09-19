import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  FolderKanban,
  Calendar,
  CalendarDays,
  ChevronRight,
  TrendingUp,
  ListTodo,
  Inbox,
} from 'lucide-react';
import dayjs from 'dayjs';
import { logger } from '@lark-apaas/client-toolkit/logger';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';

import * as dashboardApi from '@/api/dashboard';
import type {
  DashboardStats,
  Material,
  MaterialType,
  Project,
} from '@shared/api.interface';

const typeLabelMap: Record<MaterialType, string> = {
  meeting: '会议纪要',
  note: '备注',
  progress: '项目进展',
  feedback: '反馈',
  result: '项目结果',
};

const typeBadgeClassMap: Record<MaterialType, string> = {
  meeting: 'bg-blue-100 text-blue-700 border-transparent',
  note: 'bg-slate-100 text-slate-700 border-transparent',
  progress: 'bg-emerald-100 text-emerald-700 border-transparent',
  feedback: 'bg-amber-100 text-amber-700 border-transparent',
  result: 'bg-purple-100 text-purple-700 border-transparent',
};

const mockProjects: Project[] = [
  {
    id: 'p1',
    name: '新产品 V2.0 上线',
    description: '产品迭代与上线全流程跟进',
    status: 'active',
    startDate: '2026-08-01',
    endDate: '2026-10-30',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-09-15T00:00:00Z',
  },
  {
    id: 'p2',
    name: '用户增长专项',
    description: '用户留存与激活策略优化',
    status: 'active',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-18T00:00:00Z',
  },
  {
    id: 'p3',
    name: '数据看板搭建',
    description: '核心业务数据可视化',
    status: 'active',
    startDate: '2026-07-15',
    endDate: '2026-09-30',
    createdAt: '2026-07-15T00:00:00Z',
    updatedAt: '2026-09-10T00:00:00Z',
  },
];

interface TodoItem {
  id: string;
  text: string;
  dueDate: string;
  done: boolean;
}

const mockTodos: TodoItem[] = [
  { id: 't1', text: '整理本周项目进展素材', dueDate: '2026-09-20', done: false },
  { id: 't2', text: '回复产品反馈邮件', dueDate: '2026-09-20', done: false },
  { id: 't3', text: '准备下周周会材料', dueDate: '2026-09-22', done: false },
  { id: 't4', text: '更新产品需求文档', dueDate: '2026-09-25', done: true },
  { id: 't5', text: '月度复盘报告初稿', dueDate: '2026-09-28', done: false },
];

const calcProgress = (project: Project): number => {
  if (!project.startDate || !project.endDate) return 0;
  const start = dayjs(project.startDate);
  const end = dayjs(project.endDate);
  const total = end.diff(start, 'day');
  if (total <= 0) return 100;
  const passed = dayjs().diff(start, 'day');
  return Math.max(0, Math.min(100, Math.round((passed / total) * 100)));
};

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentMaterials, setRecentMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todos, setTodos] = useState<TodoItem[]>(mockTodos);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsRes, materialsRes] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getRecentMaterials(5),
        ]);
        setStats(statsRes);
        setRecentMaterials(Array.isArray(materialsRes) ? materialsRes : []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : '加载失败';
        logger.error('Dashboard load failed', { error: msg });
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleTodo = (id: string) => {
    setTodos((prev: TodoItem[]) =>
      prev.map((t: TodoItem) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const today = dayjs();
  const weekdayMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  const activeProjects = mockProjects.filter((p: Project) => p.status === 'active');

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
    <div className="space-y-6" data-ai-section-type="card-list">
      {/* 问候区 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            下午好，Tao 👋
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            今天也要好好沉淀工作成果哦
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          <Calendar size={16} className="text-blue-600" />
          <span>
            {today.month() + 1}月{today.date()}日{' '}
            {weekdayMap[today.day()]}
          </span>
        </div>
      </div>

      {/* 数据概览 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" data-ai-section-type="card-stat">
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">本周素材</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {loading ? '—' : stats?.materialsThisWeek ?? 0}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
                <TrendingUp size={12} />
                较上周 +3
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <FileText size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">进行中项目</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {loading ? '—' : stats?.activeProjects ?? activeProjects.length}
              </p>
              <p className="mt-1 text-xs text-slate-500">当前活跃项目</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <FolderKanban size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">周报</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {loading ? '—' : stats?.weeklyReports ?? 0}
              </p>
              <p className="mt-1 text-xs text-slate-500">已生成篇数</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Calendar size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">月报</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {loading ? '—' : stats?.monthlyReports ?? 0}
              </p>
              <p className="mt-1 text-xs text-slate-500">已生成篇数</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <CalendarDays size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* 最近工作记录 + 待处理事项 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 最近工作记录 */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between p-5 pb-0">
            <h2 className="text-lg font-semibold text-slate-900">最近工作记录</h2>
            <Link
              to="/materials"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              查看全部
              <ChevronRight size={14} />
            </Link>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((i: number) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded-lg bg-slate-100"
                  />
                ))}
              </div>
            ) : recentMaterials.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Inbox className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle>暂无素材</EmptyTitle>
                  <EmptyDescription>去素材库添加第一条记录吧</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="space-y-3">
                {recentMaterials.map((m: Material) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50"
                  >
                    <Badge
                      className={typeBadgeClassMap[m.type]}
                    >
                      {typeLabelMap[m.type]}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {m.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {dayjs(m.materialDate).format('MM月DD日')}
                        {m.projectName ? ` · ${m.projectName}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* 待处理事项 */}
        <Card>
          <div className="flex items-center gap-2 p-5 pb-0">
            <ListTodo size={18} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">待处理事项</h2>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {todos.map((todo: TodoItem) => (
                <div
                  key={todo.id}
                  className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50"
                >
                  <Checkbox
                    checked={todo.done}
                    onCheckedChange={() => toggleTodo(todo.id)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm ${
                        todo.done
                          ? 'text-slate-400 line-through'
                          : 'text-slate-700'
                      }`}
                    >
                      {todo.text}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      截止 {dayjs(todo.dueDate).format('MM月DD日')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* 进行中的项目 */}
      <Card>
        <div className="flex items-center justify-between p-5 pb-0">
          <h2 className="text-lg font-semibold text-slate-900">进行中的项目</h2>
          <Link
            to="/projects"
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
          >
            查看全部
            <ChevronRight size={14} />
          </Link>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeProjects.map((project: Project) => {
              const progress = calcProgress(project);
              return (
                <div
                  key={project.id}
                  className="rounded-xl border border-slate-100 p-4 transition-colors hover:border-blue-200 hover:bg-blue-50/30"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {project.name}
                    </h3>
                    <Badge className="bg-emerald-100 text-emerald-700 border-transparent">
                      进行中
                    </Badge>
                  </div>
                  <p className="mt-2 line-clamp-1 text-xs text-slate-500">
                    {project.description}
                  </p>
                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
                      <span>进度</span>
                      <span className="font-medium text-slate-700">
                        {progress}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
