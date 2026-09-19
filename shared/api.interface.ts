export type MaterialType = 'meeting' | 'note' | 'progress' | 'feedback' | 'result';

export type ProjectStatus = 'planning' | 'active' | 'completed' | 'paused';

export type ReportType = 'weekly' | 'monthly' | 'quarterly';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  id: string;
  title: string;
  content: string;
  type: MaterialType;
  projectId: string | null;
  projectName?: string | null;
  materialDate: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  type: ReportType;
  title: string;
  content: string;
  periodStart: string;
  periodEnd: string;
  materialIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MaterialListParams {
  type?: MaterialType;
  projectId?: string;
  dateFrom?: string;
  dateTo?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface MaterialListResponse {
  items: Material[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateMaterialRequest {
  title: string;
  content: string;
  type: MaterialType;
  projectId?: string | null;
  materialDate: string;
  tags?: string[];
}

export interface UpdateMaterialRequest {
  title?: string;
  content?: string;
  type?: MaterialType;
  projectId?: string | null;
  materialDate?: string;
  tags?: string[];
}

export interface ProjectListParams {
  status?: ProjectStatus;
  keyword?: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  status: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
}

export interface ReportListParams {
  type?: ReportType;
  page?: number;
  pageSize?: number;
}

export interface ReportListResponse {
  items: Report[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateReportRequest {
  type: ReportType;
  title: string;
  content: string;
  periodStart: string;
  periodEnd: string;
  materialIds?: string[];
}

export interface DashboardStats {
  materialsThisWeek: number;
  activeProjects: number;
  weeklyReports: number;
  monthlyReports: number;
}

export interface TimelineItem {
  id: string;
  date: string;
  title: string;
  content: string;
  type: 'material' | 'report';
  subType: string;
  projectName?: string | null;
}

export interface GrowthStats {
  byWeek: { week: string; count: number }[];
  byMonth: { month: string; count: number }[];
  byType: { type: string; count: number }[];
  projectStats: { project: string; count: number }[];
}
